import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "vscode-jsonrpc/node": "vscode-jsonrpc/node.js",
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Exclude integration tests - run them separately with vitest.integration.config.ts
    exclude: ["node_modules", "dist", "tests/**/*.integration.test.ts"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/**/*.d.ts",
      ],
    },
    testTimeout: 10000,
  },
});
