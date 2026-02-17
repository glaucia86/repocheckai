/**
 * System Prompt for Repo Check AI
 * 
 * This file now re-exports from the modular prompt system.
 * The prompts are composed from smaller, reusable modules:
 * 
 * - base/     → Common modules (security, phases, scoring, etc.)
 * - modes/    → Mode-specific rules (quick, deep)
 * - composers/ → Functions to compose final prompts
 * 
 * Benefits:
 * - Zero duplication: shared modules are reused
 * - Token optimization: each mode only includes necessary instructions
 * - Easy extension: add new modes by creating new mode modules
 * - Testable: each module can be tested in isolation
 */

// Re-export composed prompts
export {
  QUICK_SYSTEM_PROMPT,
  DEEP_SYSTEM_PROMPT,
  composeSystemPrompt,
  getSystemPrompt,
  type AnalysisMode,
  type PromptComposerOptions,
} from "./composers/index.js";

// Re-export base modules for direct access if needed
export * from "./base/index.js";
export * from "./modes/index.js";

// ════════════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ════════════════════════════════════════════════════════════════════════════

// Keep SYSTEM_PROMPT as alias to QUICK_SYSTEM_PROMPT for backward compatibility
import { QUICK_SYSTEM_PROMPT } from "./composers/index.js";

/**
 * @deprecated Use QUICK_SYSTEM_PROMPT or DEEP_SYSTEM_PROMPT instead.
 * This is kept for backward compatibility with existing code.
 */
export const SYSTEM_PROMPT = QUICK_SYSTEM_PROMPT;

// ════════════════════════════════════════════════════════════════════════════
// LEGACY PROMPT BUILDER (BACKWARD COMPATIBILITY)
// ════════════════════════════════════════════════════════════════════════════

export interface PromptOptions {
  /** Additional rules to append to the system prompt */
  additionalRules?: string;
  /** Custom categories to analyze (overrides defaults) */
  customCategories?: string[];
  /** Maximum number of file reads allowed */
  maxFileReads?: number;
}

/**
 * Build a customized system prompt
 * @deprecated Use composeSystemPrompt() instead
 */
export function buildSystemPrompt(options?: PromptOptions): string {
  if (!options) {
    return QUICK_SYSTEM_PROMPT;
  }

  let prompt = QUICK_SYSTEM_PROMPT;

  if (options.additionalRules) {
    prompt += `\n\n# ADDITIONAL RULES\n\n${options.additionalRules}`;
  }

  if (options.maxFileReads) {
    prompt = prompt.replace(
      /MAXIMUM 20 file reads/g,
      `MAXIMUM ${options.maxFileReads} file reads`
    );
  }

  return prompt;
}

