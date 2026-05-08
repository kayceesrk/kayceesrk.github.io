---
layout: post
title: "Capsules: compile-time lock discipline in OxCaml"
date: 2026-05-08 10:00
categories: [OCaml, OxCaml, Modes, Blogging]
excerpt_separator: <!--more-->
---

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

Here's the capsule version straight from the lecture:

```ocaml
open Await

let gensym =
  let (P mutex) = Await_capsule.Mutex.create () in
  let counter   = Capsule.Data.create (fun () -> ref 0) in
  let fetch_and_incr (w : Await.t) =
    Await_capsule.Mutex.with_lock w mutex ~f:(fun access ->
      let c = Capsule.Data.unwrap ~access counter in
      incr c;
      !c)
  in
  fun w prefix -> prefix ^ "_" ^ string_of_int (fetch_and_incr w)
```

Five lines do the work; the rest is glue. Let's unpack the modes that
make it sound.

(One thing worth flagging up front: unlike the
[previous post]({% post_url 2026-05-07-data-race-freedom-in-oxcaml %}), this
post's snippets are plain `.ml`-file code, not interactive toplevel
cells. In a `.ml` file the whole compilation unit is a module that
mode inference can mark portable wholesale, so we don't need the
`module Gen = struct … end` wrapper trick the toplevel forced on us
last time. The bare `let gensym = …` here is fine.)

### The brand `'k`: an existential tied to the mutex

`Await_capsule.Mutex.create ()` returns a mutex packaged in an
existential:

```ocaml
type packed = P : 'k Mutex.t -> packed
val create : unit -> packed
```

When you write `let (P mutex) = ...`, OCaml introduces a fresh type
variable, call it `$k`, and binds `mutex : $k Mutex.t`. A second
`let (P m2) = create ()` would introduce `$k2`, distinct and unrelated.
Every `P` pattern brings a new type into the world.

That brand is the connection between lock and data. When we then call
`Capsule.Data.create (fun () -> ref 0)`, the compiler unifies the
data's type parameter with the brand of the mutex it's first paired
with, so `counter : (int ref, $k) Capsule.Data.t`. Henceforth this
data only opens under *this* mutex's lock.

### The bare `ref` is unreachable from outside the capsule

Look at where the `ref 0` lives:

```ocaml
let counter = Capsule.Data.create (fun () -> ref 0)
```

That `ref` has no binding outside the closure. The only handle out is
the `Capsule.Data.t` value branded `$k`. There is no aliased reference
to smuggle out: the `ref`'s reachability is single-pathed.

This is exactly the configuration the
[uniqueness post]({% post_url 2025-05-29-uniqueness_and_behavioural_types %})
was about, a unique reference with no aliases to it, but here we get
it for free from how the API is shaped, without writing `@ unique`
anywhere ourselves. The capsule API is *exploiting* uniqueness as a
construction principle.

### `Capsule.Data.t` mode-crosses contention and portability

Just like `Portable.Atomic.t` from the previous post, the type
`('a, 'k) Capsule.Data.t` carries the kind annotation
`value mod contended portable`. A closure that captures a capsule
value stays `@ portable`, and any domain may hold the capsule. So the
`gensym` closure, which captures both `mutex` and `counter`,
type-checks at portable mode and is safe to send to another domain.

This is the same mode-crossing move we saw with `Portable.Atomic`,
just applied to a more general container.

### `with_lock` produces an `access` token, briefly

`with_lock` is the only way to obtain an `access` token. Its signature
is roughly:

```ocaml
val with_lock :
  Await.t -> 'k Mutex.t ->
  f:('k Access.t @ local -> 'a) @ local once ->
  'a
```

Three different mode axes are doing real work in this signature.

- **Brand `'k`**: the access token's brand matches the mutex's brand.
  An access from a *different* mutex (a different `$k1`) cannot unwrap
  our `counter`. The type checker refuses to unify the two existentials
  and the program does not compile.
