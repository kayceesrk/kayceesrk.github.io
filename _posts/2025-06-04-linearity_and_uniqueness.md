---
layout: post
title: "Linearity and uniqueness"
date: 2025-06-04 10:00
categories: [OCaml, Modes, OxCaml]
excerpt_separator: <!--more-->
---

In the [last post]({% post_url 2025-05-29-uniqueness_and_behavioural_types %}),
we looked at _uniqueness_ mode and how uniqueness may be used to optimise. As we
will see, uniqueness alone is insufficient in practice, and we also need a
concept of _linearity_ for uniqueness to be useful.

<!--more-->

## Capturing unique values

Let's start with an example. Recall the signature of the unique reference
module.

```ocaml
module type Unique_ref = sig
  type 'a t
  val alloc : 'a -> 'a t @ unique
  val free : 'a t @ unique -> unit
  val get : 'a t @ unique -> 'a Modes.Aliased.t * 'a t @ unique
  val set : 'a t @ unique -> 'a -> 'a t @ unique
end
```

Assume that we also have an implementation of the module:

```ocaml
module Unique_ref : Unique_ref
```

Consider the following example, which works fine:

```ocaml
let works () =
  let t = alloc 42 in (* Allocate a unique reference *)
  free t (* free it *)
```

Now consider this modified example:

```ocaml
let wat () =
  let t = alloc 42 in (* Allocate a unique reference *)
  let f () = free t in (* capture free in a closure *)
  f (); (* free it *)
  f () (* free it again??? *)
```

Observe that `f` has captured `t` in the closure, and when called frees `t`. It
should be clear that calling `f` _more than once_ is bad -- leads to a
double-free issue! What property do we want of `f`? Uniqueness is insufficient;
we have a unique reference to `f` in this program, with which we call `f` twice.

What we want to enforce is that `f` can be called _at most once_. The compiler
has a _linearity_ mode which captures the idea of how many times a value can be
used. We have two modes in the linearity axis -- `once`, which stands for
"at most once" and `many` (the default one for all values), which allows values
to be used arbitrary number of times.

Whenever a unique value is captured by a closure, the closure gets a `once`
mode, which allows the closure to be called at most once. This program rightly
gets rejected by the compiler.

```ocaml
File "./unique_ref.ml", line 32, characters 2-3:
32 |   f () (* free it again??? *)
       ^
Error: This value is used here,
       but it is defined as once and has already been used:
File "./unique_ref.ml", line 31, characters 2-3:
31 |   f (); (* free it *)
       ^
```

## A linear ref

Now, one might wonder whether the unique reference that we've implemented may be
implemented with the linear mode. The answer is yes.

```ocaml
module type Linear_ref = sig
  type 'a t
  val alloc : 'a -> 'a t @ once
  val free : 'a t @ once -> unit
  val get : 'a t @ once -> 'a * 'a t @ once
  val set : 'a t @ once -> 'a -> 'a t @ once
end

module Linear_ref : Linear_ref = struct
  type 'a t = { mutable value : 'a }
  let alloc x = { value = x }
  let free t = ()
  let get t =
    t.value, t
  let set t x =
    t.value <- x;
    t
end
```

This works as expected:

```ocaml
open Linear_ref

let works () =
  let r = alloc 42 in
  let v,r = get r in
  let r = set r (v + 1) in
  let v,r = get r in
  print_int v;
  free r;
  ()

let fails () =
  let r = alloc 42 in
  free r;
  get r (* fails here *)
```

with the error message:

```ocaml
File "./linear_ref.ml", line 34, characters 6-7:
34 |   get r (* fails here *)
           ^
Error: This value is used here,
       but it is defined as once and has already been used:
File "./linear_ref.ml", line 33, characters 7-8:
33 |   free r;
```

## Why both linearity and uniqueness?

Given this example, you might be wondering, if the _safe_ reference may be
implemented equivalently using both uniqueness and linearity, why do we need
both? Obviously, there's something interesting going on where unique values
captured in a closure needs linearity. Does that mean linearity is sufficient?

