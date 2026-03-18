import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleAnalyze } from "../../../src/presentation/cli/handlers/analyzeHandler.js";

// Mock dependencies
vi.mock("../../../src/application/core/agent.js", () => ({
  analyzeRepositoryWithCopilot: vi.fn().mockResolvedValue({
    content: "Mock analysis result",
    toolCallCount: 3,
    durationMs: 1500,
    repoUrl: "https://github.com/owner/repo",
    model: "claude-sonnet-4",
  }),
}));

vi.mock("../../../src/application/core/repoPacker.js", () => ({
  isRepomixAvailable: vi.fn().mockReturnValue(true),
}));

vi.mock("../../../src/presentation/cli/parsers/repoParser.js", () => ({
  parseRepoRef: vi.fn(),
  buildRepoUrl: vi.fn(),
  buildRepoSlug: vi.fn(),
}));

vi.mock("../../../src/presentation/ui/index.js", () => ({
  printRepo: vi.fn(),
  printModel: vi.fn(),
  printError: vi.fn(),
  printWarning: vi.fn(),
  printSuccess: vi.fn(),
  c: {
    dim: vi.fn((s) => s),
    warning: vi.fn((s) => s),
    border: vi.fn((s) => s),
    whiteBold: vi.fn((s) => s),
    info: vi.fn((s) => s),
  },
}));

vi.mock("../../../src/application/core/publish/index.js", () => ({
  publishReport: vi.fn().mockResolvedValue({
    ok: true,
    targetUrl: "https://github.com/owner/repo/issues/1",
  }),
}));

vi.mock("../../../src/infrastructure/providers/github.js", () => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
}));

vi.mock("../../../src/presentation/cli/state/appState.js", () => ({
  appState: {
    currentModel: "claude-sonnet-4",
    isPremium: true,
    setLastAnalysis: vi.fn(),
    addToHistory: vi.fn(),
  },
}));

describe("handleAnalyze (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle basic analysis successfully", async () => {
    const { parseRepoRef, buildRepoUrl, buildRepoSlug } = await import("../../../src/presentation/cli/parsers/repoParser.js");
    const { printRepo, printModel } = await import("../../../src/presentation/ui/index.js");

    // Mock parser
    vi.mocked(parseRepoRef).mockReturnValue({ owner: "owner", repo: "repo" });
    vi.mocked(buildRepoUrl).mockReturnValue("https://github.com/owner/repo");
    vi.mocked(buildRepoSlug).mockReturnValue("owner/repo");

    const options: Parameters<typeof handleAnalyze>[1] = {
      token: "mock-token",
      maxFiles: 100,
      maxBytes: 100000,
      timeout: 60000,
      verbosity: "normal",
      format: "pretty",
      deep: false,
      issue: false,
    };

    // Capture console.log to verify output
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await handleAnalyze("owner/repo", options);

    expect(parseRepoRef).toHaveBeenCalledWith("owner/repo");
    expect(printRepo).toHaveBeenCalledWith("owner", "repo");
    expect(printModel).toHaveBeenCalledWith("claude-sonnet-4", true);

    consoleSpy.mockRestore();
  });

  it("should handle deep analysis mode", async () => {
    const { parseRepoRef, buildRepoUrl, buildRepoSlug } = await import("../../../src/presentation/cli/parsers/repoParser.js");
    const { isRepomixAvailable } = await import("../../../src/application/core/repoPacker.js");
    const { analyzeRepositoryWithCopilot } = await import("../../../src/application/core/agent.js");

    vi.mocked(parseRepoRef).mockReturnValue({ owner: "owner", repo: "repo" });
    vi.mocked(buildRepoUrl).mockReturnValue("https://github.com/owner/repo");
    vi.mocked(buildRepoSlug).mockReturnValue("owner/repo");

    const options: Parameters<typeof handleAnalyze>[1] = {
      token: "mock-token",
      maxFiles: 100,
      maxBytes: 100000,
      timeout: 60000,
      verbosity: "normal",
      format: "pretty",
      deep: false,
      issue: false,
    };

    await handleAnalyze("owner/repo", options, true);

    expect(isRepomixAvailable).toHaveBeenCalled();
    expect(analyzeRepositoryWithCopilot).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 600000, deep: true })
    );
  });

  it("should handle issue publishing", async () => {
    const { parseRepoRef, buildRepoUrl, buildRepoSlug } = await import("../../../src/presentation/cli/parsers/repoParser.js");
    const { publishReport } = await import("../../../src/application/core/publish/index.js");

    vi.mocked(parseRepoRef).mockReturnValue({ owner: "owner", repo: "repo" });
    vi.mocked(buildRepoUrl).mockReturnValue("https://github.com/owner/repo");
    vi.mocked(buildRepoSlug).mockReturnValue("owner/repo");

    const options: Parameters<typeof handleAnalyze>[1] = {
      token: "mock-token",
      maxFiles: 100,
      maxBytes: 100000,
      timeout: 60000,
      verbosity: "normal",
      format: "pretty",
      deep: false,
      issue: true,
    };

    await handleAnalyze("owner/repo", options);

    expect(publishReport).toHaveBeenCalledWith({
      target: "issue",
      repo: {
        owner: "owner",
        name: "repo",
        fullName: "owner/repo",
        url: "https://github.com/owner/repo",
      },
      analysisContent: "Mock analysis result",
      token: "mock-token",
    });
  });

  it("should handle invalid repo reference", async () => {
    const { parseRepoRef } = await import("../../../src/presentation/cli/parsers/repoParser.js");
    const { printError } = await import("../../../src/presentation/ui/index.js");

    vi.mocked(parseRepoRef).mockReturnValue(null);

    const options: Parameters<typeof handleAnalyze>[1] = {
      token: "mock-token",
      maxFiles: 100,
      maxBytes: 100000,
      timeout: 60000,
      verbosity: "normal",
      format: "pretty",
      deep: false,
      issue: false,
    };

    await handleAnalyze("invalid/repo", options);

    expect(printError).toHaveBeenCalledWith("Invalid repository reference.");
  });
});
