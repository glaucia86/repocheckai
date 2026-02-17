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

// ════════════════════════════════════════════════════════════════════════════
// TOOL OPTIONS
// ════════════════════════════════════════════════════════════════════════════

export interface RepoToolsOptions {
  token?: string;
  maxFiles?: number;
  maxBytes?: number;
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLS FACTORY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Creates the standard repository analysis tools.
 * These are lightweight tools that use the GitHub API.
 */
export function repoTools(options: RepoToolsOptions = {}) {
  const { token, maxFiles = 800, maxBytes = 204800 } = options;

  return [
    createGetRepoMeta({ token }),
    createListRepoFiles({ token, maxFiles }),
    createReadRepoFile({ token, maxBytes }),
  ];
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

