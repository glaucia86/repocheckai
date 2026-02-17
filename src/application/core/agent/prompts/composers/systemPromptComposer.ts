/**
 * System Prompt Composer
 * Composes the final system prompts from modular pieces
 * 
 * This follows the Open/Closed Principle:
 * - Open for extension: add new modes by creating new mode modules
 * - Closed for modification: base modules don't need to change
 */

// Base modules
import {
  SECURITY_DIRECTIVE,
  EXPERTISE_PROFILE,
  RECONNAISSANCE_PHASE,
  LANGUAGE_DETECTION_PHASE,
  STRATEGIC_READING_PHASE,
  ANALYSIS_CRITERIA_PHASE,
  SCORING_PHASE,
  EVIDENCE_RULES,
  OUTPUT_FORMAT,
  CONSTRAINTS,
  ERROR_HANDLING,
} from "../base/index.js";

// Mode-specific modules
import {
  QUICK_MODE_RULES,
  QUICK_BEGIN_ANALYSIS,
  DEEP_MODE_RULES,
  DEEP_SECURITY_CATEGORY,
  DEEP_OUTPUT_FORMAT,
  DEEP_CONSTRAINTS,
  DEEP_FALLBACK,
  DEEP_BEGIN_ANALYSIS,
} from "../modes/index.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type AnalysisMode = "quick" | "deep";

export interface PromptComposerOptions {
  /** Analysis mode */
  mode: AnalysisMode;
  /** Additional rules to append */
  additionalRules?: string;
  /** Maximum file reads (overrides default) */
  maxFileReads?: number;
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED BASE PROMPT
// ════════════════════════════════════════════════════════════════════════════

const INTRO = `You are **Repo Check AI**, an expert-level GitHub repository health analyzer.`;

/**
 * Build the shared base prompt (common to all modes)
 */
function buildBasePrompt(): string {
  return [
    INTRO,
    "",
    SECURITY_DIRECTIVE,
    "",
    "---",
    "",
    EXPERTISE_PROFILE,
    "",
    "---",
    "",
    RECONNAISSANCE_PHASE,
    "",
    "---",
    "",
    LANGUAGE_DETECTION_PHASE,
    "",
    "---",
    "",
    STRATEGIC_READING_PHASE,
    "",
    "---",
    "",
    ANALYSIS_CRITERIA_PHASE,
    "",
    "---",
    "",
    SCORING_PHASE,
    "",
    "---",
    "",
    EVIDENCE_RULES,
    "",
    "---",
    "",
    OUTPUT_FORMAT,
    "",
    "---",
    "",
    CONSTRAINTS,
    "",
    "---",
    "",
    ERROR_HANDLING,
  ].join("\n");
}

// ════════════════════════════════════════════════════════════════════════════
// MODE-SPECIFIC SECTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Build quick analysis mode section
 */
function buildQuickModeSection(): string {
  return [
    "",
    "---",
    "",
    QUICK_MODE_RULES,
    "",
    "---",
    "",
    QUICK_BEGIN_ANALYSIS,
  ].join("\n");
}

/**
 * Build deep analysis mode section
 */
function buildDeepModeSection(): string {
  return [
    "",
    "---",
    "",
    DEEP_MODE_RULES,
    "",
    DEEP_SECURITY_CATEGORY,
    "",
    DEEP_OUTPUT_FORMAT,
    "",
    DEEP_CONSTRAINTS,
    "",
    DEEP_FALLBACK,
    "",
    "---",
    "",
    DEEP_BEGIN_ANALYSIS,
  ].join("\n");
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSED PROMPTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Pre-built Quick Analysis System Prompt
 * Optimized for governance-focused analysis (~350 lines)
 */
export const QUICK_SYSTEM_PROMPT = buildBasePrompt() + buildQuickModeSection();

/**
 * Pre-built Deep Analysis System Prompt
 * Includes code review instructions (~550 lines)
 */
export const DEEP_SYSTEM_PROMPT = buildBasePrompt() + buildDeepModeSection();

// ════════════════════════════════════════════════════════════════════════════
// DYNAMIC COMPOSER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Compose a system prompt dynamically based on options
 * Use this for custom modes or runtime modifications
 */
export function composeSystemPrompt(options: PromptComposerOptions): string {
  const { mode, additionalRules, maxFileReads } = options;

  // Start with base
  let prompt = buildBasePrompt();

  // Add mode-specific section
  if (mode === "deep") {
    prompt += buildDeepModeSection();
  } else {
    prompt += buildQuickModeSection();
  }

  // Apply custom modifications
  if (additionalRules) {
    prompt += `\n\n# ADDITIONAL RULES\n\n${additionalRules}`;
  }

  if (maxFileReads) {
    prompt = prompt.replace(
      /MAXIMUM 20 file reads/g,
      `MAXIMUM ${maxFileReads} file reads`
    );
    prompt = prompt.replace(
      /max 20 reads/g,
      `max ${maxFileReads} reads`
    );
  }

  return prompt;
}

/**
 * Get the appropriate system prompt for a mode
 * Uses pre-built prompts for performance
 */
export function getSystemPrompt(mode: AnalysisMode): string {
  return mode === "deep" ? DEEP_SYSTEM_PROMPT : QUICK_SYSTEM_PROMPT;
}

