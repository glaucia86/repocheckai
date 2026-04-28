import { describe, expect, it, vi } from "vitest";
import { runAnalysisJob } from "../../src/presentation/api/jobs/analysisOrchestrator.js";
import { InMemoryJobRegistry } from "../../src/presentation/api/jobs/jobRegistry.js";

vi.mock("../../src/application/core/agent.js", () => ({
  analyzeRepositoryWithCopilot: vi.fn().mockResolvedValue({
    content: "**Repository:** owner/repo\n\n# Report\n\nLooks good.",
    toolCallCount: 3,
    durationMs: 1200,
    repoUrl: "https://github.com/owner/repo",
    model: "claude-sonnet-4",
  }),
}));

vi.mock("../../src/application/core/publish/index.js", () => ({
  publishReport: vi.fn().mockResolvedValue({
    ok: true,
    targetUrls: ["https://github.com/owner/repo/issues/1"],
  }),
}));

describe("runAnalysisJob progress events", () => {
  it("emits progress percentages before completion", async () => {
    const registry = new InMemoryJobRegistry();
    const job = registry.createJob({
      repositoryInput: "owner/repo",
      analysisMode: "quick",
      model: "claude-sonnet-4",
    });

    const result = await runAnalysisJob(registry, {
      jobId: job.jobId,
      repositoryUrl: "https://github.com/owner/repo",
      repositorySlug: "owner/repo",
      analysisMode: "quick",
      model: "claude-sonnet-4",
    });

    expect(result.ok).toBe(true);

    const percentages = registry
      .getEvents(job.jobId)
      .map((event) => event.percent)
      .filter((percent): percent is number => typeof percent === "number");

    expect(percentages).toEqual(expect.arrayContaining([5, 15, 75, 85, 100]));
    expect(percentages.some((percent) => percent > 0 && percent < 100)).toBe(true);
  });
});
