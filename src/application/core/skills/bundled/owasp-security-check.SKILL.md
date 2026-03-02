---
name: owasp-security-check
title: OWASP Security Baseline
description: Map findings to common OWASP-style risk areas for web/API repositories with concrete evidence.
category: security
applies_to: any
modes: quick,deep
priority: 9
---

## When to Use
Use when repository appears to expose web/API behavior or handles user-controlled input.

## Quick Mode Checklist
- Confirm input boundary files and validation helpers exist.
- Confirm auth/authz policy location and enforcement points.
- Confirm security policy and dependency update signals.
- Confirm at least one concrete high-risk or hardening gap with evidence.

## Deep Mode Checklist
- Trace at least one request path from entrypoint to sensitive sink.
- Validate authz checks at resource ownership boundaries.
- Validate error/logging behavior does not expose sensitive internals.
- Expand one finding to adjacent handlers for variant risk.

## Checks
- Input validation and output encoding controls.
- AuthN/AuthZ controls and token/session handling.
- Sensitive data handling (logs, errors, transport, storage).
- Dependency and component risk signals.
- Security headers, CSRF/CORS controls, and abuse/rate-limit controls where applicable.
- Secrets handling and key lifecycle signals (rotation, scope, least privilege).
- Error behavior that may reveal internals or bypass checks.

## Risk Buckets (OWASP-Oriented)
- Injection and unsafe deserialization
- Broken access control
- Identification and authentication failures
- Security misconfiguration
- Vulnerable/outdated components
- Logging/monitoring failures

## Code Pattern Examples (Bad -> Better)
### Access Control (IDOR)
```ts
// Bad
const user = await db.user.findUnique({ where: { id: req.query.id } });
return json(user);
```

```ts
// Better
if (session.userId !== req.query.id && !session.isAdmin) {
  return forbidden();
}
const user = await db.user.findUnique({ where: { id: req.query.id } });
return json(user);
```

### Injection
```ts
// Bad
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

```ts
// Better
const user = await db.user.findUnique({ where: { email } });
```

### Secret Handling
```ts
// Bad
const API_KEY = "sk_live_hardcoded";
```

```ts
// Better
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY not configured");
```

### Security Misconfiguration
```ts
// Bad
return new Response(error.stack, { status: 500 });
```

```ts
// Better
console.error(error);
return new Response("Internal server error", { status: 500 });
```

## Deep-Mode Focus
- Trace request path from input boundary to sensitive sink.
- Identify missing authorization checks at handler/service boundaries.
- Identify unsafe parser/eval/dynamic execution patterns.
- Identify insecure error handling paths and stack trace leakage.

## False Positive Guards
- Avoid requiring browser-specific controls for non-browser APIs.
- If component is internal-only and gated, downgrade severity with rationale.
- Do not classify speculative paths without evidence chain.

## Evidence Rules
- Tie each finding to a concrete file/config/code snippet and one OWASP-like risk class.
- Avoid generic OWASP claims without repository-specific evidence.
- For each high-risk issue, provide at least one abuse scenario sentence.

## Scoring Hints
- Broken auth, injection vectors, or sensitive data exposure are P0/P1.
- Missing hardening controls in public services are generally P1/P2.

## Output Structure
- Risk class
- Evidence chain (entrypoint -> vulnerable operation)
- Impact
- Fix now / harden next

## Minimal Severity Guide
- `P0`: Confirmed exploit path for auth bypass, injection, or sensitive data exposure.
- `P1`: High-likelihood weakness with clear exposure conditions.
- `P2`: Hardening gap or incomplete control without confirmed exploit chain.
