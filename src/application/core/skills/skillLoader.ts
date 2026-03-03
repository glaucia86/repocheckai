import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AnalysisSkillDocument } from "../../../domain/types/analysisSkill.js";
import { parseSkillDocument } from "./skillFrontmatter.js";

const SKILL_EXTENSION = ".SKILL.md";
const BUNDLED_SKILLS_DIR = new URL("./bundled/", import.meta.url);

export function getBundledSkillsDirectory(): string {
  return fileURLToPath(BUNDLED_SKILLS_DIR);
}

export function loadBundledAnalysisSkills(): AnalysisSkillDocument[] {
  const directoryPath = getBundledSkillsDirectory();
  let fileNames: string[] = [];
  try {
    fileNames = readdirSync(directoryPath)
      .filter((file) => file.endsWith(SKILL_EXTENSION))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }

  const parsed = fileNames
    .map((fileName) => path.join(directoryPath, fileName))
    .map(readSkillFileSafely)
    .filter((entry): entry is AnalysisSkillDocument => Boolean(entry));

  return dedupeByName(parsed).sort((a, b) => b.meta.priority - a.meta.priority);
}

function readSkillFileSafely(filePath: string): AnalysisSkillDocument | null {
  try {
    const raw = readFileSync(filePath, "utf8");
    return parseSkillDocument(raw, filePath);
  } catch {
    return null;
  }
}

function dedupeByName(skills: AnalysisSkillDocument[]): AnalysisSkillDocument[] {
  const map = new Map<string, AnalysisSkillDocument>();
  for (const skill of skills) {
    if (!map.has(skill.meta.name)) {
      map.set(skill.meta.name, skill);
    }
  }
  return Array.from(map.values());
}
