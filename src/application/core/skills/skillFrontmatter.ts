import type {
  AnalysisSkillDocument,
  AnalysisSkillMeta,
  SkillAnalysisMode,
  SkillCategory,
} from "../../../domain/types/analysisSkill.js";

const REQUIRED_KEYS = [
  "name",
  "title",
  "description",
  "category",
  "applies_to",
  "modes",
  "priority",
] as const;

const ALLOWED_CATEGORIES: SkillCategory[] = [
  "governance",
  "security",
  "ci",
  "quality",
  "stack",
];

const ALLOWED_MODES: SkillAnalysisMode[] = ["quick", "deep"];
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export function parseSkillDocument(raw: string, sourcePath: string): AnalysisSkillDocument {
  const parts = splitFrontmatter(raw);
  const frontmatter = parseFrontmatter(parts.frontmatter, sourcePath);
  const meta = validateMeta(frontmatter, sourcePath);

  return {
    meta,
    body: parts.body.trim(),
    sourcePath,
  };
}

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("Missing frontmatter opening delimiter '---'.");
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex < 0) {
    throw new Error("Missing frontmatter closing delimiter '---'.");
  }

  return {
    frontmatter: normalized.slice(4, closingIndex).trim(),
    body: normalized.slice(closingIndex + 5),
  };
}

function parseFrontmatter(frontmatter: string, sourcePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = frontmatter.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf(":");
    if (separator < 1) {
      throw new Error(`Invalid frontmatter line in ${sourcePath}: "${line}"`);
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!key || !value) {
      throw new Error(`Invalid frontmatter key/value in ${sourcePath}: "${line}"`);
    }

    out[key] = value;
  }

  return out;
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function validateMeta(frontmatter: Record<string, string>, sourcePath: string): AnalysisSkillMeta {
  for (const key of REQUIRED_KEYS) {
    if (!frontmatter[key]) {
      throw new Error(`Missing required key "${key}" in ${sourcePath}`);
    }
  }

  const nameValue = frontmatter.name;
  const categoryValue = frontmatter.category;
  const appliesToValue = frontmatter.applies_to;
  const modesValue = frontmatter.modes;
  const priorityValue = frontmatter.priority;
  const titleValue = frontmatter.title;
  const descriptionValue = frontmatter.description;

  if (!nameValue || !categoryValue || !appliesToValue || !modesValue || !priorityValue || !titleValue || !descriptionValue) {
    throw new Error(`Incomplete frontmatter in ${sourcePath}`);
  }

  const name = nameValue.toLowerCase();
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`Invalid skill name "${nameValue}" in ${sourcePath}`);
  }

  const category = categoryValue.toLowerCase() as SkillCategory;
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category "${categoryValue}" in ${sourcePath}`);
  }

  const appliesTo = parseCsv(appliesToValue);
  if (appliesTo.length === 0) {
    throw new Error(`Field "applies_to" must include at least one value in ${sourcePath}`);
  }

  const modes = parseCsv(modesValue) as SkillAnalysisMode[];
  if (modes.length === 0 || modes.some((mode) => !ALLOWED_MODES.includes(mode))) {
    throw new Error(`Invalid modes "${modesValue}" in ${sourcePath}`);
  }

  const priority = Number.parseInt(priorityValue, 10);
  if (!Number.isFinite(priority)) {
    throw new Error(`Invalid priority "${priorityValue}" in ${sourcePath}`);
  }

  return {
    name,
    title: titleValue,
    description: descriptionValue,
    category,
    appliesTo,
    modes,
    priority,
  };
}
