---
name: variant-analysis
title: Variant Analysis
description: Expand one confirmed issue pattern to find similar variants across the codebase with confidence labeling.
category: security
applies_to: any
modes: deep
priority: 8
---

## When to Use
Use in deep mode after at least one concrete security issue pattern is identified.

## Quick Mode Checklist
- Not applicable in quick mode.
- If no confirmed seed issue exists, do not run variant expansion.

## Deep Mode Checklist
- Confirm one seed issue with concrete evidence first.
- Define pattern signature (entry -> sink -> missing guard -> outcome).
- Expand to sibling paths and mark confidence per variant.
- Propose one systemic fix plus one regression test strategy.

## Checks
- Build a concise "pattern signature" from the confirmed issue.
- Search for parallel call paths, sibling modules, and copy/paste variants.
- Check whether fixes are localized or systemic.
- Propose remediation strategy that removes the root pattern class.
- Verify whether test coverage would catch the variant class.
- Identify architectural boundary where a single guard can neutralize variants.

## Pattern Signature Template
- Entry condition (untrusted input, auth context, etc.)
- Unsafe operation (sink)
- Missing guard (validation/authz/sanitization)
- Observable outcome (data exposure, code exec, bypass)

## Code Pattern Examples (Seed -> Variants)
### Seed
```ts
// Seed issue
router.get("/user", async (req) => {
  return db.user.findUnique({ where: { id: req.query.id } });
});
```

### Likely Variant A
```ts
router.get("/account", async (req) => {
  return db.account.findUnique({ where: { id: req.query.id } });
});
```

### Likely Variant B
```ts
router.get("/orders", async (req) => {
  return db.order.findMany({ where: { userId: req.query.id } });
});
```

## Evidence Rules
- Start with one confirmed finding, then list variant candidates with confidence level.
- Mark uncertain matches explicitly to avoid over-claiming.
- Use confidence tags: `high`, `medium`, `low` with one-line rationale.

## Scoring Hints
- Multiple confirmed variants of a high-impact flaw may escalate severity.
- Single uncertain variants should remain advisory until confirmed.

## Output Structure
- Seed issue summary
- Variant candidates table (`location`, `confidence`, `reason`)
- Consolidated remediation strategy (code + test + policy)

## Minimal Severity Guide
- `P0`: Multiple confirmed high-impact variants with exploitable paths.
- `P1`: Confirmed variant(s) with clear risk but narrower blast radius.
- `P2`: Hypothesized variants requiring confirmation.
