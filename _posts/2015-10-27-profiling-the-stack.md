---
layout: post
title: "Profiling the stack"
date: 2015-10-27 17:29:30
categories: [ocaml, profiling]
---

In the [last
post](http://kcsrk.info/ocaml/profiling/2015/09/23/bytecode-allocation-profiler/),
I described a *flat* allocation profiler for OCaml 4.02 bytecode interpreter.
In this post, I'll describe further developments which add support for call
stack information and better location information. Lets dive straight to the
usage:

# Enabling stack profiling

Stack profiling is enabled by setting the environment variable
`CAML_PROFILE_STACK` to the intended depth of stack. Suppose we would like to
attribute any allocation to the current function, we would set
`CAML_PROFILE_STACK=1`. To do the same to the current function and its caller,
we would set `CAML_PROFILE_STACK=2`. `CAML_PROFILE_STACK=<INFINITY>` should
give you stack profile all the way down to the first function.

## Why should I care about the stack depth?

Because it affects the program performance. Enabling stack profiling walks the
stack for **every** allocation. This has the potential to severely affect the
program performance. Most often, with a flat profile, you've tracked the
offending allocation to some function in the standard library such as[^1]:

{% highlight bash %}
File "bytes.ml", line 59, characters 7-81:
  C_CALL1 caml_create_string

File "src/bigstring.ml", line 98, characters 20-37:
  C_CALL1 caml_create_string
{% endhighlight %}

And all you want is to find out the caller of that standard library function in
your code. A stack depth of a small number should provide you this information.
You might have to play around with the stack depth to identify what you are
looking for.

# Profiling N-queens

You can obtain and install the profiling enabled OCaml 4.02
[here](http://kcsrk.info/ocaml/profiling/2015/09/23/bytecode-allocation-profiler/#instructions).
Let us obtain the flat profile first.

{% highlight bash %}
$ wget http://caml.inria.fr/pub/old_caml_site/Examples/oc/basics/queens.ml
$ ocamlc -o queens -g queens.ml
$ CAML_PROFILE_ALLOC=queens.preprof ./queens
Chess boards's size ? 8
The 8 queens problem has 92 solutions.

Do you want to see the solutions <n/y> ? n
$ ./tools/allocprof queens.preprof queens.prof
$ head -n10 queens.prof
Total: 77,863 words
Instr   Words   % of total      Location
-----   -----   ----------      --------
2488    31440   40.38%          file "list.ml", line 55, characters 32-39
27681   31440   40.38%          file "queens.ml", line 61, characters 46-52
27775   5895    7.57%           file "queens.ml", line 38, characters 2-113
27759   4112    5.28%           file "queens.ml", line 40, characters 33-41
27687   3930    5.05%           file "queens.ml", line 61, characters 14-59
2403    86      0.11%           file "pervasives.ml", line 490, characters 8-63
5391    44      0.06%           file "list.ml", line 20, characters 15-29
{% endhighlight %}

Observe that we now have the precise location information directly in the
profile, whereas
[earlier](http://kcsrk.info/ocaml/profiling/2015/09/23/bytecode-allocation-profiler)
one had to manually identify the source location using the instruction
information. In this profile, we see that most allocations were in
`list.ml:55`, which is the `List.map` function. However, we cannot pin down the
source of these allocations in `queens.ml` from this profile since the profile
is flat. Let us now obtain the stack allocation profile, which will reveal the
source of these allocations in `queens.ml`.

{% highlight bash %}
$ CAML_PROFILE_ALLOC=queens.preprof CAML_PROFILE_STACK=10000 ./queens
Chess boards's size ? 8
The 8 queens problem has 92 solutions.

Do you want to see the solutions <n/y> ? n
$ ./tools/allocprof queens.preprof queens.prof --sort-stack
$ head -n10 queens.prof
Total: 77,863 words
Instr   Current Cur %   Stack   Stack % Location
-----   ------- -----   -----   ------- --------
27836   0       0.00%   76911   98.78%  file "queens.ml", line 100, characters 33-42
27549   0       0.00%   76870   98.72%  file "queens.ml", line 85, characters 17-36
27466   0       0.00%   76473   98.21%  file "queens.ml", line 45, characters 18-31
27715   0       0.00%   65117   83.63%  file "queens.ml", line 62, characters 4-22
27694   0       0.00%   62880   80.76%  file "queens.ml", line 61, characters 31-59
2487    0       0.00%   55020   70.66%  file "list.ml", line 55, characters 32-39
2483    0       0.00%   31440   40.38%  file "list.ml", line 55, characters 20-23
{% endhighlight %}

I've chosen a stack depth of 10000 to obtain the complete stack profile of the
program. The option `--sort-stack` to `allocprof` sorts the results based on
the stack allocation profile. We can now clearly see the stack of functions
that perform most allocations. The line

{% highlight bash %}
27836   0       0.00%   76911   98.78%  file "queens.ml", line 100, characters 33-42
{% endhighlight %}

says that 98.78% of all allocations were performed by the function at
`queens.ml:100`, characters 33-42, and its callees. This isn't surprising since
this function is the top-level [`main`
function](https://github.com/kayceesrk/code-snippets/blob/master/queens.ml#L100)!
More interesting is the 98.21% of allocations on `queens.ml:45`. This is the
recursive call to the [`concmap`
function](https://github.com/kayceesrk/code-snippets/blob/master/queens.ml#L43),
which in turn invokes the `List.map` function on `queens.ml:61`. We've now
pinned down the source of the allocation in `list.ml:55` to `queens.ml:61`.

# Caveats and conclusions

Unlike stack profiles of C programs, OCaml's stack profile does not include all
the functions in the call stack since many calls are in tail positions. Calls
to functions at tail position will not have a frame on the stack, and hence
will not be included in the profile.

Please do submit issues and bug-fixes. Pull-requests are welcome! Also, here is
my trimmed down (yay \o/!), non-exhaustive wish list of features:

* Dump the profile every few milliseconds to study the allocation behavior of
  programs over time.
* Save the [location information in the object
  header](https://ocaml.org/meetings/ocaml/2013/proposals/profiling-memory.pdf)
  and dump the heap at every GC to catch space leaks.

[^1]: Thanks to [trevorsummerssmith](https://github.com/trevorsummerssmith) for the example.