It turns out that only recently was the relationship between the two formally
studied in the same type system. While linear types and uniqueness types have a
long history of being studied independently, Marshall et al. in their paper,
["Linearity and Uniqueness: An Entente
Cordiale"](https://starsandspira.ls/docs/esop22-draft.pdf), present the ideas in
the same type system. They provide some key insights.

The first insight is that

> in a setting where all values must be linear, we can also guarantee that every value is unique, and vice versa! Intuitively, if it is never possible to duplicate a value, then it will never be possible for said value to have multiple references.

In our `Unique_ref` and `Linear_ref` every operation that operates on the ref
requires uniqueness or linearity, respectively. Hence, they seem almost
equivalent in expressive power.

> It is when we also have the ability for unrestricted use (non-linear/non-unique) that differences between linearity and uniqueness begin to arise, as we will soon see.

In our language, we do have the ability for unrestricted use. That is, in the
linearity axis, `many` is the default mode attributed to all the values not
tagged or inferred as `once`. Similarly, `aliased` is the default mode
attributed to all the values not tagged or inferred as `unique`.

The type system has _submoding_: values may move freely to _greater_ modes
(which typically restrict what can be done with those values) but not to
_lesser_ modes. For example, a `many` value may be safely use in a context where
a `once` value is expected.

```ocaml
let works () =
  let set_to_20 (r @ once) =
    r := 20
  in
  let r @ many = ref 10 in
  set_to_20 r (* [r @ many] is passed to a function that expects [int ref @ once] *)
```

Similarly, you can use a `unique` value in a context where an `aliased` value is
expected.

```ocaml
let dup r = r,r

let works () =
  let r = Unique_ref.alloc 42 in
  let a,b = dup r in
  a,b
```

The type of the `works` function is `val works : unit -> int Unique_ref.t * int
Unique_ref.t`, which crucially lacks the fact that the references are at unique
mode. We can't call any functions from the `Unique_ref` module with these
references, all of which expect a reference with `unique` mode.

## Uniqueness is more appropriate for safe refs

In our running example of implementing a safe ref, it turns out that uniqueness
is more appropriate. Consider the type signature of `free` in `Unique_ref`:

```ocaml
val free : 'a t @ unique -> unit
```

The type signature says that there are no other aliases to this reference.
Hence, its memory may be safely deallocated. However, consider the
`Linear_ref.free` signature:

```ocaml
val free : 'a t @ once -> unit
```

The signature says that this reference must be used at most once. In particular,
just by looking at the signature, we cannot conclude that there are no other
aliases to this reference. But we know that the API is safe since the only way
to create a safe reference is through the `alloc` function, which returns a
once-usable reference, and every other operation also expects and returns a
once-usable reference.

The correctness of the linear version depends on reasoning over the _whole
API_, whereas the unique version can be concluded to be safe just by
looking at the signature of the `free` function. This modular reasoning makes
uniqueness more appropriate for our safe reference API.

## Past and the future

In a sense, uniqueness and linearity are duals of each other. Uniqueness talks
about the _past_ -- whether a value may be aliased in the past. It is okay to
alias a unique value in the future and lose the uniqueness mode. Linearity talks
about the _future_ -- whether a value may be used more than once in the future.
You can take any value and ascribe a linear mode to it, restricting its use in
the future. However, there may be other aliases to this value in the past.

## Conclusions

The code examples are available
[here](https://github.com/kayceesrk/code-snippets/tree/master/oxcaml/linearity_june_2025).
Section 2.1 of [Marshall et al.'s
paper](https://starsandspira.ls/docs/esop22-draft.pdf) is quite readable and
explains the distinction between linearity and uniqueness with some historical
context. I highly recommend it.

## Acknowledgements

Thanks to [Richard Eisenberg](https://richarde.dev/) for the discussions which
spurred this post.
