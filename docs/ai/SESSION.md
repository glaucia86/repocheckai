# Session Configuration — Repo Check AI

## Initialization

```typescript
import { CopilotClient, type SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();

const session = await client.createSession({
  model: "claude-sonnet-4",
  streaming: true,
  tools: repoTools({ token, maxFiles, maxBytes }),
  systemMessage: { mode: "append", content: SYSTEM_PROMPT },
  infiniteSessions: {
    enabled: true,
    backgroundCompactionThreshold: 0.80,
    bufferExhaustionThreshold: 0.95,
  },
});
```

## Infinite Sessions

RepoCheckAI keeps Infinite Sessions enabled for long-running analyses. The project now targets the current Copilot SDK line (`v0.2.2` at the time of this update), but the runtime behavior remains the same: the SDK compacts context automatically before the buffer is exhausted.

| Config | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable automatic compaction |
| `backgroundCompactionThreshold` | `0.80` | Start compaction at 80% buffer usage |
| `bufferExhaustionThreshold` | `0.95` | Block until compaction completes at 95% |

## Event Handling

```typescript
session.on((event: SessionEvent) => {
  switch (event.type) {
    case "assistant.message_delta":
      process.stdout.write(event.data.deltaContent);
      break;
    case "tool.execution_start":
      toolCallCount++;
      break;
    case "session.idle":
      break;
    case "session.compaction_start":
      break;
    case "session.compaction_complete":
      break;
  }
});
```

## Model Discovery

RepoCheckAI no longer scrapes `copilot --help` for model IDs. Session-aware model discovery now relies on the Copilot SDK's `client.listModels()` and falls back to the curated catalog when runtime discovery is unavailable.

## Current Recommended Models

| Model | Type | Notes |
|-------|------|-------|
| `auto` | Included | Lets Copilot choose automatically |
| `gpt-4o` | Included | Fast daily checks |
| `gpt-4.1` | Included | Reliable general-purpose option |
| `gpt-5-mini` | Included | Good for quick scans |
| `claude-sonnet-4` | Premium | **Default** |
| `claude-sonnet-4.6` | Premium | Strong premium generalist |
| `gpt-5.3-codex` | Premium | Code-heavy repos |
| `claude-opus-4.7` | Premium | Top-tier for Pro+, Business, Enterprise |
| `gpt-5.5` | Premium | Latest GPT rollout for compatible plans |

## Guardrails (Loop Prevention)

**ToolCallTracker** records repeated tool patterns.  
**AgentGuardrails** applies progressive intervention: warn, inject a replan signal, then abort.

| Guardrail | Trigger | Action |
|-----------|---------|--------|
| Step Limit | Too many tool calls | Abort |
| Exact Repeat | Repeated identical calls | Warn → Abort |
| Sequence Loop | Repeating call pattern | Warn → Abort |

Config lives in `src/application/core/agent/guardrails.ts`.

