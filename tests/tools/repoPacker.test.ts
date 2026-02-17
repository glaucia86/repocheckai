/**
 * Unit Tests for repoPacker
 *
 * Tests the Repomix integration with mocked cross-spawn and fs.
 * These tests run fast and don't require network access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as childProcess from "child_process";
import crossSpawn from "cross-spawn";
import * as fs from "fs/promises";
import { EventEmitter } from "events";

// Mock child_process (for execSync used in isRepomixAvailable), cross-spawn and fs before importing the module
vi.mock("child_process");
vi.mock("cross-spawn");
vi.mock("fs/promises");

// Import after mocking
import {
  packRemoteRepository,
  isRepomixAvailable,
  clearRepomixAvailabilityCache,
  getDefaultIncludePatterns,
  getDeepIncludePatterns,
} from "../../src/application/core/repoPacker.js";

// ════════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Creates a mock child process that emits events
 */
function createMockChildProcess(exitCode: number = 0, stderr: string = "") {
  const emitter = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: () => void;
  };
  emitter.stdout = new EventEmitter();
  emitter.stderr = new EventEmitter();
  emitter.kill = vi.fn();

  // Schedule events to fire after spawn is called
  setTimeout(() => {
    if (stderr) {
      emitter.stderr.emit("data", Buffer.from(stderr));
    }
    emitter.emit("close", exitCode);
    emitter.emit("exit", exitCode);
  }, 10);

  return emitter;
}

/**
 * Sample Repomix output content
 */
const SAMPLE_REPOMIX_OUTPUT = `This file is a merged representation of a subset of the codebase.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the repository.

================================================================
Repository Structure
================================================================

src/
├── index.ts
└── types.ts

================================================================
Files
================================================================

================
File: src/index.ts
================
console.log("Hello World");

================
File: src/types.ts
================
export interface User {
  name: string;
}
`;

// ════════════════════════════════════════════════════════════════════════════
// TESTS: isRepomixAvailable
// ════════════════════════════════════════════════════════════════════════════

describe("isRepomixAvailable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the availability cache before each test to ensure isolation
    clearRepomixAvailabilityCache();
  });

  it("should return true when npx repomix --version succeeds", () => {
    vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from("1.11.1"));

    const result = isRepomixAvailable();

    expect(result).toBe(true);
    expect(childProcess.execSync).toHaveBeenCalledWith(
      "npx repomix --version",
      expect.objectContaining({ timeout: 30000 })
    );
  });

  it("should return false when npx repomix --version fails", () => {
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      throw new Error("Command not found");
    });

    const result = isRepomixAvailable();

    expect(result).toBe(false);
  });

  it("should return false when execSync throws ETIMEDOUT error", () => {
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      const error = new Error("ETIMEDOUT") as Error & { code: string };
      error.code = "ETIMEDOUT";
      throw error;
    });

    const result = isRepomixAvailable();

    expect(result).toBe(false);
  });

  it("should cache the result after first call", () => {
    vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from("1.11.1"));

    // First call - should execute the check
    isRepomixAvailable();
    expect(childProcess.execSync).toHaveBeenCalledTimes(1);

    // Second call - should use cached result
    isRepomixAvailable();
    expect(childProcess.execSync).toHaveBeenCalledTimes(1); // Still 1
  });

  it("should bypass cache when forceRefresh is true", () => {
    vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from("1.11.1"));

    // First call
    isRepomixAvailable();
    expect(childProcess.execSync).toHaveBeenCalledTimes(1);

    // Force refresh
    isRepomixAvailable(true);
    expect(childProcess.execSync).toHaveBeenCalledTimes(2);
  });

  it("should update cached result on forceRefresh", () => {
    // First call succeeds
    vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from("1.11.1"));
    const result1 = isRepomixAvailable();
    expect(result1).toBe(true);

    // Now make it fail and force refresh
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      throw new Error("Command not found");
    });
    const result2 = isRepomixAvailable(true);
    expect(result2).toBe(false);

    // Subsequent call should use the new cached value (false)
    const result3 = isRepomixAvailable();
    expect(result3).toBe(false);
    expect(childProcess.execSync).toHaveBeenCalledTimes(2); // Only 2 actual calls
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TESTS: getDefaultIncludePatterns / getDeepIncludePatterns
// ════════════════════════════════════════════════════════════════════════════

