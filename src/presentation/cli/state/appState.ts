/**
 * Application State Management
 * Single Responsibility: Manages global application state
 */

import type { AnalysisResult } from "../../../domain/types/schema.js";
import type { AnalysisOutput } from "../../../application/core/agent.js";
import { getCopilotCliModels } from "../../../infrastructure/providers/copilotModels.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface HistoryEntry {
  repo: string;
  score: number;
  date: string;
  findings: number;
  result: AnalysisResult | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  premium: boolean;
}

export interface IAppState {
  readonly currentModel: string;
  readonly isPremium: boolean;
  readonly lastResult: AnalysisResult | null;
  readonly lastAnalysis: AnalysisOutput | null;
  readonly lastRepo: string | null;
  readonly history: HistoryEntry[];
  readonly isRunning: boolean;

  setModel(modelId: string, isPremium: boolean): void;
  setLastAnalysis(analysis: AnalysisOutput, repo: string): void;
  setLastResult(result: AnalysisResult): void;
  addToHistory(entry: HistoryEntry): void;
  setRunning(running: boolean): void;
  reset(): void;
}

// ════════════════════════════════════════════════════════════════════════════
// AVAILABLE MODELS
// ════════════════════════════════════════════════════════════════════════════

export const AVAILABLE_MODELS: ModelInfo[] = [
  // Free models
  { id: "gpt-4o", name: "GPT-4o", premium: false },
  { id: "gpt-4.1", name: "GPT-4.1", premium: false },
  { id: "gpt-5-mini", name: "GPT-5 mini", premium: false },
  // Premium models
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", premium: true },
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", premium: true },
  { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", premium: true },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", premium: true },
  { id: "claude-opus-4.5", name: "Claude Opus 4.5 (Rate Limit: 3x)", premium: true },
  { id: "gpt-5", name: "GPT-5 (Preview)", premium: true },
  { id: "gpt-5.1", name: "GPT-5.1 (Preview)", premium: true },
  { id: "gpt-5.2", name: "GPT-5.2 (Preview)", premium: true },
  { id: "gpt-5.1-codex", name: "GPT-5.1-Codex", premium: true },
  { id: "gpt-5.2-codex", name: "GPT-5.2-Codex", premium: true },
  { id: "gpt-5.3-codex", name: "GPT-5.3-Codex", premium: true },
  { id: "gpt-5.1-codex-max", name: "GPT-5.1-Codex-Max", premium: true },
  { id: "gpt-5.1-codex-mini", name: "GPT-5.1-Codex-Mini", premium: true },
  { id: "o3", name: "o3 (Reasoning)", premium: true },
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview", premium: true },
];

export const DEFAULT_MODEL = "claude-sonnet-4";
export const MAX_HISTORY_SIZE = 10;

// ════════════════════════════════════════════════════════════════════════════
// DYNAMIC MODEL LIST
// ════════════════════════════════════════════════════════════════════════════

// Cache for memoized model list (process lifetime)
let cachedModels: ModelInfo[] | null = null;

/**
 * Try to read available models from GitHub Copilot CLI.
 * Falls back to the static list when unavailable.
 * 
 * Memoized for process lifetime to avoid repeated shell-outs.
 */
