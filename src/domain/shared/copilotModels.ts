export interface CopilotModelDefinition {
  id: string;
  name: string;
  premium: boolean;
  planSummary: string;
  note?: string;
  requestMultiplier?: number;
  isAuto?: boolean;
  aliases?: string[];
}

export const DEFAULT_COPILOT_MODEL_ID = "claude-sonnet-4";

export const CURATED_COPILOT_MODELS: CopilotModelDefinition[] = [
  {
    id: "auto",
    name: "Auto",
    premium: false,
    planSummary: "All Copilot plans",
    note: "Recommended. Copilot CLI auto model selection is GA and chooses the best currently available model.",
    isAuto: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    premium: false,
    planSummary: "All Copilot plans",
    requestMultiplier: 0,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    premium: false,
    planSummary: "All Copilot plans",
    requestMultiplier: 0,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 mini",
    premium: false,
    planSummary: "All Copilot plans",
    requestMultiplier: 0,
    aliases: ["gpt-5 mini"],
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    premium: true,
    planSummary: "Student, Pro, Pro+, Business, Enterprise",
    requestMultiplier: 1,
  },
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    premium: true,
    planSummary: "Student, Pro, Pro+, Business, Enterprise",
    requestMultiplier: 1,
  },
  {
    id: "claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    premium: true,
    planSummary: "Student, Pro, Pro+, Business, Enterprise",
    note: "Multiplier may change over time.",
    requestMultiplier: 1,
  },
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    requestMultiplier: 0.33,
  },
  {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    premium: true,
    planSummary: "Legacy premium model; do not expect access on Pro",
    note: "GitHub announced Opus removal from Pro on April 20, 2026, and retirement from Pro+ is in progress.",
    requestMultiplier: 3,
  },
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6",
    premium: true,
    planSummary: "Legacy premium model; do not expect access on Pro",
    note: "GitHub announced Opus removal from Pro on April 20, 2026, and retirement from Pro+ is in progress.",
    requestMultiplier: 3,
  },
  {
    id: "claude-opus-4.7",
    name: "Claude Opus 4.7",
    premium: true,
    planSummary: "Pro+, Business, Enterprise",
    note: "Rolling out gradually. Promotional 7.5x multiplier until April 30, 2026.",
    requestMultiplier: 7.5,
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    requestMultiplier: 1,
  },
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2-Codex",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    requestMultiplier: 1,
  },
  {
    id: "gpt-5.3-codex",
    name: "GPT-5.3-Codex",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    note: "Base model for Business and Enterprise since March 18, 2026.",
    requestMultiplier: 1,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    premium: true,
    planSummary: "Pro, Pro+, Business, Enterprise",
    requestMultiplier: 1,
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 mini",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    note: "GPT-5.4 mini uses a 0.33x multiplier. Student auto model selection support was announced on April 1, 2026.",
    requestMultiplier: 0.33,
    aliases: ["gpt-5.4 mini"],
  },
  {
    id: "gpt-5.4-nano",
    name: "GPT-5.4 nano",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    requestMultiplier: 0.25,
    aliases: ["gpt-5.4 nano"],
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    premium: true,
    planSummary: "Pro+, Business, Enterprise",
    note: "New on April 24, 2026. Rolling out gradually with a promotional 7.5x multiplier.",
    requestMultiplier: 7.5,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    requestMultiplier: 1,
    aliases: ["gemini 2.5 pro"],
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    requestMultiplier: 0.33,
    aliases: ["gemini 3 flash"],
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    premium: true,
    planSummary: "Student and paid Copilot plans; availability can depend on client and policy",
    requestMultiplier: 1,
    aliases: ["gemini 3.1 pro"],
  },
  {
    id: "grok-code-fast-1",
    name: "Grok Code Fast 1",
    premium: true,
    planSummary: "Availability varies by plan, client, and rollout",
    requestMultiplier: 0.25,
    aliases: ["grok code fast 1"],
  },
  {
    id: "raptor-mini",
    name: "Raptor mini",
    premium: true,
    planSummary: "Availability varies by plan, client, and rollout",
    note: "Public preview model with client-specific rollout.",
    requestMultiplier: 0,
    aliases: ["raptor mini"],
  },
  {
    id: "goldeneye",
    name: "Goldeneye",
    premium: true,
    planSummary: "Availability varies by plan, client, and rollout",
    note: "Experimental rollout model.",
  },
];

export const CORE_FREE_MODEL_IDS = new Set(["auto", "gpt-4o", "gpt-4.1", "gpt-5-mini"]);

export function normalizeCopilotModelId(value: string): string {
  return value.trim().toLowerCase();
}

export function getCuratedCopilotModels(): CopilotModelDefinition[] {
  return CURATED_COPILOT_MODELS.map((model) => ({ ...model }));
}

export function findCuratedCopilotModel(idOrName: string): CopilotModelDefinition | undefined {
  const normalized = normalizeCopilotModelId(idOrName);
  return CURATED_COPILOT_MODELS.find((model) => {
    if (normalizeCopilotModelId(model.id) === normalized) return true;
    if (normalizeCopilotModelId(model.name) === normalized) return true;
    return model.aliases?.some((alias) => normalizeCopilotModelId(alias) === normalized) ?? false;
  });
}
