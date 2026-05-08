---
layout: post
title: "Capsules: compile-time lock discipline in OxCaml"
date: 2026-05-08 10:00
categories: [OCaml, OxCaml, Modes, Blogging]
excerpt_separator: <!--more-->
---

<script async
  src="{{ '/assets/x-ocaml-ox/x-ocaml.js' | relative_url }}"
  src-worker="{{ '/assets/x-ocaml-ox/x-ocaml.worker+effects.js' | relative_url }}"
  src-load="{{ '/assets/x-ocaml-ox/portable.js' | relative_url }}"
></script>

<style>
  x-ocaml { font-size: 0.9em; }
  x-ocaml.hidden { display: none; }
</style>

In the
[previous post]({% post_url 2026-05-07-data-race-freedom-in-oxcaml %}) we
showed how OxCaml's *contention* and *portability* axes rule out data
races at compile time, and fixed the racy `gensym` with
`Portable.Atomic`. That worked because the shared state was a single
integer with atomic primitives. What about state that needs a hash
table, or a multi-step update, or any structure where atomics aren't
enough? OxCaml's answer is the **capsule**: a way to bundle state with
its lock so the lock discipline becomes a type-checker job rather than
a programmer convention.

<!--more-->

This post adapts the capsule version of `gensym` from my
[CS6868](https://github.com/fplaunchpad/cs6868_s26) lecture
([handout](https://github.com/fplaunchpad/cs6868_s26/blob/main/lectures/11_oxcaml/handout.md#part-5-capsules--safe-shared-mutable-state)).
Capsules don't introduce a new mode axis. They're a small library that
composes the axes we've already met: contention and portability from
the [previous post]({% post_url 2026-05-07-data-race-freedom-in-oxcaml %}),
[uniqueness]({% post_url 2025-05-29-uniqueness_and_behavioural_types %}),
and [linearity]({% post_url 2025-06-04-linearity_and_uniqueness %}). The
goal of this post is to read the gensym-with-capsule program through
those four lenses and see where each one is doing real work.

The cells below run in the same in-browser OxCaml toplevel as the
previous post. We use `Capsule_expert` (the lower-level brand-based API)
and `Capsule_blocking_sync.Mutex` (a blocking mutex that doesn't pull
in the `Await` fiber library), since those are what the in-browser
bundle ships. The curated `Capsule.{Data, Isolated, Guard, Shared, Mutex}`
namespace from the `capsule` opam library has the same shape; the
mechanics we exercise here are identical.

## Why atomics aren't enough

For a single integer counter, atomics are perfect. Drop the size
constraint and they're not. Suppose `gensym` had to consult a hash
table of already-issued names, or update two counters in lockstep, or
do a multi-step modify-then-record. None of that fits an atomic word.
The standard OCaml answer is `Mutex.t`:

```ocaml
let mutex = Mutex.create ()
let table = Hashtbl.create 16

let safe_insert k v =
  Mutex.lock mutex;
  Hashtbl.add table k v;
  Mutex.unlock mutex

(* Nothing stops you from forgetting to lock: *)
let unsafe_insert k v =
  Hashtbl.add table k v   (* races, but compiles. *)
```

Two things are wrong here. First, the mutex and the data are separate
values; nothing at the type level connects `mutex` to `table`. Second,
"always lock before access" is a programmer convention. The compiler
can't tell what mutex you meant for what state, and an unlocked
`Hashtbl.add` is a runtime data race that nothing catches.

Yes, OxCaml's contention rule from the previous post would reject
direct mutation of a `@ contended` `table` in a parallel context. But
that only helps if the type system can see that `table` is contended
in the first place. Once you have a top-level shared mutable, you need
a structural reason for the type checker to *believe* that "you are
holding the lock right now." That's exactly what a capsule provides.

## Gensym in a capsule

The capsule pattern packs the counter inside a brand-locked container.
The cell below builds a thread-safe integer counter using `Capsule_expert`
and a blocking mutex, then wraps it in a `gensym` that prefixes ids:

<x-ocaml>
[@@@alert "-deprecated"]

module Cap = Capsule_expert
module Mtx = Capsule_blocking_sync.Mutex

let make_counter () =
  let Cap.Key.P key = Cap.create () in
  let counter = Cap.Data.create (fun () -> ref 0) in
  let mutex   = Mtx.create key in
  fun () ->
    Mtx.with_lock mutex ~f:(fun password ->
      Cap.access ~password ~f:(fun access ->
        let c = Cap.Data.unwrap ~access counter in
        incr c;
        !c))

let next   = make_counter ()
let gensym prefix = prefix ^ "_" ^ string_of_int (next ())

let () = Printf.printf "%s %s\n" (gensym "x") (gensym "y")
</x-ocaml>

Click Run. The cell prints two distinct ids and the toplevel reports
`val next : unit -> int` and `val gensym : string -> string`. No
pointer to the inner `ref` ever escapes; the only way to reach it is
through `Mtx.with_lock`. Let's read what each piece is doing.

### The brand `'k`: an existential tied to a fresh capsule

`Cap.create ()` returns a key wrapped in an existential constructor
`Cap.Key.P`:

```ocaml
type packed = P : 'k Key.t -> packed [@@unboxed]
val create : unit -> packed
```

The `let Cap.Key.P key = Cap.create ()` pattern unwraps it and
introduces a fresh type variable, call it `$k`, in the surrounding
scope. `key` is then bound at type `$k Cap.Key.t`. A second
`Cap.create ()` would introduce `$k2`, distinct and unrelated. Each
`P` pattern brings a new type into the world.

That brand is the static glue between capsule, data, and mutex. When
we call `Cap.Data.create (fun () -> ref 0)` next, the compiler unifies
the data's type parameter with the brand of the key it'll eventually
be unwrapped under, so `counter : (int ref, $k) Cap.Data.t`. The
mutex created from `key` (consuming it as `@ unique`) is also branded
`$k`. Henceforth this data only opens under this mutex's lock.

(Why is the existential pattern wrapped inside `make_counter ()`
rather than at the top level? OCaml refuses top-level let-bindings
that introduce existentials, so we hide the unwrap inside a function.
The closure returned by `make_counter` carries the `$k`-branded
`mutex` and `counter` in its environment.)

### The bare `ref` is unreachable from outside the capsule

Look at where the `ref 0` lives:

```ocaml
let counter = Cap.Data.create (fun () -> ref 0)
```

That `ref` has no binding outside the closure handed to `Cap.Data.create`.
The only handle out is the `Cap.Data.t` value branded `$k`. There is no
aliased reference to smuggle out: the `ref`'s reachability is
single-pathed. This is exactly the configuration the
[uniqueness post]({% post_url 2025-05-29-uniqueness_and_behavioural_types %})
was about, a unique reference with no aliases to it, but here we get
it for free from how the API is shaped, without writing `@ unique`
anywhere ourselves. The capsule API is *exploiting* uniqueness as a
construction principle.

### `Cap.Data.t` mode-crosses contention and portability

Just like `Portable.Atomic.t` from the previous post, the type
`('a, 'k) Cap.Data.t` carries the kind annotation
`value mod contended portable`. A closure that captures a capsule
value stays `@ portable`, and any domain may hold the capsule. So the
closure returned by `make_counter` (which captures both `mutex` and
`counter`) type-checks at portable mode and is safe to send to another
domain.

This is the same mode-crossing move we saw with `Portable.Atomic`,
just applied to a more general container.

### `with_lock` produces an `access` token, briefly

`Mtx.with_lock` is the only way into the critical section. Its
signature:

```ocaml
val with_lock
  : 'k t
  -> f:('k Cap.Password.t @ local -> 'a @ once unique) @ local once
  -> 'a @ once unique
```

Three different mode axes are doing real work in this signature.

- **Brand `'k`**: the password's brand matches the mutex's brand. A
  password from a *different* mutex (different `$k1`) cannot unwrap
  our `counter`. The type checker refuses to unify the two
  existentials and the program does not compile.
- **`@ local`**: the password is local to the body's region. It
  cannot escape `f` by being returned, stored in a global, or stuffed
  into a closure that outlives the call. When `with_lock` returns the
  lock is released, and there's no `password` left in scope to attempt
  to touch the data with. (Locality is the [stack-allocation /
  no-escape axis we covered]({% post_url 2025-06-04-linearity_and_uniqueness %});
  same mechanism, different use.)
- **`@ once`** on the body: `f` can be called at most once. This is
  the linearity guarantee. The body cannot be re-entered with the
  same password, and the runtime cannot smuggle it out for later. Each
  `with_lock` use is a single shot.

Inside `f`, `Cap.access ~password ~f:(fun access -> ...)` converts
the password into a brand-matching `'k Access.t` for the inner body.
`Cap.Data.unwrap ~access counter` then accepts the access and returns
the underlying `int ref` at **`@ uncontended`**. We hold the lock; no
other domain can be touching the data. The next two lines, `incr c;
!c`, are ordinary OCaml mutation; the contention rule is satisfied by
construction because `unwrap` promised uncontended access.

Outside the lock body, neither `password` nor `access` exists in
scope, so there is no path from the outer program to `incr c` that
doesn't go through `with_lock`.

## Brand mismatch is a type error

The cell below tries the genuinely unsound case: protecting one
`Cap.Data.t` with two distinct mutexes. If this compiled, two
threads holding distinct mutexes could enter critical sections on the
same data simultaneously. The type checker refuses, and reports the
two existentials don't match.

<x-ocaml>
[@@@alert "-deprecated"]

let abuse () =
  let Cap.Key.P key1 = Cap.create () in
  let Cap.Key.P key2 = Cap.create () in
  let data  = Cap.Data.create (fun () -> ref 0) in
  let m1 = Cap.(Mtx.create key1) in
  let m2 = Cap.(Mtx.create key2) in
  (* First unwrap pins data's brand to key1's $k. *)
  let _ = Mtx.with_lock m1 ~f:(fun password ->
            Cap.access ~password ~f:(fun access ->
              !(Cap.Data.unwrap ~access data))) in
  (* This second unwrap fails: data is branded with the FIRST key's $k,
     not the second's $k1. *)
  Mtx.with_lock m2 ~f:(fun password ->
    Cap.access ~password ~f:(fun access ->
      !(Cap.Data.unwrap ~access data)))
</x-ocaml>

The error names the two existentials and points out they cannot
unify. The handout's `capsule_abuse.ml` walks through two more
attempted escape hatches:

- **Leak the inner ref through a top-level `Portable.Atomic`.** The
  store compiles, but anything inside a portable atomic is
  `@ contended`, and the contention rule from the
  [previous post]({% post_url 2026-05-07-data-race-freedom-in-oxcaml %})
  forbids reading or writing a mutable field of a contended value. So
  you can park an alias, but you can't dereference it.
- **One mutex protecting two `Cap.Data.t` values.** *Allowed*, and
  correctly so. Both data values are branded with the same `$k`, and
  a single critical section can update both. (Equivalent to one mutex
  guarding two fields of a struct.)

The first closes the obvious leak path (via the same uniqueness-of-paths
property that protects the bare `ref`); brand mismatch closes the
aliased-mutex case; the one-mutex-two-data case shows the rule isn't
gratuitously restrictive.

## Five axes, working together

If you read the previous three OxCaml posts and this one, every piece
is something we've already met:

- **Contention** says "this value might be touched by another domain
  right now," and forbids reads and writes of mutable fields. Inside
  `with_lock` we get an *uncontended* view; outside, the contents are
  unreachable.
- **Portability** says the closure can be shipped to another domain.
  `Cap.Data.t` mode-crosses, so capturing it doesn't make the closure
  nonportable.
- **Locality** confines the password (and the access derived from it)
  to the body of `with_lock`. No way to retain a token past the lock
  release.
- **Linearity (`@ once`)** prevents re-entering the body with the
  same password, ruling out aliasing of the critical section.
- **Uniqueness** isn't an annotation here, it's a structural property:
  the inner `ref` has exactly one path of access, through the capsule.
  No alias.

## A note on the curated API

The example uses `Capsule_expert` (the brand-based primitives) and
`Capsule_blocking_sync.Mutex` (a blocking mutex). The full `capsule`
opam library wraps these with a curated layer (`Capsule.Isolated`,
`Capsule.Guard`, `Capsule.Shared`, `Capsule.Data`) that hides most of
the brand machinery for common patterns. For most application code
you reach for the curated forms first; the `Cap.Key.P key`, `password`,
and `Cap.access` plumbing show up explicitly when you really do want a
named capsule shared across several call sites, as in the lecture's
gensym. We use the lower-level API here mostly because the curated
wrapper pulls in `base`, `sexplib0`, and friends that would balloon
the in-browser bundle by ~270 MB; the shape of what the modes are
doing is the same.

## What's left

This is enough machinery to put a hash table or a more elaborate
shared structure under a single mutex with a compile-time guarantee
that nothing touches it without the lock. To actually run gensym from
two domains in parallel we need the parallel scheduler: `Parallel.t`,
`Parallel.fork_join2`, the `@ portable once` story for closures
crossing the fork boundary. That's the topic of the next post, when I
get around to it.

The point of stopping here: the hard part of getting safe shared
mutable state in OxCaml isn't the parallel primitive, it's the lock
discipline. And the lock discipline turns out to be a small
composition of the four mode axes we already had to learn anyway. The
new library is small. The framework was already in place.
