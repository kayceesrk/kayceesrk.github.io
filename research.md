---
layout: default
title: Research
permalink: research.html
---

# Themes

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

## Programming Weakly Consistent Stores

While the NoSQL revolution gave us scalable web services that we have all come
to accept (and depend on!), it also gave us weak consistency. No longer was it
possible (and profitable) to provide strongly consistent view of a replicated
database and yet achieve the scalability demands of a popular web service. Weak
consistency makes the development of correct applications quite difficult, even
for expert programmers. The problem is analogous to the weak memory behaviours
on modern multicore architectures, but unlike the multicore architectures, we do
not have an efficient
[DRF-SC](https://blog.acolyer.org/2019/11/27/mergeable-replicated-data-types-part-ii/)
guarantee that we can fall back to. How can we then write correct programs on
such weakly consistent stores.

My research has developed a series of approaches to better programmability under
weak consistency. [Quelea](http://kcsrk.info/publications#pldi15) develops a
programming model for expressing replicated data types as a purely functional
program, and synthesizes the weakest consistency model under which the
applications can be run given the application requirements. We have also
developed [better programming
abstractions](https://github.com/mirage/irmin#oopsla19) over
[Irmin](https://github.com/mirage/irmin), a distributed database developed on
the principles of Git. 

# Team

## PhD Students

* Sheera Shamsu (2019-)
* Vimala S (2020-)

## MS Students

* Shashank Shekhar Dubey (2019-)
* Sumit Padhiyar (2019-)

## MTech Students

* Atul Dhiman (2019-2020)

## Research Software Development Engineers

* Shakti Kannan (2020-)
* Shubham Kumar (2019-)
* Sudha Parimala (2019-)
* Sai Venkata Krishnan (2019-)
* Anmol Sahoo (2019-2020)

## Interns

### At OCaml Labs
  * Anirudh Sunder Raj, IITM (Summer 2020)
  * Shagun Goel, Stanford University (Summer 2020)

### At IITM

  * Pratap Singh, Harvard University (Summer 2019)

## Past @ University of Cambridge 

  * Simon Fowler, Intern, University of Edinburgh
  * Matevz Polijanc, Part II Project, University of Cambridge
  * Charlie Crisp, Part II Project, University of Cambridge
  * Henry Mercer, Part II Project, University of Cambridge
  * Nicolas Assouad, Intern, ENS Paris
  * Matt Harrison, Part II Project, University of Cambridge
  * Maxime Lesourd, Intern, ENS de Lyon
  * Philip Dexter, Intern, Binghampton University
  * James Wright, Intern, University of Cambridge
  * Armael Gueneau, Intern, ENS de Lyon
  * Theo Laurent, Intern, ENS Paris
  * Guillain Potron, Intern, ENS de Lyon
