---
title: "TD3 Stock Trading Agent"
description: "A reinforcement learning trading agent on AAPL, with a custom reward structure and frame stacked states."
date: "04/07/2025"
tech: ["Python", "PyTorch", "Reinforcement learning"]
repoURL: "https://github.com/heykulthe/td3-stock-trading"
modelURL: "https://huggingface.co/siddheshtv/td3-stock-aapl"
draft: false
---

A trading agent built on TD3, twin delayed deep deterministic policy gradient,
trained on AAPL price data. Most of the work went into the environment rather
than the algorithm: a custom reward structure, and frame stacked states so the
agent sees a short window of history instead of a single tick.

### Results

- **34.61%** mean return across evaluation episodes.
- **18.63%** maximum drawdown.
- **110 seconds** per epoch, converging stably and reproducibly across episodes despite noisy market data.

Runs are instrumented with a configurable logging setup, which is what made the
training debuggable and the results worth comparing against each other.
