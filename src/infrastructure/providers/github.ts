/**
 * GitHub API provider for RepoCheckAI
 * Handles authentication and API client creation
 */

import { Octokit } from "@octokit/rest";
import { execSync } from "node:child_process";

// ════════════════════════════════════════════════════════════════════════════
// TOKEN RESOLUTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get GitHub token from various sources
 * Priority: explicit token > GITHUB_TOKEN env > gh CLI auth
 */
function getToken(explicitToken?: string): string | undefined {
  // 1. Explicit token passed as parameter
  if (explicitToken?.trim()) {
    return explicitToken.trim();
  }

  // 2. Environment variable
  const envToken = process.env.GITHUB_TOKEN?.trim();
  if (envToken) {
    return envToken;
  }

  // 3. Try gh CLI
  try {
    const token = execSync("gh auth token", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return token || undefined;
  } catch {
    return undefined;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// OCTOKIT FACTORY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create an Octokit instance with optional authentication
 */
export function createOctokit(explicitToken?: string): Octokit {
  const token = getToken(explicitToken);
  const formatRateLimitMessage = (options: { method: string; url: string }): string =>
    `${options.method} ${options.url}`;
  
  return new Octokit({
    auth: token || undefined,
    userAgent: "repocheckai/2.5.0",
    // Add retry logic for rate limiting
    retry: {
      enabled: true,
      retries: 3,
    },
    throttle: {
      onRateLimit: (retryAfter: number, options: { method: string; url: string }) => {
        console.warn(
          `Rate limit hit for ${formatRateLimitMessage(options)}. Retrying after ${retryAfter}s`
        );
        return true; // Retry
      },
      onSecondaryRateLimit: (retryAfter: number, options: { method: string; url: string }) => {
        console.warn(
          `Secondary rate limit for ${formatRateLimitMessage(options)}. Retrying after ${retryAfter}s`
        );
        return true; // Retry
      },
    },
  });
}

/**
 * Check if we have authentication
 */
export function isAuthenticated(explicitToken?: string): boolean {
  return !!getToken(explicitToken);
}

// ════════════════════════════════════════════════════════════════════════════
// URL PARSING
// ════════════════════════════════════════════════════════════════════════════

/**
 * Parse repository URL into owner and repo
 * Supports: HTTPS URLs, SSH URLs, and owner/repo slugs
 */
export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const trimmed = repoUrl.trim();

  // Format: OWNER/REPO (slug)
  const shortMatch = trimmed.match(/^([\w-]+)\/([\w.-]+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1]!,
      repo: shortMatch[2]!.replace(/\.git$/i, ""),
    };
  }

  // Format: https://github.com/OWNER/REPO
  const httpsMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/i
  );
  if (httpsMatch) {
    return {
      owner: httpsMatch[1]!,
      repo: httpsMatch[2]!.replace(/\.git$/i, ""),
    };
  }

  // Format: git@github.com:OWNER/REPO.git
  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/]+)$/i);
  if (sshMatch) {
    return {
      owner: sshMatch[1]!,
      repo: sshMatch[2]!.replace(/\.git$/i, ""),
    };
  }

  throw new Error(`Invalid repository URL: ${repoUrl}`);
}
