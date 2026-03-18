import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for integration tests.
 *
 * Integration tests require network access and may be slow.
 * They test the actual Repomix integration, not mocks.
 *
 * Run with: npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      "vscode-jsonrpc/node": "vscode-jsonrpc/node.js",
    },
  },
  test: {
    globals: true,
    environment: "node",
    // Only run integration tests
    include: ["tests/**/*.integration.test.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["tests/setup.ts"],
    // Integration tests need longer timeouts
    testTimeout: 180000, // 3 minutes
    hookTimeout: 60000, // 1 minute for beforeAll/afterAll
    // Run tests sequentially to avoid rate limiting (Vitest 4.x syntax)
    fileParallelism: false,
  },
});
