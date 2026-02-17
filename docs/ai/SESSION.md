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

## Infinite Sessions (v0.1.18+)

Automatic context compaction for long-running analyses.

| Config | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable auto-compaction |
| `backgroundCompactionThreshold` | `0.80` | Start at 80% buffer |
| `bufferExhaustionThreshold` | `0.95` | Block at 95% |

**Benefits**: Long analyses without context limits. State persisted at `~/.copilot/session-state/{sessionId}/`.

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
      // Analysis complete
      break;
    case "session.compaction_start":
      // Context compaction started
      break;
    case "session.compaction_complete":
      // { tokensRemoved, success }
      break;
  }
});
```

## Available Models

| Model | Type | Notes |
|-------|------|-------|
| `gpt-4o` | Free | Good default |
| `gpt-4.1` | Free | Fast |
| `gpt-5-mini` | Free | Quick scans |
| `claude-sonnet-4` | Premium | **Default** — Excellent detail |
| `claude-sonnet-4.5` | Premium | Enhanced reasoning |
| `claude-opus-4.5` | Premium | Most capable (3x cost) |
| `gpt-5` | Premium | Advanced reasoning |
| `o3` | Premium | Deep reasoning |

## Guardrails (Loop Prevention)

**ToolCallTracker**: Records calls, detects patterns.
**AgentGuardrails**: Progressive response (warn → inject → abort).

| Guardrail | Trigger | Action |
|-----------|---------|--------|
| Step Limit | 50+ calls (standard) | Abort |
| Exact Repeat | 5+ identical | Warn → Abort |
| Sequence Loop | A→B→A→B | Warn → Abort |

Config in `src/application/core/agent/guardrails.ts`.

