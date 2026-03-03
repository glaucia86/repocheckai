import { describe, it, expect, vi } from "vitest";
import { analyzeRepositoryWithCopilot } from "../../src/application/core/agent.js";

// Mock CopilotClient
vi.mock("@github/copilot-sdk", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    CopilotClient: function() {
      return {
        start: vi.fn().mockResolvedValue(undefined),
        createSession: vi.fn().mockResolvedValue({
          on: vi.fn(),
          sendAndWait: vi.fn().mockImplementation(async () => {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 10));
            return "Mocked analysis response";
          }),
        }),
        stop: vi.fn().mockResolvedValue(undefined),
      };
    },
  };
});

// Mock UI functions to avoid console output
vi.mock("../../src/presentation/ui/index.js", () => ({
  startSpinner: vi.fn().mockReturnValue({
    update: vi.fn(),
    success: vi.fn(),
    fail: vi.fn(),
  }),
  updateSpinner: vi.fn(),
  spinnerSuccess: vi.fn(),
  spinnerFail: vi.fn(),
  printWarning: vi.fn(),
  c: {
    dim: vi.fn((s) => s),
    brand: vi.fn((s) => s),
    info: vi.fn((s) => s),
    text: vi.fn((s) => s),
    warning: vi.fn((s) => s),
    healthy: vi.fn((s) => s),
    healthyBold: vi.fn((s) => s),
    warningBold: vi.fn((s) => s),
    check: vi.fn((s) => s),
    warn: vi.fn((s) => s),
  },
  ICON: {
    analyze: "🔍",
    check: "✅",
    warn: "⚠️",
  },
  box: vi.fn().mockReturnValue(["Mocked box output"]),
}));

// Mock extracted modules
vi.mock("../../src/application/core/agent/index.js", () => ({
  SYSTEM_PROMPT: "Mock system prompt",
  QUICK_SYSTEM_PROMPT: "Mock quick prompt",
  DEEP_SYSTEM_PROMPT: "Mock deep prompt",
  composeSystemPrompt: vi.fn().mockReturnValue("Mock composed system prompt"),
  getSystemPrompt: vi.fn().mockReturnValue("Mock system prompt"),
  buildAnalysisPrompt: vi.fn().mockReturnValue("Mock analysis prompt"),
  createGuardrails: vi.fn().mockReturnValue({
    getStats: vi.fn().mockReturnValue({ warningCount: 0 }),
  }),
  createEventHandler: vi.fn().mockReturnValue({
    handler: vi.fn(),
    state: {
      outputBuffer: "Mocked analysis content",
      toolCallCount: 5,
      aborted: false,
      abortReason: null,
      appliedSkillNames: [],
      evidence: {
        repoFullName: "owner/repo",
        listedPaths: ["README.md", "package.json"],
        readPaths: ["README.md"],
      },
    },
  }),
}));

vi.mock("../../src/infrastructure/providers/github.js", () => ({
  parseRepoUrl: vi.fn().mockReturnValue({ owner: "owner", repo: "repo" }),
  createOctokit: vi.fn().mockReturnValue({
    repos: {
      get: vi.fn().mockResolvedValue({ data: { language: "TypeScript" } }),
      listLanguages: vi.fn().mockResolvedValue({ data: { TypeScript: 1000 } }),
      getContent: vi.fn().mockResolvedValue({
        data: [{ name: "package.json" }],
      }),
    },
  }),
}));

describe("Performance Tests", () => {
  it("analyzeRepositoryWithCopilot - quick analysis performance", async () => {
    const options = {
      repoUrl: "https://github.com/owner/repo",
      token: "mock-token",
      model: "claude-sonnet-4",
      verbosity: "silent" as const,
      format: "json" as const,
      deep: false,
    };

    const start = performance.now();
    await analyzeRepositoryWithCopilot(options);
    const end = performance.now();
    const duration = end - start;

    // Assert that it completes within reasonable time (e.g., < 100ms for mocked)
    expect(duration).toBeLessThan(100);
    console.log(`Quick analysis took ${duration.toFixed(2)}ms`);
  });

  it("analyzeRepositoryWithCopilot - deep analysis performance", async () => {
    const options = {
      repoUrl: "https://github.com/owner/repo",
      token: "mock-token",
      model: "claude-sonnet-4",
      verbosity: "silent" as const,
      format: "json" as const,
      deep: true,
    };

    const start = performance.now();
    await analyzeRepositoryWithCopilot(options);
    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(100);
    console.log(`Deep analysis took ${duration.toFixed(2)}ms`);
  });
});
