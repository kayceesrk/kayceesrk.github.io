---
layout: post
title: "Shrinking the OxCaml bundle: 285 MB to 4 MB"
date: 2026-05-10 11:00
categories: [OCaml, OxCaml, Modes, Blogging]
excerpt_separator: <!--more-->
---

<script async
  src="{{ '/assets/x-ocaml-ox/x-ocaml.js' | relative_url }}"
  src-worker="{{ '/assets/x-ocaml-ox/x-ocaml.worker+effects.js' | relative_url }}"
  src-load="{{ '/assets/x-ocaml-ox/portable.js' | relative_url }}"
></script>

<style>
  x-ocaml { font-size: 0.8em; display: block; margin-bottom: 1.4rem; }
  x-ocaml.hidden { display: none; }
</style>

In the
[previous post]({% post_url 2026-05-08-capsules-in-oxcaml %}) on
capsules, I cheated. The lecture I was adapting (from my
[CS6868](https://github.com/fplaunchpad/cs6868_s26) course on
language abstractions for parallelism) used
`Await_capsule.Mutex.with_lock`, the recommended non-deprecated way
to acquire a capsule mutex, but the post shipped
`Capsule_blocking_sync.Mutex` instead with the deprecation alert
silenced. The reason was bundle size: the `await` library, once we
chased its transitive dependencies through `base`, `sexplib0`,
`base_quickcheck` and the rest of Jane Street's runtime, would have
ballooned the in-browser toplevel by roughly _285 MB_. The right
API would not even fit through GitHub's 100 MB per-file push limit,
let alone be reasonable to send to a reader's browser.

This post is the story of how we got from 285 MB down to 4 MB and
made the resulting bundle compose cleanly with the in-browser
toplevel, so the lecture's `Await_capsule` form works end-to-end in
the cell at the bottom of this post. Most of the work happened on a
[branch of `ocsigen/js_of_ocaml`](https://github.com/kayceesrk/js_of_ocaml/tree/kc-toplevel-extend),
with a smaller piece in
[`art-w/x-ocaml`](https://github.com/kayceesrk/x-ocaml/tree/oxcaml),
the WebComponent that powers the cells.

<!--more-->

## Why bundle size matters

Before getting into the bundling itself, it is worth saying why I
care about this at all. I teach two OCaml-heavy courses at IIT
Madras:
[CS3100](https://github.com/fplaunchpad/cs3100_m20), the
undergraduate functional programming course, and
[CS6868](https://github.com/fplaunchpad/cs6868_s26), the more
recent graduate course on language abstractions for parallelism.
The lecture notes, examples and homework for both would be
considerably more useful as _interactive books_ that a student can
read, edit and run entirely client-side, with no local
installation. The same shape would help us when we run hands-on
OCaml and OxCaml workshops. At any in-person workshop with a few
dozen attendees, limited time, and the patchy conference WiFi we
all know too well, a substantial fraction of the first session
routinely gets spent on the _installation hump_, waiting for
everyone to get `opam`, the compiler, and the required libraries
working on their machines before the actual content can begin. The
shorter the workshop, the more painful that overhead becomes
relative to the time we actually have for teaching.

The broader effort to make installation painless is the OCaml
Platform [roadmap](https://ocaml.org/tools/platform-roadmap), which
we have been working on at Tarides as a "zero to OCaml in one
click" experience. That roadmap targets a developer who wants a
real local toolchain on their machine, with the full editor,
debugger and project-management story; the latency budget is
generous, since this is a one-time setup the developer will keep
using. A workshop attendee has a much shorter latency budget and
a much narrower target: they only need _enough_ of OCaml to
complete the exercises on the page in front of them, for the
duration of the workshop. The client-side `x-ocaml` toplevel is a
natural fit for that narrower target, because everything ships as
static assets and there is no installation step at all. The
bundle, in this setting, _is_ the latency budget; a 285 MB
download makes the in-browser path effectively unshippable, while
a 4 MB download makes it a realistic alternative to standing up a
local toolchain for a 90-minute session.

## Why 285 MB?

The recipe `x-ocaml` already had for "load extra libraries into a
running in-browser toplevel" goes like this. For each `cma` you want
to ship, run

```
$ js_of_ocaml --toplevel <library>.cma -o lib.js
```

then concatenate the per-cma outputs into a single bundle and load
it via `<script src-load=...>`. Each per-cma output is `kind=cma`:
it registers the cma's modules into the existing toplevel without
clobbering anything, the modules light up, and you can `open` them
from a cell. This works, and it is what the previous two OxCaml
posts already use.

The trouble is that _dead code elimination runs one cma at a time_.
If you ship `base`, you ship _all_ of `base`, because the per-cma
DCE pass never gets to look at the linked-together program and
notice that the `await` library you actually want only touches a
small slice of `sexplib0`. So the bundle for the closure
`await + capsule + basement` ends up being the union of every cma
in the transitive dependency, fully linked, which comes out to
roughly 285 MB after the OxCaml compiler's normal optimisations and
before any of the JavaScript-side cleverness has had a chance to
run.

Even before we get to the question of whether the reader's browser
should be asked to load a 285 MB JavaScript file (it should not),
this size is not deployable to a GitHub Pages site at all: GitHub
rejects pushes that contain a single file larger than 100 MB. So
the `await`-based blessed API is unshippable not because the
bundling tooling is wrong, but because per-cma DCE is the wrong
granularity for this problem.

## The other recipe, and why it doesn't compose

It turns out `js_of_ocaml` already has a second recipe that
[does perform cross-cma DCE](https://ocsigen.org/js_of_ocaml/latest/manual/build-toplevel),
which I learned about when [Ricky
Vetter](https://x.com/rickyvetter/status/2053215352301998424)
pointed me at the `--export` route on X. The recipe has two steps:

1. Build a single bytecode that links every library you want, with
   `-linkall` so nothing gets pruned at the bytecode level.
2. Hand that single bytecode to `js_of_ocaml --toplevel --export
   units.txt`. The export list names the compilation units that
   should remain visible to the toplevel; everything else is fair
   game for DCE on the unified intermediate representation.

For the same `await + capsule + basement` set, this recipe produces
a _4 MB_ bundle, almost two orders of magnitude smaller than the
per-cma concatenation. The link-step DCE works at function
granularity over the whole linked program, so the unused parts of
`sexplib`, `base`, `base_quickcheck` and the rest of the dependency
closure get pruned away cleanly.

So why aren't we already using this recipe?

Because the artifact that comes out the other end is `kind=exe`,
that is, a self-contained executable rather than a library. When
you load such a bundle into a Web Worker that already has a running
toplevel, its initialisation runs in `caml_main` style and starts
by overwriting the host's globals:

```js
caml_global_data.symbols    = <bundle's symbol table>
caml_global_data.sections   = <bundle's bytecode sections>
caml_global_data.prim_count = <bundle's primitive count>
caml_global_data.aliases    = <bundle's alias table>
```

Those four assignments _overwrite_ the host toplevel's tables. After
the bundle loads, `caml_get_global_data().symbols` is the bundle's
symbols, not the worker's, and anything in the host toplevel that
does name-based symbol resolution (`Toploop`, hover-types lookup,
`open Stdlib`) now consults a table that does not know about the
modules the worker had already linked. The toplevel survives, but
its typing environment is wrong, and cells stop being able to
`open` anything. We hit this dead end in the [capsules
post]({% post_url 2026-05-08-capsules-in-oxcaml %}); the bundle was
correct and the sizes were great, but the integration step that
connects an exe-shaped bundle to an existing toplevel was the
missing piece.

## The patch

The fix is a flag, `--toplevel-extend`, that I added on a [branch of
`ocsigen/js_of_ocaml`](https://github.com/kayceesrk/js_of_ocaml/tree/kc-toplevel-extend).
When it is set, `js_of_ocaml --toplevel --export …` emits exactly
the same DCE output as before, with the same bytes for the
registered modules and the same `.cmi` files embedded under
`/static/cmis/`, but with three small changes:

- packed as `~standalone:false`, so there is no `globalThis`
  polyfill IIFE wrapping the output,
- with the four `caml_js_set` writes to `caml_global_data` from
  above skipped, and
- tagged as `kind=cma` in the buildInfo header.

The bundle's modules still register themselves on load via the
ordinary
[`caml_register_global(n, v, name)`](https://github.com/kayceesrk/js_of_ocaml/blob/kc-toplevel-extend/runtime/js/stdlib.js#L265),
which the runtime correctly merges via `symidx` into the host's
existing tables. The result is _additive, not destructive_: the host
toplevel's symbol table, sections, primitives and aliases all
survive intact, and its typing environment continues to resolve
`Stdlib`, `Toploop` and everything else that was already linked.
The new modules from the bundle simply show up as new symbols on
top.

The initial diff is small.
[`compiler/lib/parse_bytecode.ml`](https://github.com/kayceesrk/js_of_ocaml/commit/6ec194f)
gates the `caml_js_set` block on the new flag, and
`compiler/bin-js_of_ocaml/{cmd_arg.ml,compile.ml}` thread it
through. That alone gets the bundle composable. The bulk of the
actual debugging showed up afterwards, when we tried to make the
composed bundle behave the way the host expected, and that is what
the rest of this post is about.

## Wiring it through `x-ocaml`

On the `x-ocaml` side, the
[`--dce` flag](https://github.com/kayceesrk/x-ocaml/blob/oxcaml/bin/x_ocaml.ml#L139)
drives the single-bytecode + `--export` build. It invokes
`js_of_ocaml --toplevel-extend --export units.txt` and is the
mechanism behind `build_portable_js_extend.sh`, which is the
build-side worked example for this post. The
[oxcaml branch of my `x-ocaml` fork](https://github.com/kayceesrk/x-ocaml/tree/oxcaml)
carries the change; the patched `js_of_ocaml` needs to be on `PATH`
when the build runs.

## Numbers

For `basement + capsule0.expert + capsule0.blocking_sync + capsule +
await + portable.kernel`, the full closure for the lecture's
`gensym`, the per-cma and `--dce` paths come out very differently:

|                               | Per-cma | `--dce --toplevel-extend` | Ratio |
|-------------------------------|---------|--------------------------|-------|
| basement + capsule0 only      | 1.0 MB  | 1.0 MB                   | 1×    |
| + capsule + await + portable  | 285 MB  | 4.0 MB                   | _~70×_ |

The `basement + capsule0` row is essentially a wash, because the
bundle size at that scale is dominated by the `.cmi` files and there
is very little JavaScript code for DCE to chew on. Once `await` and
the curated `capsule` API enter the picture the per-cma path
balloons, because it has to ship every cma in the transitive
closure of `base`, `sexplib0`, `bin_prot`, `base_quickcheck` and the
`ppx_*` runtime libraries, while `--dce` keeps only the functions
that are actually reachable from the export list, plus the `.cmi`
files the toplevel needs to elaborate the signatures the user types
into a cell.

## A few more snags

Getting the bundle to be `kind=cma` was the easy part. Composing it
with an already-running toplevel turned out to surface a small
zoo of follow-on issues, each of which had a short fix once we
understood it. They all live on the same
[`kc-toplevel-extend`](https://github.com/kayceesrk/js_of_ocaml/tree/kc-toplevel-extend)
branch; the commit messages have the gory details.

- _Predefined-exception identity drifts across bundles._ The
  bundle's re-allocated `Not_found`, `Sys_error` and friends are
  physically distinct from the host's copies, so a
  `try ... with Not_found ->` in stdlib code (the first place we
  hit this was `Hashtbl.randomized_default`, which reads
  `OCAMLRUNPARAM` inside a `try`) fails to catch the host's
  `Not_found` raised by the runtime. The fix is to bind each
  predef-exn variable in the bundle to a runtime
  `caml_get_global_data` lookup so the bundle picks up and reuses
  the host's instances rather than allocating new ones.

- _The pseudo-filesystem raises on duplicate `.cmi` registrations._
  The bundle wants to re-emit `/static/cmis/stdlib.cmi`, which the
  host has already registered at boot, and `MlFakeDevice.register`
  refuses to overwrite. Making `register` idempotent removes the
  conflict without losing anything: the two copies of `stdlib.cmi`
  agree, since they come from the same `opam` switch.

- _Stdlib re-registration overwrites host modules._ Without a
  guard, `caml_register_global` was cheerfully replacing the host's
  `caml_global_data["Format"]` (and every other stdlib module the
  bundle's bytecode happens to link in) with the bundle's freshly
  initialised copy. Adding an early return when the name is already
  known fixes this without changing the behaviour for any name the
  host does not yet have.

- _`Domain.DLS` slot collisions silently broke hover types._ This
  one took me a while to track down. The bundle re-runs stdlib's
  module init when it loads, and in particular
  `Stdlib__Domain.DLS`'s `let key_counter = Atomic.make 0`
  re-allocates the counter and starts it from zero again. The
  bundle's `Format.stdbuf_key` then ends up with a low DLS index
  that the host had already assigned to _its_ `Format.stdbuf_key`,
  and `DLS.set` overwrites the host's entry in the shared
  `caml_domain_dls` array. The host's `Format.flush_str_formatter`
  then reads from the bundle's empty buffer, and merlin's
  type-enclosing printer (which flushes through
  `Format.str_formatter`) returns `""` for every query, so the
  hover-on-identifier tooltips come up blank. The fix is at the
  bundle-load boundary in
  [`build_portable_js_extend.sh`](https://github.com/kayceesrk/x-ocaml/blob/oxcaml/build_portable_js_extend.sh):
  snapshot `caml_domain_dls_get ()` before the bundle's IIFE runs,
  and restore the host-owned slots afterwards. The bundle's _new_
  high-index slots are left alone; only the slots the host had
  previously populated get restored. (I spent a while convinced
  this was a Format DCE bug before noticing the slot collision in
  the OCaml 5+ `Domain.DLS` init code path.)

- _Bundle build:_ the curated `capsule` and `await.capsule` APIs
  both use `open! Base` at the top of their files, so their
  interface files mention `Base.unit` rather than `Stdlib.unit`. To
  elaborate the bundle's signatures the host toplevel therefore
  needs a small chain of `base` and `sexplib0` `.cmi` files at
  `/static/cmis/`. We ship the three `base` cmis (`base.cmi`,
  `base__.cmi`, `base__Unit.cmi`) and two `sexplib0` cmis via
  `js_of_ocaml`'s `--file=<src>:/static/cmis/` flag, which bypasses
  the export filter and embeds the file directly into the bundle,
  rather than putting `base` on the bytecode-link line (which would
  drag the whole 268 MB of `base` back into the bytecode).

## The cell

The cell below uses the lecture's
[`gensym_capsule.ml`](https://github.com/fplaunchpad/cs6868_s26/blob/main/lectures/11_oxcaml/code/08_capsules/gensym_capsule.ml)
shape directly: `Await_capsule.Mutex.with_lock` taking an
`Await_kernel.Await.t` witness, with `Capsule_expert.Data.create`
and `Capsule_expert.Data.unwrap` for the brand-locked counter. No
`[@@@alert "-deprecated"]`, no shim. Press Run.

<x-ocaml>
let make_gensym () =
  let (P mutex) = Await_capsule.Mutex.create () in
  let counter = Capsule_expert.Data.create (fun () -> ref 0) in
  let fetch_and_incr (w : Await_kernel.Await.t) =
    Await_capsule.Mutex.with_lock w mutex
      ~f:(fun access ->
        let c = Capsule_expert.Data.unwrap ~access counter in
        incr c;
        !c)
  in
  fun w prefix -> prefix ^ "_" ^ string_of_int (fetch_and_incr w)

let gensym = make_gensym ()
let w = Await_blocking.await Await_kernel.Terminator.never
let () = Printf.printf "%s %s\n" (gensym w "x") (gensym w "y")
</x-ocaml>

We cannot actually demonstrate parallelism in the browser worker
(it is single-domain), so we hand the body the trivial blocker
`Await_blocking.await Terminator.never`. The mode-checking, however,
is exactly what the lecture covers: the `'k` brand on `mutex`,
`counter` and `access` keeps the `int ref` reachable only from
inside the `with_lock` body, the `@ local` on `access` keeps the
token from escaping the critical section, and the `@ once`
annotation on `f` makes the section single-shot.

## What next?

The fork is small enough that the `--toplevel-extend` flag is
plausibly upstreamable into `ocsigen/js_of_ocaml`. I would like to
clean up the DLS-snapshot dance into a proper runtime primitive
rather than a wrapper around the bundle's IIFE, and the
predef-exception fix is the kind of change that benefits from a few
more eyes on it before it goes in. If anyone reading is interested,
the
[branch](https://github.com/kayceesrk/js_of_ocaml/tree/kc-toplevel-extend)
is open for review.

For `x-ocaml` itself, the obvious next step is to broaden the set
of extension bundles. The current `portable.js` covers
`basement + capsule0 + capsule + await + portable`, which is just
enough for the capsule and parallelism material in
[CS6868](https://github.com/fplaunchpad/cs6868_s26); the
[CS3100](https://github.com/fplaunchpad/cs3100_m20) material would
want a different slice (more of `containers`, a JS-friendly slice
of standard library extensions), and an `async`/`Eio`-flavoured
bundle would let the same cells host an Eio-style concurrency
example. Once a small library of these bundles exists, turning a
lecture set or a workshop tutorial into an interactive book becomes
mostly a matter of picking the right bundle, which is the
workshop-scale "zero to OxCaml" story I want to get to. The
`--file` trick for shipping `.cmi` files without the corresponding
code may also be the right mechanism for an "interface-only" mode
for documentation pages that only need to typecheck against a
library.

`x-ocaml` is one of [Arthur Wendling's](https://github.com/art-w)
hacking expeditions, and it remains a pleasure to build on. Thanks
to [Ricky Vetter](https://x.com/rickyvetter) for the `--export`
pointer that got the whole thing started, and to the OxCaml team
for the libraries.

---

_The diff against `ocsigen/js_of_ocaml` and the integration into
`x-ocaml`'s `--dce` flow were written together with
[Claude Opus 4.7
(1M context)](https://www.anthropic.com/news/claude-opus-4-7), and
are both on
[GitHub](https://github.com/kayceesrk/js_of_ocaml/tree/kc-toplevel-extend)._
