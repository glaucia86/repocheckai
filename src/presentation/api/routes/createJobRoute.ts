import type { AnalysisMode } from "../../../domain/shared/contracts.js";
import { runAnalysisJob } from "../jobs/analysisOrchestrator.js";
import { InMemoryJobRegistry } from "../jobs/jobRegistry.js";
import { toHttpError } from "../errors/httpErrors.js";
import { normalizeRepositoryInput } from "../validation/repositoryInput.js";

interface CreateJobRequestBody {
  repositoryInput?: string;
  analysisMode?: AnalysisMode;
  model?: string;
  maxFiles?: number;
  timeoutSeconds?: number;
  preferredOutputFormat?: "markdown" | "json";
  publishAsIssue?: boolean;
  githubToken?: string;
}

interface RequestLike {
  body?: CreateJobRequestBody;
}

interface ResponseLike {
  statusCode: number;
  body: unknown;
}

const isAnalysisMode = (value: unknown): value is AnalysisMode =>
  value === "quick" || value === "deep";

export function createCreateJobRoute(registry: InMemoryJobRegistry) {
  return createCreateJobRouteWithRunner(registry, runAnalysisJob);
}

export function createCreateJobRouteWithRunner(
  registry: InMemoryJobRegistry,
  runJob: typeof runAnalysisJob
) {
  return function handleCreateJob(request: RequestLike): ResponseLike {
    const repositoryInput = request.body?.repositoryInput;
    const analysisMode = request.body?.analysisMode;

    if (!repositoryInput || !isAnalysisMode(analysisMode)) {
      const error = toHttpError({
        errorCode: "INVALID_REPOSITORY_INPUT",
        message: "Repository input and analysis mode are required.",
      });
      return { statusCode: error.statusCode, body: error };
    }

    const normalized = normalizeRepositoryInput(repositoryInput);
    if (!normalized.ok) {
      const error = toHttpError(normalized);
      return { statusCode: error.statusCode, body: error };
    }

    const job = registry.createJob({
      repositoryInput: normalized.value.normalizedInput,
      analysisMode,
      model: request.body?.model,
      maxFiles: request.body?.maxFiles,
      timeoutSeconds: request.body?.timeoutSeconds,
      preferredOutputFormat: request.body?.preferredOutputFormat,
    });

    void runJob(registry, {
      jobId: job.jobId,
      repositoryUrl: normalized.value.repositoryUrl,
      repositorySlug: normalized.value.repositorySlug,
      analysisMode,
      model: request.body?.model,
      timeoutSeconds: request.body?.timeoutSeconds,
      maxFiles: request.body?.maxFiles,
      publishAsIssue: request.body?.publishAsIssue === true,
      githubToken: request.body?.githubToken?.trim() || undefined,
    });

    return {
      statusCode: 202,
      body: {
        jobId: job.jobId,
        state: job.state,
      },
    };
  };
}

