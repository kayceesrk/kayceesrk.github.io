---
layout: post
title: "Behavioural types"
date: 2016-06-30 09:31:00
categories: [ocaml,types]
excerpt_separator: <!--_more-->
---

Behavioural types such as session types, contracts and choreography describe the
behaviour of a software entity as a sequence of *operations* on a resource such
as a communication channel, web service session or a file descriptor. Behavioural
types capture well-defined interactions, which are enforced statically with the
help of type system machinery. In this post, I will describe a lightweight
embedding of behavioural types in OCaml using polymorphic variants through a
series of examples.

<!--_more-->

The idea of encoding behavioural types using polymorphic variants comes from
[FuSe](http://www.di.unito.it/~padovani/Software/FuSe/FuSe.html), which is a
simple library implementation of binary sessions in OCaml. Similar to FuSe
linear use of resources is enforced through dynamic checks in the following
examples. We'll raise `LinearityViolation` when linearity is violated.

```ocaml
exception LinearityViolation
```

## Refs that explain their work

Let us define a ref type that is constrained not only by the type of value
that it can hold but also by the sequence of operations that can be performed
on it.

```ocaml
module type Ref =
sig
  type ('a, 'b) ref constraint 'b = [>]

  val ref   : 'a -> ('a, 'b) ref
  val read  : ('a, [`Read of 'b]) ref -> 'a * ('a, 'b) ref
  val write : ('a, [`Write of 'b]) ref -> 'a -> ('a, 'b) ref
end

module Ref : Ref = struct ... end
```

The phantom type variable `'b` constrained to be a polymorphic variant (`'b =
[>]`) describes the sequence of permitted operations. For example, a reference
can only be read when the type presents the read capability ``[`Read of 'b]``.
Here, the `'b` represents the behaviour of the continuation. Consequently, the
result of the `read` operation is a tuple consisting of the value read and a
reference whose type is `('a,'b) ref`. It is useful to think of the `read`
operation as changing the type of the reference. The type for `write` is
similar.

Associating behaviours with references is quite handy. For example, below is a
reference that holds an integer, which can only be written once following which
a single read is permitted:

```ocaml
let my_ref1 : (int, [`Write of [`Read of [`Stop]]]) Ref.ref = Ref.ref 10
```

The behavioural types are also automatically inferred. For example,

```ocaml
utop # let foo1 r =
  let r = Ref.write r 20 in
  Ref.read r;;
