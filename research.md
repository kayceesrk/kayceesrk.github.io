---
layout: default
title: Research
permalink: research.html
---

# Research

I work on the intersection of programming languages and (concurrent, parallel,
distributed, operating) systems. My recent research has been under the two
following topics:

## Multicore OCaml

The aim of the [Multicore
OCaml](https://github.com/ocaml-multicore/ocaml-multicore) project is to build
sound and efficient support for concurrency and parallelism in the OCaml
programming language. I focus on all parts of the stack from language design,
verification, compiler, runtime systems, and hardware support for efficient
concurrency and parallelism. 

Concurrency in Multicore OCaml is expressed through [effect
handlers](http://kcsrk.info/publications.html#sys17), an abstraction for
programming and reasoning about computational effects in a pure setting. The
runtime behaviour of effect handlers is akin to delimited continuations. By
providing efficient delimited continuations as a language mechanism rather than
high-level constructs like coroutines and threads, we simplify the runtime
system design and allow high-level abstractions to be expressed as libraries
that live outside the core compiler distribution. Effect handlers are also part
of the plan to make OCaml a pure (in the sense of Haskell
[purity](https://wiki.haskell.org/Pure)) language.

Multicore OCaml is equipped with a [mostly-concurrent garbage
collector](http://kcsrk.info/multicore/gc/2017/07/06/multicore-ocaml-gc/) that
optimises for latency. Multicore OCaml is one of the few languages to have a
sane memory model that can be efficiently compiled to ARM and POWER. At the
heart of the memory model is a new [modular version of the DRF-SC
property](http://kcsrk.info/publications.html#pldi18). 
