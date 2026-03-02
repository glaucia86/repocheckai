---
name: sast-readiness
title: SAST Readiness
description: Assess whether repository structure and CI are ready for sustainable static security analysis.
category: security
applies_to: any
modes: quick,deep
priority: 8
---

## When to Use
Use for repositories where security scanning quality and maintainability are important.

## Quick Mode Checklist
- Verify CI exists and can host security scan stages.
- Verify source layout and ignore strategy are clear enough for scanning.
- Verify baseline quality gates (tests/lint/typecheck) to reduce SAST noise.
- Verify ownership path for triaging security findings.

## Deep Mode Checklist
- Inspect potential high-noise areas and suggest targeted scan boundaries.
- Identify likely custom rules opportunities based on repository patterns.
- Identify insecure coding patterns where SAST would add highest value.
- Recommend phased rollout (baseline -> enforce -> tune).

## Checks
- Pipeline readiness for SAST jobs (runtime, caching, fail behavior).
- Signal quality prerequisites (lint/test hygiene, generated code filtering, directory conventions).
- Triage process signals (severity policy, owners, issue workflow).
- Fit-for-purpose scanner strategy by stack and repository type.

## Evidence Rules
- Reference workflow and config files that support or block SAST adoption.
- Mark recommendations as phased when confidence is medium.
- Avoid claiming "no vulnerabilities" without scanner evidence.

## Scoring Hints
- No path to triage/remediate scanner output is usually P1 process risk.
- Missing scan boundaries or noisy structure is commonly P2/P1 depending on scale.

