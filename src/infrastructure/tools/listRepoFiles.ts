/**
 * list_repo_files tool
 * Single Responsibility: List repository file tree structure
 */

import { defineTool } from "@github/copilot-sdk";
import { z } from "zod";
import { createOctokit, parseRepoUrl } from "../providers/github.js";
import { isExcludedFromRepoFileListing } from "../../domain/config/repoPathFilters.js";

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const RepoInput = z.object({
  repoUrl: z
    .string()
    .describe("GitHub repository URL or slug"),
});

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface ListRepoFilesOptions {
  token?: string;
  maxFiles?: number;
}

const isBlobWithPath = (node: {
  type?: string;
  path?: string;
  size?: number | null;
}): node is { type: "blob"; path: string; size?: number | null } =>
  node.type === "blob" && typeof node.path === "string";

// ════════════════════════════════════════════════════════════════════════════
// TOOL FACTORY
// ════════════════════════════════════════════════════════════════════════════

export function createListRepoFiles(options: ListRepoFilesOptions = {}) {
  const { token, maxFiles: defaultMaxFiles = 800 } = options;

  return defineTool("list_repo_files", {
    description: `Lists repository file tree structure.
Returns array of file paths with sizes.
Use maxFiles to limit results (default based on options).
Automatically filters out common noise (node_modules, dist, .git, etc).`,
    parameters: {
      type: "object",
      properties: {
        repoUrl: {
          type: "string",
          description: "GitHub repository URL or slug",
        },
        maxFiles: {
          type: "number",
          description: "Maximum number of files to list",
        },
      },
      required: ["repoUrl"],
    },

    handler: async (args: { repoUrl: string; maxFiles?: number }) => {
      try {
        const { repoUrl } = RepoInput.parse({ repoUrl: args.repoUrl });
        const maxFilesLimit = Math.max(
          50,
          Math.min(args.maxFiles ?? defaultMaxFiles, 2000)
        );
        const { owner, repo } = parseRepoUrl(repoUrl);
        const octokit = createOctokit(token);

        // Get default branch
        const repoResp = await octokit.repos.get({ owner, repo });
        const branch = repoResp.data.default_branch;

        // Get tree
        const ref = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`,
        });
        const commitSha = ref.data.object.sha;

        const commit = await octokit.git.getCommit({
          owner,
          repo,
          commit_sha: commitSha,
        });
        const treeSha = commit.data.tree.sha;

        const tree = await octokit.git.getTree({
          owner,
          repo,
          tree_sha: treeSha,
          recursive: "true",
        });

        // Filter and process files
        const allFiles = (tree.data.tree || [])
          .filter(isBlobWithPath)
          .filter((n) => !isExcludedFromRepoFileListing(n.path));

        const files = allFiles
          .slice(0, maxFilesLimit)
          .map((n) => ({ path: n.path, size: n.size ?? null }));

        return {
          branch,
          totalUnfiltered: tree.data.tree?.length || 0,
          totalFiltered: allFiles.length,
          returned: files.length,
          truncated: allFiles.length > maxFilesLimit,
          files,
        };
      } catch (error: unknown) {
        const err = error as { status?: number };
        if (err.status === 404) {
          return {
            error: "Repository not found",
            status: 404,
          };
        }
        if (err.status === 403) {
          return {
            error: "Rate limited or access denied",
            status: 403,
            message: "Try using --token for higher rate limits.",
          };
        }
        throw error;
      }
    },
  });
}
