---
name: semgrep-guidance
title: Semgrep Integration Guidance
description: Provide repository-specific guidance for adopting Semgrep safely and with low noise.
category: security
applies_to: any
modes: quick,deep
priority: 7
---

## When to Use
Use when repository needs practical guidance for static rule-based security scanning.

## Quick Mode Checklist
- Verify CI can run additional security jobs.
- Verify stack coverage aligns with Semgrep rule ecosystem.
- Verify baseline exclusions for generated/vendor code.
- Verify result handling path (PR comments, issues, blocking policy).

## Deep Mode Checklist
- Identify highest-value rule packs for detected stack.
- Identify repository hotspots suited for custom Semgrep rules.
- Propose low-noise rollout strategy with measurable checkpoints.
- Recommend fail policy by severity and confidence.

## Checks
- Feasibility of integrating Semgrep in existing CI pipeline.
- Expected noise sources and exclusion strategy.
- Governance for scanner findings (owner, severity, SLA).
- Practical phased adoption path.

## Evidence Rules
- Cite workflows and folders that affect scanner coverage/noise.
- Avoid claiming tool output; recommend based on repository shape.
- Include one "day-1" and one "day-30" adoption step.

## Scoring Hints
- Missing finding triage ownership is P1 process risk.
- Scan integration gaps without immediate exposure are usually P2.

