import { describe, expect, it } from "vitest";
import {
  getBundledSkillsDirectory,
  loadBundledAnalysisSkills,
} from "../../../src/application/core/skills/index.js";

describe("skillLoader", () => {
  it("resolves bundled directory", () => {
    const dir = getBundledSkillsDirectory();
    expect(dir.toLowerCase()).toContain("skills");
  });

  it("loads bundled skills", () => {
    const skills = loadBundledAnalysisSkills();
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.some((s) => s.meta.name === "security-baseline")).toBe(true);
  });
});

