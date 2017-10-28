---
layout: default
title: About
---

<img src="assets/profile.jpeg" alt="ProfileImage" style="width: 220px; float:
left; padding-right: 1rem; padding-left: 0.5rem; padding-top: 0.4rem;"/> I am a
Post-doctoral Research Associate under the [OCaml
Labs](http://www.cl.cam.ac.uk/projects/ocamllabs/) initiative at the
[University of Cambridge](http://www.cam.ac.uk/) [Computer
Lab](http://www.cl.cam.ac.uk/), an [1851 Research
Fellow](http://www.royalcommission1851.org/awards/) and a Research Fellow at
[Darwin College, Cambridge](https://www.darwin.cam.ac.uk/). I am also a member
of the [Network and Operating
Systems](http://www.cl.cam.ac.uk/research/srg/netos/) group.

I am interested in the design and implementation of concurrent functional
programming languages targeting scalable platforms such as many-core processors
and compute clouds. My research spans programming models, compilers, static
analysis, schedulers, threading systems, and memory management.

Before coming to Cambridge, I was a [graduate
student](https://www.cs.purdue.edu/homes/chandras/) at [Purdue
University](http://www.purdue.edu/) where I obtained an MS and a PhD degree in
Computer Science under the supervision of the wonderful [Prof. Suresh
Jagannathan](https://www.cs.purdue.edu/homes/suresh/). At Purdue, I led the
[MultiMLton](http://multimlton.cs.purdue.edu/) and
[Quelea](http://kcsrk.info/Quelea/) projects. Before that, I obtained my BEng
degree in Computer Science and Engineering from [Anna University,
India](https://www.annauniv.edu/).

 * [CV](cv/cv.pdf)
 * [Research Statement](research/research.pdf)

# Contact

 * Email : `(\i -> i ++ "@cl.cam.ac.uk") "sk826"`
 * IRL : 15 JJ Thomson Ave, Cambridge CB3 0FD
 * Twitter : <a href="https://twitter.com/kc_srk"> @kc_srk </a>
 * Github : <a href="https://github.com/kayceesrk"> kayceesrk </a>
 * BitBucket : <a href="https://bitbucket.org/kayceesrk"> kayceesrk </a>

# Latest News

 * **\[Sep 17\]** Running a tutorial on "Concurrent Programming with Effect Handlers"
   at [ICFP 2017 @ Oxford](http://cufp.org/2017/c3-daniel-hillerstrom-kc-concurrent-programming-with-effect-handlers.html).
 * **\[Jul 17\]** Organizing Dagstuhl Seminar on ["Algebraic Effect Handlers go Mainstream"](http://www.dagstuhl.de/en/program/calendar/semhp/?semnr=18172)
   with Daan Leijen, Matija Pretnar, Tom Schrijvers. The seminar will take place in April 2018.

# Timeline

<a href="timeline.html">
  <img src="assets/timeline.png" alt="Timeline" style="width: 45rem;"/>
</a>

# Publications

## Overview

 * Distributed Programming : [PLDI15](#pldi15), [PADL14](#padl14), [ML13](#ml13)
 * Concurrent Programming : [OCaml15](#ocaml15), [PLDI11](#pldi11), [ICFP09](#icfp09), [JFP16](#jfp16), [ML10](#ml10), [TR11](#tr11), [DAMP10](#damp10)
 * Multicore Runtime : [JFP14](#jfp14), [MARC12](#marc12), [ISMM12](#ismm12), [SFMA11](#sfma11)
 * Session Types : [SCP13](#scp13), [COORDINATION10](#coordination10)

## PhD Dissertation

 * <div id="phd"/> KC Sivaramakrishnan
   [Functional Programming Abstractions for Weakly Consistent Systems](papers/dissertation_dec14.pdf)
   *Department of Computer Science, Purdue University, Dec 2014*
   [\[slides (pdf)\]](slides/defense.pdf) [\[slides (pptx)\]](slides/defense.pptx) [\[bib\]](bib/phd.txt)

## Drafts

 1. <div id="eff17"/> Oleg Kiselyov and KC Sivaramakrishnan
    [Eff directly in OCaml](papers/caml-eff17.pdf)
    In submission, Apr 2017

## Journal publications

 1. <div id="jfp16"/> KC Sivaramakrishnan, Tim Harris, Simon Marlow, Simon Peyton Jones
    [Composable Scheduler Activations for Haskell](papers/schedact_jfp16.pdf)
    *Journal of Functional Programming (JFP), 2016*
    [\[code\]](https://github.com/ghc/ghc/tree/ghc-lwc2)
 2. <div id="jfp14"/> KC Sivaramakrishnan, Gowtham Kaki, Suresh Jagannathan
    [Representation without Taxation: A Uniform, Low-Overhead, and High-Level Interface to Eventually Consistent Key-Value Stores](papers/quelea_ieee16.pdf)
    *IEEE Data Engineering Bulletin, 39(1): 52 – 64, March 2016*
    **Invited Paper** [\[bib\]](bib/ieee16.txt)
 3. <div id="jfp14"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
    [MultiMLton: A Multicore-aware Runtime for Standard ML](papers/multimlton_jfp14.pdf)
    *Journal of Functional Programming (JFP), 24(6): 613 – 674, 2014*
    [\[code\]](https://github.com/kayceesrk/multiMLton) [\[bib\]](bib/jfp14.txt)
 4. <div id="scp13"/> KC Sivaramakrishnan, Mohammad Qudeisat, Lukasz Ziarek, Karthik Nagaraj, Patrick Eugster
    [Efficient Sessions](papers/sting_scp13.pdf)
    *Science of Computer Programming (SCP), 78(2): 147 – 167, 2013*
    **Invited Paper** [\[code\]](https://github.com/kayceesrk/Sting) [\[bib\]](bib/scp13.txt)

## Conference publications

 1. <div id="fscd17"/> Daniel Hillerström, Sam Lindley, Robert Atkey, KC Sivaramakrishnan
    [Continuation Passing Style for Effect Handlers](papers/cps-handler-fscd17.pdf)
    *International Conference on Formal Structures for Computation and Deduction (FSCD), 2017*
 2. <div id="snapl17"/> Gowtham Kaki, KC Sivaramakrishnan, Thomas Gazagnaire, Anil Madhavapeddy, Suresh Jagannathan
    [DaLi: Database as a Library](papers/dali_snapl17.pdf)
    *The 2nd Annual Summit on Advances in Programming Languages (SNAPL), 2017*
    Oral presentation
 3. <div id="pldi15"/> KC Sivaramakrishnan, Gowtham Kaki, Suresh Jagannathan
    [Declarative Programming over Eventually Consistent Data Stores](papers/quelea_pldi15.pdf)
    *International Conference on Programming Language Design and Implementation (PLDI), 2015*
    [\[code\]](http://kcsrk.info/Quelea) [\[techrep\]](papers/quelea-long.pdf) [\[bib\]](bib/pldi15.txt)
 4. <div id="padl14"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
    [Rx-CML: A Prescription for Safely Relaxing Synchrony](papers/rxcml_padl14.pdf)
    *Symposium on Practical Aspects of Declarative Languages (PADL), 2014*
    [\[code\]](https://github.com/kayceesrk/mlton-zmq) [\[slides (pdf)\]](slides/padl14.pdf) [\[slides (key)\]](slides/padl14.key) [\[bib\]](bib/padl14.txt)
 5. <div id="marc12"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
    [A Coherent and Managed Runtime for ML on the SCC](papers/mmscc_marc12.pdf)
    *Many-core Architecture Research Community Symposium (MARC), 2012*
    **Best Paper Award** [\[code\]](https://github.com/kayceesrk/multiMLton/tree/split-heap-parallel-GC-IntelSCC) [\[slides (pdf)\]](slides/marc12.pdf) [\[slides (pptx)\]](slides/marc12.pptx) [\[bib\]](bib/marc12.txt)
 6. <div id="ismm12"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
    [Eliminating Read Barriers through Procrastination and Cleanliness](papers/mmgc_ismm12.pdf)
    *International Symposium on Memory Management (ISMM), 2012*
    [\[slides (pdf)\]](slides/ismm12.pdf) [\[slides (pptx)\]](slides/ismm12.pptx) [\[bib\]](bib/ismm12.txt)
 7. <div id="pldi11"/> Lukasz Ziarek, KC Sivaramakrishnan, Suresh Jagannathan
    [Composable Asynchronous Events](papers/acml_pldi11.pdf)
    *International Conference on Programming Language Design and Implementation (PLDI), 2011*
    [\[bib\]](bib/pldi11.txt)
 8. <div id="coordination10"/> KC Sivaramakrishnan, Karthik Nagaraj, Lukasz Ziarek, Patrick Eugster
    [Efficient Session Type Guided Distributed Interaction](papers/sting_coordination10.pdf)
    *International Conference on Coordination Models and Languages (COORDINATION), 2010*
    [\[code\]](https://github.com/kayceesrk/Sting) [\[slides (pdf)\]](slides/coordination10.pdf) [\[slides (key)\]](slides/coordination10.key) [\[bib\]](bib/coordination10.txt)
 9. <div id="icfp09"/> Lukasz Ziarek, KC Sivaramakrishnan, Suresh Jagannathan
    [Partial Memoization of Concurrency and Communication](papers/memo_icfp09.pdf)
    *International Conference on Functional Programming (ICFP), 2009*
    [\[bib\]](bib/icfp09.txt)

## Workshop publications

 1. <div id="mcm17"/> Stephen Dolan and KC Sivaramakrishnan
    [A Memory Model for Multicore OCaml](papers/memory_model_ocaml17.pdf)
    *OCaml Workshop, 2017*
 2. <div id="awk17"/> Stephen Dolan, Spiros Eliopolous, Daniel Hillerström, Anil Madhavapeddy, KC Sivaramakrishnan, Leo White
    [Effectively Tackling the Awkward Squad](papers/awkward_effects_ml17.pdf)
    *ML Workshop, 2017*
 3. <div id="mt17"/> Gowtham Kaki, KC Sivaramakrishnan, Samodya Abeysiriwardane, Suresh Jagannathan
    [Mergeable Types](papers/mergeable_types_ml17.pdf)
    *ML Workshop, 2017*
 4. <div id="sys17"/> Stephen Dolan, Spiros Eliopolous, Daniel Hillerström, Anil Madhavapeddy, KC Sivaramakrishnan, Leo White
    [Concurrent System Programming with Effect Handlers](papers/system_effects_may_17.pdf)
    *Trends in Functional Programming, 2017*
 5. <div id="ppl17"/> Oleg Kiselyov and KC Sivaramakrishnan
    [Eff directly in OCaml](papers/eff_ocaml_ppl17.pdf)
    *JSSST Workshop on Programming and Programming Languages, 2017*
 6. <div id="ocaml16"/> KC Sivaramakrishnan and Théo Laurent
    [Lock-free programming for the masses](papers/reagents_ocaml16.pdf)
    *OCaml Workshop, 2016*
 7. <div id="ml16_1"/> Daniel Hilleström, Sam Lindley, KC Sivaramakrishnan
    [Compiling Links Effect Handlers to the OCaml Backend](papers/links_ocaml_ml16.pdf)
    *ML Worshop, 2016*
 8. <div id="ml16_2"/> Oleg Kiselyov and Kc Sivaramakrishnan
    [Eff Directly in OCaml](papers/eff_ocaml_ml16.pdf)
    *ML Worshop, 2016*
 9. <div id="ocaml15"/> Stephen Dolan, Leo White, KC Sivaramakrishnan, Jeremy Yallop and Anil Madhavapeddy
    [Effective Concurrency with Algebraic Effects](papers/effects_ocaml15.pdf)
    *OCaml Worshop, 2015*
    [\[code\]](https://github.com/kayceesrk/ocaml-eff-example) [\[slides (pdf)\]](slides/OCaml15.pdf) [\[slides (key)\]](slides/OCaml15.key)
 10. <div id="ml13"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
    [Migrating MultiMLton to the Cloud](papers/mmcloud_mlw13.pdf)
    *ML Worshop, 2013*
 11. <div id="sfma11"/> Daniel G. Waddington, Chen Tian, KC Sivaramakrishnan
    [Scalable Lightweight Task Management Schemes for MIMD Processors](papers/snapple_sfma11.pdf)
    *Workshop on Systems for Future Multi-Core Architectures (SFMA), 2011*
    [\[bib\]](bib/sfma11.txt)
 12. <div id="ml10"/> Suresh Jagannathan, Armand Navabi, KC Sivaramakrishnan, Lukasz Ziarek
    [Design Rationale for MultiMLton](papers/multimlton_mlw10.pdf)
    *ML Workshop, 2010*
    [\[bib\]](bib/mlw10.txt)
 13. <div id="damp10"/> KC Sivaramakrishnan, Lukasz Ziarek, Raghavendra Prasad, Suresh Jagannathan
    [Lightweight Asynchrony using Parasitic Threads](papers/parasites_damp10.pdf)
    *Workshop on Declarative Aspects of Multicore Programming (DAMP), 2010*
    [\[bib\]](bib/damp10.txt)

## Technical Reports

 1. <div id="tr11"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
    [Featherweight Threads for Communication](papers/parasites_tech11.pdf)
    *Purdue University Computer Science Technical Report – TR-11-018, 2011*
    [\[bib\]](bib/featherweight.txt)

## Talks

 * **A Deep Dive into Multicore OCaml Garbage Collector**
   &dagger; &nbsp; Department Seminar, Computer Science and Engineering, IIT Madras, Oct 2017
   &dagger; &nbsp; System Research Group (SRG) seminar, Computer Laboratory, University of Cambridge, Jul 2017
   &dagger; &nbsp; JaneStreet Group, New York, Jul 2017
   [\[Annotated slides\]](http://kcsrk.info/multicore/gc/2017/07/06/multicore-ocaml-gc/)[\[slides (pdf)\]](slides/multicore_gc.pdf) [\[slides (key)\]](slides/multicore_gc.key)
 * **Composable lock-free programming for Multicore OCaml**
   ABCD Meeting, University of Edinburgh, Nov 2016
   [\[slides (pdf)\]](slides/reagents_edinburgh.pdf) [\[slides (key)\]](slides/reagents_edinburgh.key)
 * **Practical Algebraic Effect Handlers in Multicore OCaml**
   LFCS Seminar, University of Edinburgh, Nov 2016
   [\[slides (pdf)\]](slides/handlers_edinburgh.pdf) [\[slides (key)\]](slides/handlers_edinburgh.key)
 * **Effective Concurrency and Parallelism in Multicore OCaml**
   Invited Seminar, IIT Madras, Nov 2016
 * **Effective Concurrency and Parallelism in Multicore OCaml**
   Invited Seminar, IIT Bombay, Nov 2016
 * **Effective parallelism with Reagents**
   London Facebook Faculty Summit - Facebook London, UK, Sep 2016
   [\[slides (pdf)\]](slides/reagents_fb_fac_summit_16.pdf) [\[slides (key)\]](slides/reagents_fb_fac_summit_16.key)
 * **Multicore OCaml and Programming with Reagents**
   [LDN Functionals](https://www.meetup.com/London-Functionals/), Jane Street UK, London, Aug 2016
   [\[video\]](https://youtu.be/qRWTws_YPBA) [\[slides (pdf)\]](slides/reagents_aug_2_17.pdf) [\[slides (key)\]](slides/reagents_aug_2_17.key)
 * **Effect handlers in Multicore OCaml**
   Dagstuhl Seminar, Mar 2016
   [\[slides (pdf)\]](slides/handlers_dagstuhl_16.pdf) [\[slides (key)\]](slides/handlers_dagstuhl_16.key)
 * **Arrows and Reagents**
   Invited Lecture, Advanced Functional Programming, Mar 2016
   [\[slides (pdf)\]](slides/reagents_adv_fp_16.pdf) [\[slides (key)\]](slides/reagents_adv_fp_16.key)
 * **Concurrent and Multicore OCaml: A deep dive**
   Facebook, Menlo Park, CA, Jan 2016
   [\[slides (pdf)\]](slides/multicore_fb16.pdf) [\[slides (key)\]](slides/multicore_fb16.key)
 * **Multicore OCaml: Status Report**
   OCaml Developer's workshop, Paris, Nov 2015
 * **The state of the OCaml Platform**
   OCaml Consortium Meeting, Paris, Nov 2015
 * **Silence is Golden: Controlling Communication and Coordination in Distributed Databases**
   Darwin College Science Seminar, University of Cambridge, Oct 2015
 * **Effective Concurrency with Algebraic Effects**
  OCaml Workshop, Sep 2015
 * **Quelea: Declarative Programming over Eventually Consistent Data Stores**
   University of Cambridge, Apr 2015
 * **Functional Programming Abstractions for Weakly Consistent Systems**
   Purdue University, Dec 2014
 * **Functional Abstractions for Practical and Scalable Concurrent Programming**
   Microsoft Research, Cambridge, UK, Mar 2014
   [\[slides (pdf)\]](slides/msr14.pdf) [\[slides (pptx)\]](slides/msr14.pptx)
 * **Rx-CML: A Prescription for Safely Relaxing Synchrony**
   PADL '14, Jan 2014
 * **Migrating MultiMLton to the Cloud**
   ML Workshop '13, Sep 2013
 * **A Coherent and Managed Runtime for ML on the SCC**
   MARC '12, Nov 2012
 * **Eliminating Read Barriers through Procrastination and Cleanliness**
   &dagger; &nbsp; ISMM '12, Jun 2012
   &dagger; &nbsp; Wrestling Wednesdays, Microsoft Research, Cambridge, May 2012
 * **Lightweight Concurrency in GHC**
   Microsoft Research, Cambridge, May 2012
   [\[slides (pdf)\]](slides/ghclwc.pdf) [\[slides (pptx)\]](slides/ghclwc.pptx)
 * **Efficient Session Type guided Distributed Interaction**
   COORDINATION '12, Jun 2012
