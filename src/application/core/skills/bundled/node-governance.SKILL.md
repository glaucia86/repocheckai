---
name: node-governance
title: Node.js Governance Baseline
description: Governance checks for Node.js repositories, including docs and package hygiene.
category: governance
applies_to: node,typescript,javascript
modes: quick,deep
priority: 9
---

## When to Use
Use for repositories where Node.js, TypeScript, or JavaScript is a primary stack.

## Checks
- Verify README has setup, run, and test instructions.
- Verify license presence and SPDX alignment in `package.json`.
- Check `package.json` for scripts: `build`, `test`, `lint`.
- Check for contribution and security guidance (`CONTRIBUTING.md`, `SECURITY.md`).
- Check lockfile and dependency update automation signals.

## Evidence Rules
- Always cite exact file names and keys in `package.json`.
- If a file is missing, record the 404 as explicit evidence.
- Distinguish between "missing" and "present but weak" guidance.

## Scoring Hints
- Missing README or LICENSE is at least P1.
- Missing test or lint script is usually P1 in active projects.
- Missing SECURITY policy is P1 for libraries and public services.

