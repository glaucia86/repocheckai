import { describe, expect, it } from "vitest";
import { CURATED_COPILOT_MODELS } from "../../src/domain/shared/copilotModels.js";
import { DEFAULT_MODEL_OPTIONS } from "../../src/presentation/web/public/constants.ts";

describe("curated web model options", () => {
  it("includes auto as the recommended non-premium option", () => {
    const model = CURATED_COPILOT_MODELS.find((item) => item.id === "auto");
    expect(model).toBeDefined();
    expect(model?.premium).toBe(false);
    expect(model?.isAuto).toBe(true);
  });

  it("includes gpt-5.5 as premium", () => {
    const model = CURATED_COPILOT_MODELS.find((item) => item.id === "gpt-5.5");
    expect(model).toBeDefined();
    expect(model?.premium).toBe(true);
  });

  it("includes claude-opus-4.7 as the current top-tier opus option", () => {
    const model = CURATED_COPILOT_MODELS.find((item) => item.id === "claude-opus-4.7");
    expect(model).toBeDefined();
    expect(model?.premium).toBe(true);
  });

  it("does not include removed hardcoded preview models", () => {
    expect(CURATED_COPILOT_MODELS.some((item) => item.id === "gpt-5")).toBe(false);
    expect(CURATED_COPILOT_MODELS.some((item) => item.id === "gpt-5.1")).toBe(false);
    expect(CURATED_COPILOT_MODELS.some((item) => item.id === "gpt-5.1-codex")).toBe(false);
    expect(CURATED_COPILOT_MODELS.some((item) => item.id === "gpt-5.1-codex-max")).toBe(false);
    expect(CURATED_COPILOT_MODELS.some((item) => item.id === "gemini-3-pro-preview")).toBe(false);
    expect(CURATED_COPILOT_MODELS.some((item) => item.id === "o3")).toBe(false);
  });

  it("keeps a non-empty browser fallback list for the inline selector", () => {
    expect(DEFAULT_MODEL_OPTIONS.length).toBeGreaterThan(0);
    expect(DEFAULT_MODEL_OPTIONS.some((item) => item.id === "auto")).toBe(true);
    expect(DEFAULT_MODEL_OPTIONS.some((item) => item.id === "gpt-5.5")).toBe(true);
    expect(DEFAULT_MODEL_OPTIONS.some((item) => item.id === "claude-opus-4.7")).toBe(true);
  });
});
