---
name: polyglot-governance
title: Polyglot Governance Baseline
description: Language-agnostic governance checks for repositories with unknown or mixed stacks.
category: governance
applies_to: any
modes: quick,deep
priority: 8
---

## When to Use
Use when stack detection is uncertain, mixed, or when the repository does not match known language-specific playbooks.

## Checks
- Confirm baseline documentation: `README.md`, `LICENSE`, and contribution guidance.
- Confirm security and disclosure process (`SECURITY.md` and reporting channel).
- Verify CI workflows exist and run build/test/lint gates.
- Verify dependency update automation or equivalent maintenance process.
- Verify release hygiene: versioning strategy, changelog, and clear ownership signals.

## Evidence Rules
- Use explicit file presence/absence as evidence.
- For CI findings, cite exact workflow files and missing job stages.
- Distinguish repository health gaps from language-specific conventions.

## Scoring Hints
- Missing CI or security policy in public repos is usually P1.
- Missing docs/governance files is P2 to P1 depending on project visibility.
- Treat uncertain stack as a reason to avoid speculative language-specific deductions.

