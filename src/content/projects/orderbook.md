---
title: "Low Latency Orderbook"
description: "A Level 2 limit orderbook in Rust, built around a ring buffer to keep hot reads in L1 cache."
date: "03/30/2026"
tech: ["Rust", "Lock free", "Cache aware"]
repoURL: "https://github.com/heykulthe/orderbook"
draft: false
---

A Level 2 limit orderbook written in Rust, built for the kind of latency budget
high frequency trading actually runs on. Best bid and best ask reads land at
roughly 1.2 nanoseconds.

The design leans on a ring buffer over a fixed size array rather than a tree or a
hash map. Price levels sit contiguously in memory, so the levels that get touched
on every tick stay resident in L1 cache and reads stay branch predictable. Nothing
is allocated on the hot path.

### How it gets there

- Fixed size array backing the book, so every level is a bounded offset away.
- Ring buffer indexing, which keeps the working set contiguous as the book moves.
- Hot data packed to stay inside L1, which is where most of the win comes from.
- No allocation and no pointer chasing once the book is warm.

Reading around this pulled me into kernel bypass networking, DPDK and the rest of
the stack you need if you want the network path to keep up with the book.
