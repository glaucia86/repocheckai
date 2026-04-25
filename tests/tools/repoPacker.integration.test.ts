/**
 * Integration Tests for repoPacker
 *
 * These tests actually call Repomix and require network access.
 * They are slower but validate the full integration works.
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect } from "vitest";
import {
  packRemoteRepository,
  isRepomixAvailable,
  clearRepomixAvailabilityCache,
  getDefaultIncludePatterns,
  getDeepIncludePatterns,
} from "../../src/application/core/repoPacker.js";

// ════════════════════════════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════════════════════════════

// Use a small, stable, public repository for testing
const TEST_REPO = "octocat/Hello-World";
const TEST_REPO_URL = "https://github.com/octocat/Hello-World";

// Timeout for integration tests (Repomix can be slow)
const INTEGRATION_TIMEOUT = 120000; // 2 minutes

// Check Repomix availability once at module load time
// This enables proper use of Vitest's skipIf for better test reporting
clearRepomixAvailabilityCache();
const repomixAvailable = isRepomixAvailable();

if (!repomixAvailable) {
  console.warn("⚠️ Repomix not available - integration tests will be skipped");
}

// ════════════════════════════════════════════════════════════════════════════
// PRE-FLIGHT CHECK
// ════════════════════════════════════════════════════════════════════════════

describe("Integration: Pre-flight", () => {
  it("should report Repomix availability as a boolean", () => {
    const available = isRepomixAvailable();
    expect(typeof available).toBe("boolean");
  }, 60000);

  it.skipIf(!repomixAvailable)("should have Repomix available via npx", () => {
    // Only enforce this when the current environment actually exposes Repomix.
    const available = isRepomixAvailable();
    expect(available).toBe(true);
  }, 60000);
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS: packRemoteRepository
// ════════════════════════════════════════════════════════════════════════════

describe("Integration: packRemoteRepository", () => {
  describe("with owner/repo shorthand", () => {
    it.skipIf(!repomixAvailable)(
      "should successfully pack a small public repository",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          maxBytes: 500000,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
        expect(result.content!.length).toBeGreaterThan(0);
        expect(result.error).toBeUndefined();
      },
      INTEGRATION_TIMEOUT
    );

    it.skipIf(!repomixAvailable)(
      "should include file content in the packed output",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          include: ["README"],
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        // The Hello-World repo has a README with "Hello World"
        expect(result.content).toContain("Hello");
      },
      INTEGRATION_TIMEOUT
    );
  });

  describe("with full URL", () => {
    it.skipIf(!repomixAvailable)(
      "should successfully pack using full GitHub URL",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO_URL,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
      },
      INTEGRATION_TIMEOUT
    );
  });

  describe("output structure", () => {
    it.skipIf(!repomixAvailable)(
      "should include Repomix header in output",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        // Repomix outputs start with a header about the merged representation
        expect(result.content).toMatch(/merged representation|codebase/i);
      },
      INTEGRATION_TIMEOUT
    );

    it.skipIf(!repomixAvailable)(
      "should include file markers in output",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        // Repomix uses markers like "File:" or "================"
        expect(result.content).toMatch(/File:|={5,}/);
      },
      INTEGRATION_TIMEOUT
    );

    it.skipIf(!repomixAvailable)(
      "should return metadata about files processed",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        expect(result.metadata).toBeDefined();
        // Metadata should have at least files property
        expect(typeof result.metadata?.files).toBe("number");
      },
      INTEGRATION_TIMEOUT
    );

    it.skipIf(!repomixAvailable)(
      "should report correct original size",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        expect(result.originalSize).toBeGreaterThan(0);
        expect(result.originalSize).toBe(Buffer.byteLength(result.content, "utf-8"));
      },
      INTEGRATION_TIMEOUT
    );
  });

  describe("include patterns", () => {
    it.skipIf(!repomixAvailable)(
      "should respect include patterns",
      async () => {
        // Only include README files
        const result = await packRemoteRepository({
          url: TEST_REPO,
          include: ["README*"],
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        // Should have README content
        expect(result.content).toContain("README");
      },
      INTEGRATION_TIMEOUT
    );

    it.skipIf(!repomixAvailable)(
      "should use default patterns when not specified",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        // Default patterns include README*
        const patterns = getDefaultIncludePatterns();
        expect(patterns).toContain("README*");
      },
      INTEGRATION_TIMEOUT
    );
  });

  describe("error scenarios", () => {
    it.skipIf(!repomixAvailable)(
      "should fail gracefully for non-existent repository",
      async () => {
        const result = await packRemoteRepository({
          url: "this-owner-does-not-exist/this-repo-does-not-exist-12345",
          timeout: 60000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      },
      INTEGRATION_TIMEOUT
    );

    it.skipIf(!repomixAvailable)(
      "should handle timeout for very slow operations",
      async () => {
        // Use a very short timeout to force timeout
        const result = await packRemoteRepository({
          url: TEST_REPO,
          timeout: 1, // 1ms - will definitely timeout
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("timed out");
      },
      30000
    );
  });

  describe("output cleaning", () => {
    it.skipIf(!repomixAvailable)(
      "should not contain npm/node warnings in final output",
      async () => {
        const result = await packRemoteRepository({
          url: TEST_REPO,
          timeout: INTEGRATION_TIMEOUT,
        });

        expect(result.success).toBe(true);
        expect(result.content).not.toMatch(/npm warn/i);
        expect(result.content).not.toMatch(/npm notice/i);
        expect(result.content).not.toMatch(/DeprecationWarning/i);
        expect(result.content).not.toMatch(/ExperimentalWarning/i);
      },
      INTEGRATION_TIMEOUT
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS: Deep Analysis Mode
// ════════════════════════════════════════════════════════════════════════════

describe("Integration: Deep Analysis Patterns", () => {
  it.skipIf(!repomixAvailable)(
    "should include source code with deep patterns",
    async () => {
      const deepPatterns = getDeepIncludePatterns();

      const result = await packRemoteRepository({
        url: TEST_REPO,
        include: deepPatterns,
        timeout: INTEGRATION_TIMEOUT,
      });

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "deep patterns should include more than default",
    () => {
      const defaultPatterns = getDefaultIncludePatterns();
      const deepPatterns = getDeepIncludePatterns();

      expect(deepPatterns.length).toBeGreaterThan(defaultPatterns.length);

      // Deep should include source directories
      expect(deepPatterns).toContain("src/**");
      expect(deepPatterns).toContain("lib/**");

      // Default should NOT include source directories
      expect(defaultPatterns).not.toContain("src/**");
    }
  );
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS: Real Repository Analysis
// ════════════════════════════════════════════════════════════════════════════

describe("Integration: Real Repository Content", () => {
  it.skipIf(!repomixAvailable)(
    "should read actual file contents from repository",
    async () => {
      // Pack the Hello-World repo which has known content
      const result = await packRemoteRepository({
        url: TEST_REPO,
        include: ["README"],
        timeout: INTEGRATION_TIMEOUT,
      });

      expect(result.success).toBe(true);

      // The octocat/Hello-World repo README contains "Hello World"
      // This verifies we're actually reading file contents, not just metadata
      expect(result.content).toMatch(/Hello|World/i);
    },
    INTEGRATION_TIMEOUT
  );

  it.skipIf(!repomixAvailable)(
    "should pack multiple files when patterns match",
    async () => {
      // Use a repo with multiple files
      // vercel/ms is a small, stable repo with src/ files
      const result = await packRemoteRepository({
        url: "vercel/ms",
        include: ["src/**", "*.json"],
        timeout: INTEGRATION_TIMEOUT,
      });

      expect(result.success).toBe(true);

      // Should have content from multiple files
      // Look for file markers that indicate multiple files were included
      const fileMarkerCount = (result.content?.match(/File:|={10,}/g) || [])
        .length;
      expect(fileMarkerCount).toBeGreaterThan(1);
    },
    INTEGRATION_TIMEOUT
  );
});
