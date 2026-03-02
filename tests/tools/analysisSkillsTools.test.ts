import { describe, expect, it, vi } from "vitest";
import type { AnalysisSkillDocument } from "../../src/domain/types/analysisSkill.js";

vi.mock("@github/copilot-sdk", () => ({
  defineTool: (name: string, config: Record<string, unknown>) => ({ name, ...config }),
}));

import { createListAnalysisSkills } from "../../src/infrastructure/tools/listAnalysisSkills.js";
import { createReadAnalysisSkill } from "../../src/infrastructure/tools/readAnalysisSkill.js";

const skills: AnalysisSkillDocument[] = [
  {
    meta: {
      name: "security-baseline",
      title: "Security Baseline",
      description: "Security checks",
      category: "security",
      appliesTo: ["any"],
      modes: ["quick", "deep"],
      priority: 10,
    },
    body: "Body 1",
    sourcePath: "security.SKILL.md",
  },
  {
    meta: {
      name: "node-governance",
      title: "Node Governance",
      description: "Node checks",
      category: "governance",
      appliesTo: ["node"],
      modes: ["quick", "deep"],
      priority: 9,
    },
    body: "Body 2",
    sourcePath: "node.SKILL.md",
  },
];

describe("analysis skills tools", () => {
  it("lists skills", async () => {
    const tool = createListAnalysisSkills({ skills }) as unknown as {
      handler: (args: unknown) => Promise<{ success: boolean; returned: number }>;
    };

    const result = await tool.handler({
      mode: "quick",
      detectedStacks: ["node"],
    });

    expect(result.success).toBe(true);
    expect(result.returned).toBeGreaterThan(0);
  });

  it("reads a skill by name", async () => {
    const tool = createReadAnalysisSkill({ skills }) as unknown as {
      handler: (args: unknown) => Promise<{ success: boolean; skill?: { name: string } }>;
    };

    const result = await tool.handler({ name: "node-governance" });
    expect(result.success).toBe(true);
    expect(result.skill?.name).toBe("node-governance");
  });

  it("returns structured error for missing skill", async () => {
    const tool = createReadAnalysisSkill({ skills }) as unknown as {
      handler: (args: unknown) => Promise<{ success: boolean; reason?: string }>;
    };

    const result = await tool.handler({ name: "unknown-skill" });
    expect(result.success).toBe(false);
    expect(result.reason).toBe("SKILL_NOT_FOUND");
  });
});

