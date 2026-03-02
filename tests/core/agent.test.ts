import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeRepositoryWithCopilot } from "../../src/application/core/agent.js";
import { createOctokit } from "../../src/infrastructure/providers/github.js";

// Mock CopilotClient
vi.mock("@github/copilot-sdk", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    CopilotClient: class {
      start = vi.fn().mockResolvedValue(undefined);
      createSession = vi.fn().mockResolvedValue({
        on: vi.fn(),
        sendAndWait: vi.fn().mockResolvedValue("Mocked analysis response"),
      });
      stop = vi.fn().mockResolvedValue(undefined);
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
        listedPaths: ["README.md", "package.json", ".github/workflows/ci.yml"],
        readPaths: ["README.md", "package.json"],
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

describe("analyzeRepositoryWithCopilot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createOctokit).mockReturnValue({
      repos: {
        get: vi.fn().mockResolvedValue({ data: { language: "TypeScript" } }),
        listLanguages: vi.fn().mockResolvedValue({ data: { TypeScript: 1000 } }),
        getContent: vi.fn().mockResolvedValue({ data: [{ name: "package.json" }] }),
      },
    } as any);
  });

  it("should analyze a repository successfully", async () => {
    const options = {
      repoUrl: "https://github.com/owner/repo",
      token: "mock-token",
      model: "claude-sonnet-4",
      verbosity: "normal" as const,
      format: "pretty" as const,
      deep: false,
    };

    const result = await analyzeRepositoryWithCopilot(options);

    expect(result.content).toContain("Mocked analysis content");
    expect(result.content).toContain("## Skills Used");
    expect(result).toMatchObject({
      toolCallCount: 5,
      repoUrl: "https://github.com/owner/repo",
      model: "claude-sonnet-4",
    });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should handle deep analysis mode", async () => {
    const options = {
      repoUrl: "https://github.com/owner/repo",
      deep: true,
    };

    const result = await analyzeRepositoryWithCopilot(options);

    expect(result.repoUrl).toBe("https://github.com/owner/repo");
    expect(result.model).toBe("claude-sonnet-4"); // default
  });

  it("should handle silent verbosity", async () => {
    const options = {
      repoUrl: "https://github.com/owner/repo",
      verbosity: "silent" as const,
    };

    const result = await analyzeRepositoryWithCopilot(options);

    expect(result).toBeDefined();
  });

  it("should handle JSON format", async () => {
    const options = {
      repoUrl: "https://github.com/owner/repo",
      format: "json" as const,
    };

    const result = await analyzeRepositoryWithCopilot(options);

    expect(result).toBeDefined();
  });

  it("should deterministically include ci-quality for node stacks", async () => {
    const options = {
      repoUrl: "https://github.com/owner/repo",
      skills: "on" as const,
      skillsMax: 2,
    };

    const result = await analyzeRepositoryWithCopilot(options);

    expect(result.content).toContain("## Skills Used");
    expect(result.content).toContain("security-baseline");
    expect(result.content).toContain("ci-quality");
  });

  it("should include polyglot-governance when stack is unknown", async () => {
    vi.mocked(createOctokit).mockReturnValue({
      repos: {
        get: vi.fn().mockResolvedValue({ data: { language: null } }),
        listLanguages: vi.fn().mockResolvedValue({ data: {} }),
        getContent: vi.fn().mockResolvedValue({ data: [{ name: "README.md" }] }),
      },
    } as any);

    const result = await analyzeRepositoryWithCopilot({
      repoUrl: "https://github.com/owner/repo",
      skills: "on",
      skillsMax: 3,
    });

    expect(result.content).toContain("polyglot-governance");
  });

  it("should include expanded security skills when skillsMax is higher", async () => {
    const result = await analyzeRepositoryWithCopilot({
      repoUrl: "https://github.com/owner/repo",
      skills: "on",
      skillsMax: 5,
    });

    expect(result.content).toContain("security-baseline");
    expect(result.content).toContain("ci-quality");
    expect(result.content).toContain("node-governance");
    expect(result.content).toContain("insecure-defaults");
    expect(result.content).toContain("security-supply-chain");
  });
});
