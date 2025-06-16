---
layout: post
title: "Uniqueness for Behavioural Types"
date: 2025-05-29 17:56
categories: [OCaml, Modes, OxCaml]
excerpt_separator: <!--more-->
---

Jane Street has been developing modal types for OCaml -- an extension to the
type system where modes track properties of values, such as their scope, thread
sharing, and aliasing. These modes restrict which operations are permitted on
values, enabling safer and more efficient systems programming. In this post, I
focus on the uniqueness mode, which tracks aliasing, and show how it can
eliminate certain runtime checks.


<!--more-->

My intention in this post is not to explain how the different modes work. There
are a number of blog posts and academic papers written about modes. I recommend
the interested reader to have look at them. The following table summarizes the
main properties tracked by modes, the corresponding mode names, and resources
for further reading:


| Property | Modes | Resources |
|---|---|---|
| Scope | Locality | [Blog](https://blog.janestreet.com/oxidizing-ocaml-locality/), [Paper](https://dl.acm.org/doi/10.1145/3674642) |
| Sharing between threads | Portability, Contention | [Blog](https://blog.janestreet.com/oxidizing-ocaml-parallelism/), [Paper](https://dl.acm.org/doi/10.1145/3704859) |
| Aliasing | Uniqueness, Linearity | [Blog](https://blog.janestreet.com/oxidizing-ocaml-ownership/), [Paper](https://dl.acm.org/doi/10.1145/3674642) |

The OCaml compiler extended with modes is [developed in the
open](https://github.com/ocaml-flambda/flambda-backend), and is used in
production at Jane Street. The repo also has some
[documentation](https://github.com/ocaml-flambda/flambda-backend/tree/main/jane/doc)
of the extensions.

Be warned that the compiler and the language features are fast evolving. The
code examples presented in the blog and the paper referenced above are likely
not to work. I expect the same for the code examples in this post in the near
future, but that's what one should expect with these bleeding-edge features.

## Behavioural types and runtime overhead

A couple of years ago, I wrote a post on [behavioural
types](https://kcsrk.info/ocaml/types/2016/06/30/behavioural-types/) where the
types capture the sequence of operations that may be performed on the values
with those types. The correctness of the system depended on the linear use of
the resources. Since OCaml does not provide support for enforcing linearity
statically, the implementation uses a dynamic check, using a fresh ref cell that
gets _consumed_ every time the type state changes. If we are guaranteed that the
resource is not aliased statically, then there's no need for the dynamic check.
This is where _uniqueness_ helps.

Uniqueness mode allows the OCaml compiler to statically guarantee that certain
values are not aliased. This enables optimizations and eliminates the need for
some runtime checks, which is particularly valuable in systems programming for
ensuring memory safety and efficient resource management.


## Setting up OCaml with modes

An opam repository with the modes extensions and packages supporting modes is
available
[here](https://github.com/janestreet/opam-repository/tree/with-extensions).
Here's how you can set up the new compiler:

```bash
# this will take time
opam switch create 5.2.0+flambda2 --repos with-extensions=git+https://github.com/janestreet/opam-repository.git#with-extensions,default
eval $(opam env --switch 5.2.0+flambda2)
```

## An explicitly memory-managed reference

Suppose you want to implement a mutable reference whose memory is explicitly
managed (not managed by the GC), you may go for the following interface:

```ocaml
module type S = sig
  type 'a t
  val alloc : 'a -> 'a t
  val free : 'a t -> unit (* unsafe *)
  val get : 'a t -> 'a
  val set : 'a t -> 'a -> unit
end
```

This interface provides an explicit `free`, which releases the memory associated
with this reference. This opens up the possibility of memory safety bugs such as
use-after-free and double-free. We can use uniqueness modality to get a _safe_
API. Here's the interface:

```ocaml
module type S = sig
  type 'a t
  val alloc : 'a -> 'a t @ unique
  val free : 'a t @ unique -> unit
  val get : 'a t @ unique -> 'a Modes.Aliased.t * 'a t @ unique
  val set : 'a t @ unique -> 'a -> 'a t @ unique
end
```

The `unique` annotation states that the value is not aliased. The operations on
the reference expect that this reference is not aliased. Observe that `get` and
`set` take in the unique reference and also return them unlike the original
interface. You can use this like so:

```ocaml
# let okay r =
    let v, r = get r in
    let r = set r 20 in
    free r;;
val okay : int M.t @ unique -> unit = <fun>
```

The key bit is that `free` _consumes_ the unique reference; you can
no longer produce a unique handle to the same reference and hence, you cannot
call `free`, `get` or `set` on this reference which has been freed.

```ocaml
# let wont_work r =
    free r;
    get r
  ;;
Error: This value is used here, but it has already been used as unique:
Line 2, characters 7-8:
```

### Modes.Aliased.t

Uniqueness applies deeply. If a value is marked as unique, then the transitive
closure of the reachable parts of the object is also expected to be unique. The
return value of `get` is a pair, which is marked as `unique`[^1]. Hence, both
the components of the pair are expected to be unique. However, we don't want to
impose uniqueness of the value stored in the reference. The language allows
parts of the value to be marked as aliased. `Modes.Aliased.t` is defined as:

```ocaml
module Aliased : sig
  type 'a t = { aliased : 'a @@ aliased } [@@unboxed]
end
```

The language allows record fields to be annotated as `aliased`, while the record
itself may be uniquely referenced.

### Implementation

Here's an implementation of that satisfies the signature.

```ocaml
module M : S = struct
  type 'a t = { mutable value : 'a }
  let alloc x = { value = x }
  let free t = ()
  let get t =
    let a = Modes.Aliased.{aliased = t.value } in
    a, t
  let set t x =
    t.value <- x;
    t
end
```

There's nothing surprising about this implementation. Note that the compiler is
doing a lot of work behind the scenes to ensure that the functions do in fact
satisfy the uniqueness requirements. For example, if you change the
implementation of `set` to do something _innocuous_ where the compiler cannot
prove that the value is not aliased, the program no longer compiles:

```ocaml
# let set t x =
    t.value <- x;
    let t' = Fun.id t in (* compiler cannot prove [t'] is not aliased *)
    t'
Error: <snip>
Values do not match:
 val set : 'a t -> 'a -> 'a t
is not included in
 val set : 'a t @ unique -> 'a -> 'a t @ unique
The type 'a t -> 'a -> 'a t is not compatible with the type
 'a t @ unique -> 'a -> 'a t @ unique
```

## Refs that explain their work

The [earlier blog
post](https://kcsrk.info/ocaml/types/2016/06/30/behavioural-types/#refs-that-explain-their-work)
used polymorphic variants to encode the _protocol_ of operations that are
permitted on a ref cell. The implementation is reproduced below:

```ocaml
module type Ref =
sig
  type ('a, 'b) ref constraint 'b = [>]

  val ref   : 'a -> ('a, 'b) ref
  val read  : ('a, [`Read of 'b]) ref
              -> 'a * ('a, 'b) ref
  val write : ('a, [`Write of 'b]) ref
              -> 'a
              -> ('a, 'b) ref
end
module Ref : Ref =
struct

  type ('a, 'b) ref =
    {contents     : 'a;
     mutable live : bool} (* For linearity *)
     constraint 'b = [>]

  let ref v = {contents = v; live = true}

  let check r =
    if not r.live then raise LinearityViolation;
    r.live <- false

  let fresh r = {r with live = true}

  let read r =
    check r;
    (r.contents, fresh r)

  let write r v =
    check r;
    { contents = v; live = true }

  let branch r _ = check r; fresh r
end
```

Observe that we use a dynamic check to enforce linearity. It requires a _fresh_
ref cell for each operation performed on this reference. With uniqueness, we can
enforce this statically, avoiding the dynamic check and the fresh ref cell
requirement.

```ocaml
module type Ref =
sig
  type ('a, 'b) ref constraint 'b = [>]
  (* 'b is the behavioural type variable *)

  val ref   : 'a -> ('a, 'b) ref @ unique
  val read  : ('a, [`Read of 'b]) ref @ unique
              -> 'a Modes.Aliased.t * ('a, 'b) ref @ unique
  val write : ('a, [`Write of 'b]) ref @ unique
              -> 'a
              -> ('a, 'b) ref @ unique
  val branch : ('a, [>] as 'b) ref @ unique
               -> (('a, [>] as 'c) ref @ unique -> 'b)
               -> ('a, 'c) ref @ unique
end

module Ref : Ref =
struct
  type ('a, 'b) ref = {mutable contents : 'a} constraint 'b = [>]

  let ref v = {contents = v}

  let read r =
    let c = Modes.Aliased.{aliased = r.contents} in
    c, Obj.magic_at_unique r

  let write r v =
    r.contents <- v;
    Obj.magic_at_unique r

  let branch r _ = Obj.magic_at_unique r
end
```

The only changes necessary in the signature were a number of uniqueness and
aliasing annotations. Notice that the implementation no longer needs the
dynamic check! `Obj.magic_at_unique` has the type `'a @ unique -> 'b @ unique`,
and is the version of `Obj.magic` with uniqueness annotation. We use it to
_advance_ the protocol type state.

## Where next

The rest of the examples in the [original
post](https://kcsrk.info/ocaml/types/2016/06/30/behavioural-types/) should also
benefit from uniqueness annotations to remove the runtime overheads.

The complete code examples are available
[here](https://github.com/kayceesrk/code-snippets/tree/master/oxcaml/uniqueness_may_2025).
You can also play with the code examples [directly in the
browser](https://tinyurl.com/y7ku8r5h) thanks to [Patrick
Ferris'](https://patrick.sirref.org/index/index.xml) OCaml with extensions
[js_of_ocaml top-level](https://patrick.sirref.org/try-oxcaml/index.xml). 

Since the modes features are constantly evolving, there are no stability
guarantees yet. However, I'm excited about the possibility of modes improving
how we do safe systems programming in OCaml.

## Addendum 

Looks like there's a [part 2](https://kcsrk.info/ocaml/modes/oxcaml/2025/06/04/linearity_and_uniqueness/) of this post.

## Footnotes

[^1]: Unclear whether it is possible to return a pair where one of the
    components is unique, but the other one is not.
