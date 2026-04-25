/**
 * Tests for Application State
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { listCopilotSdkModels } from "../../../src/infrastructure/providers/copilotModels.js";
import {
  AppState,
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  MAX_HISTORY_SIZE,
  findModel,
  findModelByIndex,
  getAvailableModels,
  refreshAvailableModels,
  clearModelCache,
} from "../../../src/presentation/cli/state/appState.js";

vi.mock("../../../src/infrastructure/providers/copilotModels.js", () => ({
  listCopilotSdkModels: vi.fn(),
}));

beforeEach(() => {
  clearModelCache();
  vi.mocked(listCopilotSdkModels).mockResolvedValue(null);
});

describe("AppState", () => {
  let state: AppState;

  beforeEach(() => {
    state = new AppState();
  });

  describe("initial state", () => {
    it("should have default model as claude-sonnet-4", () => {
      expect(state.currentModel).toBe(DEFAULT_MODEL);
      expect(state.currentModel).toBe("claude-sonnet-4");
    });

    it("should have isPremium as true by default", () => {
      expect(state.isPremium).toBe(true);
    });

    it("should have empty history", () => {
      expect(state.history).toEqual([]);
    });

    it("should have null lastAnalysis", () => {
      expect(state.lastAnalysis).toBeNull();
    });

    it("should have isRunning as true", () => {
      expect(state.isRunning).toBe(true);
    });
  });

  describe("model management", () => {
    it("should update model correctly", () => {
      state.setModel("gpt-4o", false);
      expect(state.currentModel).toBe("gpt-4o");
      expect(state.isPremium).toBe(false);
    });

    it("should track premium status", () => {
      state.setModel("claude-opus-4.7", true);
      expect(state.isPremium).toBe(true);
    });
  });

  describe("analysis history", () => {
    it("should add analysis to history", () => {
      state.addToHistory({
        repo: "vercel/next.js",
        score: 85,
        date: "2024-01-01",
        findings: 5,
        result: null,
      });
      expect(state.history).toHaveLength(1);
      expect(state.history[0]?.repo).toBe("vercel/next.js");
    });

    it("should limit history to MAX_HISTORY_SIZE entries", () => {
      for (let i = 0; i < MAX_HISTORY_SIZE + 5; i++) {
        state.addToHistory({
          repo: `owner/repo-${i}`,
          score: 80,
          date: new Date().toISOString(),
          findings: 0,
          result: null,
        });
      }
      expect(state.history).toHaveLength(MAX_HISTORY_SIZE);
    });

    it("should add new entries at the beginning", () => {
      state.addToHistory({ repo: "first", score: 0, date: "", findings: 0, result: null });
      state.addToHistory({ repo: "second", score: 0, date: "", findings: 0, result: null });
      expect(state.history[0]?.repo).toBe("second");
    });
  });

  describe("state reset", () => {
    it("should reset to initial state", () => {
      state.setModel("gpt-4o", false);
      state.addToHistory({ repo: "test", score: 0, date: "", findings: 0, result: null });
      state.setRunning(false);

      state.reset();

      expect(state.currentModel).toBe(DEFAULT_MODEL);
      expect(state.isPremium).toBe(true);
      expect(state.history).toEqual([]);
      expect(state.isRunning).toBe(true);
    });
  });
});

describe("findModel", () => {
  it("should find model by exact ID", () => {
    const model = findModel("gpt-4o");
    expect(model?.id).toBe("gpt-4o");
  });

  it("should include auto as a non-premium option", () => {
    const model = findModel("auto");
    expect(model?.id).toBe("auto");
    expect(model?.premium).toBe(false);
    expect(model?.isAuto).toBe(true);
  });

  it("should include gpt-5.5 as a premium model", () => {
    const model = findModel("gpt-5.5");
    expect(model?.id).toBe("gpt-5.5");
    expect(model?.premium).toBe(true);
  });

  it("should include claude-opus-4.7 as a premium model", () => {
    const model = findModel("claude-opus-4.7");
    expect(model?.id).toBe("claude-opus-4.7");
    expect(model?.premium).toBe(true);
  });

  it("should not include retired gpt-5.1 codex max", () => {
    const model = findModel("gpt-5.1-codex-max");
    expect(model).toBeUndefined();
  });

  it("should find model by partial name", () => {
    const model = findModel("sonnet");
    expect(model?.id).toBe("claude-sonnet-4");
  });

  it("should return undefined for unknown model", () => {
    const model = findModel("unknown-model");
    expect(model).toBeUndefined();
  });
});

describe("findModelByIndex", () => {
  it("should find model by 1-based index", () => {
    const model = findModelByIndex(1);
    expect(model).toBe(AVAILABLE_MODELS[0]);
  });

  it("should return undefined for out of range index", () => {
    expect(findModelByIndex(0)).toBeUndefined();
    expect(findModelByIndex(100)).toBeUndefined();
  });
});

describe("available models caching", () => {
  it("should return curated models immediately before refresh", () => {
    const models = getAvailableModels();
    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
    expect(models.some((model) => model.id === "auto")).toBe(true);
    expect(models.some((model) => model.id === "gpt-5.5")).toBe(true);
    expect(models.some((model) => model.id === "claude-opus-4.7")).toBe(true);
    expect(models.some((model) => model.id === "gpt-5.1")).toBe(false);
  });

  it("should cache the fallback result when runtime discovery fails", async () => {
    const firstCall = await refreshAvailableModels();
    const secondCall = await refreshAvailableModels();

    expect(secondCall).toBe(firstCall);
    expect(secondCall).toEqual(AVAILABLE_MODELS);
  });

  it("should merge runtime models with curated metadata", async () => {
    vi.mocked(listCopilotSdkModels).mockResolvedValue([
      { id: "auto", name: "Auto" },
      { id: "gpt-5.5", name: "GPT-5.5", billingMultiplier: 7.5 },
      { id: "claude-opus-4.7", name: "Claude Opus 4.7", billingMultiplier: 7.5 },
      { id: "custom-preview-model", name: "Custom Preview Model", billingMultiplier: 1 },
    ]);

    const models = await refreshAvailableModels();

    expect(models.map((model) => model.id)).toEqual([
      "auto",
      "claude-opus-4.7",
      "gpt-5.5",
      "custom-preview-model",
    ]);
    expect(models.find((model) => model.id === "gpt-5.5")?.planSummary).toBe("Pro+, Business, Enterprise");
    expect(models.find((model) => model.id === "claude-opus-4.7")?.note).toContain("Rolling out gradually");
    expect(models.find((model) => model.id === "custom-preview-model")?.planSummary).toContain("Availability depends");
  });

  it("should clear cache after clearModelCache is called", async () => {
    const firstCall = await refreshAvailableModels();
    clearModelCache();
    const secondCall = await refreshAvailableModels();

    expect(secondCall).toEqual(firstCall);
  });
});
