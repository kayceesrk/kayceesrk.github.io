---
layout: post
title: "Data race freedom in OxCaml"
date: 2026-05-07 10:00
categories: [OCaml, OxCaml, X-OCaml, Blogging]
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

<x-ocaml class="hidden">
module Portable = struct
  module Atomic : sig
    type !'a t : value mod contended portable
    val make : 'a @ portable contended -> 'a t
    val fetch_and_add : int t @ local -> int -> int
  end = struct
    type !'a t : value mod contended portable =
      'a Basement.Portable_atomic.t
    let make = Basement.Portable_atomic.make
    let fetch_and_add = Basement.Portable_atomic.fetch_and_add
  end
end
</x-ocaml>

A while back I [wired up `x-ocaml`]({% post_url 2025-06-20-xocaml %}) so this
blog could embed live, editable OCaml notebooks. That post used a vanilla
OCaml 5 toplevel. Today the toplevel running in your browser is built
from [OxCaml](https://oxcaml.org), the Jane Street fork of the compiler.
That means we can prove a small parallel program is data-race free,
interactively, without ever spawning a thread.

<!--more-->

The examples below are adapted from the OxCaml team's excellent
[Intro to Parallelism (Part 1)](https://oxcaml.org/documentation/tutorials/01-intro-to-parallelism-part-1/)
tutorial, by way of my recent
[CS6868](https://github.com/fplaunchpad/cs6868_s26) lecture on OxCaml
([handout](https://github.com/fplaunchpad/cs6868_s26/blob/main/lectures/11_oxcaml/handout.md)).
The tutorial is the canonical reference and is worth reading in full;
this post tries to capture the essence in a more bite-sized form,
focused on the two new mode axes that together rule out data races at
compile time — and on one subtlety about portability that's easy to
misread.

## A quick aside: data races in OCaml are less scary

Before we dive in, it's worth pausing on why we want to rule out data
races at all in OCaml. In C, C++, or unsafe Rust, a data race is
catastrophic: the standard licenses the compiler to do *anything*,
including silent memory corruption, on the basis that your program had
no defined meaning to begin with. OCaml is considerably gentler.
[OCaml's memory model](https://ocaml.org/manual/5.4/memorymodel.html)
guarantees that even programs with races preserve type safety and
memory safety — a racy program may observe weakly-consistent values
across domains, but it will not crash, won't read uninitialised memory,
and won't violate the type system's invariants.

So a race in OCaml is a logic bug, not a runtime footgun. Why bother
catching them statically, then? Because once a program is data-race
free, you get **sequential consistency**: any observed behaviour can
be explained as some interleaving of the operations of the different
domains, with each domain's own operations executed in program order.
That's still concurrent reasoning — there are many possible
interleavings — but it's the simplest model concurrent code can have,
and equational reasoning, induction, and the usual program-logic tools
all transfer over to each interleaving. Drop race freedom and you lose
this: observed behaviours can only be justified by allowing
*intra-thread* reorderings as well, where a single domain's operations
appear to execute out of program order to other domains. Sequential
consistency is the real prize. Race freedom is what buys it.

## Hello, OxCaml

A quick sanity check that your browser really is running an OxCaml
toplevel. The `@ local` annotation is OxCaml-only syntax; on a stock OCaml
parser it wouldn't even parse.

<x-ocaml>
let use_locally (x @ local) = x + 1

let () = Printf.printf "use_locally 42 = %d\n" (use_locally 42)
</x-ocaml>

## A racy `gensym`

Here's the example we'll keep coming back to: a symbol generator that
hands out distinct ids by incrementing a captured counter. Sequentially
it works; the cell prints two ids. The last line tries to ship `gensym`
to another domain, and that's where the type checker stops us.

<x-ocaml>
[@@@alert "-do_not_spawn_domains"]

let gensym =
  let count = ref 0 in
  fun prefix ->
    count := !count + 1;
    prefix ^ "_" ^ string_of_int !count

let () = Printf.printf "%s %s\n" (gensym "x") (gensym "x")

let _ = Domain.Safe.spawn (fun () -> gensym "x")
</x-ocaml>

Run it from two domains in parallel and you'd tick every box on the
four-ingredient recipe for a data race: two domains, a shared `count`,
both writing, and `count` is a plain `ref` — not atomic. On stock OCaml
5, the compiler would happily let you ship this closure to another
domain. OxCaml refuses, before anything runs. The error names two things
— *nonportable* and *portable* — that aren't in vanilla OCaml's
vocabulary. What do they mean?

## Two new modes for data race freedom

OxCaml extends OCaml's type system with several
[modes](https://oxcaml.org/jane/doc/extensions/modes/intro/) — annotations
that describe *how* a value can be used, orthogonal to its type. I've
already written about two of them on this blog:
[uniqueness]({% post_url 2025-05-29-uniqueness_and_behavioural_types %}),
which tracks whether a value has at most one reference, and
[linearity]({% post_url 2025-06-04-linearity_and_uniqueness %}), which
tracks how often a value may be used. Today's post is about a different
pair — the two modes that, together, rule out data races at compile time:

- **contention** — `uncontended` / `contended`: tracks whether multiple
  domains can simultaneously access a value. A `contended` value might
  be in another domain's hands right now, so the type system limits
  what you can do with it.
- **portability** — `portable` / `nonportable`: tracks whether a value
  can safely *cross* a domain boundary at all. Closures that are sent
  to other domains must be `portable`.

The pair is enough to catch the `gensym` race. Let's look at each
restriction in isolation, then come back to the closure.

### Contention rejects mutable writes

A `contended` value might be mutated by another domain right now. So
OxCaml refuses to let you read or write its mutable fields:

<x-ocaml>
type mood = Happy | Neutral | Sad
type thing = { price : float; mutable mood : mood }

(* Reading an immutable field of a contended value is fine. *)
let price_contended (t @ contended) = t.price

(* Writing a mutable field is not. *)
let cheer_up_contended (t @ contended) = t.mood <- Happy
</x-ocaml>

The error on the last line names exactly the rule: *"This value is
contended but is expected to be uncontended because its mutable field
mood is being written."* Even *reading* a mutable field on a `contended`
value is rejected — another domain might be mid-write at the same
instant.

### Portability rejects captured refs

Portability is about closures. A `@ portable` closure is one the
compiler has verified is safe to ship to another domain, with one
critical catch: every value the closure *captures* from its enclosing
scope is treated as `contended` inside the closure body. A pure
function that doesn't mutate anything is trivially portable — there's
nothing the contention rule can object to:

<x-ocaml>
let test_portable () =
  let (f @ portable) = fun x y -> x + y in
  f 1 2

let () = Printf.printf "test_portable () = %d\n" (test_portable ())
</x-ocaml>

Capturing a `ref` is fine on its own; *mutating* one that's been
captured is what falls afoul of the rule:

<x-ocaml>
let test_nonportable () =
  let r = ref 0 in
  let (counter @ portable) () = incr r; !r in
  counter ()
</x-ocaml>

Read the error carefully — it tells you *exactly why* `counter` isn't
portable. The closure is `@ portable`, so the captured `r` is treated
as `contended` inside the body. But `incr r` is a mutation, and writing
through a ref requires it to be `uncontended`. The two rules collide.
And now the original `gensym` rejection makes sense: it does exactly
the same thing — mutates a captured `count`.

## The trap, and the actual rule

Read those last two cells together and it's tempting to draw the wrong
moral: that to make a function safe to ship to another domain, you have
to give up side effects. That would be far too restrictive.

The actual rule is narrower, and the difference matters.

Portability constrains what a closure **captures from its enclosing
scope**. Captured values become contended — that's the rule, and it's
why `gensym` got rejected. But a closure's **parameters** are not
captures. They're handed in fresh at each call, so they can be passed at
any mode the type spells out — including `@ uncontended`. The obligation
to provide an uncontended argument shifts to whoever is doing the
calling. That's a much weaker requirement than "no side effects."

### Captured vs parameter, in code

Here's the example that makes the distinction concrete. `loop` is
`@ portable`, and its body mutates an `int ref`. That works because the
ref is a *parameter* annotated `@ uncontended`, not something captured:

<x-ocaml>
let (factorial_portable @ portable) n =
  let a = ref 1 in
  let rec (loop @ portable) (a @ uncontended) i =
    if i > 0 then begin
      a := !a * i;
      loop a (i - 1)
    end
  in
  loop a n;
  !a

let () = Printf.printf "factorial_portable 10 = %d\n" (factorial_portable 10)
</x-ocaml>

Two `@ portable` annotations are doing work here. The inner one says
`loop` is shippable to another domain — that's the interesting one,
and it works because `a` is `loop`'s *parameter*, not a capture: when
`loop` is eventually called from somewhere parallel, that somewhere
has to prove the `a` it passes in is uncontended. Portability didn't
ban mutation; it pushed the proof to the call site. The outer
annotation says the whole `factorial_portable` is portable too — it
allocates a fresh `a` on each call and captures nothing from outside,
so we can ship the whole function to another domain. The compiler
verifies both annotations as part of accepting the program.

## A formal aside: defaults and submoding

We've been writing `@ contended` and `@ portable` as if they were the
interesting modes and their absence was nothing in particular. There's
actually a small lattice on each axis, with a default and a direction
of "how strong" the guarantee is. The handout summarises it like this:

| Axis        | Modes (`⊑`)                              | Default       |
|-------------|-------------------------------------------|---------------|
| Contention  | `uncontended` ⊑ `shared` ⊑ `contended`    | `uncontended` |
| Portability | `portable` ⊑ `nonportable`                | `nonportable` |

The relation `A ⊑ B` is the **submoding order**: a value at mode `A`
may be used wherever mode `B` is expected, because `A` carries the
stronger guarantee and `B` is the looser expectation. An `uncontended`
value satisfies a `@ contended` parameter (we just promised the callee
might let other domains touch it; if no other domain ever does, that
promise is trivially compatible). A `portable` closure satisfies a
`@ nonportable` slot. But not the other way around — submoding goes
one way only.

The defaults are what you get when you write plain OCaml. Every value
starts out `uncontended` — no other domain has it, so reads and writes
are unrestricted. Every closure starts out `nonportable` — we make no
claim about shipping it elsewhere. That's why ordinary OCaml code keeps
type-checking under OxCaml: defaults are the most permissive end of
each axis, and you only meet the new restrictions when you (or a
parallel API) ask for a stronger guarantee. The post uses only the two
endpoints of the contention chain — `uncontended` and `contended` — and
skips `shared`, which permits read-only access across domains and isn't
needed for the gensym story.

## Back to `gensym`: the fix

The captured-vs-parameter distinction is enough to fix simple loops, but
`gensym` is a different shape: there's a single counter that must be
shared across calls. We need a counter type that's *itself* portable —
something whose values mode-cross both contention and portability, so a
closure capturing it stays portable. That's exactly `Portable.Atomic.t`,
from OxCaml's
[`portable`](https://github.com/oxcaml/oxcaml/tree/main/portable)
library: a `'a Portable.Atomic.t` is always portable and always
uncontended, regardless of where it lives.

Wrap the counter and `gensym` in a module so the toplevel can see the
whole bundle as portable, then actually do what got us in trouble at
the start: ship `gensym` to a freshly-spawned domain. The compiler
accepts it (it verified `Gen` is portable), and the program runs:

<x-ocaml>
[@@@alert "-do_not_spawn_domains"]

module Gen = struct
  open Portable
  let count = Atomic.make 0
  let gensym prefix =
    let n = Atomic.fetch_and_add count 1 in
    prefix ^ "_" ^ string_of_int n
end

let d  = Domain.Safe.spawn (fun () -> Gen.gensym "y")
let s1 = Gen.gensym "x"
let s2 = Domain.join d
let () = Printf.printf "%s %s\n" s1 s2
</x-ocaml>

The toplevel reports `module Gen : sig ... end @@ portable` — mode
inference noticed every value inside is portable and made the whole
module portable, so `Gen.gensym` survives extraction at portable mode.
You might wonder why we don't just write `let (gensym @ portable)
prefix = ...` at the top level, the same shape we used for
`factorial_portable` above. That's a quirk of the toplevel: a bare
`let` lands in the implicit toplevel module, which itself sits at the
default `nonportable` mode, so when `Domain.Safe.spawn` later reads
`gensym` back out, it sees a nonportable binding and refuses — even
though the closure was verified portable at its binding site. The
`factorial_portable` cell got away with the simpler form only because
nothing else tried to extract the binding at portable mode. Wrapping
in `module Gen` gives the closure its own portable home, which is what
lets it actually cross a domain boundary. In a real `.ml` file the
whole compilation unit is a module that mode inference can mark
portable wholesale, so this dance isn't necessary.

(A note on the `Portable.Atomic` you see here: in a real program you'd
get it by `open Portable` from the
[`portable`](https://github.com/oxcaml/oxcaml/tree/main/portable) opam
library. To keep the page weight reasonable, this notebook ships only
[`basement`](https://github.com/oxcaml/oxcaml/tree/main/basement) — the
small library that provides the actual atomic operations — and a
hidden setup cell at the top of the page wraps it with the kind
annotation `: value mod contended portable`. That kind is what tells the
compiler this type mode-crosses both axes — a closure capturing one
stays portable, and any domain may touch it.) The
[handout](https://github.com/fplaunchpad/cs6868_s26/blob/main/lectures/11_oxcaml/handout.md)
notes that for state more elaborate than a single atomic counter, the
right answer is **capsules** — a structural way to bundle mutable state
with its access protocol so the whole package is portable.

## What's left

The race-freedom guarantee here is independent of any test run: every
rejection above happened at the same compile step an OxCaml binary on
disk would go through, before any code executed. The final spawn is a
demonstration, not a proof — it's the compiler accepting the program
in the first place that tells us no race is possible. Two mode axes, a
kind annotation, and a clear rule about what "portable" means were
enough to make data-race freedom a property the type checker enforces.

The lecture this is drawn from goes further into capsules (for shared
state more elaborate than an atomic) and `Parallel.fork_join2` (for
structured parallelism). Material for another post.
