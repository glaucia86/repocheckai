---
name: security-ownership-risk
title: Security Ownership Risk
description: Evaluate whether security-critical areas have clear ownership and sustainable response capacity.
category: security
applies_to: any
modes: quick,deep
priority: 8
---

## When to Use
Use for active repositories where long-term maintenance and vulnerability response speed matter.

## Quick Mode Checklist
- Verify explicit maintainer/owner signals exist.
- Verify security reporting path identifies responsible team/person.
- Verify bus-factor risk indicators in governance docs.
- Verify triage expectations for security issues are documented.

## Deep Mode Checklist
- Map critical surfaces (auth, secrets, release, infra) to ownership clues.
- Identify single-owner bottlenecks for high-risk components.
- Identify escalation and handoff gaps for incidents.
- Recommend minimal ownership model to reduce response risk.

## Checks
- Ownership artifacts (`CODEOWNERS`, docs, maintainer sections, contribution policy).
- Security response clarity (contact channel, SLA expectations, disclosure approach).
- Concentration risk in critical paths.
- Collaboration model resilience for incident conditions.

## Evidence Rules
- Use repository-visible evidence only; avoid speculation on personal availability.
- Classify ownership confidence (`high|medium|low`) when evidence is partial.
- Frame findings as operational risk, not individual performance judgment.

## Scoring Hints
- No clear ownership for critical security areas in active repos is often P1.
- Partial ownership clarity with documented fallback is commonly P2.