- **`@ local`**: the access token is local to the body's region. It
  cannot escape `f` by being returned, stored in a global, or stuffed
  into a closure that outlives the call. When `with_lock` returns the
  lock is released, and there's no `access` left in scope to attempt
  to touch the data with. (Locality is the [stack-allocation /
  no-escape axis we covered]({% post_url 2025-06-04-linearity_and_uniqueness %});
  same mechanism, different use.)
- **`@ once`** on the body: `f` can be called at most once. This is
  the linearity guarantee. There's no way to call back into the body
  recursively with the same access token, no way for the runtime to
  re-enter the critical section. Each `with_lock` use is a single
  shot.

Inside the body, `Capsule.Data.unwrap ~access counter` accepts the
brand-matching `access` and returns the underlying `int ref` at
**`@ uncontended`**. We hold the lock; no other domain can be touching
the data. The next two lines, `incr c; !c`, are ordinary
OCaml mutation; the contention rule is satisfied by construction
because the unwrap promised uncontended access.

Outside the body, no `access` exists, so `unwrap` is unreachable, so
the inner `ref` is unreachable. There is no path to `incr c` that
doesn't go through `with_lock`.

## Five axes, working together

If you read the previous three OxCaml posts and this one, every piece
is something we've already met:

- **Contention** says "this value might be touched by another domain
  right now," and forbids reads and writes of mutable fields. Inside
  `with_lock` we get an *uncontended* view; outside, the contents are
  unreachable.
- **Portability** says the closure can be shipped to another domain.
  `Capsule.Data.t` mode-crosses, so capturing it doesn't make the
  closure nonportable.
- **Locality** confines the `access` token to the body of `with_lock`.
  No way to retain a token past the lock release.
- **Linearity (`@ once`)** prevents re-entering the body with the same
  token, ruling out aliasing of the critical section.
- **Uniqueness** isn't an annotation here, it's a structural property:
  the inner `ref` has exactly one path of access, through the capsule.
  No alias.

The lecture's `capsule_abuse.ml` companion walks through three
attempts to subvert the discipline. Each fails for a reason that's
already in the framework:

1. **Leak the inner ref through a top-level `Portable.Atomic`.** The
   store compiles, but anything inside a portable atomic is
   `@ contended`, and the contention rule from the
   [previous post]({% post_url 2026-05-07-data-race-freedom-in-oxcaml %})
   forbids reading or writing a mutable field of a contended value. So
   you can park an alias, but you can't dereference it.
2. **One mutex protecting two `Capsule.Data.t` values.** *Allowed*, and
   correctly so. Both data values are branded with the same `$k`, and
   a single critical section can update both. (Equivalent to one mutex
   guarding two fields of a struct.)
3. **Two mutexes for one `Capsule.Data.t`.** *Rejected.* The data's
   type parameter was unified with the first mutex's brand `$k`; the
   second mutex's brand is a distinct `$k1`. The type checker refuses
   the second unwrap and reports that the existentials don't match.
   The genuinely unsound case (two threads with different mutexes
   concurrently inside critical sections on the same data) is closed.

(1) closes the obvious leak path (via the same uniqueness-of-paths
property that protects the bare `ref`); (3) closes the aliased-mutex
case; (2) confirms the rule isn't gratuitously restrictive.

## A note on the curated API

The example uses `Capsule.Data` and `Await_capsule.Mutex`, the
intermediate-level capsule API. The `capsule` library also has a
**curated** layer (`Capsule.Isolated`, `Capsule.Guard`,
`Capsule.Shared`) that hides most of the brand machinery for common
patterns, and a `Capsule.Expert` layer for finer-grained primitives
(raw `Password.t`, brand manipulation, etc.). For most code you reach
for the curated forms first; the brand and `Data.unwrap` show up
explicitly when you really do want a named capsule shared across
several call sites, as in the lecture's gensym.

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
