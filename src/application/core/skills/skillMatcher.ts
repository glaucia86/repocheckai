import type {
  AnalysisSkillDocument,
  AnalysisSkillMatch,
  AnalysisSkillMatchContext,
} from "../../../domain/types/analysisSkill.js";

const MAX_SKILL_RESULTS = 8;

export function matchAnalysisSkills(
  skills: AnalysisSkillDocument[],
  context: AnalysisSkillMatchContext,
  maxResults: number = MAX_SKILL_RESULTS
): AnalysisSkillMatch[] {
  const stacks = (context.detectedStacks || []).map((stack) => stack.toLowerCase());
  const normalizedMode = context.mode;

  const scored = skills
    .filter((skill) => skill.meta.modes.includes(normalizedMode))
    .map((skill) => {
      const matchedStacks = stacks.filter((stack) => skill.meta.appliesTo.includes(stack));
      const hasGeneric = skill.meta.appliesTo.includes("any");
      const stackScore = matchedStacks.length * 10;
      const genericScore = hasGeneric ? 2 : 0;
      const mismatchPenalty =
        stacks.length > 0 && matchedStacks.length === 0 && !hasGeneric ? -500 : 0;
      const score = skill.meta.priority * 100 + stackScore + genericScore + mismatchPenalty;

      const matchReason =
        matchedStacks.length > 0
          ? `matched stack: ${matchedStacks.join(", ")}`
          : hasGeneric
            ? "generic fallback"
            : "mode + priority match";

      return { skill, score, matchReason };
    })
    .sort((a, b) => b.score - a.score || a.skill.meta.name.localeCompare(b.skill.meta.name));

  return scored.slice(0, Math.max(1, maxResults));
}

export function findAnalysisSkillByName(
  skills: AnalysisSkillDocument[],
  name: string
): AnalysisSkillDocument | null {
  const normalized = name.trim().toLowerCase();
  return skills.find((skill) => skill.meta.name === normalized) ?? null;
}

export function formatSkillsCatalogForPrompt(
  skills: AnalysisSkillDocument[],
  mode: "quick" | "deep"
): string {
  if (skills.length === 0) {
    return "";
  }

  const lines = [
    "# ANALYSIS SKILLS CATALOG",
    "",
    "When stack-specific guidance is needed, use list_analysis_skills then read_analysis_skill.",
    "Apply only skills relevant to the detected stack and mode.",
    "",
  ];

  const visible = skills.filter((skill) => skill.meta.modes.includes(mode)).slice(0, 12);
  for (const skill of visible) {
    lines.push(
      `- ${skill.meta.name}: ${skill.meta.description} ` +
      `(applies_to: ${skill.meta.appliesTo.join(", ")}; modes: ${skill.meta.modes.join(", ")})`
    );
  }

  return lines.join("\n");
}

export function formatSelectedSkillsForPrompt(skills: AnalysisSkillDocument[]): string {
  if (skills.length === 0) {
    return "";
  }

  const lines = [
    "# PRESELECTED ANALYSIS SKILLS",
    "",
    "Use these skills as primary guidance in PHASE 4 and PHASE 5.",
    "",
  ];

  for (const skill of skills) {
    lines.push(`## Skill: ${skill.meta.name}`);
    lines.push(`Description: ${skill.meta.description}`);
    lines.push(skill.body.slice(0, 1800));
    lines.push("");
  }

  return lines.join("\n").trim();
}
