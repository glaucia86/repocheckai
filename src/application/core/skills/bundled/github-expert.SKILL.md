---
name: github-expert
title: GitHub Platform Maturity
description: Evaluate repository maturity on GitHub controls such as Actions hardening, CODEOWNERS, and branch protections.
category: governance
applies_to: any
modes: quick,deep
priority: 8
---

## When to Use
Use for any repository hosted on GitHub, especially multi-contributor or production-facing projects.

## Quick Mode Checklist
- Verify `.github/workflows/` exists and includes CI gates.
- Verify ownership/process signals (`CODEOWNERS`, PR template, issue templates).
- Verify security process files (`SECURITY.md`, dependency update automation).
- Verify default branch quality expectations are documented.

## Deep Mode Checklist
- Inspect workflows for least-privilege `permissions` and untrusted action usage.
- Inspect release/deploy workflows for environment isolation and review gates.
- Inspect governance docs for contributor and maintainer responsibilities.
- Recommend minimum GitHub control baseline by repository risk profile.

## Checks
- CI workflow presence, trigger quality, and failure visibility.
- Branch/PR governance artifacts (`CODEOWNERS`, templates, contribution policy).
- Security lifecycle artifacts (`SECURITY.md`, dependency bot config, incident guidance).
- Workflow hardening signals (pinned actions, permission scoping, trusted sources).

## Evidence Rules
- Cite exact file paths and workflow keys.
- Distinguish "missing control" from "control present but weak."
- Provide one practical next action per P1 finding.

## Scoring Hints
- Missing CI + governance controls in active public repositories is typically P1.
- Weak workflow hardening in deploy pipelines is often P1/P2 by exposure.

