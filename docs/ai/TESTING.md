# Testing — Repo Check AI

## Commands

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:integration # Integration tests (network required)
```

## Test Files

| File | Coverage |
|------|----------|
| `tests/cli/parsers/repoParser.test.ts` | URL parsing |
| `tests/cli/parsers/reportExtractor.test.ts` | Report extraction |
| `tests/cli/state/appState.test.ts` | State management |
| `tests/core/agent/analysisPrompt.test.ts` | Prompt building |
| `tests/core/agent/eventHandler.test.ts` | Event handling |
| `tests/core/agent/toolCallTracker.test.ts` | Loop detection |
| `tests/core/agent/guardrails.test.ts` | Safety mechanisms |
| `tests/tools/repoPacker.test.ts` | RepoPacker unit |
| `tests/tools/repoPacker.integration.test.ts` | RepoPacker integration |

**Total**: 100+ tests

## Manual Testing

```bash
npm run dev:cli                      # Interactive mode
npm run dev:cli -- vercel/next.js    # Direct analysis
npm run dev:cli -- /deep owner/repo  # Deep analysis
```

## Test Cases

| Case | Input | Expected |
|------|-------|----------|
| Healthy repo | `vercel/next.js` | Score > 80%, few P2s |
| Missing LICENSE | Repo without LICENSE | P0 finding |
| No CI | Repo without workflows | P0 finding |
| Rate limited | 403 response | Partial report + warning |
| Private repo | No token | Auth error message |
| Archived repo | Archived repository | Note in summary |
| Empty repo | Empty repository | P0: "Repository appears empty" |
| Prompt injection | Malicious README | P0 security finding |

## Edge Cases

- **Large repos**: Test with 10k+ files (truncation)
- **Monorepos**: Multiple package.json files
- **Non-standard structures**: No src/, custom layouts
- **Binary repos**: Mostly images/assets
- **Forked repos**: Fork metadata handling

