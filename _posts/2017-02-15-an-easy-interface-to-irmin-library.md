---
layout: post
title: "Ezirmin : An easy interface to the Irmin library"
date: 2017-02-15 13:46:00
categories: [ocaml, irmin, crdt]
excerpt_separator: <!--more-->
---

[Ezirmin](https://github.com/kayceesrk/ezirmin) is an easy interface over the
[Irmin](https://github.com/mirage/irmin), a library database for building
persistent mergeable data structures based on the principles of Git. In this
post, I will primarily discuss the Ezirmin library, but also discuss some of the
finer technical details of mergeable datatypes implemented over Irmin.

## Irmin and Ezirmin

Irmin is a library for manipulating persistent mergeable data structures
(including CRDTs) that follows the same principles of Git. In particular, it has
built-in support for snapshots, branches and reverts, and can compile to
multiple backends. Being written in pure OCaml, apps written using Irmin, as
well as running natively, can run in the browsers or be compiled to Unikernels.
A good introduction to the capabilities of Irmin can be found in the Irmin
[README](https://github.com/mirage/irmin/blob/master/README.md) file.

One of the downsides to being extremely configurable is that the Irmin library
is not beginner friendly. In particular, the library tends to be rather functor
heavy, and even [simple
uses](https://github.com/mirage/irmin/blob/master/README.md#usage) require
multiple functor instantiations[^irmin1.0]. The primary goal of Ezirmin is to
provide a defuntorized interface to Irmin, specialized to useful defaults.
However, as I've continued to build Ezirmin, it has come to include a collection
of useful mergeable datatypes including counters, queues, ropes, logs, etc. I
will spend some time describing some of the interesting aspects of these data
structures.

[^irmin1.0]: Things are indeed improving with a cleaner API in the [1.0 release](https://github.com/mirage/irmin/pull/397).

## Quick tour of Ezirmin

You can install the latest version of Ezirmin by

```bash
$ git clone https://github.com/kayceesrk/ezirmin
$ cd ezirmin
$ opam pin add ezirmin .
```

Stable versions are also available through OPAM:

```bash
$ opam install ezirmin
```

Let's fire up `utop` and get started:

```ocaml
$ utop
utop # #require "ezirmin";;
utop # open Lwt.Infix;;
```

We'll create a mergeable queue of strings using the Git filesystem backend
rooted at `/tmp/ezirminq`:

```ocaml
utop # module M = Ezirmin.FS_queue(Tc.String);; (* Mergeable queue of strings *)
utop # open M;;
utop # let m = Lwt_main.run (init ~root:"/tmp/ezirminq" ~bare:true () >>= master);;
val m : branch = <abstr>
```

`m` is the master branch of the repository. Ezirmin exposes a key value store,
where keys are hierarchical paths and values are whatever datatypes is stored in
the repo. In this case, the data type is a queue. Let's push some elements into
the queue:

```ocaml
utop # push m ["home"; "todo"] "buy milk";;
- : unit = ()
utop # push m ["work"; "todo"] "publish ezirmin";;
- : unit = ()
utop # to_list m ["home"; "todo"];;
- : string list = ["buy milk"]
```

The updates to the queue is saved in the Git repository at `/tmp/ezirminq`. In
another terminal,

```ocaml
$ utop
utop # #require "ezirmin";;
utop # module M = Ezirmin.FS_queue(Tc.String);; (* Mergeable queue of strings *)
utop # open M;;
utop # open Lwt.Infix;;
utop # let m = Lwt_main.run (init ~root:"/tmp/ezirminq" ~bare:true () >>= master);;
val m : branch = <abstr>
utop # pop m ["home"; "todo"];;
- : string option = Some "buy milk"
```

For concurrency control, use branches. In the first terminal,

```ocaml
utop # let wip_t1 = Lwt_main.run @@ clone_force m "wip_t1";;
utop # push wip_t1 ["home"; "todo"] "walk dog";;
- : unit = ()
utop # push wip_t1 ["home"; "todo"] "take out trash";;
- : unit = ()
```

The changes are not visible until the branches are merged.

```ocaml
utop # to_list m ["home"; "todo"];;
- : string list = []
utop # merge wip_t1 ~into:m;;
- : unit = ()
utop # to_list m ["home"; "todo"];;
- : string list = ["walk dog"; "take out trash"]
```

Irmin is fully compatible with Git. Hence, we can explore the history of the
operations using the git command line. In another terminal:

```bash
$ cd /tmp/ezirminq
$ git lg
* e75da48 - (4 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126] (HEAD -> master, wip_t1)
* 40ed32d - (4 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126]
* 6a56fb0 - (5 minutes ago) pop - Irmin xxxx.cam.ac.uk.[73221]
* 6a2cc9a - (6 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126]
* 55f7fc8 - (6 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126]
```

The Git log shows that there have been 4 pushes and 1 pop in this repository.
In addition to the data structures being mergeable, they are also persistent.
In particular, every object stored in Irmin has complete provenance. You can
also manipulate history using the Git command line.

```bash
$ git reset HEAD~2 --hard
$ git lg
* e75da48 - (8 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126] (wip_t1)
* 40ed32d - (9 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126]
* 6a56fb0 - (9 minutes ago) pop - Irmin xxxx.cam.ac.uk.[73221] (HEAD -> master)
* 6a2cc9a - (10 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126]
* 55f7fc8 - (10 minutes ago) push - Irmin xxxx.cam.ac.uk.[73126]
```

Back in the first terminal:

```ocaml
utop # to_list m ["home"; "todo"];;
- : string list = []
```

Since we rolled back the master to before the pushes were merged, we see an
empty list.

### Working with history

Ezimrin simplifies programmatically working with history.

```ocaml
utop # let run = Lwt_main.run;;
utop # let repo = run @@ init ();;
utop # let path = ["Books"; "Ovine Supply Logistics"];;
utop # let push_msg = push m ~path;;

utop # begin
  push_msg "Baa" >>= fun () ->
  push_msg "Baa" >>= fun () ->
  push_msg "Black" >>= fun () ->
  push_msg "Camel"
end;;

utop # to_list m path;;
- : string list = ["Baa"; "Baa"; "Black"; "Camel"]
```

Clearly this is wrong. Let's fix this by reverting to earlier version:

```ocaml
utop # let m_1::_ = run @@ predecessors repo m;; (** HEAD~1 version *)
utop # to_list m_1 path;;
- : string list = ["Baa"; "Baa"; "Black"]
utop # update_branch m ~set:m_1;;
utop # to_list m path;;
- : string list = ["Baa"; "Baa"; "Black"]
```

Now that we've undone the error, we can do the right thing.

```ocaml
utop # push_msg "Sheep";;
utop # run @@ to_list m path;;
- : string list = ["Baa"; "Baa"; "Black"; "Sheep"]
```

## Irmin Architecture

Irmin provides a high-level key-value interface built over two lower level
heaps: a **block store** and a **tag store**. A block store is an append-only
content-addressible store that stores serialized values of application contents,
prefix-tree nodes, history meta-data, etc. Instead of using physical memory
address of blocks, the blocks are identified by the hash of their contents. As a
result block store enjoys very nice properties. Being content-addressed, we get
sharing for free: two blocks with the same content will have the have the same
hash. This not only applies for individual blocks, but also for
linked-structures. For example,

<p align="center"> <img src="{{ base.url }}/assets/linked_list.png" alt="Hash list"/> </p>

The linked list above is uniquely indentified by hash `h0` since `h0` was
computed from the content `a` and the hash of the tail of the list `h1`. No
other list has hash `h0`. Changing `c` to `C` in this list would result in a
different hash for the head of the list[^blockchain]. Moreover, since the block
store is append-only, all previous versions of a application-level data
structure is also available, and thus providing persistence. This also makes for
a nice concurrency story for multiple processes/threads operating on the block
store. The absence of mutations on block store mean that no additional
concurrency control mechanisms are necessary.

The only mutable part of the Irmin architecture is the tag store, that maps
global names to blocks in the block store. The notion of branches are built on
top of the tag store. Cloning a branch creates a new tag that points to the same
block as the cloned branch.

### User-defined merges

The real power of Irmin is due to the user-defined merges. Irmin expects the
developer to provide a 3-way merge function with the following signature:

```ocaml
type t
(** User-defined contents. *)

val merge : old:t -> t -> t -> [`Ok of t | `Conflict of string]
(** 3-way merge. *)
```

Given the common ancestor `old` and the two versions, merge function can either
return a successful merge or mark a conflict. It is upto the developer to ensure
that merges are commutative (`merge old a b = merge old b a`) and that the merge
captures the intent of the two branches. *If the merge function never conflicts,
we have CRDTs*.

[^blockchain]: The same principle underlies the irrefutability of [blockchain](https://en.wikipedia.org/wiki/Blockchain_(database)). No block can be changed without reflecting the change in every subsequent block.
