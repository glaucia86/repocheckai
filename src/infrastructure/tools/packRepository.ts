/**
 * pack_repository tool
 * Single Responsibility: Pack entire repository using Repomix for deep analysis
 */

import { defineTool } from "@github/copilot-sdk";
import {
  packRemoteRepository,
  getDefaultIncludePatterns,
  getDeepIncludePatterns,
  isRepomixAvailable,
  type PackErrorReason,
} from "../../application/core/repoPacker.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface PackRepositoryOptions {
  maxBytes?: number;
}

// ════════════════════════════════════════════════════════════════════════════
// ERROR SUGGESTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Maps structured error reasons to user-friendly suggestions.
 * Centralized here to keep suggestions consistent and easy to update.
 */
function getErrorSuggestion(reason: PackErrorReason): string {
  const suggestions: Record<PackErrorReason, string> = {
    TIMEOUT:
      "Repository too large or network too slow. Use standard file-by-file analysis instead.",
    REPO_NOT_FOUND:
      "Repository not found or is private. Check the URL and ensure you have access.",
    RATE_LIMITED:
      "GitHub rate limit hit. Wait a few minutes or use a token with higher limits.",
    CLONE_FAILED:
      "Failed to clone repository. Check network connection and repository accessibility.",
    NPX_NOT_FOUND:
      "npx command not found. Ensure Node.js >= 18 is installed and in PATH.",
    REPOMIX_NOT_AVAILABLE:
      "Repomix is not available. Ensure Node.js >= 18 and npx are working correctly. Fall back to standard file-by-file analysis.",
    EXECUTION_FAILED:
      "Repomix execution failed. Fall back to standard file-by-file analysis using read_repo_file.",
    EXCEPTION:
      "Repomix failed unexpectedly. Fall back to standard file-by-file analysis using read_repo_file.",
    UNKNOWN:
      "Repomix failed. Fall back to standard file-by-file analysis using read_repo_file.",
  };
  
  return suggestions[reason] || suggestions.UNKNOWN;
}

// ════════════════════════════════════════════════════════════════════════════
// TOOL FACTORY
// ════════════════════════════════════════════════════════════════════════════

export function createPackRepository(options: PackRepositoryOptions = {}) {
  const { maxBytes = 512000 } = options; // 500KB default for packed content

  return defineTool("pack_repository", {
    description: `Packs entire repository into a single consolidated text file using Repomix.
This is useful for deep analysis when you need to understand the full codebase.
WARNING: This is resource-intensive. Only use when:
- Standard file-by-file analysis is insufficient
- User explicitly requested deep/comprehensive analysis
- You need to understand code patterns across many files
Returns consolidated content with file markers and structure.`,
    parameters: {
      type: "object",
      properties: {
        repoUrl: {
          type: "string",
          description: "GitHub repository URL or owner/repo shorthand",
        },
        ref: {
          type: "string",
          description:
            "Branch, tag, or commit (optional, uses default branch if omitted)",
        },
        mode: {
          type: "string",
          enum: ["governance", "deep"],
          description:
            "Analysis mode: 'governance' for config/docs only, 'deep' for full source code",
        },
        compress: {
          type: "boolean",
          description:
            "Enable token compression for very large repos (default: false)",
        },
      },
      required: ["repoUrl"],
    },

    handler: async (args: {
      repoUrl: string;
      ref?: string;
      mode?: "governance" | "deep";
      compress?: boolean;
    }) => {
      const { repoUrl, ref, mode = "governance", compress = false } = args;

      try {
        // Pre-check: verify Repomix is available
        const repomixReady = isRepomixAvailable();
        if (!repomixReady) {
          const reason: PackErrorReason = "REPOMIX_NOT_AVAILABLE";
          return {
            success: false,
            error: "Repomix is not available. npx repomix --version failed.",
            reason,
            suggestion: getErrorSuggestion(reason),
          };
        }

        // Select include patterns based on mode
        const include =
          mode === "deep"
            ? getDeepIncludePatterns()
            : getDefaultIncludePatterns();

        const result = await packRemoteRepository({
          url: repoUrl,
          ref,
          include,
          compress,
          maxBytes,
          timeout: mode === "deep" ? 600000 : 300000, // Align with analysis defaults
        });

        if (!result.success) {
          // Use the structured error reason from PackResult
          // This avoids fragile string matching on error messages
          const reason = result.errorReason || "UNKNOWN";
          const suggestion = getErrorSuggestion(reason);

          return {
            success: false,
            error: result.error,
            reason,
            suggestion,
          };
        }

        return {
          success: true,
          mode,
          truncated: result.truncated,
          originalSize: result.originalSize,
          returnedSize: result.content?.length ?? 0,
          metadata: result.metadata,
          content: result.content,
          note: result.truncated
            ? "Content was truncated to fit context limits. Most important files are included based on patterns."
            : "Full repository content included.",
        };
      } catch (error: unknown) {
        const errorMsg = error instanceof Error
          ? error.message.slice(0, 500)
          : String(error).slice(0, 500);
        const reason: PackErrorReason = "EXCEPTION";
        return {
          success: false,
          error: errorMsg,
          reason,
          suggestion: getErrorSuggestion(reason),
        };
      }
    },
  });
}

