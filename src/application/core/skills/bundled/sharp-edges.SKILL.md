---
name: sharp-edges
title: Security Sharp Edges
description: Detect dangerous API usage patterns and interfaces where insecure usage is easier than secure usage.
category: security
applies_to: any
modes: quick,deep
priority: 8
---

## When to Use
Use when repository contains SDKs, framework adapters, or internal platform abstractions.

## Quick Mode Checklist
- Identify top exposed APIs/config knobs with security impact.
- Check if safe usage path is easier than unsafe usage path.
- Confirm docs/examples prioritize secure defaults.
- Flag one high-impact ergonomic risk with clear fix direction.

## Deep Mode Checklist
- Trace risky helper usage across multiple call sites.
- Validate wrappers preserve lower-level safety checks.
- Validate guardrails (typing/runtime checks) for dangerous operations.
- Propose API ergonomics changes that prevent recurring misuse.

## Checks
- APIs that make insecure usage easier than secure usage.
- Dangerous helper methods without guardrails or warnings.
- Unsafe convenience wrappers around crypto, auth, serialization, or command execution.
- Missing "safe-by-default" examples in docs.
- Naming/parameter design that hides risk (e.g., boolean switches with unsafe defaults).
- Missing compile-time/runtime guardrails for high-risk operations.

## Deep-Mode Focus
- Identify repeated call sites where the same footgun appears.
- Check whether wrappers remove safety checks from lower-level APIs.
- Validate whether docs and examples steer users toward secure paths.

## Code Pattern Examples (Bad -> Better)
### Unsafe Convenience API
```ts
// Bad
export function execute(command: string) {
  return exec(command);
}
```

```ts
// Better
export function executeSafe(args: string[]) {
  return spawn("trusted-binary", args, { shell: false });
}
```

### Risky Boolean Toggle
```ts
// Bad
createClient({ insecure: true });
```

```ts
// Better
createClient({ tlsMode: "strict" });
```

### Missing Guardrail in Wrapper
```ts
// Bad
export const sign = (payload: string) => jwt.sign(payload, SECRET);
```

```ts
// Better
export const sign = (payload: object) =>
  jwt.sign(payload, SECRET, { algorithm: "HS256", expiresIn: "15m" });
```

## False Positive Guards
- If unsafe methods are intentionally internal and gated, downgrade severity.
- If API has clear warnings + safe defaults + tests, classify as low/observational.
- Avoid penalizing advanced APIs when secure ergonomics are still first-class.

## Evidence Rules
- Show exact function signatures and call examples that demonstrate misuse risk.
- Distinguish "unsafe capability exists" from "unsafe by default."
- Include one "secure alternative" path for each identified sharp edge.

## Scoring Hints
- Unsafe-by-default interfaces affecting many consumers are P1.
- Misuse-prone but documented edges are often P2.

## Output Structure
- Edge: function/config and why it is a footgun
- Who is affected: internal team vs external consumers
- Short fix: default/ergonomics/guardrail change

## Minimal Severity Guide
- `P0`: Footgun enables direct critical misuse in common call paths.
- `P1`: Unsafe ergonomics likely to cause recurring insecure usage.
- `P2`: Minor design sharp edge with mitigations already present.
