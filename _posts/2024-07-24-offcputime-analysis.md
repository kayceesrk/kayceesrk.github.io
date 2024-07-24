---
layout: post
title: "Off-CPU-time analysis"
date: 2024-07-24 09:48
categories: [OCaml, offcputime, bpfcc]
excerpt_separator: <!--more-->
---

Off-CPU analysis is where the program behavior when it is not running is
recorded and analysed. See Brendan Gregg's eBPF based off-CPU analysis:
https://www.brendangregg.com/offcpuanalysis.html. While on-CPU performance
monitoring tools such as `perf` give you an idea of where the program is
_actively_ spending its time, they won't tell you where the program is spending
time _blocked_ waiting for an action. Off-CPU analysis reveals information about
where the program is spending time _passively_. 

<!--more-->

## Installation

Install the tools from https://github.com/iovisor/bcc/.

## Enabling frame pointers

The off-CPU stack trace collection, `offcputime-bpfcc`, requires the programs to
be compiled with frame pointers for full backtraces.

### OCaml

For OCaml, you'll need a compiler variant with frame pointers enabled. If you
are installing a released compiler using `opam`, look for `+fp` variants in
`opam switch list-available`.

Instead, if you are building the OCaml compiler from source, `configure` the
compiler with `--enable-frame-pointers` option:

```
$ ./configure --enable-frame-pointers
```

Lastly, there is an option to create an opam switch with the development branch
of the compiler. The instructions are in `ocaml/HACKING.adoc`. In order to
create an opam switch from the current working directory, do:

```
$ opam switch create . 'ocaml-option-fp' --working-dir
```

## glibc

The libc is not compiled with frame pointers by default. This will lead to many
truncated stack traces. On Ubuntu, I did the following to get a glibc with frame
pointers enabled:

1. Install glibc with frame pointers
```
$ sudo apt install libc6-prof
```
2. LD_PRELOAD the glibc with frame pointers
```
$ LD_PRELOAD=/lib/libc6-prof/x86_64-linux-gnu/libc.so.6 ./myapp.exe
```

## Running

On one terminal run the program that you want to analyze:

```
$ LD_PRELOAD=/lib/libc6-prof/x86_64-linux-gnu/libc.so.6 ./ocamlfoo.exe
```

On another terminal run `offcputime-bpfcc` tool:

```
$ sudo offcputime-bpfcc --stack-storage-size 2097152 -p $(pgrep -f ocamlfoo.exe) 10 > offcputime.out
```

The command instruments the watches for 10s and the writes out the stack traces
corresponding to blocking calls in `offcputime.out`. We use a large stack
storage size argument so as to not lose stack traces. Otherwise, you will see
many `[Missing User Stack]` errors in the back traces. 

## Caveats

`offcputime-bpfcc` must run longer than the program being instrumented by a few
seconds so that the function symbols are resolved. Otherwise you may see
`[unknown]` in the backtrace for function names. 

## Oddities

I still see an order of magnitude difference between the maximum pauses observed
using `offcputime-bpfcc` and `olly trace`. Something is off.

## Other links

* https://www.pingcap.com/blog/how-to-trace-linux-system-calls-in-production-with-minimal-impact-on-performance/