export function getAvailableModels(): ModelInfo[] {
  // Return cached result if available
  if (cachedModels !== null) {
    return cachedModels;
  }

  try {
    const models = getCopilotCliModels();
    if (models && models.length > 0) {
      const premiumMap = new Map(AVAILABLE_MODELS.map((model) => [model.id.toLowerCase(), model.premium]));
        const mapped = models.map((model) => {
          // Try exact id match first (case-insensitive)
          const idKey = model.id.toLowerCase();
          const mId = model.id.toLowerCase();
          const mName = model.name.toLowerCase();

          // Attempt tolerant matching against AVAILABLE_MODELS
          let alt: ModelInfo | undefined;
          const exactAlt = AVAILABLE_MODELS.find((a) => a.id.toLowerCase() === mId);
          if (exactAlt) {
            alt = exactAlt;
          } else {
            alt = AVAILABLE_MODELS.find((a) => {
              const aId = a.id.toLowerCase();
              const aName = a.name.toLowerCase();
              return (
                mId.startsWith(aId) ||
                aId.startsWith(mId) ||
                aName === mName ||
                aName.includes(mName) ||
                mName.includes(aName)
              );
            });
          }

          // Determine premium: prefer exact id match from the map, then alt, then default to premium
          let premium = true;
          if (exactAlt) {
            premium = exactAlt.premium;
          } else if (premiumMap.has(idKey)) {
            premium = premiumMap.get(idKey)!;
          }

          return {
            id: model.id,
            // Use the static AVAILABLE_MODELS name when we have a mapping (preserves rate notes)
            name: alt ? alt.name : model.name,
            premium: Boolean(premium),
          };
        });

        // Deduplicate by id (case-insensitive), preserving order and merging premium flags.
        const result: ModelInfo[] = [];
        const seenById = new Map<string, ModelInfo>();
        for (const m of mapped) {
          const idKey = m.id.toLowerCase();
          if (!seenById.has(idKey)) {
            const copy = { ...m };
            seenById.set(idKey, copy);
            result.push(copy);
          } else {
            const existing = seenById.get(idKey)!;
            if (!existing.premium && m.premium) existing.premium = true;
          }
        }

        // Add any models from AVAILABLE_MODELS that are not in the CLI list
        for (const staticModel of AVAILABLE_MODELS) {
          const idKey = staticModel.id.toLowerCase();
          if (!seenById.has(idKey)) {
            result.push(staticModel);
          }
        }

        // Cache and return the result
        cachedModels = result;
        return result;
    }
  } catch {
    // ignore and fall back
  }

  // Cache and return the static list
  cachedModels = AVAILABLE_MODELS;
  return AVAILABLE_MODELS;
}

/**
 * Clear the cached model list (useful for testing or forced refresh).
 */
export function clearModelCache(): void {
  cachedModels = null;
}

// ════════════════════════════════════════════════════════════════════════════
// APP STATE CLASS
// ════════════════════════════════════════════════════════════════════════════

export class AppState implements IAppState {
  private _currentModel: string = DEFAULT_MODEL;
  private _isPremium: boolean = true;
  private _lastResult: AnalysisResult | null = null;
  private _lastAnalysis: AnalysisOutput | null = null;
  private _lastRepo: string | null = null;
  private _history: HistoryEntry[] = [];
  private _isRunning: boolean = true;

  // Getters (readonly access)
  get currentModel(): string {
    return this._currentModel;
  }

  get isPremium(): boolean {
    return this._isPremium;
  }

  get lastResult(): AnalysisResult | null {
    return this._lastResult;
  }

  get lastAnalysis(): AnalysisOutput | null {
    return this._lastAnalysis;
  }

  get lastRepo(): string | null {
    return this._lastRepo;
  }

  get history(): HistoryEntry[] {
    return [...this._history]; // Return copy to prevent mutation
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  // Mutations
  setModel(modelId: string, isPremium: boolean): void {
    this._currentModel = modelId;
    this._isPremium = isPremium;
  }

  setLastAnalysis(analysis: AnalysisOutput, repo: string): void {
    this._lastAnalysis = analysis;
    this._lastRepo = repo;
  }

  setLastResult(result: AnalysisResult): void {
    this._lastResult = result;
  }

  addToHistory(entry: HistoryEntry): void {
    this._history.unshift(entry);
    // Keep only last N entries
    if (this._history.length > MAX_HISTORY_SIZE) {
      this._history.pop();
    }
  }

  setRunning(running: boolean): void {
    this._isRunning = running;
  }

  reset(): void {
    this._currentModel = DEFAULT_MODEL;
    this._isPremium = true;
    this._lastResult = null;
    this._lastAnalysis = null;
    this._lastRepo = null;
    this._history = [];
    this._isRunning = true;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE (for backward compatibility)
// ════════════════════════════════════════════════════════════════════════════

export const appState = new AppState();

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Find a model by ID or name
 */
export function findModel(query: string, models: ModelInfo[] = getAvailableModels()): ModelInfo | undefined {
  const normalizedQuery = query.toLowerCase();
  
  // Try exact ID match first
  const exactMatch = models.find(
    m => m.id.toLowerCase() === normalizedQuery
  );
  if (exactMatch) return exactMatch;
  
  // Try partial name match
  return models.find(
    m => m.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Find a model by index (1-based for user display)
 */
export function findModelByIndex(index: number, models: ModelInfo[] = getAvailableModels()): ModelInfo | undefined {
  if (index >= 1 && index <= models.length) {
    return models[index - 1];
  }
  return undefined;
}