describe("Include Patterns", () => {
  describe("getDefaultIncludePatterns", () => {
    it("should return an array of patterns", () => {
      const patterns = getDefaultIncludePatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it("should include essential governance files", () => {
      const patterns = getDefaultIncludePatterns();

      expect(patterns).toContain("README*");
      expect(patterns).toContain("LICENSE*");
      expect(patterns).toContain("CONTRIBUTING*");
      expect(patterns).toContain("SECURITY*");
    });

    it("should include GitHub config", () => {
      const patterns = getDefaultIncludePatterns();

      expect(patterns).toContain(".github/**");
    });

    it("should include package.json", () => {
      const patterns = getDefaultIncludePatterns();

      expect(patterns).toContain("package.json");
    });

    it("should return a copy (not the original array)", () => {
      const patterns1 = getDefaultIncludePatterns();
      const patterns2 = getDefaultIncludePatterns();

      patterns1.push("test-modification");

      expect(patterns2).not.toContain("test-modification");
    });
  });

  describe("getDeepIncludePatterns", () => {
    it("should include all default patterns", () => {
      const defaultPatterns = getDefaultIncludePatterns();
      const deepPatterns = getDeepIncludePatterns();

      for (const pattern of defaultPatterns) {
        expect(deepPatterns).toContain(pattern);
      }
    });

    it("should include source code directories", () => {
      const patterns = getDeepIncludePatterns();

      expect(patterns).toContain("src/**");
      expect(patterns).toContain("lib/**");
      expect(patterns).toContain("app/**");
    });

    it("should include test directories", () => {
      const patterns = getDeepIncludePatterns();

      expect(patterns).toContain("test/**");
      expect(patterns).toContain("tests/**");
      expect(patterns).toContain("__tests__/**");
    });

    it("should have more patterns than default", () => {
      const defaultPatterns = getDefaultIncludePatterns();
      const deepPatterns = getDeepIncludePatterns();

      expect(deepPatterns.length).toBeGreaterThan(defaultPatterns.length);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TESTS: packRemoteRepository
// ════════════════════════════════════════════════════════════════════════════

describe("packRemoteRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fs.mkdtemp to return a temp directory
    vi.mocked(fs.mkdtemp).mockResolvedValue("/tmp/repocheckai-pack-abc123");

    // Mock fs.rm to succeed silently
    vi.mocked(fs.rm).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful packing", () => {
    beforeEach(() => {
      // Mock successful repomix execution
      vi.mocked(crossSpawn).mockReturnValue(
        createMockChildProcess(0) as any
      );

      // Mock reading the output file
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_REPOMIX_OUTPUT);
    });

    it("should return success with content", async () => {
      const result = await packRemoteRepository({
        url: "owner/repo",
        maxBytes: 500000,
        timeout: 10000,
      });

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("File Summary");
      expect(result.error).toBeUndefined();
    });

    it("should use cross-spawn for Windows compatibility", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(crossSpawn).toHaveBeenCalled();
      const spawnCall = vi.mocked(crossSpawn).mock.calls[0];
      // cross-spawn is called with (command, args, options)
      expect(spawnCall[0]).toBe("npx");
    });

    it("should normalize owner/repo to full URL", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(crossSpawn).toHaveBeenCalled();
      const spawnCall = vi.mocked(crossSpawn).mock.calls[0];
      // With cross-spawn, spawn receives (executable, args, options)
      const args = spawnCall[1] as string[];

      expect(args.join(" ")).toContain("https://github.com/owner/repo");
    });

    it("should append ref to URL when provided", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        ref: "develop",
        timeout: 10000,
      });

      const spawnCall = vi.mocked(crossSpawn).mock.calls[0];
      const args = spawnCall[1] as string[];

      expect(args.join(" ")).toContain("https://github.com/owner/repo/tree/develop");
    });

    it("should include patterns in command", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        include: ["src/**", "README.md"],
        timeout: 10000,
      });

      const spawnCall = vi.mocked(crossSpawn).mock.calls[0];
      const args = spawnCall[1] as string[];

      expect(args).toContain("--include");
      expect(args.join(" ")).toContain("src/**");
    });

    it("should use plain style by default", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      const spawnCall = vi.mocked(crossSpawn).mock.calls[0];
      const args = spawnCall[1] as string[];

      expect(args).toContain("--style");
      expect(args).toContain("plain");
    });

    it("should pass --no-security-check flag", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      const spawnCall = vi.mocked(crossSpawn).mock.calls[0];
      const args = spawnCall[1] as string[];

      expect(args).toContain("--no-security-check");
    });

    it("should pass --compress flag when enabled", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        compress: true,
        timeout: 10000,
      });

      const spawnCall = vi.mocked(crossSpawn).mock.calls[0];
      const args = spawnCall[1] as string[];

      expect(args).toContain("--compress");
    });

    it("should clean temp directory after success", async () => {
      await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(fs.rm).toHaveBeenCalledWith(
        "/tmp/repocheckai-pack-abc123",
        expect.objectContaining({ recursive: true, force: true })
      );
    });

    it("should report originalSize correctly", async () => {
      const result = await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(result.originalSize).toBe(
        Buffer.byteLength(SAMPLE_REPOMIX_OUTPUT, "utf-8")
      );
    });

    it("should not truncate when content is under maxBytes", async () => {
      const result = await packRemoteRepository({
        url: "owner/repo",
        maxBytes: 500000, // Much larger than sample
        timeout: 10000,
      });

      expect(result.truncated).toBe(false);
    });
  });

  describe("truncation", () => {
    beforeEach(() => {
      // Mock successful repomix execution
      vi.mocked(crossSpawn).mockReturnValue(
        createMockChildProcess(0) as any
      );

      // Mock large content that exceeds maxBytes
      const largeContent = "X".repeat(10000);
      vi.mocked(fs.readFile).mockResolvedValue(largeContent);
    });

    it("should truncate when content exceeds maxBytes", async () => {
      const result = await packRemoteRepository({
        url: "owner/repo",
        maxBytes: 1000, // Small limit
        timeout: 10000,
      });

      expect(result.truncated).toBe(true);
      expect(result.content!.length).toBeLessThan(10000);
      expect(result.content).toContain("TRUNCATED");
    });
  });

  describe("error handling", () => {
    it("should return error when spawn fails", async () => {
      vi.mocked(crossSpawn).mockImplementation(() => {
        throw new Error("spawn ENOENT");
      });

      const result = await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error when repomix exits with non-zero code", async () => {
      vi.mocked(crossSpawn).mockReturnValue(
        createMockChildProcess(1, "Error: Repository not found") as any
      );

      const result = await packRemoteRepository({
        url: "owner/nonexistent",
        timeout: 10000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("exited with code 1");
    });

    it("should clean temp directory after error", async () => {
      vi.mocked(crossSpawn).mockReturnValue(
        createMockChildProcess(1, "Error") as any
      );

      await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(fs.rm).toHaveBeenCalledWith(
        "/tmp/repocheckai-pack-abc123",
        expect.objectContaining({ recursive: true })
      );
    });

    it("should handle timeout gracefully", async () => {
      // Create a process that never completes
      const slowProcess = new EventEmitter() as any;
      slowProcess.stdout = new EventEmitter();
      slowProcess.stderr = new EventEmitter();
      slowProcess.kill = vi.fn(() => {
        slowProcess.emit("exit", null);
      });

      vi.mocked(crossSpawn).mockReturnValue(slowProcess);

      const result = await packRemoteRepository({
        url: "owner/repo",
        timeout: 50, // Very short timeout
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("timed out");
      expect(slowProcess.kill).toHaveBeenCalled();
    });

    it("should sanitize tokens from error messages", async () => {
      vi.mocked(crossSpawn).mockReturnValue(
        createMockChildProcess(
          1,
          "Error: Authentication failed for ghp_abc123secret"
        ) as any
      );

      const result = await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(result.error).not.toContain("ghp_abc123secret");
      expect(result.error).toContain("[REDACTED_TOKEN]");
    });
  });

  describe("output cleaning", () => {
    beforeEach(() => {
      vi.mocked(crossSpawn).mockReturnValue(
        createMockChildProcess(0) as any
      );
    });

    it("should remove npm warnings from output", async () => {
      const dirtyOutput = `npm warn old lockfile
npm WARN deprecated package@1.0.0
${SAMPLE_REPOMIX_OUTPUT}`;

      vi.mocked(fs.readFile).mockResolvedValue(dirtyOutput);

      const result = await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(result.content).not.toContain("npm warn");
      expect(result.content).not.toContain("npm WARN");
      expect(result.content).toContain("File Summary");
    });

    it("should remove Node.js warnings from output", async () => {
      const dirtyOutput = `(node:12345) ExperimentalWarning: Feature X is experimental
(node:12345) DeprecationWarning: Something is deprecated
${SAMPLE_REPOMIX_OUTPUT}`;

      vi.mocked(fs.readFile).mockResolvedValue(dirtyOutput);

      const result = await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      expect(result.content).not.toContain("ExperimentalWarning");
      expect(result.content).not.toContain("DeprecationWarning");
    });

    it("should collapse multiple blank lines", async () => {
      const dirtyOutput = `Line 1



Line 2`;

      vi.mocked(fs.readFile).mockResolvedValue(dirtyOutput);

      const result = await packRemoteRepository({
        url: "owner/repo",
        timeout: 10000,
      });

      // Should have at most 2 consecutive newlines
      expect(result.content).not.toMatch(/\n{3,}/);
    });
  });
});

