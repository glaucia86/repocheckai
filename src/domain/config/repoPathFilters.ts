/**
 * Shared repository path filtering rules.
 * Keep these aligned with list_repo_files so downstream checks can avoid false positives.
 */

export const REPO_FILE_NOISE_SEGMENTS = [
  "node_modules/",
  "dist/",
  ".git/",
  "vendor/",
  "__pycache__/",
  ".next/",
  "coverage/",
];

export const REPO_FILE_NOISE_PATTERNS = [
  /\.(min|bundle)\.(js|css)$/,
  /\.lock$/,
];

export const REPO_LOCK_FILE_NAMES = [
  "package-lock.json",
  "yarn.lock",
];

export function normalizeRepoPath(path: string): string {
  return path.trim().replace(/\\/g, "/").toLowerCase();
}

export function isExcludedFromRepoFileListing(path: string): boolean {
  const normalized = normalizeRepoPath(path);
  if (!normalized) {
    return false;
  }

  if (REPO_FILE_NOISE_SEGMENTS.some((segment) => normalized.includes(segment))) {
    return true;
  }

  if (REPO_FILE_NOISE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (REPO_LOCK_FILE_NAMES.some((lockFile) => normalized.endsWith(lockFile))) {
    return true;
  }

  return false;
}