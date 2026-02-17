/**
 * Tool Call Tracker
 * Single Responsibility: Track tool calls and detect loops/repetitions
 * 
 * Implements guardrails to prevent the agent from getting stuck in
 * infinite loops of tool executions.
 */

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface ToolCall {
  tool: string;
  argsHash: string;
  timestamp: number;
}

export interface LoopDetectionResult {
  isLoop: boolean;
  type: "none" | "exact-repeat" | "sequence-loop" | "step-limit";
  message: string;
  consecutiveRepeats: number;
}

export interface TrackerConfig {
  /** Maximum number of tool calls allowed per session */
  maxToolCalls: number;
  /** Number of consecutive identical calls to trigger loop detection */
  maxConsecutiveRepeats: number;
  /** Minimum sequence length to detect A→B→A patterns */
  minSequenceLength: number;
  /** Time window in ms to consider for loop detection */
  timeWindowMs: number;
}

// ════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_TRACKER_CONFIG: TrackerConfig = {
  maxToolCalls: 50,           // Allow up to 50 tool calls per session
  maxConsecutiveRepeats: 5,   // Detect after 5 identical calls in a row
  minSequenceLength: 3,       // Detect A→B→C→A→B→C patterns (longer sequences)
  timeWindowMs: 120000,       // Look at last 2 minutes
};

// ════════════════════════════════════════════════════════════════════════════
// TOOL CALL TRACKER CLASS
// ════════════════════════════════════════════════════════════════════════════

export class ToolCallTracker {
  private calls: ToolCall[] = [];
  private config: TrackerConfig;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = { ...DEFAULT_TRACKER_CONFIG, ...config };
  }

  /**
   * Record a tool call
   */
  recordCall(toolName: string, args: unknown): void {
    const argsHash = this.hashArgs(args);
    this.calls.push({
      tool: toolName,
      argsHash,
      timestamp: Date.now(),
    });
  }

  /**
   * Get the total number of tool calls
   */
  getCallCount(): number {
    return this.calls.length;
  }

  /**
   * Check for loop conditions
   */
  detectLoop(): LoopDetectionResult {
    // Check step limit first
    if (this.calls.length >= this.config.maxToolCalls) {
      return {
        isLoop: true,
        type: "step-limit",
        message: `Step limit reached (${this.config.maxToolCalls} tool calls). Forcing completion.`,
        consecutiveRepeats: 0,
      };
    }

    // Check for exact repeats (same tool + same args)
    const exactRepeatResult = this.detectExactRepeats();
    if (exactRepeatResult.isLoop) {
      return exactRepeatResult;
    }

    // Check for sequence loops (A→B→A→B pattern)
    const sequenceLoopResult = this.detectSequenceLoop();
    if (sequenceLoopResult.isLoop) {
      return sequenceLoopResult;
    }

    return {
      isLoop: false,
      type: "none",
      message: "",
      consecutiveRepeats: 0,
    };
  }

  /**
   * Detect consecutive identical tool calls (same tool + same args)
   */
  private detectExactRepeats(): LoopDetectionResult {
    if (this.calls.length < this.config.maxConsecutiveRepeats) {
      return { isLoop: false, type: "none", message: "", consecutiveRepeats: 0 };
    }

    const recentCalls = this.getRecentCalls();
    if (recentCalls.length < this.config.maxConsecutiveRepeats) {
      return { isLoop: false, type: "none", message: "", consecutiveRepeats: 0 };
    }

    // Check last N calls for identical pattern
    const lastCall = recentCalls[recentCalls.length - 1];
    if (!lastCall) {
      return { isLoop: false, type: "none", message: "", consecutiveRepeats: 0 };
    }

    let consecutiveCount = 1;
    for (let i = recentCalls.length - 2; i >= 0; i--) {
      const call = recentCalls[i];
      if (call && call.tool === lastCall.tool && call.argsHash === lastCall.argsHash) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    if (consecutiveCount >= this.config.maxConsecutiveRepeats) {
      return {
        isLoop: true,
        type: "exact-repeat",
        message: `Detected ${consecutiveCount} consecutive identical calls to "${lastCall.tool}". This may indicate a loop.`,
        consecutiveRepeats: consecutiveCount,
      };
    }

    return { isLoop: false, type: "none", message: "", consecutiveRepeats: consecutiveCount };
  }

  /**
   * Detect sequence loops (A→B→A→B or A→B→C→A→B→C patterns)
   */
  private detectSequenceLoop(): LoopDetectionResult {
    const recentCalls = this.getRecentCalls();
    if (recentCalls.length < this.config.minSequenceLength * 2) {
      return { isLoop: false, type: "none", message: "", consecutiveRepeats: 0 };
    }

    // Try different sequence lengths
    for (let seqLen = this.config.minSequenceLength; seqLen <= 4; seqLen++) {
      if (recentCalls.length < seqLen * 2) continue;

      const lastSequence = recentCalls.slice(-seqLen);
      const previousSequence = recentCalls.slice(-seqLen * 2, -seqLen);

      if (this.sequencesMatch(lastSequence, previousSequence)) {
        const toolNames = lastSequence.map(c => c.tool).join(" → ");
        return {
          isLoop: true,
          type: "sequence-loop",
          message: `Detected repeating sequence: ${toolNames}. This may indicate a loop.`,
          consecutiveRepeats: 2,
        };
      }
    }

    return { isLoop: false, type: "none", message: "", consecutiveRepeats: 0 };
  }

  /**
   * Compare two sequences of tool calls.
   * 
   * DESIGN DECISION: We compare both tool name AND arguments (argsHash).
   * 
   * This is intentional for Repo Check AI's use case:
   * - Reading different files in sequence (README → LICENSE → package.json) is 
   *   expected and normal behavior during repository analysis
   * - We only want to detect TRUE loops where the agent is stuck repeating
   *   the exact same operation (same tool + same arguments)
   * 
   * Alternative approach (tool name only) would cause false positives:
   *   read_file(README) → read_file(LICENSE) → read_file(package.json) → ...
   *   would incorrectly be flagged as a loop pattern.
   * 
   * Current approach correctly allows:
   *   ✓ read_file(A) → read_file(B) → read_file(C) (different files)
   * 
   * Current approach catches:
   *   ✗ read_file(A) → process → read_file(A) → process (same file, stuck loop)
   */
  private sequencesMatch(seq1: ToolCall[], seq2: ToolCall[]): boolean {
    if (seq1.length !== seq2.length) return false;
    
    for (let i = 0; i < seq1.length; i++) {
      const a = seq1[i];
      const b = seq2[i];
      if (!a || !b) return false;
      // Compare both tool name AND arguments to avoid false positives
      // when the agent is legitimately reading multiple different files
      if (a.tool !== b.tool || a.argsHash !== b.argsHash) return false;
    }
    
    return true;
  }

  /**
   * Get calls within the time window
   */
  private getRecentCalls(): ToolCall[] {
    const cutoff = Date.now() - this.config.timeWindowMs;
    return this.calls.filter(c => c.timestamp >= cutoff);
  }

  /**
   * Create a hash of the arguments for comparison
   */
  private hashArgs(args: unknown): string {
    try {
      return JSON.stringify(args);
    } catch {
      return String(args);
    }
  }

  /**
   * Get a summary of tool usage for debugging
   */
  getSummary(): { tool: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const call of this.calls) {
      counts.set(call.tool, (counts.get(call.tool) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Reset the tracker (for new sessions)
   */
  reset(): void {
    this.calls = [];
  }
}

