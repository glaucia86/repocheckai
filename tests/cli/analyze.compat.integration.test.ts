import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleAnalyze } from "../../src/presentation/cli/handlers/analyzeHandler.js";
import { resolveCommandPolicy } from "../../src/domain/config/commandPolicy.js";

vi.mock("../../src/application/core/agent.js", () => ({
  analyzeRepositoryWithCopilot: vi.fn().mockResolvedValue({
    content: "Compatibility report",
    toolCallCount: 2,
    durationMs: 250,
    repoUrl: "https://github.com/owner/repo",
    model: "claude-sonnet-4",
  }),
}));

vi.mock("../../src/application/core/repoPacker.js", () => ({
  isRepomixAvailable: vi.fn().mockReturnValue(true),
}));

vi.mock("../../src/presentation/cli/parsers/repoParser.js", () => ({
  parseRepoRef: vi.fn().mockReturnValue({ owner: "owner", repo: "repo" }),
  buildRepoUrl: vi.fn().mockReturnValue("https://github.com/owner/repo"),
  buildRepoSlug: vi.fn().mockReturnValue("owner/repo"),
}));

vi.mock("../../src/presentation/ui/index.js", () => ({
  printRepo: vi.fn(),
  printModel: vi.fn(),
  printError: vi.fn(),
  printWarning: vi.fn(),
  printSuccess: vi.fn(),
  c: {
    dim: (s: string) => s,
    warning: (s: string) => s,
    border: (s: string) => s,
    whiteBold: (s: string) => s,
    info: (s: string) => s,
  },
}));

vi.mock("../../src/application/core/publish/index.js", () => ({
  publishReport: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("../../src/infrastructure/providers/github.js", () => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
}));

vi.mock("../../src/presentation/cli/state/appState.js", () => ({
  appState: {
    currentModel: "claude-sonnet-4",
    isPremium: true,
    setLastAnalysis: vi.fn(),
    addToHistory: vi.fn(),
  },
}));

describe("CLI analyze compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps analyze flow compatible for standard mode", async () => {
    const options: Parameters<typeof handleAnalyze>[1] = {
      token: "token",
      maxFiles: 100,
      maxBytes: 100000,
      timeout: 60000,
      verbosity: "normal",
      format: "pretty",
      deep: false,
      issue: false,
    };

    await expect(handleAnalyze("owner/repo", options)).resolves.toBeUndefined();
  });

  it("recognizes repocheck as the official command", () => {
    const policy = resolveCommandPolicy(["node", "repocheck", "analyze", "owner/repo"]);
    expect(policy.effectiveCommand).toBe("repocheck");
    expect(policy.isLegacy).toBe(false);
  });

  it("keeps repodoctor as temporary legacy alias with warning policy", () => {
    const policy = resolveCommandPolicy(["node", "repodoctor", "analyze", "owner/repo"]);
    expect(policy.effectiveCommand).toBe("repocheck");
    expect(policy.isLegacy).toBe(true);
    expect(policy.legacyBehavior).toBe("allow_with_warning");
    expect(policy.deprecationMessage).toContain("repocheck");
  });
});
