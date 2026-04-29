---
layout: post
title: "From Convergence to Confidence: Push-button verification for RDTs"
date: 2026-04-28 10:00
categories: [Verification, RDTs, Lean]
excerpt_separator: <!--more-->
---

What does it mean for a replicated data type to be *correct*? Two answers
have circulated in the literature. The weaker one is convergence: two
replicas that have applied the same operations end up in the same state. The
stronger one,
[replication-aware linearizability](https://dl.acm.org/doi/10.1145/3314221.3314617)
from Wang et al. (PLDI 2019), is full functional equivalence with a
sequential specification: the merged state should behave as if the operations
everyone did had run in some sequential interleaving. RA-linearizability has
been the property our verification work has aimed at for a few years now. For
a class of useful data types it still falls short, namely the ones where the
state is a grow-only bag and the interesting semantics live in the read
function. I gave [a talk at PaPoC last
week](/slides/RDT_verification_papoc_2026.pdf) about this, and about the
multi-modal agentic proof setup we've been using in
[Sal](https://github.com/fplaunchpad/sal) to chip away at the gap. This post
is the longer-form version.

<!--more-->

## Convergence is not enough

The canonical example is the OR-Set. Adding an element tags it with a fresh
id and stores the `(element, id)` pair. Removing an element does not delete
anything; it adds a tombstone entry for each currently observed `(element,
id)` pair into a separate tombstone component of the state. Reading filters
the adds against the tombstones, and merging unions both components
componentwise. The data type converges, but tombstones accumulate without
bound. The fix is a bit cleverer than just tagging: each replica tracks
causality explicitly, by maintaining a context of operations it has
observed, and the merge uses that context to recognise when an element
was removed at another replica without having to keep a tombstone for it.
The result is the "efficient" OR-Set.

In practice this is harder than it sounds. Riak's
[riak_dt](https://github.com/basho/riak_dt), a production CRDT library,
shipped an optimisation to its OR-Set Map that broke monotonicity
([issue #79](https://github.com/basho/riak_dt/issues/79)). Christopher
Meiklejohn, one of the authors of the [Riak DT Map
paper](https://doi.org/10.1145/2596631.2596633), [later
wrote](https://christophermeiklejohn.com/erlang/lasp/2019/03/08/monotonicity.html)
about how easy it is to get the inflationary, deterministic,
least-upper-bound conditions wrong, and noted that the team *"have even
got this wrong a few times"* themselves. Martin Kleppmann's [2019 PaPoC
paper on collaborative-text
anomalies](https://martin.kleppmann.com/2019/03/25/papoc-interleaving-anomalies.html)
had errata of the same flavour, appended to the publication page a few
years after the fact: the non-interleaving condition proposed in §2.1
"cannot be guaranteed by any algorithm," and the algorithm in §3.1 does
not guarantee convergence.

A well-defined join and a join that does what the user expects are not the
same thing, and the gap between the two is where most of these bugs live.

## A short history of how we tried to close that gap

My group has been chipping at this for a few years. In
[Peepul](/papers/certified_mrdt.pdf) (PLDI 2022) we tried to capture intent
axiomatically: write the spec as a fold over a partially ordered event
graph, then prove the implementation simulates it. The proofs closed, but
the cost was telling. The queue MRDT case study took 1,123 lines of proof
spread over 75 lemmas against a 32-line implementation, with each F\*
verification run taking on the order of 4,753 seconds. F\*'s SMT-aided
proofs were brittle (z3 upgrades broke them, and the solver only ever
returned yes / no / timeout with no counterexample), and the methodology
did not really scale past a handful of carefully-chosen examples.

[Neem](/papers/mrdtconverge_jan_25.pdf) (OOPSLA 2025) replaced the axiomatic
spec with the RA-linearizability framing of Wang et al., with a twist:
instead of taking a separate sequential specification as input, Neem treats
the operational definition of `do_` itself as the spec. The merge is
correct if the resulting state behaves like some sequential interleaving of
the updates under that definition. Neem also gave us a fixed schedule of 24
verification conditions (six on `do_`, twelve on `merge`, six on conflict
resolution) that, if all closed, certify RA-linearizability. That was a
real upgrade. But it was still in F\*, still SMT-fragile, and there was a
class of useful RDTs for which closing the 24 VCs left the correctness
statement itself near-vacuous: what we now call *Tier-C*.

The pattern that exposes that vacuity is recognisable. When porting an
op-based CRDT to a state-based one, a common move is to dump every
operation into a grow-only set and leave the read function to
reconstruct the result. The merge is then set union, any sequence of
operations is trivially its own linearisation, and the 24
RA-linearizability VCs close without much work. The data type can still
be wrong, because nothing in that proof has said anything about
*intent*: which characters are bold, which key sits at the head of the
queue. Peepul did try to capture intent, but it expressed the spec over
a partially ordered graph of events with no further structure, and that
turned out to be both an awkward medium to write specs in and a brittle
one to prove against.

The taxonomy we settled on this past month:

- **Tier A**: state *is* the semantic content. LWW-Register, PN-Counter,
  Bounded-Counter, MAX-Map. The RA-linearizability VCs reduce to lattice
  arithmetic and cover what one wants to know.
- **Tier B**: merge does non-trivial computation. Multi-Valued-Register,
  LWW-Element-Set. Still substantive.
- **Tier C**: state is a grow-only bag, and the semantics live in the
  *read*. OR-Set, RGA, Add-Win Priority Queue, and Peritext (which the
  rest of the post comes back to).

Roughly half the Sal suite, and most of the RDTs people actually want to
use, sit in Tier C. For Tier C, "verified" without read-side theorems is an
overclaim: the 24 VCs prove union commutativity on a few grow-only maps,
and say nothing about which characters end up bold or which item sits at
the head of the priority queue.

## What Sal actually is

Sal is the work I presented at PaPoC, joint with Pranav Ramesh and Vimala
Soundarapandian. The wider line of work this builds on also involves
Adarsh Kamath, Aseem Rastogi, and Kartik Nagar. It ports Neem to Lean 4
and adds a multi-modal proof tactic. The repo is at
<https://github.com/fplaunchpad/sal>.

The Lean choice is not original to us. Ilya Sergey is the one who
convinced me to take Lean seriously, and Sal's multi-modal tactic stack
is directly inspired by [Loom](https://verse-lab.github.io/), the
verification framework his group has been building. Loom and Velvet do
imperative-program verification; Sal does RDTs. The toolchain is shared.

When you write `by sal` in front of a verification condition, three things
happen in sequence. First, `dsimp + grind`: pure rewriting plus Lean's
bit-level automation. If this closes the goal, the proof term is checked
by the Lean kernel and the trusted base is just Lean. If it doesn't, Sal
hands the goal to Z3 via
[lean-blaster](https://github.com/argumentcomputer/LeanBlaster). Fast, but
Z3 is now in the trusted base, and Sal records this with a `Blaster_admit`
annotation so the borrowed trust is visible. If that does not close
either, an AI agent (Claude Code or [Aristotle](https://harmonic.fun))
tries to write a proof term, which Lean then kernel-checks. The TCB
shrinks back to just Lean.

For the LWW-Register all 24 VCs close at stage 1. The whole specification
fits on a screen:

```lean
abbrev concrete_st := ℕ × ℕ
def init_st : concrete_st := (0, 0)

def lex_max (a b : ℕ × ℕ) : ℕ × ℕ :=
  if a.1 > b.1 then a
  else if b.1 > a.1 then b
  else if a.2 ≥ b.2 then a else b

def do_ (s : concrete_st) : op_t → concrete_st
  | (ts, _, .Write v) => lex_max s (ts, v)

def merge (a b : concrete_st) : concrete_st := lex_max a b

theorem merge_comm (a b : concrete_st) : eq (merge a b) (merge b a) := by sal
theorem merge_idem (s : concrete_st) : eq (merge s s) s            := by sal
-- ... 22 more, all closed by `by sal`
```

Across the current Sal suite (28 RDTs, 17 CRDTs and 11 MRDTs, 648
verification conditions) the breakdown from the paper was roughly 69%
closed at stage 1, 28% via Z3, and 3% via AI-completed ITP. That is the
"push-button" claim, and for Tier A and B it holds up well.

Two practical notes worth flagging here. First, [Aristotle](https://harmonic.fun)
has been the workhorse at stage 3 in practice: `LWW-Map`, `Shopping-Cart`,
and `MAX-Map` each had VCs that neither `grind` nor Z3 closed, and
Aristotle produced kernel-checked intermediate lemmas that did. Second,
on the brittleness-of-tooling worry, the suite was bumped from Lean
4.26 to 4.28 between the paper draft and PaPoC. One Shopping-Cart
obligation drifted under the new `grind` and needed a tweak; everything
else carried over. That is a different experience from the F\* /
z3-upgrade story above.

Tier C is where things get more involved.

## The Peritext story

[Peritext](https://www.inkandswitch.com/peritext/) is a CRDT for
collaborative rich-text editing, by Geoffrey Litt, Sarah Lim, Martin
Kleppmann, and Peter van Hardenberg (CSCW 2022). The design has four
state components (characters, parent pointers, tombstones, formatting
marks). What makes the paper unusually pleasant to mechanise is the
care its authors put into specifying intent. §3 walks through eight
worked examples of intent preservation, each spelled out as a small
concrete scenario, and appendix §A.2 catalogues them as a single
table for reference. Alice bolds the entire
sentence while Bob inserts the word "brown" in the middle; the result
should be `**The brown fox jumped**`. Alice bolds the first two words,
Bob bolds the last two; the overlap is bold too. A link span has a
hard right edge: a concurrent insert at `endId` should *not* expand the
link. And so on. The paper argues informally that the design handles
each example correctly, and ships a TypeScript reference plus
property-based tests, but no machine-checked proofs.

The 24 RA-linearizability VCs are trivial here. Peritext's state is
four grow-only components and componentwise union commutes; `by sal`
closes them in seconds. That work lives in `Peritext_CRDT.lean` (571
lines, mostly state plumbing), and at the level of RA-linearizability
the data type is verified.

The interesting questions, however, are about the *read*: the function
that takes the state and renders it as formatted text. That function
lives in `Peritext_ReadSide.lean`, currently 1,316 lines. It answers
questions like: do the start- and end-side anchor bits matter? do
overlapping bolds compose? does tombstoning a character preserve the
formatting of everything else? do insertions at a span boundary fall
inside or outside the span under the paper's expand-vs-contract rules?
None of these are anywhere in the 24 VCs.

The eight worked examples in §3 turn out to be a much better
starting point than the VCs for actually mechanising the data type. Each
example is small enough to write down as a *concrete* state and a
*concrete* claim about its read. Nik Swamy and Shuvendu Lahiri have
[a recent
post](https://risemsr.github.io/blog/2026-04-16-spotting-specs/)
calling this kind of artifact a *Small Proof-Oriented Test*, or SPOT:
"a small, concrete, verified test case, proving that the test always
succeeds." The Peritext authors had effectively done the
specification-engineering half of that job for us by writing
§3 with the level of care they did; all that was left was to
translate each example into Lean and prove it against the
implementation. So we did.

Take Example 1 from the paper. Alice bolds the entire sentence
"The fox jumped" while Bob concurrently inserts the word "brown"
in the middle. Convergence is not the question: both replicas will
agree on a state once they merge. The question is what the rendered
text looks like. Peritext's expand-on-the-bold-side rule says the
inserted text should fall inside Alice's bold span, so the merged
result reads **"The brown fox jumped"**, with "brown" formatted bold
along with everything else. In Sal we simplify Bob's insert to a
single character 'b' (enough to exercise the rule, and the proof
stays tractable), and the SPOT translates almost directly:

```lean
-- Alice (rid 0) types "The fox jumped" and bolds the whole thing.
def ex1_pre : Scenario :=
  the_fox_jumped.bold 0
    ['T','h','e',' ','f','o','x',' ','j','u','m','p','e','d']

-- Bob (rid 1) concurrently inserts 'b' between "The " and "fox".
def ex1_post : Scenario := ex1_pre.insertCharAfter 1 (4, 0) 'b'

-- Alice's bold mark, opId (15, 0), spans the original sentence.
def ex1_mark : MarkOp := Mark.bold (15, 0) (1, 0) (14, 0)

-- The intent claim: Bob's 'b' ends up inside Alice's bold span.
example : in_span_visible ex1_post.state ex1_mark (16, 1) := by ...
```

The other seven worked examples take the same shape: an English
description in the paper, a few lines of DSL builder to set up the
concrete scenario, and a one-line theorem statement that captures
the paper's intent claim. `Peritext_SPOT.lean` is 323 lines for all
eight. The proofs themselves are unremarkable; the work was in
setting up the DSL so the scenario reads like the paper.

The read-side theorems in `Peritext_ReadSide.lean` are universally
quantified versions of the same statements: instead of "Bob's 'b' is
in Alice's bold span at this concrete state," the theorem
`insert_within_span_in_span_visible` says "for any state, any mark,
any character inserted strictly inside the span at a fresh opId, the
inserted character is in the span." Each SPOT then closes via that
universal theorem applied to its concrete state. Generalisation of
the SPOT *is* the read-side proof, which I find a useful way to
think about the relationship.

We have since written SPOTs for all 28 RDTs in the suite, and the
generalised read-side theorems for the Tier-C ones. The Tier-A SPOTs
are mostly there as documentation that a reader can confirm the read
function does what the lattice arithmetic suggests it does.

It is worth saying how an early draft of the Peritext read-side
went wrong, since the failure is a sharp version of the talk's
title. I had Claude draft a predicate called `in_span_boundary`
from a careful reading of paper §3.3, with four cases (start of
span, end of span, after-of-start, after-of-end) and a boolean side
bit. The proofs went through. About 400 lines of theorems closed
across both the CRDT and the MRDT versions, and I was about to
commit. Re-reading §3.3 with the predicate in front of me, the
predicate turned out to be backward. The `after_of c endId →
endSide` clause encoded the opposite of the link-contract case: it
included post-`endId` inserts in the span where the paper says they
should be excluded. The proofs validated the proof, not the spec.
Tests pass, code is wrong. The bug was caught only when I wrote an
alternative predicate (`in_span_visible`) and the two disagreed on
Example 8.

The fix was a four-rule inductive characterising the RGA visible
order (parent-child, sibling via `opid_max`,
left-descendant-of-older-sibling, transitive) plus a separate
`bold_expand_reach` predicate for the bold-expand semantics in
Example 7. About 800 lines of the buggy parallel track were
deleted in the process. Eight `_visible` theorems now map
one-to-one to the paper's eight worked examples; there is a
[crosswalk](https://github.com/fplaunchpad/sal/blob/main/docs/peritext-vs-paper.md)
for anyone who wants the full table.

The piece of methodology I would recommend to someone starting out:
the SPOTs catch this kind of failure if the SPOT itself is faithful
to the paper's example. Had I started by formalising the worked
examples as SPOTs and only then generalised, the disagreement on
Example 8 would have shown up immediately rather than after 400
lines of proofs against the wrong predicate. John Regehr's [zero-degree-of-freedom
LLM coding](https://john.regehr.org/writing/zero_dof_programming.html)
post argues a similar point in a different domain: pin the agent
with fast, deterministic, executable oracles, and the agent has
nowhere to drift. The Peritext SPOTs are an executable oracle for
the read-side spec.

## Beyond Peritext

Peritext is one example of a broader pattern. PaPoC 2026 had several
other talks where the hard work was not the merge but in writing
down what the data type was supposed to *mean* in the presence of
concurrent edits. Three I want to flag, because they suggest the
intent-formalisation problem has finally become the bottleneck
people are willing to talk about openly.

[AegisSheet](https://doi.org/10.1145/3806077.3806695) (Florian
Pfeil, David Scandurra, and Julian Haas, TU Darmstadt) studies
collaborative spreadsheets. Their starting move is honest empirical
work: they tabulate how Google Sheets and Notion behave under all
combinations of concurrent `EditCell` / `InsertR/C` / `RemoveR/C` /
`MoveR/C` and classify each outcome as *desirable*, *suboptimal*,
or *destructive*. Most of the cells in those tables are red. They
then design a compositional spreadsheet CRDT that turns the red
cells green. The CRDT is the easy half; the table of intended
semantics is the hard half, and they did it.

[ERA](https://doi.org/10.1145/3806077.3806691) (Kegan Dougal,
Element Creations) addresses the *duelling admins* problem in
group-management CRDTs in Matrix and Keyhive: two
equally-permissioned admins concurrently revoke each other's
permissions. Whose revocation wins? Kleppmann's PaPoC 2025
keynote suggested seniority ranking, but a Byzantine admin can
backdate events to roll back their own revocation. ERA proposes
*epoch events*: an external arbiter batches concurrent events into
epochs and imposes a bounded total order, which gives finality
without sacrificing availability. Like the spreadsheet case, the
contribution is mostly about specifying what *correct* looks like
under adversarial concurrency, with the data structure designed to
match.

The closing lightning talk by Florian Jacob, Johanna Stuber, and
Hannes Hartenstein (KIT) sketches a path to formal verification of
local-first access control. Same shape: write the intent down
precisely, then prove an implementation matches.

It is a useful background fact that none of these are RDT-specific.
Each is a different domain (rich-text, spreadsheets, group
membership, access control) where the merges are easy and the
intent is hard. SPOTs, oracles, and the multi-modal Lean stack are
all reactions to the same shift in where the difficulty lives.

## The past three weeks

Since the Sal paper was finalised, the repo has had something like 200
commits, overwhelmingly mine, with Pranav having landed the
architectural heavy lifting earlier on. The headline change is in
coverage: 13 new CRDTs and 2 new MRDTs since the paper, taking the
suite from 13 RDTs to 28. Most of the additions are smaller scalar,
set, and map types (MAX-Register, MIN-Register, LWW-Register,
LWW-Map, MAX-Map, Grow-Only-Set, Grow-Only-Multiset,
LWW-Element-Set, Shopping-Cart, and a few more) that fill out
Tier-A and Tier-B coverage and serve as documentation that the
obvious read functions do the obvious thing. The three additions
that took real work, and that the rest of this section is about,
are the paper-only designs that finally got machine-checked Lean
ports.

**Peritext** is the largest of the three: 1,316 lines of read-side, 571
of CRDT, 291 of a small DSL for the §3 worked examples, and 323 of
SPOTs. Eight intent-preservation theorems matching the paper's worked
examples one-to-one, plus a `wf_afters` acyclicity invariant and a
`bold_expand_reach` predicate for Example 7. Roughly two days of
agent-paired work, mostly spent on the spec rather than on the proofs.

The **Add-Wins Priority Queue** of Zhang et al. (Internetware 2023) is a
391-line CRDT plus a 325-line read-side. The translation is interesting
in its own right. The paper has a per-record `count` field that ties
commutativity in knots; in Sal we flatten it into a separate `I`
component for increment records and use a snapshot-in-op-payload trick
(the `Rmv` op carries the observed-set as a parameter), which gives us
`rc := Either` everywhere and lets the RA-linearizability VCs drop out
without any SMT.

The **Bounded Counter** of Balegas et al. (SRDS 2015) is a 465-line
CRDT, structurally a PN-Counter plus a transfer matrix. The 24 VCs are
trivial. The bound itself is *not* part of the verified model: it is
enforced operationally at the client boundary (a replica refuses to emit
a `Dec` that would push its quota negative), and that part is currently
unverified. Worth saying explicitly, since the headline number alone
might suggest more than is there.

A separate cleanup is worth noting. About 85 Blaster-admits across the
suite closed via a single pattern, *per-component decomposition*:
instead of one monolithic SMT call on the full state, split the state
into components, prove each component independently, then combine. The
OR-Set MRDT went from 17 of 20 VCs trusting Z3 down to 3. The pattern
was human-found; the agent applied it consistently across files.

The qualifier from the Peritext section applies to all three of these
ports as well: the RA-linearizability VCs are easy, and the work that
took time was the spec.

For readers who want to play with the data types directly,
[fplaunchpad.org/sal](https://fplaunchpad.org/sal) hosts an
interactive playground for every RDT in the suite. The CRDT pages let
you drive two replicas in parallel and merge one into the other;
toggling "show concrete state" exposes the lattice that the
convergence proofs are about. The MRDT pages render the operation
history as a git-style commit DAG and let you do three-way merges
over the lowest common ancestor. None of this is load-bearing for
the verification story, but it is by some distance the easiest way
to see what the data types actually do.

## Closing

Agents have made proof-engineering noticeably cheaper. Spec engineering
still sits with the human author, and SPOTs, executable oracles, and the
multi-modal Lean stack each approach that from a different direction.
None of them is sufficient on its own; in combination they look like a
workable methodology.

The slides are [here](/slides/RDT_verification_papoc_2026.pdf), the repo
is at <https://github.com/fplaunchpad/sal>, and the question I closed
the talk with was: *what will you prove next?*
