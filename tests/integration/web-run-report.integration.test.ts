import { describe, expect, it } from "vitest";
import { createCreateJobRouteWithRunner } from "../../src/presentation/api/routes/createJobRoute.js";
import { createGetReportRoute } from "../../src/presentation/api/routes/getReportRoute.js";
import { InMemoryJobRegistry } from "../../src/presentation/api/jobs/jobRegistry.js";
import { JobsClient } from "../../src/presentation/web/services/jobsClient.js";
import { AppStore } from "../../src/presentation/web/state/appStore.js";

describe("Web run/report integration flow", () => {
  it("creates a job and loads the completed report", async () => {
    const registry = new InMemoryJobRegistry();
    let capturedOptions: Parameters<typeof createCreateJobRouteWithRunner>[1] extends (
      registry: InMemoryJobRegistry,
      options: infer T
    ) => Promise<unknown>
      ? T | null
      : null = null;

    const runJob: Parameters<typeof createCreateJobRouteWithRunner>[1] = (jobRegistry, options) => {
      capturedOptions = options;
      jobRegistry.startJob(options.jobId);
      jobRegistry.completeJob(options.jobId, {
        jobId: options.jobId,
        markdownContent: "# Analysis\n\nAll checks passed.",
        jsonContent: { score: 95, summary: "All checks passed." },
        generatedAt: new Date().toISOString(),
        sourceMode: options.analysisMode,
      });
      return Promise.resolve({
        ok: true,
        report: jobRegistry.getReport(options.jobId)!,
      });
    };

    const createRoute = createCreateJobRouteWithRunner(registry, runJob);
    const reportRoute = createGetReportRoute(registry);

    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const method = init?.method ?? "GET";

      if (url.endsWith("/jobs") && method === "POST") {
        const requestBody = typeof init?.body === "string" ? init.body : "{}";
        const body = JSON.parse(requestBody) as Record<string, unknown>;
        const response = await createRoute({ body });
        return new Response(JSON.stringify(response.body), { status: response.statusCode });
      }

      const reportMatch = url.match(/\/jobs\/([^/]+)\/report/);
      if (reportMatch && method === "GET") {
        const response = await reportRoute({
          params: { jobId: reportMatch[1] },
        });
        return new Response(JSON.stringify(response.body), { status: response.statusCode });
      }

      return new Response(JSON.stringify({ message: "Not found" }), { status: 404 });
    };

    const client = new JobsClient("http://local.test", fetchMock);
    const store = new AppStore(client);

    const running = await store.startAnalysis({
      repositoryInput: "owner/repo",
      analysisMode: "quick",
      skills: "on",
      skillsMax: 10,
    });

    expect(running.status).toBe("running");
    expect(running.jobId).toBeDefined();

    const completed = await store.loadCompletedReport(running.jobId);
    expect(completed.status).toBe("completed");
    expect(completed.markdownReport).toContain("Analysis");
    expect(completed.jsonReport).toMatchObject({ score: 95 });
    expect(capturedOptions?.skills).toBe("on");
    expect(capturedOptions?.skillsMax).toBe(6);
  });
});
