import { defineTool } from "@github/copilot-sdk";
import { z } from "zod";
import type { AnalysisSkillDocument } from "../../domain/types/analysisSkill.js";
import { findAnalysisSkillByName } from "../../application/core/skills/index.js";

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

const ReadInput = z.object({
  name: z
    .string()
    .min(2)
    .max(64)
    .describe("Skill name slug, e.g. security-baseline"),
});

export interface ReadAnalysisSkillOptions {
  skills: AnalysisSkillDocument[];
}

export function createReadAnalysisSkill(options: ReadAnalysisSkillOptions) {
  const { skills } = options;

  return defineTool("read_analysis_skill", {
    description: `Reads a specific analysis skill document by name.
Use after list_analysis_skills to get detailed checks and evidence rules.`,
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Skill slug name.",
        },
      },
      required: ["name"],
    },
    handler: (args: z.infer<typeof ReadInput>) => {
      const parsedResult = ReadInput.safeParse(args);
      if (!parsedResult.success) {
        return {
          success: false,
          reason: "INVALID_SKILL_NAME",
          error: "Skill name format is invalid.",
          suggestion: "Use the exact name returned by list_analysis_skills.",
        };
      }

      const parsed = parsedResult.data;
      const normalized = parsed.name.trim().toLowerCase();

      if (!NAME_PATTERN.test(normalized)) {
        return {
          success: false,
          reason: "INVALID_SKILL_NAME",
          error: "Skill name format is invalid.",
          suggestion: "Use the exact name returned by list_analysis_skills.",
        };
      }

      const skill = findAnalysisSkillByName(skills, normalized);
      if (!skill) {
        return {
          success: false,
          reason: "SKILL_NOT_FOUND",
          error: `Analysis skill "${normalized}" was not found.`,
          suggestion: "Call list_analysis_skills first and select one of the returned names.",
        };
      }

      return {
        success: true,
        skill: {
          name: skill.meta.name,
          title: skill.meta.title,
          description: skill.meta.description,
          category: skill.meta.category,
          appliesTo: skill.meta.appliesTo,
          modes: skill.meta.modes,
          priority: skill.meta.priority,
          body: skill.body,
        },
      };
    },
  });
}

