---
layout: post
title: "Experiment with OCaml Multicore and Algebraic Effects"
date: 2015-09-10 13:11:00
categories: [multicore, opam, ocaml]
excerpt_separator: <!--more-->
---

I recently gave a talk on Algebraic Effects in OCaml at the [OCaml Workshop
2015](https://ocaml.org/meetings/ocaml/2015/). The extended abstract and the
slides from the talk are available [here](http://kcsrk.info/#ocaml15). The slides
should provide a gentle introduction to programming with algebraic effects and
handlers in OCaml. The examples from the talk (and many more!) are available
[here](https://github.com/kayceesrk/ocaml-eff-example).

<!--more-->

Algebraic effects in OCaml are available as a part of the multicore OCaml. The
experimental compiler could easily be installed using the OCaml Labs opam
development repo.

{% highlight bash %}
$ opam remote add ocamllabs -k git https://github.com/ocamllabs/opam-repo-dev
$ opam switch 4.02.2+multicore
{% endhighlight %}

If you are interested in contributing, please do experiment with algebraic
effects, and report any inevitable bugs or feature requests to the multicore
OCaml [issue tracker](https://github.com/ocamllabs/ocaml-multicore/issues).

We are also quite interested in hearing interesting applications of algebraic
effects such as the encoding of [monadic
reflection](https://github.com/kayceesrk/ocaml-eff-example/blob/master/reify_reflect.ml)
and [one-shot multi-prompt delimited
control](https://github.com/kayceesrk/ocaml-eff-example/blob/master/delimcc.ml).
Feel free to submit pull requests with your examples.
