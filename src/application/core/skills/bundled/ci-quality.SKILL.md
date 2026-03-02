---
name: ci-quality
title: CI Quality Gate
description: CI workflow checks for test/lint/build coverage and reliability.
category: ci
applies_to: any
modes: quick,deep
priority: 8
---

## When to Use
Use when CI workflow files are detected in `.github/workflows`.

## Checks
- Verify workflows run on PR and push for relevant branches.
- Verify test and lint jobs are present and not no-op.
- Check dependency caching and timeout/concurrency safety.
- Check artifact handling and failure visibility.
- In deep mode, validate scripts called by CI actually exist.

## Evidence Rules
- Cite workflow file names and trigger keys (`on`, `jobs`, `steps`).
- Distinguish coverage gap vs pipeline absence.
- Prefer one concrete failing scenario per finding.

## Scoring Hints
- No CI in active multi-contributor repos is usually P1.
- CI present but missing tests/lint is often P2 to P1 depending on risk.
- Flaky or unbounded jobs can be P2 unless they block release confidence.