val foo1 :
  (int, [ `Write of [ `Read of [>  ] as 'a ] ]) Ref.ref ->
  int * (int, 'a) Ref.ref
```

The inferred type says that `foo1` writes into `r` and then reads it. We can
apply `foo1` on `my_ref1` as their behaviours are compatible.

```ocaml
utop # let v,res_ref = foo1 my_ref1;;
val v : int = 20
val res_ref : (int, [ `Stop ]) Ref.ref
```

Recursive behavioural types are obtained painlessly.

```ocaml
utop # let rec foo2 r =
  let r = Ref.write r 20 in
  let v, r = Ref.read r in
  foo2 r;;
val foo2 : (int, [ `Write of [ `Read of 'a ] ] as 'a) Ref.ref -> 'b
```

The inferred types says that `foo2` repeatedly writes and then reads the given
reference. Incompatible references are rejected statically. For example,

```ocaml
utop # let my_ref2 : (int, [`Write of [`Read of [`Stop]]]) Ref.ref = Ref.ref 10;;
val my_ref2 : (int, [ `Write of [ `Read of [ `Stop ] ] ]) Ref.ref = <abstr>
utop # let _ = foo2 my_ref2;;
Error: This expression has type
         (int, [ `Write of [ `Read of [ `Stop ] ] ]) Ref.ref
       but an expression was expected of type
         (int, [ `Write of [ `Read of 'a ] ] as 'a) Ref.ref
       These two variant types have no intersection
```

whereas

```ocaml
utop # let my_ref3 = Ref.ref 10;;
val my_ref3 : (int, _[>  ]) Ref.ref = <abstr>
utop # let _ = foo2 my_ref3;;
```

is accepted and runs forever. It is (sometimes) useful to write programs that
don't always run forever such as `foo3`:

```ocaml
utop # let rec foo3 r = function
  | 0 ->
      print_endline "done";
      Ref.read r
  | n ->
      let r = Ref.write r 20 in
      let v, r = Ref.read r in
      foo3 r (n-1);;
```

which runs for `n` iterations, where it performs a write and a read in every
iteration but the last one where it just performs a read. Unfortunately, this
program does not type check:

```ocaml
Error: This expression has type ('a, [ `Read of [>  ] ]) Ref.ref
       but an expression was expected of type ('a, [ `Write of [>  ] ]) Ref.ref
       These two variant types have no intersection
```

The problem is that the behaviour of the two branches are incompatible, and the
program is rightly rejected. We distinguish the branches in the type using:

```ocaml
val branch : ('a, [>] as 'b) ref -> (('a, [>] as 'c) ref -> 'b) -> ('a, 'c) ref
```

`branch r f` indicates branch selection in `r` where `f` is a function that is
always of the form ``fun x ->  `Tag x``. The fixed version of `foo3` is:

```ocaml
utop # let rec foo3 r = function
  | 0 ->
      print_endline "done";
      Ref.write (Ref.branch r (fun x -> `Zero x)) 0
  | n ->
      let r = Ref.write (Ref.branch r (fun x -> `Succ x)) 20 in
      let v, r = Ref.read r in
      foo3 r (n-1);;
val foo3 :
  (int,
   [> `Succ of (int, [ `Write of [ `Read of 'a ] ]) Ref.ref
    | `Zero of (int, [ `Write of [>  ] as 'b ]) Ref.ref ]
   as 'a)
  Ref.ref -> int -> (int, 'b) Ref.ref = <fun>
```

Observe that the inferred type captures the branching behaviour, and works as
expected:

```ocaml
utop # utop # let my_ref4 = Ref.ref 10 in foo3 my_ref4 32;;
done
- : (int, _[>  ]) Ref.ref = <abstr>
```

### Implementation

```ocaml
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

The implementation is unremarkable except for the machinery to dynamically
enforce linearity. Behavioural types crucially depend on linear use of the
resources. Since OCaml does not have linear types, there is nothing that
prevents writing the following function that seemingly violates the behavioural
contract.

```ocaml
utop # let foo (r : (int, [`Read of [`Stop]]) Ref.ref) =
         let _, _ = Ref.read r in
         Ref.read r;;
val foo :
  (int, [ `Read of [ `Stop ] ]) Ref.ref -> int * (int, [ `Stop ]) Ref.ref =
  <fun>
```

While the type of `r` says that it will be read only once, the function `foo`
reads it twice. This non-linear use of `r` is caught dynamically; the second
read of `r` raises `LinearityViolation`.

```ocaml
utop # let _ = foo (Ref.ref 10);;
Exception: LinearityViolation.
```

## Polymorphic References

Since we can accurately track the behaviour of references, we can safely allow
differently typed values to be written and read from the reference. A reference
that holds a value of type `t` can be read multiple times at `t` before being
written at type `u`. This protocol is captured by the following type:

```ocaml
module type PolyRef =
sig
  type ('a,'b) rw_prot
    constraint 'b = [> `Read of 'a * 'b | `Write of 'c * ('c,_) rw_prot]
  type 'c ref constraint 'c = ('a,'b) rw_prot
  ...
end
```

As before, the reference holds values of `'a` with the behaviour given by `'b`.
The reference can either by read multiple times at `'a` or written once at `'c`
after which the reference holds values of type `'c`. The rest of the operations
are defined as usual:

```ocaml
module type PolyRef =
sig
  ...
  val ref  : 'a -> ('a,'b) rw_prot ref
  val read  : ('a,[> `Read of 'a * 'b]) rw_prot ref -> 'a * ('a,'b) rw_prot ref
  val write : ('a,[> `Write of 'b * ('b,'c) rw_prot]) rw_prot ref -> 'b ->
    ('b,'c) rw_prot ref
  val branch : ('a, [>] as 'b) rw_prot ref -> (('a, [>] as 'c) rw_prot ref -> 'b) ->
    ('a, 'c) rw_prot ref
end
```

We can now write interesting programs:

```ocaml
utop # let rec foo r =
  let v,r = read r in
  let r = write r (string_of_int (v+1)) in
  let v,r = read r in
  let r = write r (int_of_string v) in
  foo r
val foo :
  (int,
   [> `Read of int * 'a
    | `Write of
        string *
        (string,
         [> `Read of string * 'b | `Write of int * (int, 'a) rw_prot ] as 'b)
        rw_prot ]
   as 'a)
  rw_prot PolyRef.ref -> 'c = <fun>
```

Observe that `foo` reads `r` as a integer, updates it as a string, reads it as
a string and then finally writing an integer into it. The inferred type
reflects this change from `int -> string -> int`. The implementation of
polymorphic references uses the unsafe `Obj.magic` to coerce the contents.
However, the behavioural types ensure that accesses are safe.

```ocaml
module PolyRef : PolyRef =
struct
  type ('a,'b) rw_prot
    constraint 'b = [> `Read of 'a * 'b | `Write of 'c * ('c,_) rw_prot]

  type 'a ref =
    {contents     : 'b.'b;
     mutable live : bool} (* For linearity *)
     constraint 'a = ('b,'c) rw_prot

  let ref v = {contents = Obj.magic v; live = true}

  let check r =
    if not r.live then raise LinearityViolation;
    r.live <- false

  let fresh r = {r with live = true}

  let read r =
    check r;
    (Obj.magic r.contents, fresh r)

  let write r v =
    check r;
    { contents = Obj.magic v; live = true }

  let branch r _ = check r; fresh r
end
```

## File descriptors

We can utilise behavioural types to apply meaningful restrictions to operations
on file descriptors.

```ocaml
module type File_descriptor = sig
  type 'a t constraint 'a = [>]

  val openfile : string -> Unix.open_flag list -> Unix.file_perm ->
    ([< `Close | `Write of 'a | `Read of 'a > `Close] as 'a) t
  val close : [> `Close] t -> unit
  val read : [> `Read of 'a] t -> bytes -> int -> int -> int * 'a t
  val write : [> `Write of 'a] t -> bytes -> int -> int -> int * 'a t
  val mk_read_only  : [> `Read of 'a] t -> ([`Close | `Read of 'a] as 'a) t
  val mk_write_only : [> `Write of 'a] t -> ([`Close | `Write of 'a] as 'a) t

  val open_stdin  : unit -> ([`Close | `Read of 'a] as 'a) t
  val open_stdout : unit -> ([`Close | `Write of 'a] as 'a) t
  val open_stderr : unit -> ([`Close | `Write of 'a] as 'a) t
end
```

The `File_descriptor` module is a thin wrapper around the file descriptors from
`Unix` module. The file descriptor obtained through openfile permits a subset
of operations to read, write and close. The precise set of capabilities is
dictated by the flags supplied. For example, with `O_RDONLY` the type of the
file descriptor obtained should be ``([`Close | `Read of 'a] as 'a) t``. The
types of standard streams are also restricted. For example,

```ocaml
utop # open_stderr () |> fun fd -> write fd "hello\n" 0 6;;
hello
- : int * ([ `Close | `Write of 'a ] as 'a) t = (6, <abstr>)
utop # open_stdin () |> fun fd -> write fd "hello\n" 0 6;;
Error: This expression has type ([ `Close | `Read of 'a ] as 'a) t
       but an expression was expected of type [> `Write of [>  ] ] t
       The first variant type does not allow tag(s) `Write
```

File descriptors can also be made read or write only.

```ocaml
utop # let foo fd =
         let _, fd = write fd  "hello\n" 0 6 in
         let fd = mk_read_only fd in
         write fd "hello\n" 0 6;;
Error: This expression has type ([ `Close | `Read of 'a ] as 'a) t
       but an expression was expected of type [> `Write of [>  ] ] t
       The first variant type does not allow tag(s) `Write
```

The implementation of the module is straightforward.

```ocaml
module File_descriptor : File_descriptor = struct
  open Unix

  type 'a t =
    {fd : file_descr;
     mutable live : bool} constraint 'a = [>]

  let mk fd = {fd = fd; live = true}

  let fresh fd = {fd with live = true}

  let check fd =
    if not fd.live then raise LinearityViolation;
    fd.live <- false

  let open_stdin () = mk stdin
  let open_stdout () = mk stdout
  let open_stderr () = mk stderr

  let openfile file flags perm =
    let fd = openfile file flags perm in
    mk fd

  let close fd = check fd; close fd.fd

  let read fd buff ofs len =
    check fd;
    (read fd.fd buff ofs len, fresh fd)

  let write fd buff ofs len =
    check fd;
    (write fd.fd buff ofs len, fresh fd)

  let mk_read_only fd = check fd; fresh fd
  let mk_write_only fd = check fd; fresh fd
end

```

## Tracking Aliases

The final example I will discuss is alias tracking.

```ocaml
module type Alias = sig
  type ('a,'b) t constraint 'b = [>]
  val make   : (unit -> 'a) -> ('a, [`One]) t
  val dup    : ('a, 'b) t -> ('a,[`Succ of 'b]) t * ('a, [`Succ of 'b]) t
  val merge  : ('a, [`Succ of 'b]) t -> ('a, [`Succ of 'b]) t -> ('a, 'b) t
  val free   : ('a, [`One]) t -> ('a -> unit) -> unit
  val app    : ('a,'b) t -> ('a -> unit) -> unit
end

module Alias : Alias = struct
  type ('a,'b) t =
    {v : 'a; mutable live : bool} constraint 'b = [>]

  let fresh a = {a with live = true}

  let check a =
    if not a.live then raise LinearityViolation;
    a.live <- false

  let make f = {v = f (); live = true}
  let dup x = check x; (fresh x, fresh x)
  let merge x y = check x; check y; fresh x
  let free x f = check x; f x.v
  let app x f = f x.v
end
```

The type variable `'b` tracks aliases as a depth in the aliasing tree. New
resources are initialised with `make`, and the resultant resource has type
``('a,[`One]) t`` indicating that there is just one reference to this resource.
Aliases are created explicitly with `dup`, which destroys the original
reference and returns two new references, each one level deeper than the
original reference. Two references from the same level can be merged together
to obtain a reference at the next higher level, and in doing so destroying the
original references. All of this machinery is to ensure that the resource can
only be `free`d when there is a unique reference.

```ocaml
utop # let r = make (fun _ -> ref 0);;
val r : (int ref, [ `One ]) t = <abstr>
utop # let r1,r2 = dup r;;
val r1 : (int ref, [ `Succ of [ `One ] ]) t = <abstr>
val r2 : (int ref, [ `Succ of [ `One ] ]) t = <abstr>
utop # let r11,r12 = dup r1;;
val r11 : (int ref, [ `Succ of [ `Succ of [ `One ] ] ]) t = <abstr>
val r12 : (int ref, [ `Succ of [ `Succ of [ `One ] ] ]) t = <abstr>
utop # let r21, r22 = dup r2;;
val r21 : (int ref, [ `Succ of [ `Succ of [ `One ] ] ]) t = <abstr>
val r22 : (int ref, [ `Succ of [ `Succ of [ `One ] ] ]) t = <abstr>
utop # let r1 = merge r11 r22;;
val r1 : (int ref, [ `Succ of [ `One ] ]) t = <abstr>
utop # let r2 = merge r12 r21;;
val r2 : (int ref, [ `Succ of [ `One ] ]) t = <abstr>
utop # free (merge r1 r2);;
- : (int ref -> unit) -> unit = <fun>
```

## Conclusion

Polymorphic variants are quite effective in encoding behavioural types.
However, the absence of linear types in OCaml makes us resort to dynamic tests
for linear use of resources. While it is possible to hide the resource under a
monad, combining the use of multiple resources would require monad
transformers, which is well known to be quite heavyweight in terms of
programmability. Perhaps an effect system would do the trick.
