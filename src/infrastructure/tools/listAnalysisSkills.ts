import { defineTool } from "@github/copilot-sdk";
import { z } from "zod";
import type { AnalysisSkillDocument } from "../../domain/types/analysisSkill.js";
import { matchAnalysisSkills } from "../../application/core/skills/index.js";

const ListInput = z.object({
  mode: z.enum(["quick", "deep"]).default("quick"),
  detectedStacks: z.array(z.string()).optional(),
  repoType: z.string().optional(),
  complexity: z.string().optional(),
  maxResults: z.number().int().min(1).max(12).optional(),
});

export interface ListAnalysisSkillsOptions {
  skills: AnalysisSkillDocument[];
}

export function createListAnalysisSkills(options: ListAnalysisSkillsOptions) {
  const { skills } = options;

  return defineTool("list_analysis_skills", {
    description: `Lists available analysis skills filtered by detected stack and mode.
Use this after stack detection and before deep evidence analysis.`,
    parameters: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["quick", "deep"],
          description: "Current analysis mode.",
        },
        detectedStacks: {
          type: "array",
          items: { type: "string" },
          description: "Detected technologies, e.g. node, python, go.",
        },
        repoType: {
          type: "string",
          description: "Repository type hint (optional).",
        },
        complexity: {
          type: "string",
          description: "Complexity hint (optional).",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of skills to return (1-12).",
        },
      },
    },
    handler: async (args: z.infer<typeof ListInput>) => {
      const parsed = ListInput.parse(args);
      const matched = matchAnalysisSkills(
        skills,
        {
          mode: parsed.mode,
          detectedStacks: parsed.detectedStacks,
          repoType: parsed.repoType,
          complexity: parsed.complexity,
        },
        parsed.maxResults ?? 8
      );

      return {
        success: true,
        returned: matched.length,
        skills: matched.map((match) => ({
          name: match.skill.meta.name,
          title: match.skill.meta.title,
          description: match.skill.meta.description,
          category: match.skill.meta.category,
          appliesTo: match.skill.meta.appliesTo,
          modes: match.skill.meta.modes,
          priority: match.skill.meta.priority,
          matchReason: match.matchReason,
          score: match.score,
        })),
      };
    },
  });
}

