---
name: python-quality
title: Python Quality and Packaging
description: Quality checks for Python repositories covering packaging, tooling, and test conventions.
category: stack
applies_to: python
modes: quick,deep
priority: 9
---

## When to Use
Use when Python is detected via `pyproject.toml`, `requirements*.txt`, `setup.py`, or `.py` source roots.

## Checks
- Validate packaging metadata in `pyproject.toml` or legacy packaging files.
- Check for formatting/lint tooling (`ruff`, `flake8`, `black`, `isort`) and coherent usage.
- Check test setup (`pytest`, `tox`, `nox`) and baseline conventions.
- Validate Python version constraints and dependency pinning strategy.

## Evidence Rules
- Cite concrete files and `[tool.*]` sections or config keys.
- Treat missing packaging metadata as governance/quality risk with explicit evidence.
- In deep mode, include examples of typing quality and error handling style.

## Scoring Hints
- Missing test framework in non-trivial projects is usually P1.
- No lint/format baseline is often P2 or P1 based on repo size.
- Packaging ambiguity in reusable libraries should be at least P1.

