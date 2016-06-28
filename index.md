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

# Timeline

<img src="assets/timeline.png" alt="Timeline" style="width: 38rem;"/>

# Publications

## Overview

 * Distributed Programming : [PLDI15](#pldi15) | [PADL14](#padl14) | [ML13](#ml13)
 * Concurrent Programming : [OCaml15](#ocaml15) | [PLDI11](#pldi11) | [ICFP09](#icfp09) | [JFP16](#jfp16) | [ML10](#ml10) | [TR11](#tr11) | [DAMP10](#damp10)
 * Multicore Runtime : [JFP14](#jfp14) | [MARC12](#marc12) | [ISMM12](#ismm12) | [SFMA11](#sfma11)
 * Session Types : [SCP13](#scp13) | [COORDINATION10](#coordination10)

## PhD Dissertation

 * <div id="phd"/> KC Sivaramakrishnan
<div> [Functional Programming Abstractions for Weakly Consistent Systems](papers/dissertation_dec14.pdf) </a> </div>
<div> *Department of Computer Science, Purdue University, Dec 2014* </div>
<div style="font-size: 80%"> [\[slides (pdf)\]](slides/defense.pdf) [\[slides (pptx)\]](slides/defense.pptx) [\[bib\]](bib/phd.txt) </div>

## Journal publications

 1. <div id="jfp16"/> KC Sivaramakrishnan, Tim Harris, Simon Marlow, Simon Peyton Jones
<div> [Composable Scheduler Activations for Haskell](papers/schedact_jfp16.pdf) </a> </div>
<div> *Journal of Functional Programming (JFP), 2016* </div>
<div style="font-size: 80%"> [\[code\]](https://github.com/ghc/ghc/tree/ghc-lwc2) </div>
<div style="line-height: 50%"> </br> </div>
 2. <div id="jfp14"/> KC Sivaramakrishnan, Gowtham Kaki, Suresh Jagannathan
<div> [Representation without Taxation: A Uniform, Low-Overhead, and High-Level
Interface to Eventually Consistent Key-Value Stores](papers/quelea_ieee16.pdf) </a> </div>
<div> *IEEE Data Engineering Bulletin, 39(1): 52 – 64, March 2016* </div>
<div style="font-size: 80%">  **Invited Paper** [\[bib\]](bib/ieee16.txt) </div>
<div style="line-height: 50%"> </br> </div>
 3. <div id="jfp14"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
<div> [MultiMLton: A Multicore-aware Runtime for Standard ML](papers/multimlton_jfp14.pdf) </a> </div>
<div> *Journal of Functional Programming (JFP), 24(6): 613 – 674, 2014* </div>
<div style="font-size: 80%"> [\[code\]](https://github.com/kayceesrk/multiMLton) [\[bib\]](bib/jfp14.txt) </div>
<div style="line-height: 50%"> </br> </div>
 4. <div id="scp13"/> KC Sivaramakrishnan, Mohammad Qudeisat, Lukasz Ziarek, Karthik Nagaraj, Patrick Eugster
<div> [Efficient Sessions](papers/sting_scp13.pdf) </a> </div>
<div> *Science of Computer Programming (SCP), 78(2): 147 – 167, 2013* </div>
<div style="font-size: 80%">  **Invited Paper** [\[code\]](https://github.com/kayceesrk/Sting) [\[bib\]](bib/scp13.txt) </div>

## Conference publications

 1. <div id="pldi15"/> KC Sivaramakrishnan, Gowtham Kaki, Suresh Jagannathan
<div> [Declarative Programming over Eventually Consistent Data Stores](papers/quelea_pldi15.pdf) </div>
<div> *International Conference on Programming Language Design and Implementation (PLDI), 2015* </div>
<div style="font-size: 80%"> [\[code\]](http://kcsrk.info/Quelea) [\[techrep\]](papers/quelea-long.pdf) [\[bib\]](bib/pldi15.txt) </div>
<div style="line-height: 50%"> </br> </div>
 2. <div id="padl14"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
<div> [Rx-CML: A Prescription for Safely Relaxing Synchrony](papers/rxcml_padl14.pdf) </a> </div>
<div> *Symposium on Practical Aspects of Declarative Languages (PADL), 2014* </div>
<div style="font-size: 80%"> [\[code\]](https://github.com/kayceesrk/mlton-zmq) [\[slides (pdf)\]](slides/padl14.pdf) [\[slides (key)\]](slides/padl14.key) [\[bib\]](bib/padl14.txt) </div>
<div style="line-height: 50%"> </br> </div>
 3. <div id="marc12"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
<div> [A Coherent and Managed Runtime for ML on the SCC](papers/mmscc_marc12.pdf) </a> </div>
<div> *Many-core Architecture Research Community Symposium (MARC), 2012* </div>
<div style="font-size: 80%"> **Best Paper Award** [\[code\]](https://github.com/kayceesrk/multiMLton/tree/split-heap-parallel-GC-IntelSCC) [\[slides (pdf)\]](slides/marc12.pdf) [\[slides (pptx)\]](slides/marc12.pptx) [\[bib\]](bib/marc12.txt) </div>
<div style="line-height: 50%"> </br> </div>
 4. <div id="ismm12"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
<div> [Eliminating Read Barriers through Procrastination and Cleanliness](papers/mmgc_ismm12.pdf) </a> </div>
<div> *International Symposium on Memory Management (ISMM), 2012* </div>
<div style="font-size: 80%"> [\[slides (pdf)\]](slides/ismm12.pdf) [\[slides (pptx)\]](slides/ismm12.pptx) [\[bib\]](bib/ismm12.txt) </div>
<div style="line-height: 50%"> </br> </div>
 5. <div id="pldi11"/> Lukasz Ziarek, KC Sivaramakrishnan, Suresh Jagannathan
<div> [Composable Asynchronous Events](papers/acml_pldi11.pdf) </a> </div>
<div> *International Conference on Programming Language Design and Implementation (PLDI), 2011* </div>
<div style="font-size: 80%"> [\[bib\]](bib/pldi11.txt) </div>
<div style="line-height: 50%"> </br> </div>
 6. <div id="coordination10"/> KC Sivaramakrishnan, Karthik Nagaraj, Lukasz Ziarek, Patrick Eugster
<div> [Efficient Session Type Guided Distributed Interaction](papers/sting_coordination10.pdf) </a> </div>
<div> *International Conference on Coordination Models and Languages (COORDINATION), 2010* </div>
<div style="font-size: 80%"> [\[code\]](https://github.com/kayceesrk/Sting) [\[slides (pdf)\]](slides/coordination10.pdf) [\[slides (key)\]](slides/coordination10.key) [\[bib\]](bib/coordination10.txt) </div>
<div style="line-height: 50%"> </br> </div>
 7. <div id="icfp09"/> Lukasz Ziarek, KC Sivaramakrishnan, Suresh Jagannathan
<div> [Partial Memoization of Concurrency and Communication](papers/memo_icfp09.pdf) </a> </div>
<div> *International Conference on Functional Programming (ICFP), 2009* </div>
<div style="font-size: 80%"> [\[bib\]](bib/icfp09.txt) </div>

## Workshop publications

 1. <div id="ocaml15"/> Stephen Dolan, Leo White, KC Sivaramakrishnan, Jeremy Yallop and Anil Madhavapeddy
<div> [Effective Concurrency with Algebraic Effects](papers/effects_ocaml15.pdf) </a> </div>
<div> *OCaml Worshop, 2015* </div>
<div style="font-size: 80%"> [\[code\]](https://github.com/kayceesrk/ocaml-eff-example) [\[slides (pdf)\]](slides/OCaml15.pdf) [\[slides (key)\]](slides/OCaml15.key) </div>
<div style="line-height: 50%"> </br> </div>
 2. <div id="ml13"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
<div> [Migrating MultiMLton to the Cloud](papers/mmcloud_mlw13.pdf) </a> </div>
<div> *ML Worshop, 2013* </div>
<div style="line-height: 50%"> </br> </div>
 3. <div id="sfma11"/> Daniel G. Waddington, Chen Tian, KC Sivaramakrishnan
<div> [Scalable Lightweight Task Management Schemes for MIMD Processors](papers/snapple_sfma11.pdf) </a> </div>
<div> *Workshop on Systems for Future Multi-Core Architectures (SFMA), 2011* </div>
<div style="font-size: 80%"> [\[bib\]](bib/sfma11.txt) </div>
<div style="line-height: 50%"> </br> </div>
 4. <div id="ml10"/> Suresh Jagannathan, Armand Navabi, KC Sivaramakrishnan, Lukasz Ziarek
<div> [Design Rationale for MultiMLton](papers/multimlton_mlw10.pdf) </a> </div>
<div> *ML Workshop, 2010* </div>
<div style="font-size: 80%"> [\[bib\]](bib/mlw10.txt) </div>
<div style="line-height: 50%"> </br> </div>
 5. <div id="damp10"/> KC Sivaramakrishnan, Lukasz Ziarek, Raghavendra Prasad, Suresh Jagannathan
<div> [Lightweight Asynchrony using Parasitic Threads](papers/parasites_damp10.pdf) </a> </div>
<div> *Workshop on Declarative Aspects of Multicore Programming (DAMP), 2010* </div>
<div style="font-size: 80%"> [\[bib\]](bib/damp10.txt) </div>

## Technical Reports and Drafts

 1. <div id="tr11"/> KC Sivaramakrishnan, Lukasz Ziarek, Suresh Jagannathan
<div> [Featherweight Threads for Communication](papers/parasites_tech11.pdf) </a> </div>
<div> *Purdue University Computer Science Technical Report – TR-11-018, 2011* </div>
<div style="font-size: 80%"> [\[bib\]](bib/featherweight.txt) </div>

# Talks

 * **Concurrent and Multicore OCaml: A deep dive**
<div> Facebook, Menlo Park, CA, Jan 2016 </div>
<div style="font-size: 80%"> [\[slides (pdf)\]](slides/multicore_fb16.pdf) [\[slides (key)\]](slides/multicore_fb16.key) </div>
 * **Effective Concurrency with Algebraic Effects**
<div> OCaml Workshop, Sep 2015 </div>
 * **Functional Programming Abstractions for Weakly Consistent Systems**
<div> Purdue University, Dec 2014 </div>
 * **Functional Abstractions for Practical and Scalable Concurrent Programming**
<div> Microsoft Research, Cambridge, UK, Mar 2014 </div>
<div style="font-size: 80%"> [\[slides (pdf)\]](slides/msr14.pdf) [\[slides (pptx)\]](slides/msr14.pptx) </div>
 * **Rx-CML: A Prescription for Safely Relaxing Synchrony**
<div> PADL '14, Jan 2014</div>
 * **Migrating MultiMLton to the Cloud**
<div> ML Workshop '13, Sep 2013 </div>
 * **A Coherent and Managed Runtime for ML on the SCC**
<div> MARC '12, Nov 2012 </div>
 * **Eliminating Read Barriers through Procrastination and Cleanliness**
<div> &dagger; &nbsp; ISMM '12, Jun 2012 </div>
<div> &dagger; &nbsp; Wrestling Wednesdays, Microsoft Research, Cambridge, May 2012 </div>
 * **Lightweight Concurrency in GHC**
<div> Microsoft Research, Cambridge, May 2012 </div>
<div style="font-size: 80%"> [\[slides (pdf)\]](slides/ghclwc.pdf) [\[slides (pptx)\]](slides/ghclwc.pptx) </div>
 * **Efficient Session Type guided Distributed Interaction**
<div> COORDINATION '12, Jun 2012 </div>

