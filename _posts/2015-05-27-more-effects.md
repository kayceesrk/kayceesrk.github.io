---
layout: post
title: "Pearls of Algebraic Effects and Handlers"
date: 2015-05-27 14:06:00
categories: [ocaml, multicore, effects]
excerpt_separator: <!--more-->
---

In the [previous
post](http://kcsrk.info/ocaml/multicore/2015/05/20/effects-multicore/), I
presented a simple cooperative multithreaded scheduler written using algebraic
effects and their handlers. Algebraic effects are of course useful for
expressing other forms of effectful computations. In this post, I will present
a series of simple examples to illustrate the utility of algebraic effects and
handlers in OCaml. Some of the examples presented here were borrowed from the
excellent paper on Eff programming language[^Eff]. All of the examples
presented below are available
[here](https://github.com/kayceesrk/ocaml-eff-example).

<!--more-->

## State

We can use algebraic effects to model [stateful
computation](https://github.com/kayceesrk/ocaml-eff-example/blob/master/state.ml),
with the ability to retrieve (`get`) and update (`put`) the current state:

{% highlight ocaml %}
module type STATE = sig
  type t
  val put : t -> unit
  val get : unit -> t
  val run : (unit -> unit) -> init:t -> unit
end
{% endhighlight %}

The function `run` runs a stateful computation with the given initial state.
Here is the implementation of the module `State` which provides the desired
behaviour:

{% highlight ocaml linenos %}
module State (S : sig type t end) : STATE with type t = S.t = struct
  type t = S.t

  effect Put : t -> unit
  let put v = perform (Put v)

  effect Get : t
  let get () = perform Get

  let run f ~init =
    let comp =
      match f () with
      | () -> (fun s -> ())
      | effect (Put s') k -> (fun s -> continue k () s')
      | effect Get k -> (fun s -> continue k s s)
    in comp init
end
{% endhighlight %}

The key idea here is that the handler converts the stateful computation to
functions that accept the state. For example, observe that if the function `f`
returns a `unit` value (line 13), we return a function which accepts a state
`s` and returns `unit`. The handler for effect `Get` (line 15) passes the current state `s`
to the continuation `k`. The expression `continue k s` returns a function that
accepts the current state and returns `unit`. Since fetching the current state
does not modify it, we apply this function to `s`, the original state. Since
`Put` modifies the state (line 14), the function returned by `continue k ()` is applied
to the new state `s'`. We evaluate the computation by applying it to the initial
state `init` (line 16).

Observe that the implementation of the handler for the stateful computation is
similar to the implementation of [State
monad](https://wiki.haskell.org/State_Monad#Implementation) in Haskell. Except
that in Haskell, you would have the stateful computation `f` have the type
`State t ()`, which says that `f` is a stateful computation where `t` is the
type of state and  `()` the type of return value. Since multicore OCaml does
not have a effect system, `f` simply has type `unit -> unit` as opposed to
being explicitly tagged with the effects being performed. While the OCaml type
of `f` under specifies the behaviour of `f`, it does allow you to combine various
kinds of effects directly, without the need for monad transformer
gymnastics[^Idris-eff]. For example, the following code snippet combines an int
and string typed state computations, each with its own handler:

{% highlight ocaml %}
module IS = State (struct type t = int end)
module SS = State (struct type t = string end)

let foo () : unit =
  printf "%d\n" (IS.get ());
  IS.put 42;
  printf "%d\n" (IS.get ());
  IS.put 21;
  printf "%d\n" (IS.get ());
  SS.put "hello";
  printf "%s\n" (SS.get ());
  SS.put "world";
  printf "%s\n" (SS.get ())

let _ = IS.run (fun () -> SS.run foo "") 0
{% endhighlight %}

which prints:

{% highlight bash %}
0
42
21
hello
world
{% endhighlight %}

## References

We can expand upon our state example, to model [ML style
references](https://github.com/kayceesrk/ocaml-eff-example/blob/master/ref.ml):

{% highlight ocaml %}
module State : sig
    type 'a t

    val ref  : 'a -> 'a t
    val (!)  : 'a t -> 'a
    val (:=) : 'a t -> 'a -> unit

    val run  : (unit -> 'a) -> 'a
  end = struct

  type 'a t = {inj : 'a -> Univ.t; prj : Univ.t -> 'a option}

  effect Ref : 'a -> 'a t
  let ref v = perform (Ref v)

  effect Read : 'a t -> 'a
  let (!) = fun r -> perform (Read r)

  effect Write : 'a t * 'a -> unit
  let (:=) = fun r v -> perform (Write (r,v))

  let run f =
    let comp =
      match f () with
      | v -> (fun s -> v)
      | effect (Ref v) k -> (fun s ->
          let (inj, prj) = Univ.embed () in
          let cont = continue k {inj;prj} in
          cont (inj v::s))
      | effect (Read {inj; prj}) k -> (fun s ->
          match find prj s with
          | Some v -> continue k v s
          | None -> failwith "Ref.run: Impossible -> ref not found")
      | effect (Write ({inj; prj}, v)) k -> (fun s ->
          continue k () (inj v::s))
    in comp []
end
{% endhighlight %}

The idea is to represent the state as a list of universal typed values,
references as a record with inject and project functions to and from universal
type values, assign as appending a new value to the head of the state list, and
dereference as linear search through the list for a matching assignment. The
[universal type
implementation](https://blogs.janestreet.com/a-universal-type/#comment-163) is
due to Alan Frisch.

## Transactions

We may handle lookup and update to implement
[transactions](https://github.com/kayceesrk/ocaml-eff-example/blob/master/transaction.ml)
that discards the updates to references in case an exception occurs:

{% highlight ocaml %}
  let atomically f =
    let comp =
      match f () with
      | x -> (fun _ -> x)
      | exception e -> (fun rb -> rb (); raise e)
      | effect (Update (r,v)) k -> (fun rb ->
          let old_v = !r in
          r := v;
          continue k () (fun () -> r := old_v; rb ()))
    in comp (fun () -> ())
{% endhighlight %}

Updating a reference builds up a rollback function that negates the effect of
the update. In case of an exception, the rollback function is evaluated before
re-raising the exception. For example, in the following code snippet:

{% highlight ocaml %}
exception Res of int

let () = atomically (fun () -> (* T0 *)
  let r = ref 10 in
  printf "T0: %d\n" (!r);
  try atomically (fun () -> (* T1 *)
    r := 20;
    r := 21;
    printf "T1: Before abort %d\n" (!r);
    raise (Res !r);
    printf "T1: After abort %d\n" (!r);
    r := 30)
  with
  | Res v -> printf "T0: T1 aborted with %d\n" v;
  printf "T0: %d\n" !r)
{% endhighlight %}

the updates to reference `r` by transaction `T1` are discarded on exception and
the program prints the following:

{% highlight bash %}
T0: 10
T1: Before abort 21
T0: T1 aborted with 21
T0: 10
{% endhighlight %}

## From Iterators to Generators

An iterator is a fold-function of type `('a -> unit) -> unit`, that iterates a
client function over all the elements of a data structure. A generator is a
function of type `unit -> 'a option` that returns `Some v` each time the
function is invoked, where `v` is the *next-element* in the data structure. The
function returns `None` if the traversal is complete. Unlike an iterator, the
generator hands over control of the traversal to the client of the library.

Gabriel Scherer's insightful article on [generators, iterators, control and
continuations](http://gallium.inria.fr/blog/generators-iterators-control-and-continuations/)
nicely distinguish, motivate and provide implementation of different kinds of
iterators and generators for binary trees. While the iterator implementation is
obvious and straight-forward, the generator implementation requires translating
the code to CPS style and manually performing simplifications for efficient
traversal. Since algebraic effects handlers give us a handle to the
continuation, we can essentially [*derive* the generator implementation from
the
iterator](https://github.com/kayceesrk/ocaml-eff-example/blob/master/generator.ml).

Let us consider a binary tree with the following type:

{% highlight ocaml %}
type 'a t = Leaf | Node of 'a t * 'a * 'a t
{% endhighlight %}

We can define an iterator that traverses the tree from left to right as follows:

{% highlight ocaml %}
let rec iter f = function
  | Leaf -> ()
  | Node (l, x, r) -> iter f l; f x; iter f r
{% endhighlight %}

From this iterator, we derive the generator as follows:

{% highlight ocaml linenos %}
let to_gen (type a) (t : a t) =
  let module M = struct effect Next : a -> unit end in
  let open M in
  let step = ref (fun () -> assert false) in
  let first_step () =
    try
      iter (fun x -> perform (Next x)) t;
      None
    with effect (Next v) k ->
      step := continue k;
      Some v
  in
    step := first_step;
    fun () -> !step ()
{% endhighlight %}

At each step of the iteration, we perform the effect `Next : a -> unit` (line
7), which is handled by saving the continuation to a local reference and
returning the value (line 9 - 11). Since the effect handlers are provided with
the continuation, we are able to invert the control from the library to the
client of the library. This avoids the need to perform manual CPS translation.

## Direct-style asynchronous IO

Since the effect handler has access to the continuation, we can implement
minimal [asynchronous IO in
direct-style](https://github.com/kayceesrk/ocaml-eff-example/blob/master/aio.ml)
as opposed to the monadic style of asynchronous IO libraries such as Lwt and
Async. Our asynchronous IO library has the following interface:

{% highlight ocaml %}
module type AIO = sig

  val fork  : (unit -> unit) -> unit
  val yield : unit -> unit

  type file_descr = Unix.file_descr
  type sockaddr = Unix.sockaddr
  type msg_flag = Unix.msg_flag

  val accept : file_descr -> file_descr * sockaddr
  val recv   : file_descr -> bytes -> int -> int -> msg_flag list -> int
  val send   : file_descr -> bytes -> int -> int -> msg_flag list -> int
  val sleep  : float -> unit

  val run : (unit -> unit) -> unit
end
{% endhighlight %}

Observe that the return type of the non-blocking function calls `accept`,
`recv`, `send` and `sleep` are the same as their blocking counterparts from
[Unix](http://caml.inria.fr/pub/docs/manual-ocaml/libref/Unix.html) module.

The asynchronous IO implementation works as follows. For each blocking action,
if the action can be performed immediately, then it is. Otherwise, the thread
performing the blocking task is suspended and add to a pool of threads waiting
to perform IO:

{% highlight ocaml %}
(* Block until data is available to read on the socket. *)
effect Blk_read  : file_descr -> unit
(* Block until socket is writable. *)
effect Blk_write : file_descr -> unit
(* Sleep for given number of seconds. *)
effect Sleep : float -> unit

let rec core f =
  match f () with
  ...
  | effect (Blk_read fd) k ->
      if poll_rd fd then continue k ()
      else (Hashtbl.add read_ht fd k;
            dequeue ())
  | effect (Blk_write fd) k ->
      if poll_wr fd then continue k ()
      else (Hashtbl.add write_ht fd k;
            dequeue ())
  | effect (Sleep t) k ->
        if t <= 0. then continue k ()
        else (Hashtbl.add sleep_ht (Unix.gettimeofday () +. t) k;
              dequeue ())

let accept fd =
  perform (Blk_read fd);
  Unix.accept fd

let recv fd buf pos len mode =
  perform (Blk_read fd);
  Unix.recv fd buf pos len mode

let send fd bus pos len mode =
  perform (Blk_write fd);
  Unix.send fd bus pos len mode

{% endhighlight %}

The scheduler works by running all of the available threads until there are no
more threads to run. At this point, if there are threads that are waiting to
complete an IO operation, the scheduler invokes `select()` call and blocks
until one of the IO actions becomes available. The scheduler then resumes those
threads whose IO actions are now available:

{% highlight ocaml %}
(* When there are no threads to run, perform blocking io. *)
let perform_io timeout =
  let rd_fds = Hashtbl.fold (fun fd _ acc -> fd::acc) read_ht [] in
  let wr_fds = Hashtbl.fold (fun fd _ acc -> fd::acc) write_ht [] in
  let rdy_rd_fds, rdy_wr_fds, _ = Unix.select rd_fds wr_fds [] timeout in
  let rec resume ht = function
  | [] -> ()
  | x::xs ->
      enqueue (Hashtbl.find ht x);
      Hashtbl.remove ht x;
      resume ht xs
  in
  resume read_ht rdy_rd_fds;
  resume write_ht rdy_wr_fds;
  if timeout >= 0. then ignore (wakeup (Unix.gettimeofday ())) else ();
  dequeue ()
{% endhighlight %}

The
[program](https://github.com/kayceesrk/ocaml-eff-example/blob/master/aio.ml)
implements a simple echo server. The server listens on localhost port 9301. It
accepts multiple clients and echoes back to the client any data sent to the
server. This server is a direct-style reimplementation of the echo server found
[here](http://www.mega-nerd.com/erikd/Blog/CodeHacking/Ocaml/ocaml_select.html),
which implements the echo server in CPS style:

{% highlight ocaml %}
(* Repeat what the client says until the client goes away. *)
let rec echo_server sock addr =
  try
    let data = recv sock 1024 in
    if String.length data > 0 then
      (ignore (send sock data);
       echo_server sock addr)
    else
      let cn = string_of_sockaddr addr in
      (printf "echo_server : client (%s) disconnected.\n%!" cn;
       close sock)
  with
  | _ -> close sock
{% endhighlight %}

The echo server can be tested with a telnet client by starting the server and
on the same machine running `telnet localhost 9301`.

## Conclusion

The aim of the post is to illustrate the variety of alternative programming
paradigms that arise due to algebraic effects and handlers, and hopefully
kindle interest in reasoning and programming with effects and handlers in
OCaml. Algebraic effects and handlers support in OCaml is in active development
within the context of [multicore
OCaml](https://github.com/ocamllabs/ocaml-multicore). When you find those
inevitable bugs, please report them to the [issue
tracker](https://github.com/ocamllabs/ocaml-multicore/issues).


[^Eff]: [Programming with Algebraic Effects and Handlers (pdf)](http://arxiv.org/pdf/1203.1539v1.pdf)

[^Idris-eff]: [Programming and Reasoning with Algebraic Effects and Dependent Types (pdf)](http://eb.host.cs.st-andrews.ac.uk/drafts/effects.pdf)
