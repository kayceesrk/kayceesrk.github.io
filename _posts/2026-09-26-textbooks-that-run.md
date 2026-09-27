---
layout: post
talk_columns: true
title: "Textbooks that run"
date: 2026-09-26 14:30
categories: [OCaml, Teaching, NPTEL, LLM]
excerpt: >-
  I gave a talk at IndiaFOSS 2026 about the interactive textbook
  “Functional Programming with OCaml”. The book runs in the browser,
  with code execution, editor support, and embedded quizzes, alongside
  analytics that help identify where learners struggle. The book and
  its infrastructure were written primarily with coding agents. This
  post pairs the slides with a narrative reflecting on that process.
---

This is a written version of my talk at IndiaFOSS 6.0 in Bengaluru
on 26 September 2026. The slides are available as
[a PDF](/slides/OCaml_NPTEL_IndiaFOSS_2026.pdf) and
[a Keynote file](/slides/OCaml_NPTEL_IndiaFOSS_2026.key).

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/title.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/title.jpg" alt="Title slide: Textbooks that run. Interactive 0-install CS education in the browser." width="1440" height="810" loading="eager" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

I want to tell you the story of the book I wrote for my NPTEL course,
*Functional Programming with OCaml*. The first run is underway, with
1,227 students enrolled. The [book](https://fplaunchpad.org/ocaml_nptel/)
runs in the browser: students can change the examples and execute them
right in the page, with nothing to install.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/story.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/story.jpg" alt="The NPTEL course and its accompanying browser textbook, with 1,227 students enrolled." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

For those unfamiliar with [NPTEL](https://nptel.ac.in/), it is a
platform for online courses, primarily from the IITs and IISc. The
lecture videos are freely available, including on YouTube. Students
can also take a proctored examination for certification, and many
colleges and universities recognise NPTEL course credits.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/nptel.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/nptel.jpg" alt="NPTEL: free online courses, optional certification, and recognition of course credits." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

I think NPTEL is one of the greatest collective achievements of Indian
academia. There are courses by excellent teachers on foundational
subjects. Earlier this year, I noticed that it did not have an OCaml
course and decided to teach one.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/delivery.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/delivery.jpg" alt="Delivery challenges: students with different computers, skills, and internet access, supported by two teaching assistants." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

Programming languages are learnt by poking at them. You change a
program, run it, and see what happens. How was I going to give 1,227
students a working OCaml environment?

These students are spread across India. Some may share a computer;
some may not have one of their own. They use different operating
systems, have different levels of familiarity with their machines,
and may have unreliable internet. There are also the learners who
will watch the videos long after this run of the course has ended.

Recording an NPTEL lecture means sitting in a small studio, speaking
into a camera. I have two very good teaching assistants, but I do not
get to interact with students as I would in a classroom. We cannot
provide individual setup help to everyone.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/installation-roadmap.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/installation-roadmap.jpg" alt="The OCaml Platform roadmap identifies installation as a barrier to learning and adoption." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

Getting OCaml set up is a challenge for learning and adoption. We
identified this in the OCaml Platform roadmap a few years ago. There
has been progress on installation, but there are still gaps.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/installation.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/installation.jpg" alt="Installation challenges: unfamiliar terminals, time spent setting up workshops, and learners who disengage before asking for help." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

Even at IIT Madras, students arrive in my third-year course without
much experience using a terminal. Installing OCaml asks them to use
tools they are still learning how to operate.

In the hands-on OCaml workshops I have helped run, we have often spent
about a third of the session getting the environment working on
people's machines. In a room, I can walk over and help. A remote
learner who gets stuck at the first step may leave. I may
never hear from them.

I had tried to address this in earlier courses.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/earlier-workflow.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/earlier-workflow.jpg" alt="The earlier CS3100 workflow used Jupyter, Docker, RISE, and nbgrader, with a 2.86 GB Docker image." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

For CS3100, *Paradigms of Programming*, I taught OCaml and Prolog
using Jupyter notebooks in a Docker container.
[RISE](https://rise.readthedocs.io/) turned the notebooks into
reveal.js slides, and [nbgrader](https://nbgrader.readthedocs.io/)
helped with assignment evaluation. We used this setup for several
course offerings, and my colleague continues to use it.

But the student still needed Docker, and the image was about 3 GB.
The notebook editor did not have the language support we had come to
expect from OCaml editors: types on hover, live errors, and code
completion. The notebooks were also lecture material. They did not
read as a standalone book.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/zero-steps.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/zero-steps.jpg" alt="Requirements: start immediately, learn by doing with editor support and quiz feedback, and keep the book maintainable." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

For NPTEL, I wanted students to start immediately. Open a page and
run some OCaml. I also wanted a way to use the material offline,
so that a learning session would not depend on a reliable connection.

The [offline build script](https://github.com/fplaunchpad/ocaml_nptel/blob/main/tools/build-offline.py)
packages the book and its runtimes into an archive. Extract it and
open `index.html` in a browser: the chapters, runnable cells, quizzes,
and Linux terminal work without a server or internet connection.
Online videos and the analytics dashboard still need internet.

The editor should help them as they work: show types, report errors,
and offer completions. Quizzes should give immediate feedback, in
the same page as the explanation.

On the authoring side, I wanted one source for the textbook and the
executable lecture slides. It should produce readable Git diffs, and
the build should type-check and test the code examples.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/demo.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/demo.jpg" alt="Demo: runnable OCaml and OxCaml, a Linux VM, and interactive graphics in the browser." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

The easiest way to see what this means is to
[open the course introduction](https://fplaunchpad.org/ocaml_nptel/M01-L01-course-intro.html#run-code-right-in-this-page)
and run an example. Change it and run it again. Hover over an
expression to see its type. The lecture can also be presented as
slides, with the code still runnable.

The same approach extends to [OxCaml](https://oxcaml.org/), a
performance-oriented extension of OCaml. For the systems material,
there is a [Linux VM](https://fplaunchpad.org/ocaml_nptel/M01-L01-course-intro.html#a-full-machine-for-the-second-half)
in the page. Students can compile C programs and explore buffer
overflows, use-after-free, and double-free errors in that environment.

And programs can interact with the page itself. In the OCaml workshop
we ran at IndiaFOSS,
[examples using the Joy graphics library](https://fplaunchpad.org/indiafoss-2026-ocaml-workshop/06-joy.html#higher-order-transformations)
let you change a program and see its effect on a picture.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/ocaml-platform.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/ocaml-platform.jpg" alt="OCaml Platform tools compiled to JavaScript and brought together by x-ocaml." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

Much of this rests on [js_of_ocaml](https://github.com/ocsigen/js_of_ocaml),
a compiler from OCaml bytecode to JavaScript. The OCaml compiler is
itself written in OCaml. So are [Merlin](https://github.com/ocaml/merlin),
which provides editor intelligence, and
[ocamlformat](https://github.com/ocaml-ppx/ocamlformat).
We can compile those tools to JavaScript too.

[Arthur Wendling's x-ocaml](https://github.com/art-w/x-ocaml) brings
these pieces together as a Web Component. Adding an HTML tag gives a
page an executable OCaml cell with editor support. The compiler and
tools run in the student's browser.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/linux-vm.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/linux-vm.jpg" alt="The browser Linux VM uses v86, an Alpine image, and a compressed snapshot, fetching filesystem chunks on demand." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

The Linux environment uses [v86](https://github.com/copy/v86), which
compiles x86 instructions to WebAssembly as it runs. I build an Alpine
Linux image with OCaml, dune, and the course projects preinstalled.
The student does not need Docker; it is part of how I prepare the
image.

Getting to a shell takes about 12 MB of downloads. This is possible
because the VM resumes a compressed snapshot instead of performing a
cold boot, and fetches filesystem chunks as they are needed. That
12 MB is the initial shell, not the entire course environment. The
VM executes locally, with no server running the student's programs.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/quizzes.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/quizzes.jpg" alt="Embedded multiple-choice and programming quizzes give feedback to readers and authors." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

The book has both multiple-choice questions and programming puzzles.
A student can test their understanding while reading, and get
feedback immediately. For example, the
[tail-recursion lecture](https://fplaunchpad.org/ocaml_nptel/M03-L04-tail-recursion.html#a-small-code-challenge)
includes a small code challenge with tests.

Anonymous quiz results also feed a
[public dashboard](https://fplaunchpad.org/ocaml_nptel/dashboard.html).
The reader gets feedback about their understanding; I get evidence
about where my explanations may need work. I plan to use those results
to revise the book.

This follows Will Crichton and Shriram Krishnamurthi's work on the
[Rust book](https://rust-book.cs.brown.edu/), described in
[*Profiling Programming Language Learning*](https://dl.acm.org/doi/10.1145/3649812)
(OOPSLA 2024). Embedded quizzes helped identify misconceptions and
guide changes to the material. Their study was at a much larger scale.
My course is still in its first run.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/authoring-slides.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/authoring-slides.jpg" alt="Markdown with Pandoc-style fenced divs produces a textbook page and lecture slides." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

Each lecture is a Markdown file, with Pandoc-style fenced divs to mark
slides and other elements. The same file contains the fuller textbook
explanation and the material that appears on screen during a lecture.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/authoring-quizzes.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/authoring-quizzes.jpg" alt="A code quiz is authored with its prompt, starter code, tests, and solution." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

Quizzes are written alongside the prose, with their code, tests, and
solutions. The test suite checks them too. It is a relief to be able
to change a chapter and have the build check its executable content.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/one-source.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/one-source.jpg" alt="One source for the book and slides, checked with ocaml-mdx, overflow checks, and cross-reference checks." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

[ocaml-mdx](https://github.com/realworldocaml/mdx) compiles and runs the
code examples. Other checks catch overflowing slides and broken
cross-references. The source stays readable in Git, which helps when
reviewing changes across lectures.

Those checks are useful, but they leave another kind of review to do:
does the explanation make sense to someone who is learning this for
the first time?

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/agentic-programming.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/agentic-programming.jpg" alt="Agentic programming: platform code, course content, and alignment of earlier lecture slides with audio transcripts." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

I started writing the book one day before the first recording
session. I already had recordings of my CS3100 lectures from teaching
during Covid, which gave me material to work from.

I used ffmpeg to detect scene changes and identify slides in those
recordings. A local Whisper model transcribed the audio, and a small
script aligned each slide with what I had said about it. The agent
could then see both the slide and its explanation. That became the
basis for the book.

The first draft grew quickly: around 30,000 lines of Markdown on the
first day. The book reached roughly 60,000 lines over a month. I
primarily used Claude Opus 4.7 during that initial period. The
platform was almost entirely built through agentic programming:
roughly 9,000 lines of OCaml, JavaScript, shell, and other code.

I have written more about the development and token usage in
[An O(x)Caml book that runs]({% post_url 2026-06-13-an-oxcaml-book-that-runs %}).
Here I want to focus on how differently the platform work and the
teaching material went.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/reflections.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/reflections.jpg" alt="Platform development worked well; content drafts assumed too much and introduced concepts without preparation." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

The platform work went mostly well. I had little experience with
frontend development or building dashboards, and the agent helped me
build those parts. It also helped with narrow compiler problems,
including the work to
[shrink an OxCaml library bundle from 285 MB to 4 MB]({% post_url 2026-05-10-shrinking-the-oxcaml-bundle %}).
That required getting dead-code elimination across library boundaries
wired up correctly.

The content writing went much less well.

The agent assumed too much about what the learner already knew. It
used concepts before introducing them, jumped between ideas, and
presented definitions without first explaining why someone would
want them. It could answer my OCaml questions, but that did not make
its explanations suitable for a beginner.

This felt familiar. When I first moved from researching a specialised
topic to teaching undergraduates, I had to learn to notice all the
background knowledge I was assuming. The agent kept making similar
mistakes.

Education research has a name for this. Lee Shulman's account
of [pedagogical content knowledge](https://www.wcu.edu/webfiles/pdfs/shulman.pdf)
describes the knowledge involved in making a subject understandable
to others, including useful examples and an understanding of what
learners find difficult. Knowing the subject is only part of the job.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/writing-chapters.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/writing-chapters.jpg" alt="Rules for chapter writing: no forward concepts, motivated examples, self-contained slide narratives, fresh activities, and fresh-context reviews." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

I developed these instructions while reviewing the material. They
should become an agent skill for writing and reviewing chapters.

**Use what is in the reader's toolbox.** An explanation can use only
concepts the reader has already encountered. A fact being true does
not make it appropriate at this point in the course.

**Motivate the idea before generalising it.** Start with a small
example that gives the learner a reason to care. Avoid jumping to an
abstraction before they have seen the problem it addresses.

**Make the slides carry the narrative.** Because the book and slides
were written together, the agent often assumed that someone watching
a slide had read the surrounding chapter. I expect many students to
watch the videos without reading the book first. The slides must
make sense in that setting too.

**Give the student a fresh activity.** The agent sometimes turned a
worked example into a quiz by asking the student to reproduce the
same code. The exercise needs to give them something new to do with
what they have learnt.

**Review with a fresh context.** It helped to have a fresh agent read
the preceding material, assume only the stated basics, and then
review a chapter. That reduced the influence of all the extra context
accumulated while writing it.

These instructions helped, but I still had to review the material.
The tests could check an example's behaviour. I had to check the
assumptions an explanation made about its reader.

</div>
</div>

<div class="talk-segment" markdown="1">

<figure class="talk-slide">
  <a href="/assets/indiafoss-2026/closing.jpg" aria-label="View slide at full size">
    <img src="/assets/indiafoss-2026/closing.jpg" alt="Closing slide: access to specialised knowledge, the need for educators, and links to the course and FP Launchpad." width="1440" height="810" loading="lazy" decoding="async">
  </a>
</figure>

<div class="talk-text" markdown="1">

AI helped me build the platform and turn existing lectures into a
book that students can use on their own.

Someone asked about AI support within the book. As I wrote in
[An O(x)Caml book that runs]({% post_url 2026-06-13-an-oxcaml-book-that-runs %}#where-this-is-going-a-book-that-evolves-with-the-reader),
we would like to build agentic books that evolve with the reader and
become personalised to them. A tutor could use the reader's questions
and attempts at exercises to adapt explanations, revisit prerequisites,
and set new exercises at an appropriate difficulty. For programming
exercises, it could compile and test its examples before presenting
them. This is a direction we would like to explore.

The course seems to be going well so far. The examinations are due
in October, and I plan to write a retrospective after the first run.
For now, you can [open the book](https://fplaunchpad.org/ocaml_nptel/)
and try it. The course material is available under CC BY-NC-SA, and
the [source is on GitHub](https://github.com/fplaunchpad/ocaml_nptel).
If you teach, you are welcome to adapt it under those terms.

I also closed the talk with a call for applicants to
[FP Launchpad](https://fplaunchpad.org/). Applications are open for the
second cohort of our post-baccalaureate fellowship. If functional
programming and formal verification interest you, take a look.

</div>
</div>
