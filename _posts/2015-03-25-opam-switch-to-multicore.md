---
layout: post
title: "Opam Switch to Multicore OCaml"
date: 2015-03-25 18:15:00
categories: multicore opam ocaml
---

OPAM has a great [compiler
switch](https://opam.ocaml.org/doc/Usage.html#opamswitch) feature that lets you
simultaneously host several OCaml installations, each with its own compiler
version and a set of installed packages. I wanted to use the power of `opam
switch` for working with the experimental [multicore
OCaml](https://github.com/kayceesrk/ocaml-multicore) compiler. The key
advantage of doing this is that it lets you easily install packages from the
[OPAM repository](http://opam.ocaml.org/), while sandboxing it from other OCaml
installations on your system. The post will show how to create OPAM compiler
switch for multicore OCaml.

## Install opam-compiler-conf

The first step is to install Gabriel Scherer's [opam-compiler-conf
script](https://github.com/gasche/opam-compiler-conf) which lets you do opam
switches on local installations:

{% highlight bash %}
$ git clone https://github.com/gasche/opam-compiler-conf
$ cd opam-compiler-conf
$ mkdir -p ~/.local/bin
$ make BINDIR=~/.local/bin install
{% endhighlight %}

This installs the `opam-compiler-conf` script under `~/.local/bin`. Make sure
this directory is under your search path. Now, `$opam compiler-conf` should
give you the list of available commands.

## Build multicore OCaml locally

Typing `opam switch` should list the compilers currently installed in your
system and those that are available. For instance, here is my setup:

{% highlight bash %}
$ opam switch
system  C system  System compiler (4.02.1)
4.02.1  I 4.02.1  Official 4.02.1 release
4.02.0  I 4.02.0  Official 4.02.0 release
4.01.0  I 4.01.0  Official 4.01.0 release
--     -- 3.11.2  Official 3.11.2 release
--     -- 3.12.1  Official 3.12.1 release
--     -- 4.00.0  Official 4.00.0 release
--     -- 4.00.1  Official 4.00.1 release
# 66 more patched or experimental compilers, use '--all' to show
{% endhighlight %}

You can easily switch between the installations using `opam switch
<system-name>`. Let us now install multicore OCaml as a new switch:

{% highlight bash %}
$ git clone https://github.com/kayceesrk/ocaml-multicore
$ cd ocaml-multicore
$ opam compiler-conf configure
$ make world
$ opam compiler-conf install
$ eval `opam config env`
{% endhighlight %}

The multicore compiler is now installed and has been made the current compiler:

{% highlight bash %}
$ opam switch
system                      I system                      System compiler (4.02.1)
4.02.1+local-git-multicore  C 4.02.1+local-git-multicore  Local checkout of 4.02.1 at /Users/kc/ocaml-multicore
4.02.1                      I 4.02.1                      Official 4.02.1 release
4.02.0                      I 4.02.0                      Official 4.02.0 release
4.01.0                      I 4.01.0                      Official 4.01.0 release
--                         -- 3.11.2                      Official 3.11.2 release
--                         -- 3.12.1                      Official 3.12.1 release
--                         -- 4.00.0                      Official 4.00.0 release
--                         -- 4.00.1                      Official 4.00.1 release
# 66 more patched or experimental compilers, use '--all' to show
{% endhighlight %}

This can be confirmed by:

{% highlight bash %}
$ ocamlc -version
4.02.1+multicore-dev0
{% endhighlight %}

which shows the current OCaml bytecode compiler version.

## Working with the local switch

Every time you change the compiler source, you need to rebuild the compiler and
reinstall the switch:

{% highlight bash %}
# Changed compiler source...
$ make world
$ opam compiler-conf reinstall
{% endhighlight %}

The local installation can be removed by `opam compiler-conf uninstall`.
