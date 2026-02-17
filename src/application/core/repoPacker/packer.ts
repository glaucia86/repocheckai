/**
 * Repository Packer - Main Function
 * Single Responsibility: Pack a remote repository using Repomix
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

import type { PackOptions, PackResult } from "./types.js";
import {
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_EXCLUDE_PATTERNS,
} from "./patterns.js";
import { normalizeRepoUrl, buildRepomixArgs, executeRepomix } from "./executor.js";
import { cleanRepomixOutput, truncateContent, extractMetadata } from "./cleaner.js";
import { categorizeError, sanitizeError } from "./errors.js";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DEFAULT_MAX_BYTES = 500 * 1024; // 500KB
const DEFAULT_TIMEOUT = 120000; // 2 minutes

// ─────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────

/**
 * Packs a remote repository into a single text file using Repomix.
 *
 * @param options - Pack configuration
 * @returns Pack result with content or error
 */
export async function packRemoteRepository(
  options: PackOptions
): Promise<PackResult> {
  const {
    url,
    ref,
    include = DEFAULT_INCLUDE_PATTERNS,
    exclude = DEFAULT_EXCLUDE_PATTERNS,
    style = "plain",
    compress = false,
    maxBytes = DEFAULT_MAX_BYTES,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  // Normalize URL
  const repoUrl = normalizeRepoUrl(url, ref);

  // Create temp directory for output
  let tempDir: string | undefined;

  try {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repocheckai-pack-"));
    const outputPath = path.join(tempDir, "packed-repo.txt");

    // Build Repomix command
    const args = buildRepomixArgs({
      url: repoUrl,
      outputPath,
      include,
      exclude,
      style,
      compress,
    });

    // Execute Repomix
    await executeRepomix(args, timeout);

    // Read and process output
    const rawContent = await fs.readFile(outputPath, "utf-8");

    // Clean output first (remove debug messages, warnings, etc.)
    const content = cleanRepomixOutput(rawContent);
    const originalSize = Buffer.byteLength(content, "utf-8");
    const truncated = originalSize > maxBytes;

    // Extract metadata from Repomix output
    const metadata = extractMetadata(content);

    // Truncate if necessary (already cleaned)
    const finalContent = truncated ? truncateContent(content, maxBytes) : content;

    return {
      success: true,
      content: finalContent,
      truncated,
      originalSize,
      metadata,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Categorize the error at the source for reliable error handling
    const errorReason = categorizeError(message);

    return {
      success: false,
      truncated: false,
      originalSize: 0,
      error: sanitizeError(message),
      errorReason,
    };
  } finally {
    // Cleanup temp directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

