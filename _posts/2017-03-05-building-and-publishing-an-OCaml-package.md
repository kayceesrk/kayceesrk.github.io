---
layout: post
title: "Building and Publishing an OCaml Package: Q1 2017"
date: 2017-03-05 13:56:00
categories: [ocaml, opam, topkg, carcass]
excerpt_separator: <!--more-->
---

One of the key indicators of maturity of a language ecosystem is the ease of
building, managing and publishing software packages in that language. OCaml
platform has made steady progress in the last few years to this end. While
[OPAM](https://opam.ocaml.org/) simplified package (and compiler) management,
the developing and publishing packages remained a constant pain point. This
situation has remarkably improved recently with the
[Topkg](http://erratique.ch/software/topkg) and
[Carcass](https://github.com/dbuenzli/carcass). This post provides a short
overview of my workflow for building and publishing an OCaml package using Topkg
and Carcass.

<!--more-->

Topkg is packager for distributing OCaml software. It provides an API for
describing rules for package builds and installs. Topkg-care provides the
command line tool `topkg` with support for creating and linting the
distribution, publishing the distribution and its documentation on WWW, and
making the package available through OPAM. Carcass is a library and a command
line tool for defining and generating the directory structure for the OCaml
package. At the time of writing this post, carcass was unreleased.

## Workflow

I recently released a package for [mergeable
vectors](https://github.com/kayceesrk/mergeable-vector) based on operational
transformation. The following describes my workflow to build and publish the
package.

### Setup

Install `topkg-care` and `carcass`:

```
$ opam install topkg-care opam-publish
$ opam pin add -kgit carcass https://github.com/dbuenzli/carcass
```

### Develop

- Create the directory structure
    ```
    $ carcass body topkg/pkg mergeable_vector
    ```
- Init
    ```
    $ cd mergeable_vector && git init && git add . && git commit -m "First commit."
    $ git remote add origin https://github.com/kayceesrk/mergeable-vector
    $ git push --set-upstream origin master
    ```
- Develop: The `mergeable_vector/src` directory has the source files. I use
  [this Makefile](https://github.com/kayceesrk/mergeable-vector/blob/master/Makefile)
  at the root of the package.

- Test the package locally with OPAM
    ```
    $ opam pin add mergeable_vector .
    ```

### Publish

- Update the
  [CHANGES](https://github.com/kayceesrk/mergeable-vector/blob/master/CHANGES.md) file for the new release.
- Tag the release
    ```
    $ topkg tag 0.1.0
    ```
- Build the distribution
    ```
    $ topkg distrib
    ```
- Publish the distribution
    ```
    $ topkg publish distrib
    ```
  This makes a new release on [Github](https://github.com/kayceesrk/mergeable-vector/releases).
- Publish the doc
    ```
    $ topkg publish doc
    ```
  This publishes the documentation on [Github](http://kayceesrk.github.io/mergeable-vector/doc/).
- Make an OPAM package info and submit it to OPAM repository at [opam.ocaml.org](https://opam.ocaml.org/).
    ```
    $ topkg opam pkg
    $ topkg opam submit
    ```
  This creates a Github [PR](https://github.com/ocaml/opam-repository/pull/8623)
  to the [opam-repository](https://github.com/ocaml/opam-repository). Once the
  PR is merged, the package becomes available to the users.
