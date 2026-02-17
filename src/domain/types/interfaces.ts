/**
 * Shared interfaces and contracts for Repo Check AI
 * 
 * This module defines the core abstractions used throughout the application,
 * following the Dependency Inversion Principle (DIP).
 * 
 * @module types/interfaces
 */

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Analysis result returned by the Copilot agent
 */
export interface IAnalysisResult {
  readonly output: string;
  readonly toolCalls: number;
  readonly durationMs: number;
  readonly model: string;
}

/**
 * Options for running an analysis
 */
export interface IAnalysisOptions {
  repoUrl: string;
  token?: string;
  model?: string;
  maxFiles?: number;
  maxBytes?: number;
  timeout?: number;
  verbosity?: "quiet" | "normal" | "verbose";
  format?: "default" | "json";
  deep?: boolean;
}

/**
 * Service interface for repository analysis
 */
export interface IAnalysisService {
  analyze(options: IAnalysisOptions): Promise<IAnalysisResult>;
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export format options
 */
export type ExportFormat = "md" | "json";

/**
 * Result of an export operation
 */
export interface IExportResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * Service interface for exporting reports
 */
export interface IReportExporter {
  export(content: string, options: { path?: string; format?: ExportFormat }): Promise<IExportResult>;
}

// ════════════════════════════════════════════════════════════════════════════
// CLIPBOARD INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Result of a clipboard operation
 */
export interface IClipboardResult {
  success: boolean;
  error?: string;
}

/**
 * Service interface for clipboard operations
 */
export interface IClipboardService {
  copy(text: string): Promise<IClipboardResult>;
  isAvailable(): boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// TOOL INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generic tool handler interface
 */
export interface IToolHandler<TArgs, TResult> {
  readonly name: string;
  readonly description: string;
  handle(args: TArgs): Promise<TResult>;
}

/**
 * Tool factory options
 */
export interface IToolFactoryOptions {
  token?: string;
  maxFiles?: number;
  maxBytes?: number;
}

// ════════════════════════════════════════════════════════════════════════════
// SESSION INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Event callback for session events
 */
export type SessionEventCallback = (event: SessionEvent) => void;

/**
 * Session event types
 */
export interface SessionEvent {
  type: string;
  data?: unknown;
}

/**
 * Session state
 */
export interface ISessionState {
  readonly isActive: boolean;
  readonly model: string;
  readonly toolCalls: number;
}

// ════════════════════════════════════════════════════════════════════════════
// MODEL INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * AI Model definition
 */
export interface IModelDefinition {
  readonly id: string;
  readonly name: string;
  readonly premium: boolean;
}

/**
 * Model selection result
 */
export interface IModelSelection {
  model: IModelDefinition;
  isNew: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// HISTORY INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * History entry for past analyses
 */
export interface IHistoryEntry {
  readonly repo: string;
  readonly score: number;
  readonly date: string;
  readonly findings: number;
  readonly result: IAnalysisResult | null;
}

/**
 * History management interface
 */
export interface IHistoryManager {
  readonly entries: readonly IHistoryEntry[];
  add(entry: IHistoryEntry): void;
  getLast(): IHistoryEntry | null;
  clear(): void;
}

// ════════════════════════════════════════════════════════════════════════════
// UI INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Spinner control interface
 */
export interface ISpinner {
  start(text: string): void;
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  warn(text?: string): void;
  stop(): void;
}

/**
 * Message display interface
 */
export interface IMessageDisplay {
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
}

