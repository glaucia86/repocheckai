---
name: security-scanning-dependencies
title: Security Dependency Scanning
description: Assess readiness and coverage for dependency vulnerability scanning and remediation workflow.
category: security
applies_to: any
modes: quick,deep
priority: 8
---

## When to Use
Use when dependency risk management is a key concern.

## Quick Mode Checklist
- Verify dependency manifest and lockfile are present.
- Verify automated update/alert signal exists.
- Verify a documented remediation path for vulnerable dependencies.
- Verify CI does not bypass dependency validation entirely.

## Deep Mode Checklist
- Identify critical dependency clusters and update bottlenecks.
- Inspect scripts/workflows for dependency install and audit behavior.
- Identify transitive risk blind spots and prioritization gaps.
- Recommend minimal remediation cadence and ownership.

## Checks
- Dependency visibility and vulnerability signal coverage.
- Reproducible dependency state controls.
- Remediation process quality and evidence.
- Alignment between project criticality and scanning maturity.

## Evidence Rules
- Cite manifests, lockfiles, workflows, and policy docs.
- Separate "no signals found" from "signals found but weak."
- Include concrete next step with smallest operational overhead.

## Scoring Hints
- No dependency scanning/update flow in active public repos is usually P1.
- Partial controls with clear upgrade path are typically P2.

