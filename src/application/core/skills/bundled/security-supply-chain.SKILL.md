---
name: security-supply-chain
title: Supply Chain Security
description: Evaluate dependency hygiene, provenance signals, and update/response workflows with evidence-first triage.
category: security
applies_to: any
modes: quick,deep
priority: 9
---

## When to Use
Use for all repositories that consume external dependencies or publish artifacts.

## Quick Mode Checklist
- Verify update automation presence and basic schedule.
- Verify lockfile and reproducible install signal.
- Verify at least one dependency-risk triage signal.
- Verify CI/release path includes integrity baseline.

## Deep Mode Checklist
- Inspect manifests for floating/high-risk dependency patterns.
- Inspect CI scripts for unverified remote execution patterns.
- Inspect release workflow for provenance/signature/checksum controls.
- Prioritize one remediation path with highest risk reduction.

## Checks
- Dependency update automation (`dependabot`, renovate, equivalent) exists and is active.
- Lockfile/reproducibility controls exist and are committed.
- Dependency risk visibility exists (advisories, audit workflow, triage process).
- Build provenance and release integrity signals exist (trusted workflow, provenance, signing, checksum policy).
- Registry and package source trust boundaries are explicit (internal mirror, allowed registries, pinning policy).

## Deep-Mode Focus
- Look for unpinned floating ranges in critical runtime dependencies.
- Look for scripts/install hooks that fetch remote code at build time.
- Look for direct URL dependencies or ad-hoc curl|bash patterns in CI.
- Look for release steps without integrity checks.

## Code Pattern Examples (Bad -> Better)
### Floating Critical Dependency
```json
// Bad
{
  "dependencies": {
    "critical-lib": "*"
  }
}
```

```json
// Better
{
  "dependencies": {
    "critical-lib": "1.4.2"
  }
}
```

### Unverified Remote Script
```yaml
# Bad
- run: curl -s https://example.com/install.sh | bash
```

```yaml
# Better
- run: curl -sSLO https://example.com/install.sh
- run: echo "<sha256>  install.sh" | sha256sum -c -
- run: bash install.sh
```

### Missing Lockfile Discipline
```bash
# Bad
npm install
```

```bash
# Better
npm ci
```

## False Positive Guards
- Treat libraries differently from deployable services.
- Do not require SBOM/signing if project scope clearly does not publish artifacts.
- If no workflow files exist, classify as governance/CI gap, not supply-chain implementation failure.

## Evidence Rules
- Reference exact files (`package-lock`, `go.sum`, `Cargo.lock`, workflows, release configs).
- Separate "automation missing" from "automation misconfigured."
- Flag ambiguity explicitly when repository type does not require a given control.
- Include at least one concrete remediation per high-severity finding.

## Scoring Hints
- No update automation in active public repos is usually P1.
- Missing lock/reproducibility controls can be P1/P2 by deployment risk.
- Unsigned/unauthenticated release process in high-distribution projects can be P1.

## Output Structure
- Finding: short title + severity
- Evidence: exact file/path/key
- Risk: exploit or failure path in one sentence
- Fix: minimum viable remediation + optional hardening step

## Minimal Severity Guide
- `P0`: Confirmed build or dependency path allows untrusted code execution.
- `P1`: High-risk hygiene gap (no update automation, no reproducible install in active repo).
- `P2`: Hardening recommendation with limited exploitability evidence.
