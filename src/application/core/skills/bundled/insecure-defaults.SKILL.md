---
name: insecure-defaults
title: Insecure Defaults Check
description: Detect risky default configurations, fail-open behavior, and unsafe bootstrap states.
category: security
applies_to: any
modes: quick,deep
priority: 10
---

## When to Use
Use for all repositories, especially services and SDKs that expose configuration options.

## Quick Mode Checklist
- Identify top 3 security-sensitive defaults from config/docs.
- Verify whether defaults are secure without extra setup.
- Confirm docs/examples reinforce secure defaults.
- Classify each issue as `default insecure` or `optional override`.

## Deep Mode Checklist
- Trace default values from declaration to runtime usage.
- Validate error/fallback branches for fail-open behavior.
- Check env-var toggles and compatibility flags for unsafe states.
- Provide minimal safe-default migration guidance.

## Checks
- Identify default settings that disable auth, TLS verification, signature checks, or input validation.
- Identify dev-only defaults that can leak into production.
- Identify permissive CORS/debug flags enabled by default.
- Verify production-safe defaults are documented and easy to adopt.
- Verify "first-run" behavior is secure before any manual hardening.
- Verify examples/templates do not normalize insecure values.

## Deep-Mode Focus
- Trace default values from config declaration to runtime decision point.
- Identify conditionals where errors silently fallback to insecure mode.
- Identify environment variables that flip security controls without guardrails.
- Identify legacy compatibility flags that weaken policy by default.

## Code Pattern Examples (Bad -> Better)
### Insecure Verification Default
```ts
// Bad
const VERIFY_TLS = process.env.VERIFY_TLS ?? "false";
```

```ts
// Better
const VERIFY_TLS = process.env.VERIFY_TLS ?? "true";
```

### Fail-Open Auth
```ts
// Bad
if (!token) return next();
```

```ts
// Better
if (!token) return unauthorized();
```

### Debug Mode Leakage
```ts
// Bad
const DEBUG = process.env.DEBUG ?? "1";
```

```ts
// Better
const DEBUG = process.env.DEBUG ?? "0";
```

## False Positive Guards
- Do not flag explicit "development-only" defaults when environment gating is strict and enforced.
- If secure defaults exist but docs are weak, classify as documentation gap, not default-security failure.
- Distinguish "unsafe option exists" from "unsafe option is default."

## Evidence Rules
- Cite exact config key, constant, or code path proving the default.
- Distinguish `default insecure` from `optional insecure override`.
- If uncertain, classify as "needs verification" with explicit evidence source.
- Prefer one minimal code snippet over broad paraphrase.

## Scoring Hints
- Fail-open auth or disabled verification defaults are P0/P1 by exposure.
- Missing explicit secure defaults is usually P1/P2 depending on context.

## Output Structure
- Default: key/value and where it is defined
- Runtime effect: what is bypassed or weakened
- Blast radius: local, service-wide, or ecosystem-wide
- Fix: secure default + migration note

## Minimal Severity Guide
- `P0`: Default bypasses auth/verification and is reachable in production paths.
- `P1`: Unsafe default with realistic production misconfiguration risk.
- `P2`: Hardening gap without direct bypass path.
