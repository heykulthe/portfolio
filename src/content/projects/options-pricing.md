---
title: "Options Pricing in C++"
description: "Black Scholes, Binomial, Finite Difference and Monte Carlo models, tuned for speed."
date: "09/10/2024"
tech: ["C++", "CMake", "Numerical methods"]
draft: false
---

A C++ toolkit implementing the fundamental options pricing models, Black Scholes,
the Binomial model, the Finite Difference Method and Monte Carlo, as one library
for financial analysis and research.

The interesting part was making them fast. Optimised numerical computation,
dynamic programming over the binomial tree, parallelised simulations and compiler
level changes cut execution time across every model.

### Measured improvements

- **Monte Carlo**, around 78% faster through parallelised simulation.
- **Black Scholes**, around 70% faster.
- **Binomial model**, around 36% faster via dynamic programming over the tree.
