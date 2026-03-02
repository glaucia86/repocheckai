/**
 * Tools module - Repository analysis tools for Repo Check AI
 * 
 * This module provides factory functions for creating custom tools
 * that the Copilot agent uses to analyze GitHub repositories.
 * 
 * @module tools
 */

// ════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL TOOL EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export { createGetRepoMeta, type GetRepoMetaOptions } from "./getRepoMeta.js";
export { createListRepoFiles, type ListRepoFilesOptions } from "./listRepoFiles.js";
export { createReadRepoFile, type ReadRepoFileOptions } from "./readRepoFile.js";
export { createPackRepository, type PackRepositoryOptions } from "./packRepository.js";
export { createListAnalysisSkills, type ListAnalysisSkillsOptions } from "./listAnalysisSkills.js";
export { createReadAnalysisSkill, type ReadAnalysisSkillOptions } from "./readAnalysisSkill.js";
export type { AnalysisSkillDocument } from "../../domain/types/analysisSkill.js";

// ════════════════════════════════════════════════════════════════════════════
// COMBINED OPTIONS TYPE
// ════════════════════════════════════════════════════════════════════════════

export interface RepoToolsOptions {
  token?: string;
  maxFiles?: number;
  maxBytes?: number;
  analysisSkills?: import("../../domain/types/analysisSkill.js").AnalysisSkillDocument[];
  skillsEnabled?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (backward compatibility)
// ════════════════════════════════════════════════════════════════════════════

// Re-export factory functions from repoTools.ts for backward compatibility
export { repoTools, deepAnalysisTools } from "./repoTools.js";

