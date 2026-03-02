/**
 * Repository analysis tools for Repo Check AI
 * Custom tools that the Copilot agent can use to analyze repositories
 * 
 * This file maintains backward compatibility while delegating to individual tool modules.
 */

import { createGetRepoMeta } from "./getRepoMeta.js";
import { createListRepoFiles } from "./listRepoFiles.js";
import { createReadRepoFile } from "./readRepoFile.js";
import { createPackRepository } from "./packRepository.js";
import { createListAnalysisSkills } from "./listAnalysisSkills.js";
import { createReadAnalysisSkill } from "./readAnalysisSkill.js";
import type { AnalysisSkillDocument } from "../../domain/types/analysisSkill.js";

// ════════════════════════════════════════════════════════════════════════════
// TOOL OPTIONS
// ════════════════════════════════════════════════════════════════════════════

export interface RepoToolsOptions {
  token?: string;
  maxFiles?: number;
  maxBytes?: number;
  analysisSkills?: AnalysisSkillDocument[];
  skillsEnabled?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLS FACTORY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Creates the standard repository analysis tools.
 * These are lightweight tools that use the GitHub API.
 */
export function repoTools(options: RepoToolsOptions = {}) {
  const { token, maxFiles = 800, maxBytes = 204800, analysisSkills = [], skillsEnabled = true } = options;

  const tools: Array<
    ReturnType<typeof createGetRepoMeta> |
    ReturnType<typeof createListRepoFiles> |
    ReturnType<typeof createReadRepoFile> |
    ReturnType<typeof createListAnalysisSkills> |
    ReturnType<typeof createReadAnalysisSkill>
  > = [
    createGetRepoMeta({ token }),
    createListRepoFiles({ token, maxFiles }),
    createReadRepoFile({ token, maxBytes }),
  ];

  if (skillsEnabled) {
    tools.push(
      createListAnalysisSkills({ skills: analysisSkills }),
      createReadAnalysisSkill({ skills: analysisSkills })
    );
  }

  return tools;
}

// ════════════════════════════════════════════════════════════════════════════
// DEEP ANALYSIS TOOLS (uses Repomix)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Returns tools for deep repository analysis using Repomix.
 * These are separate because they have higher resource usage.
 */
export function deepAnalysisTools(options: RepoToolsOptions = {}) {
  const { maxBytes = 512000 } = options; // 500KB default for packed content

  return [
    createPackRepository({ maxBytes }),
  ];
}

