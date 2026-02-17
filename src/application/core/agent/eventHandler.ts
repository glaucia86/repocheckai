/**
 * Event Handler for Copilot SDK Sessions
 * Single Responsibility: Handle session events and update state
 */

import type { SessionEvent } from "@github/copilot-sdk";
import {
  updateSpinner,
  c,
  ICON,
} from "../../../presentation/ui/index.js";
import type { AgentGuardrails, GuardrailAction } from "./guardrails.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface AnalysisPhase {
  name: string;
  status: "pending" | "running" | "done" | "error";
}

export interface EventHandlerOptions {
  /** Verbose mode - log all events */
  verbose: boolean;
  /** Silent mode - no output */
  silent: boolean;
  /** JSON output format */
  json: boolean;
  /** Reference to spinner for updates */
  hasSpinner: boolean;
  /** Optional guardrails for loop detection */
  guardrails?: AgentGuardrails;
}

export interface EventHandlerState {
  /** Buffer to collect all output */
  outputBuffer: string;
  /** Count of tool calls made */
  toolCallCount: number;
  /** Current phase index */
  currentPhaseIndex: number;
  /** Analysis phases */
  phases: AnalysisPhase[];
  /** Whether analysis was aborted by guardrails */
  aborted: boolean;
  /** Reason for abort (if aborted) */
  abortReason: string;
  /** Track the current tool being executed (for correlating start/complete events) */
  currentToolName: string | null;
  /** Tracks whether streamed deltas were received before a full message event */
  receivedDeltaSinceLastMessage: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// TOOL RESULT SCHEMA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tools that follow the structured result schema with { success, error, reason, suggestion }
 * Only these tools will have their failure status displayed prominently.
 * 
 * Expected result structure:
 * {
 *   success: boolean;
 *   error?: string;       // Human-readable error message
 *   reason?: string;      // Error code like "TIMEOUT", "REPO_NOT_FOUND", etc.
 *   suggestion?: string;  // Actionable suggestion for recovery
 * }
 */
const TOOLS_WITH_STRUCTURED_RESULTS = new Set([
  "pack_repository",
  "get_repo_meta",
  "read_repo_file",
  "list_repo_files",
]);

// ════════════════════════════════════════════════════════════════════════════
// DEFAULT PHASES
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_PHASES: AnalysisPhase[] = [
  { name: "Fetching repository metadata", status: "pending" },
  { name: "Indexing file tree", status: "pending" },
  { name: "Selecting target files", status: "pending" },
  { name: "Reading governance files", status: "pending" },
  { name: "Analyzing evidence", status: "pending" },
  { name: "Generating report", status: "pending" },
];

/**
 * Create a fresh copy of phases for a new analysis
 */
export function createPhases(): AnalysisPhase[] {
  return DEFAULT_PHASES.map((p) => ({ ...p }));
}

// ════════════════════════════════════════════════════════════════════════════
// EVENT HANDLER FACTORY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create an event handler for a Copilot session
 * Returns a handler function and the state object for reading results
 */
export function createEventHandler(options: EventHandlerOptions): {
  handler: (event: SessionEvent) => void;
  state: EventHandlerState;
} {
  const { verbose, silent, json, hasSpinner, guardrails } = options;

  // Mutable state that will be updated by the handler
  const state: EventHandlerState = {
    outputBuffer: "",
    toolCallCount: 0,
    currentPhaseIndex: 0,
    phases: createPhases(),
    aborted: false,
    abortReason: "",
    currentToolName: null,
    receivedDeltaSinceLastMessage: false,
  };

  const handler = (event: SessionEvent): void => {
    // If aborted, only process message events (for partial results)
    if (state.aborted && event.type !== "assistant.message_delta" && event.type !== "assistant.message") {
      return;
    }

    // Debug: log all events in verbose mode
    if (verbose && !json) {
      console.log(`\n  ${c.dim(`[EVENT] ${event.type}`)}`);
    }

    switch (event.type) {
      case "assistant.message_delta":
        if (!silent && !json) {
          process.stdout.write(event.data.deltaContent);
        }
        // Capture ALL delta content
        state.outputBuffer += event.data.deltaContent;
        state.receivedDeltaSinceLastMessage = true;
        break;

      case "assistant.message":
        // Full message event (non-streaming)
        if (event.data?.content) {
          // Avoid duplicate buffering when streaming deltas were already captured
          if (!state.receivedDeltaSinceLastMessage && !silent && !json) {
            console.log(event.data.content);
          }
          if (!state.receivedDeltaSinceLastMessage) {
            // IMPORTANT: Also add to output buffer for /copy and /export
            state.outputBuffer += event.data.content;
          }
        }
        state.receivedDeltaSinceLastMessage = false;
        break;

      case "tool.execution_start": {
        // Skip if aborted
        if (state.aborted) {
          return;
        }

        state.toolCallCount++;
        const toolName = event.data?.toolName || "tool";
        const toolArgs = event.data?.arguments || {};
        
        // Track current tool for correlating with execution_complete event
        state.currentToolName = toolName;

        // Check guardrails for loop detection (if provided)
        if (guardrails) {
          const action = guardrails.onToolStart(toolName, toolArgs);
          handleGuardrailAction(action, state, { verbose, silent, json });
        }

        // Update phase based on tool being called
        updatePhaseFromTool(toolName, state);

        if (verbose && !json) {
          console.log(
            `\n  ${c.dim(`→ [${state.toolCallCount}] Calling ${toolName}...`)}`
          );
        } else if (!silent && !json && hasSpinner) {
          updateSpinner(`Analyzing... (${state.toolCallCount} API calls)`);
        }
        break;
      }

      case "tool.execution_complete":
        {
          // Get the tool name from tracking state (set during execution_start)
          const completedToolName = state.currentToolName;
          state.currentToolName = null; // Clear for next tool
          
          // Only apply structured error display to tools that follow the expected schema
          // This prevents false positives from tools with different result formats
          const isStructuredTool = completedToolName && TOOLS_WITH_STRUCTURED_RESULTS.has(completedToolName);
          
          // The result may contain tool-specific data
          const resultData = event.data?.result;
          
          // Try to parse result content if it's a JSON string
          let parsedResult: Record<string, unknown> | null = null;
          if (isStructuredTool && resultData && typeof resultData.content === "string") {
            try {
              parsedResult = JSON.parse(resultData.content) as Record<string, unknown>;
            } catch {
              // Not JSON, that's fine
            }
          }

          // Log failures prominently for tools with structured results
          if (parsedResult && parsedResult.success === false) {
            const errorReason = typeof parsedResult.reason === 'string' ? parsedResult.reason : "UNKNOWN";
            const errorMsg = typeof parsedResult.error === 'string' ? parsedResult.error : "";
            
            if (!silent && !json) {
              console.log(
                `\n  ${c.warning("⚠️")} ${c.warningBold("Tool failed:")} ${c.dim(errorReason)}`
              );
              if (errorMsg) {
                console.log(`  ${c.dim(`   Error: ${errorMsg.slice(0, 200)}`)}`);
              }
              if (typeof parsedResult.suggestion === "string") {
                console.log(`  ${c.dim(`   → ${parsedResult.suggestion}`)}`);
              }
            }
          } else if (verbose && !json) {
            const icon = c.healthy(ICON.check);
            console.log(`  ${icon} ${c.dim("Tool completed")}`);
          }
        }
        break;

      case "session.idle":
        // Mark all phases as done
        for (const phase of state.phases) {
          if (phase.status !== "error") {
            phase.status = "done";
          }
        }
        if (!silent && !json) {
          console.log("\n");
        }
        break;

      // Infinite Sessions compaction events (v0.1.18+)
      case "session.compaction_start":
        if (verbose && !json) {
          console.log(`\n  ${c.dim(`${ICON.refresh} Context compaction started...`)}`);
        }
        break;

      case "session.compaction_complete":
        {
          const compactionData = event.data as { tokensRemoved?: number; success?: boolean } | undefined;
          if (verbose && !json) {
            const tokensRemoved = compactionData?.tokensRemoved ?? 0;
            const success = compactionData?.success ?? true;
            if (success) {
              console.log(`  ${c.healthy(ICON.check)} ${c.dim(`Compaction complete (${tokensRemoved} tokens freed)`)}`);
            } else {
              console.log(`  ${c.warning(ICON.warn)} ${c.dim("Compaction completed with issues")}`);
            }
          }
        }
        break;

      default:
        // Log unknown events in verbose mode
        if (verbose && !json) {
          console.log(
            `  ${c.dim(`[UNKNOWN] ${JSON.stringify(event).slice(0, 100)}...`)}`
          );
        }
        break;
    }
  };

  return { handler, state };
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Handle guardrail action and update state accordingly
 */
function handleGuardrailAction(
  action: GuardrailAction,
  state: EventHandlerState,
  options: { verbose: boolean; silent: boolean; json: boolean }
): void {
  const { silent, json } = options;

  switch (action.type) {
    case "warn":
      if (!silent && !json) {
        console.log(`\n  ${c.warning(`⚠️ [Guardrail] ${action.message}`)}`);
      }
      break;

    case "inject-message":
      // Inject guidance message to help the agent replan
      if (!silent && !json) {
        console.log(`\n${c.warning(action.message)}`);
      }
      // Also add to buffer so it's visible in the report context
      state.outputBuffer += `\n\n${action.message}\n\n`;
      break;

    case "abort":
      // Set abort flag to prevent further tool executions
      state.aborted = true;
      state.abortReason = action.reason;
      if (!silent && !json) {
        console.log(`\n  ${c.error(`🛑 [Guardrail ABORT] ${action.reason}`)}`);
        console.log(`\n  ${c.dim("Stopping analysis. Partial results shown above.")}`);
      }
      // Add abort notice to output
      state.outputBuffer += `\n\n---\n⚠️ **Analysis stopped**: ${action.reason}\n---\n`;
      break;
  }
}

/**
 * Update phase status based on which tool is being called
 */
function updatePhaseFromTool(toolName: string, state: EventHandlerState): void {
  const { phases } = state;

  if (toolName.includes("meta") && state.currentPhaseIndex === 0) {
    if (phases[0]) phases[0].status = "running";
  } else if (toolName.includes("list") && state.currentPhaseIndex <= 1) {
    if (phases[0]) phases[0].status = "done";
    if (phases[1]) phases[1].status = "running";
    state.currentPhaseIndex = 1;
  } else if (toolName.includes("read") && state.currentPhaseIndex <= 3) {
    if (phases[1]) phases[1].status = "done";
    if (phases[2]) phases[2].status = "done";
    if (phases[3]) phases[3].status = "running";
    state.currentPhaseIndex = 3;
  } else if (toolName.includes("pack") && state.currentPhaseIndex <= 4) {
    // Deep analysis mode
    if (phases[3]) phases[3].status = "done";
    if (phases[4]) phases[4].status = "running";
    state.currentPhaseIndex = 4;
  }
}
