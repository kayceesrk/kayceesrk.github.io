---
layout: post
title: "OCaml on Baremetal Shakti RISC-V processor"
date: 2019-03-29 14:00:00
categories: [ocaml, riscv, shakti]
published: false
excerpt_separator: <!--more-->
---

It has been 3 months since I joined [IIT Madras](https://www.iitm.ac.in/) and it
has been good fun so far. Along with the members of the [RISE
group](http://rise.cse.iitm.ac.in/), we've initiated a project to build secure
applications on top of secure extensions of the open-source
[Shakti](http://shakti.org.in/) RISC-V processor ecosystem. Unsurprisingly, my
language of choice to build the applications is [OCaml](http://www.ocaml.org/).
Given the availability of rich ecosystem of libraries under the
[MirageOS](https://mirage.io/) library operating system for building unikernels,
we hope to minimise the amount of unsafe C code that the hardware has to contend
with and protect exploits against. As a first step, we have managed to get OCaml
programs to run on directly on top of the Shakti processor running in simulation
under QEMU and Spike ISA simulators *without an intervening operating system*. 

<!--more-->

A custom bootloader performs the necessary hardware initialisation and
transfers control directly to the OCaml program. We have
[open-sourced](https://gitlab.com/shaktiproject/tools/shakti-tee/ocaml-baremetal-riscv)
all of the tools necessary to build your own kernel. This handy
[dockerfile](https://gitlab.com/shaktiproject/tools/shakti-tee/ocaml-baremetal-riscv/tree/master/docker)
documents the entire process. For the impatient, an image is available in the
dockerhub:

```bash
$ docker run -it iitmshakti/riscv-ocaml-baremetal:0.1.0

# Write your program
$ echo 'let _ = print_endline "A camel treads on hardware"' > hello.ml
# Compile for Shakti
$ ocamlopt -output-obj -o payload.o hello.ml
$ file payload.o
payload.o: ELF 64-bit LSB relocatable, UCB RISC-V, version 1 (SYSV), not stripped

# Link with bootcode and build the kernel
$ make -C ../build
make: Entering directory '/root/ocaml-baremetal-riscv/build'
make[1]: Entering directory '/root/ocaml-baremetal-riscv/build'
make[2]: Entering directory '/root/ocaml-baremetal-riscv/build'
make[2]: Leaving directory '/root/ocaml-baremetal-riscv/build'
[ 64%] Built target boot
make[2]: Entering directory '/root/ocaml-baremetal-riscv/build'
make[2]: Leaving directory '/root/ocaml-baremetal-riscv/build'
[ 78%] Built target freestanding-compat
make[2]: Entering directory '/root/ocaml-baremetal-riscv/build'
make[2]: Leaving directory '/root/ocaml-baremetal-riscv/build'
[ 85%] Built target asmrun_t
make[2]: Entering directory '/root/ocaml-baremetal-riscv/build'
make[2]: Leaving directory '/root/ocaml-baremetal-riscv/build'
[ 92%] Built target nolibc_t
make[2]: Entering directory '/root/ocaml-baremetal-riscv/build'
make[2]: Leaving directory '/root/ocaml-baremetal-riscv/build'
[100%] Built target kernel
make[1]: Leaving directory '/root/ocaml-baremetal-riscv/build'
make: Leaving directory '/root/ocaml-baremetal-riscv/build'
$ file kernel 
kernel: ELF 64-bit LSB executable, UCB RISC-V, version 1 (SYSV), statically linked, with debug_info, not stripped

# Run under spike RISC-V ISA simulator
$ spike kernel
ocaml-boot: heap@0x80042be8 stack@0x8002fbc0
hello ocaml, on riscv baremetal!
ocaml-boot: caml runtime returned. shutting down!

# Run under QEMU
qemu-system-riscv64 -machine spike_v1.10 -smp 1 -m 1G -serial stdio -kernel kernel
VNC server running on 127.0.0.1:5900
ocaml-boot: heap@0x80042be8 stack@0x8002fbc0
hello ocaml, on riscv baremetal!
ocaml-boot: caml runtime returned. shutting down!
```

The immediate next step will be getting the code to run on a Shakti softcore on
an FPGA. In addition to targeting high-end FPGAs, we will also be targeting the
$100 [Arty
A7](https://store.digilentinc.com/arty-a7-artix-7-fpga-development-board-for-makers-and-hobbyists/)
hobbyist board and release all of the software under liberal open-source
licenses. 

Further along, we will port mirage libraries to Shakti following similar to the
setup in [Well-typed lightbulbs](https://github.com/well-typed-lightbulbs/) and
implementing hardware security enhancements in Shakti for preventing spatial and
temporal attacks while running unsafe C code (with the ability to dynamically
turn it off when running OCaml!), hardware-assisted compartments, etc. Lots of
exciting possibilities on the horizon!

## Acknowledgements

Much of this work was done by the incredible [Malte](https://github.com/sl33k),
who is a visiting student at IIT Madras on a semester away from Leibniz
University Hannover,
[Arjun](https://www.linkedin.com/in/arjun-menon/?originalSubdomain=in), Lavanya,
Ambika, [Chester](http://www.cse.iitm.ac.in/~chester/), and the rest of the
Shakti team. The RISC-V port of OCaml is developed and maintained by [Nicolás
Ojeda Bär](https://nojb.github.io/).
