# Custom Tools — Repo Check AI

## Tool: get_repo_meta

Fetches repository metadata via GitHub API.

```typescript
defineTool("get_repo_meta", {
  description: "Fetches repository metadata from GitHub API.",
  parameters: {
    type: "object",
    properties: {
      repoUrl: { type: "string", description: "GitHub repository URL or slug" }
    },
    required: ["repoUrl"]
  },
  handler: async (args) => {
    // Returns: owner, name, description, defaultBranch, visibility,
    // size, archived, languages, license, topics, created_at, etc.
  }
});
```

**Returns**: owner, name, fullName, description, defaultBranch, visibility, size, archived, disabled, fork, open_issues_count, topics, languages, created_at, updated_at, pushed_at, license info.

---

## Tool: list_repo_files

Lists repository file tree with automatic noise filtering.

```typescript
defineTool("list_repo_files", {
  description: "Lists repository file tree structure.",
  parameters: {
    type: "object",
    properties: {
      repoUrl: { type: "string", description: "GitHub repository URL or slug" },
      maxFiles: { type: "number", description: "Maximum files to list" }
    },
    required: ["repoUrl"]
  },
  handler: async (args) => {
    // Filters: node_modules, dist, .git, vendor, __pycache__, etc.
  }
});
```

**Returns**: branch, totalUnfiltered, totalFiltered, returned, truncated, files array.

---

## Tool: read_repo_file

Reads file content with security sanitization.

```typescript
defineTool("read_repo_file", {
  description: "Reads file content from repository.",
  parameters: {
    type: "object",
    properties: {
      repoUrl: { type: "string", description: "GitHub repository URL or slug" },
      path: { type: "string", description: "File path (e.g., 'README.md')" }
    },
    required: ["repoUrl", "path"]
  },
  handler: async (args) => {
    // Content wrapped with delimiters for security
    // Prompt injection patterns detected and flagged
  }
});
```

**Security**: Content wrapped with `=== FILE CONTENT START/END ===` delimiters. Suspicious patterns flagged in `securityFlags`.

**404 handling**: Returns `{ found: false }` — use as evidence of missing file.

---

## Tool: pack_repository (Deep Analysis)

Packs entire repository using Repomix for comprehensive analysis.

```typescript
defineTool("pack_repository", {
  description: "Packs entire repository into consolidated text file.",
  parameters: {
    type: "object",
    properties: {
      repoUrl: { type: "string", description: "GitHub repository URL" },
      ref: { type: "string", description: "Branch/tag/commit (optional)" },
      mode: { type: "string", enum: ["governance", "deep"] },
      compress: { type: "boolean", description: "Token compression" }
    },
    required: ["repoUrl"]
  }
});
```

**Modes**:
- `governance`: Config files, docs, workflows only
- `deep`: Full source code (src/**, lib/**, tests/**)

**Limits**: 500KB max, 3 minute timeout.

---

## Tool: list_analysis_skills

Lists analysis skills available in runtime for the detected stack and mode.

```typescript
defineTool("list_analysis_skills", {
  description: "Lists skills for stack-specific analysis guidance.",
  parameters: {
    type: "object",
    properties: {
      mode: { type: "string", enum: ["quick", "deep"] },
      detectedStacks: { type: "array", items: { type: "string" } }
    }
  }
});
```

**Returns**: ranked list with `name`, `description`, `category`, `matchReason`, `priority`.

---

## Tool: read_analysis_skill

Reads a specific analysis skill document selected by the agent.

```typescript
defineTool("read_analysis_skill", {
  description: "Reads a skill by name",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" }
    },
    required: ["name"]
  }
});
```

**Returns**: `skill` metadata + body (`checks`, `evidence rules`, `scoring hints`).

---

## Include Patterns

### Governance Mode (default)
```
README.md, LICENSE, CONTRIBUTING.md, package.json, .github/**
```

### Deep Mode
```
+ src/**, lib/**, app/**, test/**, tests/**, spec/**
```

---

## Error Handling

| Status | Tool Response | Agent Action |
|--------|---------------|--------------|
| 404 | `{ found: false }` | Use as evidence |
| 403 | Rate limit error | Show warning, partial report |
| Timeout | Operation timeout | Partial results |

