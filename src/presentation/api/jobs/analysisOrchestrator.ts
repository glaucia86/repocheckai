import { analyzeRepositoryWithCopilot } from "../../../application/core/agent.js";
import { publishReport } from "../../../application/core/publish/index.js";
import type { AnalysisMode, AnalysisReport } from "../../../domain/shared/contracts.js";
import { extractReportOnly } from "../../../utils/reportExtractor.js";
import { InMemoryJobRegistry } from "./jobRegistry.js";

interface RunOptions {
  jobId: string;
  repositoryUrl: string;
  repositorySlug: string;
  analysisMode: AnalysisMode;
  model?: string;
  timeoutSeconds?: number;
  maxFiles?: number;
  publishAsIssue?: boolean;
  githubToken?: string;
}

type RunResult =
  | { ok: true; report: AnalysisReport }
  | { ok: false; errorCode: string; message: string };

export async function runAnalysisJob(
  registry: InMemoryJobRegistry,
  options: RunOptions
): Promise<RunResult> {
  const start = registry.startJob(options.jobId);
  if (!start.ok) {
    return start;
  }

  registry.appendEvent(options.jobId, {
    eventType: "job_started",
    message: "Analysis started.",
  });

  try {
    const output = await analyzeRepositoryWithCopilot({
      repoUrl: options.repositoryUrl,
      token: options.githubToken,
      model: options.model,
      deep: options.analysisMode === "deep",
      maxFiles: options.maxFiles,
      timeout: options.timeoutSeconds ? options.timeoutSeconds * 1000 : undefined,
      verbosity: "silent",
    });

    const cleanedReport = enforceRepositoryIdentity(
      extractReportOnly(output.content),
      options.repositorySlug
    );

    const report: AnalysisReport = {
      jobId: options.jobId,
      markdownContent: cleanedReport,
      jsonContent: {
        content: output.content,
        cleanedContent: cleanedReport,
        toolCallCount: output.toolCallCount,
        durationMs: output.durationMs,
        repoUrl: output.repoUrl,
        model: output.model,
      },
      generatedAt: new Date().toISOString(),
      sourceMode: options.analysisMode,
    };

    if (registry.getJob(options.jobId)?.state === "cancelled") {
      return {
        ok: false,
        errorCode: "JOB_TERMINAL",
        message: "Job was cancelled before completion.",
      };
    }

    const completion = registry.completeJob(options.jobId, report);
    if (!completion.ok) {
      return completion;
    }

    if (options.publishAsIssue) {
      const [owner, name] = options.repositorySlug.split("/");
      if (!owner || !name) {
        registry.appendEvent(options.jobId, {
          eventType: "step_update",
          message: "Issue publish skipped: invalid repository slug.",
        });
      } else {
        const publishResult = await publishReport({
          target: "issue",
          repo: {
            owner,
            name,
            fullName: `${owner}/${name}`,
            url: options.repositoryUrl,
          },
          analysisContent: output.content,
          token: options.githubToken,
        });

        if (publishResult?.ok) {
          const count = publishResult.targetUrls?.length ?? (publishResult.targetUrl ? 1 : 0);
          registry.appendEvent(options.jobId, {
            eventType: "step_update",
            message:
              count > 0
                ? `Published ${count} GitHub issue${count > 1 ? "s" : ""}.`
                : "Report published as GitHub issue.",
          });
        } else if (publishResult?.error?.message) {
          registry.appendEvent(options.jobId, {
            eventType: "step_update",
            message: `Issue publish skipped: ${publishResult.error.message}`,
          });
        }
      }
    }

    registry.appendEvent(options.jobId, {
      eventType: "completed",
      message: "Analysis completed.",
      percent: 100,
    });

    return { ok: true, report };
  } catch (error) {
    const failure = registry.failJob(
      options.jobId,
      "ANALYSIS_FAILED",
      error instanceof Error ? error.message : "Analysis failed."
    );
    registry.appendEvent(options.jobId, {
      eventType: "error",
      message: failure.ok ? failure.job.errorMessage : "Analysis failed.",
    });

    if (!failure.ok) {
      return failure;
    }

    return {
      ok: false,
      errorCode: failure.job.errorCode ?? "ANALYSIS_FAILED",
      message: failure.job.errorMessage ?? "Analysis failed.",
    };
  }
}

function enforceRepositoryIdentity(report: string, repositorySlug: string): string {
  const headerPattern = /^\*\*Repository:\*\*.*$/m;
  const canonical = `**Repository:** ${repositorySlug}`;

  if (headerPattern.test(report)) {
    return report.replace(headerPattern, canonical);
  }

  return `${canonical}\n\n${report}`;
}


