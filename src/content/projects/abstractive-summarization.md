---
title: "Abstractive Summarization"
description: "A BART model fine tuned on BookSum, for summarising documents long enough to break extractive methods."
date: "07/13/2024"
tech: ["Python", "PyTorch", "Hugging Face"]
modelURL: "https://huggingface.co/siddheshtv/abstractive_summarization"
draft: false
---

A BART model fine tuned for abstractive summary generation with PyTorch and
Hugging Face, trained on the BookSum dataset, where source documents run long
enough that extractive approaches stop working.

Training used gradient accumulation to hold memory down at a usable batch size,
which also improved the internal logic of the generated summaries. As with the
trading agent, runs go through a configurable logging setup so training
behaviour can be compared across experiments.
