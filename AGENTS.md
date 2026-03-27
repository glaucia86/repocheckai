# AGENTS.md — Repo Check AI

AI-powered GitHub repository health analyzer using the GitHub Copilot SDK.

This project uses npm for package management.
Node.js 24+ is required.

## Quick Start

```bash
npm install        # Install dependencies
npm run dev:cli    # Interactive mode
npm run dev:web    # Web UI
npm run dev:api    # API mode
npm test           # Run tests (100+ Vitest)
npm run build      # Production build
```

## CLI Identity (Transition)

- **Official command**: `repocheck`
- **Legacy aliases (temporary)**: `repo-doctor`, `repodoctor`
- **Package name**: `repocheckai`

Use `repocheck` in new scripts/automation. Legacy aliases are supported during migration and may emit deprecation guidance.

## Main Scripts

- `npm run dev:cli`: interactive CLI (`src/presentation/cli.ts`)
- `npm run dev:web`: web UI server (`src/presentation/web/main.ts`)
- `npm run dev:api`: API server (`src/presentation/api/index.ts`)
- `npm run test:integration`: integration tests (`vitest.integration.config.ts`)
- `npm run test:all`: unit + integration test suite
- `npm run preview:web`: preview built web UI (`dist/web/main.js`)

## Key Conventions

- **ES Modules**: imports use `.js` extension
- **UI**: Use `src/presentation/ui/` modules for user-facing rendering paths
- **Errors**: Tools return error objects (don't throw)
- **Security**: Content sanitized via `src/utils/sanitizer.ts`

For detailed documentation, see [docs/index.md](docs/index.md).

