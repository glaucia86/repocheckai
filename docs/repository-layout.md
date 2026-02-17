# 🗂️ Repository Layout

Repo Check AI currently has three application surfaces:

- **CLI**: terminal-first workflow for repository analysis.
- **Web UI**: local browser UI backed by a local API.
- **Site**: static public website (GitHub Pages).

## Top-Level Structure

```text
repocheckai/
├── site/
├── src/
├── tests/
├── docs/
└── scripts/
```

## Application Ownership

### CLI

Ownership and references for the CLI app.

- Runtime entrypoint: `src/presentation/cli.ts`
- Presentation modules: `src/presentation/cli/**` and `src/presentation/ui/**`
- Application orchestration: `src/application/core/**`
- Infrastructure adapters: `src/infrastructure/**`
- Domain models/contracts: `src/domain/**`
- Dev command: `npm run dev:cli`

### Web UI

Ownership and references for the local Web UI app.

- API entrypoint: `src/presentation/api/index.ts`
- Web server entrypoint: `src/presentation/web/main.ts`
- Frontend assets/app: `src/presentation/web/public/**`
- Dev commands:
  - `npm run dev:web-ui:api`
  - `npm run dev:web-ui`
  - `npm run dev:local-ui` (runs both)

### Site

Static site content deployed with GitHub Pages.

- Source/deploy folder: `site/**`
- Workflow: `.github/workflows/pages.yml`

## Why This Layout

- Keeps the public website isolated from runtime source code.
- Separates `src/` by clean architecture layers.
- Reduces accidental cross-surface edits by clarifying ownership.

