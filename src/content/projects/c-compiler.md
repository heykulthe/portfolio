---
title: "C Compiler"
description: "A multi phase compiler for a subset of C, from lexer through x86-64 code generation."
date: "03/15/2025"
tech: ["C", "x86-64", "CMake"]
draft: false
---

A compiler for a subset of C, written to understand the whole pipeline rather than
any single stage of it. It covers lexical analysis, parsing, AST construction and
code generation targeting x86-64 assembly using 32 bit operations.

The language subset supports functions, variable declarations, expressions and
conditional control flow. The compiler is organised as a modular multi phase
pipeline, so each stage can be read, tested and replaced on its own.

### What it covers

- **Lexer**, turning source text into a token stream.
- **Parser**, turning tokens into an abstract syntax tree with useful errors.
- **Code generation**, lowering the tree to x86-64 assembly.
- **Control flow**, with conditionals lowered to labels and jumps.
