/**
 * Tests for Application State
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCopilotCliModels } from "../../../src/infrastructure/providers/copilotModels.js";
import {
  AppState,
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  MAX_HISTORY_SIZE,
  findModel,
  findModelByIndex,
  getAvailableModels,
  clearModelCache,
} from "../../../src/presentation/cli/state/appState.js";

vi.mock("../../../src/infrastructure/providers/copilotModels.js", () => ({
  getCopilotCliModels: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getCopilotCliModels).mockReturnValue(null);
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
      state.setModel("claude-opus-4.5", true);
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
      // Add more than max entries
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

  it("should include gpt-5.4 as a premium model", () => {
    const model = findModel("gpt-5.4");
    expect(model?.id).toBe("gpt-5.4");
    expect(model?.premium).toBe(true);
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

describe("getAvailableModels memoization", () => {
  beforeEach(() => {
    // Clear cache before each test to ensure isolation
    clearModelCache();
    vi.restoreAllMocks();
    vi.mocked(getCopilotCliModels).mockReturnValue(null);
  });

  it("should return models on first call", () => {
    const models = getAvailableModels();
    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models.some((model) => model.id === "gpt-5.4")).toBe(true);
  });

  it("should return the same cached result on subsequent calls", () => {
    const firstCall = getAvailableModels();
    const secondCall = getAvailableModels();
    const thirdCall = getAvailableModels();
    
    // Should return the exact same array reference (memoized)
    expect(secondCall).toBe(firstCall);
    expect(thirdCall).toBe(firstCall);
  });

  it("should refresh cache after clearModelCache is called", () => {
    const firstCall = getAvailableModels();
    clearModelCache();
    const secondCall = getAvailableModels();
    
    // After clearing cache, should get models again (could be same reference if fallback)
    expect(secondCall).toBeDefined();
    // Should have the same content
    expect(secondCall).toEqual(firstCall);
  });
});
