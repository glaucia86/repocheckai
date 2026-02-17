# AGENTS.md — Repo Check AI

AI-powered GitHub repository health analyzer using the GitHub Copilot SDK.

This project uses npm for package management.

## Quick Start

```bash
npm install        # Install dependencies
npm run dev:cli    # Interactive mode
npm test           # Run tests (100+ Vitest)
npm run build      # Production build
```

## CLI Identity (Transition)

- **Official command**: `repocheck`
- **Legacy aliases (temporary)**: `repo-doctor`, `repodoctor`
- **Package name**: `repocheckai`

Use `repocheck` in new scripts/automation. Legacy aliases are supported during migration and may emit deprecation guidance.

## Key Conventions

- **ES Modules**: imports use `.js` extension
- **UI**: Use `src/presentation/ui/` helpers, never raw `console.log`
- **Errors**: Tools return error objects (don't throw)
- **Security**: Content sanitized via `utils/sanitizer.ts`

For detailed documentation, see [docs/index.md](docs/index.md).

