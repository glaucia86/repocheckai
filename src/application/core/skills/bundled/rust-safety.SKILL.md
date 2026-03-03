---
name: rust-safety
title: Rust Safety and Toolchain Baseline
description: Rust-focused checks for cargo setup, safety posture, and test/CI quality gates.
category: stack
applies_to: rust
modes: quick,deep
priority: 9
---

## When to Use
Use when `Cargo.toml` exists or Rust source files are prominent.

## Checks
- Verify `Cargo.toml` metadata quality and workspace organization if present.
- Check for baseline commands in CI: `cargo check`, `cargo test`, `cargo clippy`.
- Check for formatting discipline (`cargo fmt --check`).
- In deep mode, inspect `unsafe` usage boundaries and error handling patterns.

## Evidence Rules
- Cite exact package/workspace keys from `Cargo.toml`.
- Cite workflow steps that run or skip rust checks.
- For `unsafe` findings, quote file path and explain risk boundary.

## Scoring Hints
- Missing CI quality gates (`clippy`, tests) is generally P1.
- Unbounded or undocumented `unsafe` usage can be P0/P1 by impact.
- Missing formatting/lint baseline is usually P2.

