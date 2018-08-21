---
layout: post
title: "JFP Special Issue on Algebraic Effects and Handlers"
date: 2018-08-16 09:09:00
categories: [handlers, paper]
excerpt_separator: <!--more-->
---

[Andrej Bauer](http://www.andrej.com/) and I are editing a special issue of JFP
on the theory and practice of algebraic effects and handlers. The CfP is below.

<hr>

<!--more-->

    CALL FOR PAPERS

    JFP Special Issue
    on
    The Theory and Practice of Algebraic Effects and Handlers

    Submission Deadline: 18 January 2019
    Expected Publication Date: December 2019

## Scope

An important aspect of real-world languages is their support for computational
effects such as raising exceptions, printing to the screen, accessing a
database, non-determinism, and concurrency. In order to reason about the
semantics of a programming language with computational effects, it is necessary
to separate the effects out from the rest of the language. To this end, algebraic
effects permit a wide class of computational effects to be specified in a pure
setting using only operations that give rise to them and equations that the
operations satisfy. The algebraic treatment of operations naturally leads to a
novel treatment of handlers for all computational effects, not just for
exceptions.

Algebraic effect handlers have been steadily gaining attention as a programming
language feature since they generalise many control-flow abstractions such as
exception handling, iterators, async/await, or backtracking, while ensuring
that the composition of various features remains well-behaved. Indeed, there
are implementations of algebraic effects and effect handlers as libraries in C,
Clojure, F#, Haskell, OCaml, Scala, JavaScript, as well as full-fledged
languages such as Eff, Frank, Links, Koka, and Multicore OCaml. Algebraic effect
handlers have also influenced the design of software tools in industry
including Facebook's React UI library and Uber's Pyro probabilistic programming
language.

To recognise and encourage the publication of mature research contributions in
this area, a special issue of the Journal of Functional Programming (JFP) will
be devoted to the same theme.

## Topics

Full-length, archival-quality submissions are solicited on theoretical and
practical aspects of algebraic effects and handlers. Examples
include, but are not limited to:

* Reasoning about algebraic effects and handlers (denotational semantics,
  dependent types, logical relations, language support for equational reasoning)
* Effect typing (subtyping, row-polymorphism, generativity, encapsulation)
* Implementation of effect handlers (dynamic effects, selective CPS
  translations, delimited continuations)
* Applications of algebraic effect handlers (probabilistic programming, event
  correlation, meta-programming, asynchronous I/O, debugging)

<br/>
Reports on applications of these techniques to real-world problems are
especially encouraged, as are submissions that relate ideas and concepts from
several of these topics, or bridge the gap between theory and practice.

Papers will be reviewed as regular JFP submissions, and acceptance in the
special issue will be based on both JFP's quality standards and relevance to
the theme. The special issue also welcomes high-quality survey and position
papers that would benefit a wide audience.

Authors are encouraged to indicate interest in submitting by **December 14,
2018**, to aid in identifying suitable reviewers. The submission deadline is
**January 18, 2019**. The expected submission length is 25-35 pages, excluding
bibliography and appendices. Shorter submissions are encouraged; prospective
authors of longer submissions should discuss their plans with the special issue
editors in advance.

Submissions that are based on previously-published conference or workshop
papers must clearly describe the relationship with the initial publication, and
must differ sufficiently that the author can assign copyright to Cambridge
University Press. Prospective authors are welcome to discuss such submissions
with the editors to ensure compliance with this policy.

## Submissions

Submissions should be sent through the JFP Manuscript Central system at
[https://mc.manuscriptcentral.com/cup/jfp_submit](https://mc.manuscriptcentral.com/cup/jfp_submit).
Choose “Effects and Handlers” as the paper type, so that it gets assigned to the
special issue.

For other submission details, please consult an issue of the Journal of
Functional Programming or see the Journal's web page at
[http://journals.cambridge.org/jid_JFP](http://journals.cambridge.org/jid_JFP).

## Tentative Schedule

* 14 December 2018: Expression of interest
* 18 January 2019: Submission deadline
* 22 April 2019: First round of reviews
* 23 August 2019: Revision deadline
* 15 November 2019: Second round of reviews
* 13 December 2019: Final accepted versions due

## Guest Editors

* Andrej Bauer, Faculty of Mathematics and Physics, University of Ljubljana
* KC Sivaramakrishnan, Department of Computer Science and Technology,
  University of Cambridge

## Editors in Chief

* Jeremy Gibbons, Department of Computer Science, University of Oxford
* Matthias Felleisen, College of Computer and Information Science, Northeastern
  University
