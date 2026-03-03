import type { ModelOption } from "./types.ts";
import { colorTokens } from "./design/tokens.ts";

const getApiBase = (): string => {
  const maybeWindow = globalThis as typeof globalThis & {
    __REPO_CHECK_AI_API_BASE__?: string;
    __REPO_DOCTOR_API_BASE__?: string;
  };
  return (
    maybeWindow.__REPO_CHECK_AI_API_BASE__ ??
    maybeWindow.__REPO_DOCTOR_API_BASE__ ??
    "http://localhost:3001"
  );
};

export const apiBase = getApiBase();

export const DEFAULT_MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-4o", name: "GPT-4o", premium: false },
  { id: "gpt-4.1", name: "GPT-4.1", premium: false },
  { id: "gpt-5-mini", name: "GPT-5 mini", premium: false },
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
  { id: "o3", name: "o3", premium: true },
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview", premium: true },
];

export const toneByState: Record<string, string> = {
  idle: "text-slate-700 bg-slate-100 border border-slate-200",
  running: "text-amber-900 bg-amber-100 border border-amber-200",
  completed: "text-emerald-900 bg-emerald-100 border border-emerald-200",
  cancelled: "text-slate-800 bg-slate-200 border border-slate-300",
  error: "text-rose-900 bg-rose-100 border border-rose-200",
};

export const cardClass = "glass spotlight-card rounded-3xl p-5 shadow-panel";
export const selectShellClass =
  "group relative overflow-hidden rounded-2xl border border-slate-300 bg-white/90 transition focus-within:border-cobalt focus-within:ring-2 focus-within:ring-cobalt/20";
export const selectClass =
  "w-full appearance-none bg-transparent px-3 py-2.5 pr-10 text-sm font-medium text-slate-800 outline-none";

export const semanticColors = colorTokens;
