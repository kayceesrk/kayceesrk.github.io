---
layout: post
title: "(Monadic) Reflections on Concurrency"
date: 2017-06-13 12:13:00
categories: [multicore, reflection, monads, effects]
excerpt_separator: <!--more-->
---

We recently published a paper on [concurrent system programming with effect
handlers](http://kcsrk.info/papers/system_effects_may_17.pdf). In this paper, we show
that with the help of effect handlers, we could express in _direct-style_,
various interactions of a concurrent program with OS services that typically
require callbacks. The question is what do we do about legacy code that uses
monadic concurrency libraries such as Lwt and Async. Surely a wholesale rewrite
of all Lwt and Async code is a no go. This post is an exploration of some ideas
to make Lwt and Async compatible with direct-style code.

<!--more-->

## Monadic Reflection

Andrzej Filinski introduced monadic reflection in his paper [Representing
Monads](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.43.8213&rep=rep1&type=pdf),
characterizing the relationship between monadic style and continuation-passing
style. Practically, in a language like multicore OCaml with native support for
delimited continuations, any monadic style program can also be written in
direct-style. Filinski introduces two operators to transform between the two
styles:

<script src="http://gist-it.appspot.com/https://github.com/kayceesrk/reify_reflect_concurrency/blob/914c24ccfb4e438f17ac779404bf0418d421b450/rr_conc.ml?slice=420:426"></script>

`reify` transforms a direct-style computation to a monadic one and `reflect`
goes the other way. In multicore OCaml, we can implement monadic reflection for
*any* monad as[^yallop]:

<script src="http://gist-it.appspot.com/https://github.com/kayceesrk/reify_reflect_concurrency/blob/914c24ccfb4e438f17ac779404bf0418d421b450/rr_conc.ml?slice=427:440"></script>

[^yallop]: Thanks to [Jeremy Yallop](https://www.cl.cam.ac.uk/~jdy22/) for introducing me to monadic reflection and [contributing this implementation](https://github.com/kayceesrk/effects-examples/blob/master/reify_reflect.ml). 

We introduce an effect `E` which is parameterized with the monadic computation.
When this effect is performed, it returns the result of performing this monadic
computation. `reify` wraps the direct-style computation with an effect handler
that handles `E m` and binds the monadic computation `m` to the rest of the
direct-style computation. `reflect` simply performs the given monadic
computation wrapped in `E`. The idea here is that whenever the monad does
anything interesting, we perform the effect `E` which delegates the handling of
interesting monadic behavior to the effect handler.

## Monadic to Direct 

We implement [chameneos-redux benchmark](https://benchmarksgame.alioth.debian.org/u64q/chameneosredux-description.html#chameneosredux)
from the computer language benchmarks game in direct-style and using concurrency
monad. The benchmark is intended to evaluate the cost of context switching
between tasks. The source code is available
[here](https://github.com/kayceesrk/reify_reflect_concurrency/blob/master/rr_conc.ml)
in a single-self contained file. We implement both versions as functors
(direct-style is `ChameneosD (S : SchedD) (M : MVarD)` and monadic-style is
`ChameneosM (S : SchedM) (M : MVarM)`) parameterized by a scheduler and an MVar
implementation. The signatures of direct and monadic style scheduler and MVars
are:

<script src="http://gist-it.appspot.com/https://github.com/kayceesrk/reify_reflect_concurrency/blob/914c24ccfb4e438f17ac779404bf0418d421b450/rr_conc.ml?slice=2:42"></script>

Using monadic reflection on the monadic scheduler `SchedM` and MVar `MVarM`
implementations, we can instantiate the direct-style functor `ChameneosD`:

<script src="http://gist-it.appspot.com/https://github.com/kayceesrk/reify_reflect_concurrency/blob/914c24ccfb4e438f17ac779404bf0418d421b450/rr_conc.ml?slice=446:461"></script>

We can even instantiate the direct-style functor `ChameneosD` with Lwt with no
extra effort:

<script src="http://gist-it.appspot.com/https://github.com/kayceesrk/reify_reflect_concurrency/blob/914c24ccfb4e438f17ac779404bf0418d421b450/rr_conc.ml?slice=464:483"></script>

Thus, monadic reflection lets you utilize Lwt and Async in direct-style.
Importantly, one gets back backtraces and the use of `raise` and `try...with`
for [exception handling](https://ocsigen.org/lwt/dev/api/Lwt#2_Exceptionshandling). 

## Direct to Monadic

Lwt and Async libraries provide strong guarantees on task interleavings. In
particular, both libraries provide *automatic mutual exclusion* -- context
switches between tasks only occur at bind points. In other words, any
non-monadic functions, such as calls to standard library functions, are
guaranteed not to context switch. With effect handlers, this is no longer the
case since effects are not tracked in the types in multicore OCaml.

We can recover the type level marker with a shallow embedding:

<script src="http://gist-it.appspot.com/https://github.com/kayceesrk/reify_reflect_concurrency/blob/914c24ccfb4e438f17ac779404bf0418d421b450/rr_conc.ml?slice=553:573"></script>

And we can go back to direct-style using monadic reflection:

<script src="http://gist-it.appspot.com/https://github.com/kayceesrk/reify_reflect_concurrency/blob/914c24ccfb4e438f17ac779404bf0418d421b450/rr_conc.ml?slice=577:592"></script>

## Performance

We compared the performance of different configurations for running
chameneos-redux for 1 million iterations:

<p align="center"> <img src="{{ base.url }}/assets/reflection_perf.png" alt="Reflection Performance" width="70%"/> </p>

The results show that monadic reflection has around 9% overhead on average over
the baseline monadic implementations. This is a small price to pay for the
advantage for programming in direct-style.

## Conclusion

We have been prototyping a multicore-capable I/O library for OCaml called
[Aeio](https://github.com/kayceesrk/ocaml-aeio), with compatibility layer for
Lwt and Async built on top of this library. Monadic reflection and other
techniques can help resolve the schism between monadic libraries and
direct-style code.

## Footnotes
