/**
 * CLI module exports
 * Re-exports for backward compatibility
 */

export { resolveCommandPolicy, type CommandResolution } from "../../domain/config/commandPolicy.js";

// State management
export {
  appState,
  AppState,
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  findModel,
  findModelByIndex,
  type IAppState,
  type HistoryEntry,
  type ModelInfo,
} from "./state/index.js";

// Parsers
export {
  parseRepoRef,
  buildRepoUrl,
  buildRepoSlug,
  validateRepoRef,
  extractReportOnly,
  removeDuplicateSections,
  generateCondensedSummary,
  type ParsedRepo,
} from "./parsers/index.js";

// Handlers
export {
  handleAnalyze,
  handleExport,
  handleCopy,
  handleModel,
  handleHistory,
  handleLast,
  handleClear,
  handleSummary,
  handleHelp,
  showPostAnalysisOptions,
} from "./handlers/index.js";
import { type CLIAnalyzeOptions } from "./types.js";

// Chat loop
export { runChatMode } from "./chatLoop.js";
export type { CLIAnalyzeOptions };
