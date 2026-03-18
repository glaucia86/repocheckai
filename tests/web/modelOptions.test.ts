import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL_OPTIONS } from "../../src/presentation/web/public/constants.ts";

describe("web model options", () => {
  it("includes gpt-5.4 as premium", () => {
    const model = DEFAULT_MODEL_OPTIONS.find((item) => item.id === "gpt-5.4");
    expect(model).toBeDefined();
    expect(model?.premium).toBe(true);
  });
});
