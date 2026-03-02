import { describe, expect, it } from "vitest";
import type { AnalysisSkillDocument } from "../../../src/domain/types/analysisSkill.js";
import {
  matchAnalysisSkills,
  findAnalysisSkillByName,
  formatSkillsCatalogForPrompt,
} from "../../../src/application/core/skills/index.js";

const mockSkills: AnalysisSkillDocument[] = [
  {
    meta: {
      name: "security-baseline",
      title: "Security",
      description: "Security checks",
      category: "security",
      appliesTo: ["any"],
      modes: ["quick", "deep"],
      priority: 10,
    },
    body: "security body",
    sourcePath: "a.SKILL.md",
  },
  {
    meta: {
      name: "node-governance",
      title: "Node",
      description: "Node checks",
      category: "governance",
      appliesTo: ["node", "typescript"],
      modes: ["quick", "deep"],
      priority: 9,
    },
    body: "node body",
    sourcePath: "b.SKILL.md",
  },
];

describe("skillMatcher", () => {
  it("matches skills by mode and stack", () => {
    const result = matchAnalysisSkills(mockSkills, {
      mode: "quick",
      detectedStacks: ["node"],
    });

    expect(result[0]?.skill.meta.name).toBe("security-baseline");
    expect(result[1]?.skill.meta.name).toBe("node-governance");
    expect(result.some((r) => r.matchReason.includes("node"))).toBe(true);
  });

  it("finds skill by normalized name", () => {
    const skill = findAnalysisSkillByName(mockSkills, "NODE-GOVERNANCE");
    expect(skill?.meta.name).toBe("node-governance");
  });

  it("formats catalog for prompt", () => {
    const catalog = formatSkillsCatalogForPrompt(mockSkills, "quick");
    expect(catalog).toContain("ANALYSIS SKILLS CATALOG");
    expect(catalog).toContain("node-governance");
  });
});

