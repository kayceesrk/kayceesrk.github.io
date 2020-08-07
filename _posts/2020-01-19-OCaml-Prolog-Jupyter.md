---
layout: post
title: "Teaching OCaml and Prolog through Jupyter Notebooks"
date: 2020-01-19 15:16
categories: [OCaml, Prolog, Jupyter, Notebooks]
excerpt_separator: <!--more-->
---

Last semester at IIT Madras, I taught a revamped core course [CS3100 Paradigms
of Programming](http://kcsrk.info/cs3100_f19/), which introduces 3rd-year
students to functional and logic programming paradigms. While the course had
been traditionally offered in Lisp and Prolog, I introduced OCaml instead of
Lisp. All of the lectures were delivered through interactive Jupyter
notebooks. The assignments were also distributed as Jupyter notebooks and
evaluated through autograder facility in Jupyter. There has since been several
requests to replicate this setup elsewhere. Hence, I thought I should write
about the set up and experience of teaching through Jupyter notebooks. 

<!--more-->

## Course Content

Having never taken a functional programming course, there was the question of
what I wanted the students to take away from the course. I wanted the course to
be a mixture of functional programming concepts (types and lambda calculus) as
well as advanced yet pragmatic concepts that one would find in modern functional
programming languages (such as GADTs and Monads). The OCaml part of the course
is based on the excellent [CS3110 from
Cornell](https://www.cs.cornell.edu/courses/cs3110/2019sp/) and [AFP from
Cambridge Computer Laboratory](https://www.cl.cam.ac.uk/teaching/1718/L28/). In
particular, I would highly recommend the [CS3110
book](https://www.cs.cornell.edu/courses/cs3110/2019sp/textbook/intro/3110.html)
for anyone taking first steps into functional programming. Lambda calculus
lectures were based on Peter Selinger's [lecture notes on lambda
calculus](https://arxiv.org/abs/0804.3434).

The Prolog part of the course were modelled on [Prolog lectures from Cambridge
Computer Laboratory](https://www.cl.cam.ac.uk/teaching/1819/Prolog/) and the
wonderful [The Art of
Prolog](https://mitpress.mit.edu/books/art-prolog-second-edition) book. 

Teaching functional and logic programming in the same course allowed me to
develop interesting content that intersected both of the paradigms. In the
functional programming part of the lecture, I had introduced [simply typed
lambda calculus](http://kcsrk.info/cs3100_f19/lectures/lec11/lec11.pdf). In the
logic part of the course, we developed a type checker for simply typed lambda
calculus in Prolog. Merely encoding type checking rules for simply typed lambda
calculus in Prolog, [type inference with polymorphic types falls
out](http://kcsrk.info/cs3100_f19/lectures/lec25/lec25.pdf). With a tiny bit of
coaxing, Prolog synthesizes programs for the given type. In the last assignment,
the students were asked to implement [a Prolog interpreter in
OCaml](https://github.com/kayceesrk/cs3100_f19/blob/gh-pages/assignments/assignment6.ipynb).
There was indeed some value in teaching multiple paradigms in the same course,
not just for a comparative study of strengths and weaknesses, but to be able to
teach the students to pick the right tool for the job.

## Course Delivery

I had a clear idea that the course will have to be interactive where programs
are developed during the lectures. There was the option of using pdf slides and
switching to [utop](https://opam.ocaml.org/packages/utop/) for interactive
development. But this solution lacked the uniformity that the students would
like when reviewing the course materials. Moreover, switching between two
mediums made it difficult for me to plan the lectures and was a distraction for
the students. 

### Jupyter Notebooks

Hence, I decided to use Jupyter Notebooks for the course. Jupyter is a
collection of open source standards and software for interactive development.
Jupyter supports a variety of languages. For OCaml, I used
[akabe/ocaml-jupyter](https://github.com/akabe/ocaml-jupyter), an OCaml kernel
for Jupyter notebooks. This uses `utop`, an advanced OCaml top-level in the
backend and hence provides excellent interactive top-level support. The
situation for Prolog was not so great. Eventually, I zeroed in on
[targodan/jupyter-swi-prolog](https://github.com/targodan/jupyter-swi-prolog)
but ended up improving the solution a bit
[kayceesrk/jupyter-swi-prolog](https://github.com/kayceesrk/jupyter-swi-prolog)
(TODO KC: upstream fixes). Jupyter supports [mathjax](https://www.mathjax.org/),
which allows typesetting LaTeX in the notebooks. This was great for writing the
lectures on lambda calculus. 

### RISE for slideshow

Jupyter notebooks are webpages that mixes text and code. For lectures, I much
prefer slides since they let you focus on a particular images, statement or an
inference rule. While Jupyter allows the conversion of notebooks to slides
*out-of-band*, [RISE](https://github.com/damianavila/RISE) is an Jupyter
notebook extension that lets turn your Jupyter notebook into a slideshow. Adding
RISE to the setup makes the Jupyter experience compatible with traditional
slides based lectures.

## Course Distribution 

Apart from delivering the lectures through the notebooks, I also wanted the
students to be able to go through the notebooks and be able to run the snippets.
Installing all the required software (OPAM, OCaml, Prolog, Jupyter and its
extensions, Jupyter Kernels for OCaml and Prolog) and correctly was not
something I wanted the students to go through. I wasn't even sure if this
software combination works on various Mac, Windows and Linux distributions.
Hence, everything was packaged as a [Docker
file](https://github.com/kayceesrk/cs3100_f19/blob/gh-pages/_docker/dockerfile),
and the latest version of the image uploaded to [docker
hub](https://hub.docker.com/r/kayceesrk/cs3100_iitm). In order to review the
course, the students only had to install Docker and Git and run [exactly 4
commands](https://github.com/kayceesrk/cs3100_f19#running-the-jupyter-notebooks).

Docker is generally supported on all major OSes. Packaging up the course content
as a docker image and pushing it to dockerhub is insurance against the software
combination not working in the next offering of the course; if for some reason
one of the dependency does not work next year, I can always fallback to the
docker image while I find a fix. One of my TAs ran a tutorial on basic Docker
and Git in the first week of the course to ensure that everyone was setup. I
would consider Docker and Git as essential tools for modern software development
as well as research. After that, the students did not ever have to do anything
on the command line. 

## Assignments 

[nbgrader](https://nbgrader.readthedocs.io/en/stable/) is a tool that
facilitates creating and grading assignments in Jupyter notebook. It uses
language-agnostic logic to identify failing cells, which meant that it was easy
to set up nbgrader for OCaml and Prolog. The assignments were
[released](http://kcsrk.info/cs3100_f19/assignments/) as Jupyter notebooks,
which the students filled in and submitted. nbgrader has support for unit tests
which allowed the students to get instant feedback as they were developing the
solutions.

## Wish List

Overall, the students felt that the Jupyter notebooks were better than
slidedecks. However, not everything was perfect with the Jupyter notebook based
lecturing. Here are some of the things that could be improved. 

* There is no good diagramming + animation support for Jupyter notebooks. The
  best I could find was [egal](https://github.com/kayceesrk/egal) whose user
  interface I did not find intuitive. Even for simple diagrams, it was much more
  effort making diagrams there compared to Keynote, PowerPoint or OmniGraffle.
  Eventually, I used [draw.io](https://www.draw.io/) to make the diagrams and
  include the images in the slides for a few of the cases where I actually
  needed to make diagrams. 
* Docker for Windows does not work on Windows Home or Student. Support for OPAM
  on Windows is slowly improving, but it is not yet for novices. Hence, I had to
  recommend the students to run an Ubuntu VM on their Windows machines in which
  they ran the course's docker container.
* nbgrader had several bugs which caused the autograder to award marks even for
  failing cells. The TAs had to go through a few of the assignments manually to
  ensure that students were awarded grades correctly. This is something that
  should be fixable easily. 
* RISE doesn't easily let you change the size of the font. One has to edit the
  CSS to change the font size. And the default style wastes too much space. This
  meant that not much content can be fit into a single slide. Hence, I've had to
  artificially split content into multiple slides or zoom out several steps to
  show content that was cut off on the bottom. 
* The support for Prolog is not so great. There are a few advanced features in
  Prolog for which the Prolog setup
  [fails](https://github.com/yuce/pyswip/issues/68). I had to switch to
  SWI-Prolog top-level for a few lectures. That said, the Prolog support is
  mostly there and the issues can be fixed with some effort. 

## Conclusion

I have started working on fixing some of these issues and upstreaming the
solutions. Hopefully the fixes should be ready for the next iteration of the
course. If you would like to replicate this setup for your course, do feel free
to utilise the course materials. 
