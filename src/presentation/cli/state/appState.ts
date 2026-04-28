/**
 * Application State Management
 * Single Responsibility: Manages global application state
 */

import type { AnalysisResult } from "../../../domain/types/schema.js";
import type { AnalysisOutput } from "../../../application/core/agent.js";
import {
  DEFAULT_COPILOT_MODEL_ID,
  CORE_FREE_MODEL_IDS,
  findCuratedCopilotModel,
  getCuratedCopilotModels,
  normalizeCopilotModelId,
  type CopilotModelDefinition,
} from "../../../domain/shared/copilotModels.js";
import { listCopilotSdkModels } from "../../../infrastructure/providers/copilotModels.js";

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
  planSummary: string;
  note?: string;
  requestMultiplier?: number;
  isAuto?: boolean;
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

function curatedToModelInfo(model: CopilotModelDefinition): ModelInfo {
  return {
    id: model.id,
    name: model.name,
    premium: model.premium,
    planSummary: model.planSummary,
    note: model.note,
    requestMultiplier: model.requestMultiplier,
    isAuto: model.isAuto,
  };
}

export const AVAILABLE_MODELS: ModelInfo[] = getCuratedCopilotModels().map(curatedToModelInfo);

export const DEFAULT_MODEL = DEFAULT_COPILOT_MODEL_ID;
export const MAX_HISTORY_SIZE = 10;

// ════════════════════════════════════════════════════════════════════════════
// DYNAMIC MODEL LIST
// ════════════════════════════════════════════════════════════════════════════

let cachedModels: ModelInfo[] | null = null;
let modelsPromise: Promise<ModelInfo[]> | null = null;

function titleCaseToken(token: string): string {
  const lower = token.toLowerCase();
  if (lower === "gpt") return "GPT";
  if (lower === "claude") return "Claude";
  if (lower === "gemini") return "Gemini";
  if (lower === "grok") return "Grok";
  if (lower === "code") return "Code";
  if (lower === "fast") return "Fast";
  if (lower === "mini") return "mini";
  if (lower === "nano") return "nano";
  if (lower === "codex") return "Codex";
  if (/^\d/.test(token) || token.includes(".")) return token;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function formatModelName(id: string): string {
  return id
    .split("-")
    .map(titleCaseToken)
    .join(" ");
}

function inferPremium(id: string, billingMultiplier?: number): boolean {
  if (CORE_FREE_MODEL_IDS.has(normalizeCopilotModelId(id))) {
    return false;
  }
  if (typeof billingMultiplier === "number") {
    return billingMultiplier > 0;
  }
  return true;
}

function inferPlanSummary(id: string, premium: boolean): string {
  const normalizedId = normalizeCopilotModelId(id);
  if (normalizedId === "auto") return "All Copilot plans";
  if (!premium) return "All Copilot plans";
  if (normalizedId === "gpt-5.5") return "Pro+, Business, Enterprise";
  if (normalizedId === "claude-opus-4.7") return "Pro+, Business, Enterprise";
  return "Availability depends on your Copilot plan, client, and policies";
}

function sortModels(models: ModelInfo[]): ModelInfo[] {
  const curatedOrder = new Map(
    AVAILABLE_MODELS.map((model, index) => [normalizeCopilotModelId(model.id), index])
  );

  return [...models].sort((left, right) => {
    const leftIndex = curatedOrder.get(normalizeCopilotModelId(left.id));
    const rightIndex = curatedOrder.get(normalizeCopilotModelId(right.id));

    if (typeof leftIndex === "number" && typeof rightIndex === "number") {
      return leftIndex - rightIndex;
    }
    if (typeof leftIndex === "number") return -1;
    if (typeof rightIndex === "number") return 1;
    return left.name.localeCompare(right.name);
  });
}

function mergeRuntimeModels(
  runtimeModels: Array<{ id: string; name: string; billingMultiplier?: number }>
): ModelInfo[] {
  const merged = runtimeModels.map((runtimeModel) => {
    const curated = findCuratedCopilotModel(runtimeModel.id) ?? findCuratedCopilotModel(runtimeModel.name);
    const premium = curated?.premium ?? inferPremium(runtimeModel.id, runtimeModel.billingMultiplier);
    const requestMultiplier = runtimeModel.billingMultiplier ?? curated?.requestMultiplier;

    return {
      id: runtimeModel.id,
      name: curated?.name ?? runtimeModel.name ?? formatModelName(runtimeModel.id),
      premium,
      planSummary: curated?.planSummary ?? inferPlanSummary(runtimeModel.id, premium),
      note: curated?.note,
      requestMultiplier,
      isAuto: curated?.isAuto ?? normalizeCopilotModelId(runtimeModel.id) === "auto",
    };
  });

  const deduped: ModelInfo[] = [];
  const seen = new Set<string>();
  for (const model of sortModels(merged)) {
    const normalizedId = normalizeCopilotModelId(model.id);
    if (seen.has(normalizedId)) continue;
    seen.add(normalizedId);
    deduped.push(model);
  }
  return deduped;
}

/**
 * Return the best available model list without awaiting runtime discovery.
 * Falls back to the curated catalog until refreshAvailableModels() succeeds.
 */
export function getAvailableModels(): ModelInfo[] {
  return cachedModels ?? AVAILABLE_MODELS;
}

/**
 * Refresh available models from the Copilot SDK runtime.
 * Falls back silently to the curated catalog if runtime discovery fails.
 */
export async function refreshAvailableModels(): Promise<ModelInfo[]> {
  if (cachedModels !== null) {
    return cachedModels;
  }

  if (modelsPromise) {
    return modelsPromise;
  }

  modelsPromise = (async () => {
    const runtimeModels = await listCopilotSdkModels();
    cachedModels =
      runtimeModels && runtimeModels.length > 0
        ? mergeRuntimeModels(runtimeModels)
        : AVAILABLE_MODELS;
    return cachedModels;
  })();

  try {
    return await modelsPromise;
  } finally {
    modelsPromise = null;
  }
}

/**
 * Clear the cached model list (useful for testing or forced refresh).
 */
export function clearModelCache(): void {
  cachedModels = null;
  modelsPromise = null;
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
    return [...this._history];
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

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

  const exactMatch = models.find((model) => model.id.toLowerCase() === normalizedQuery);
  if (exactMatch) return exactMatch;

  return models.find(
    (model) =>
      model.name.toLowerCase().includes(normalizedQuery) ||
      model.planSummary.toLowerCase().includes(normalizedQuery)
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
