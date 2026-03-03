export const ANALYSIS_MODES = ["quick", "deep"] as const;
export type AnalysisMode = (typeof ANALYSIS_MODES)[number];

export const OUTPUT_FORMATS = ["markdown", "json"] as const;
export type PreferredOutputFormat = (typeof OUTPUT_FORMATS)[number];

export const JOB_STATES = [
  "idle",
  "running",
  "completed",
  "error",
  "cancelled",
] as const;
export type JobState = (typeof JOB_STATES)[number];

export const EVENT_TYPES = [
  "job_started",
  "progress",
  "step_update",
  "error",
  "completed",
] as const;
export type ProgressEventType = (typeof EVENT_TYPES)[number];

export interface RunConfiguration {
  repositoryInput: string;
  analysisMode: AnalysisMode;
  model?: string;
  maxFiles?: number;
  timeoutSeconds?: number;
  preferredOutputFormat?: PreferredOutputFormat;
  skills?: "on" | "off";
  skillsMax?: number;
}

export interface AnalysisReport {
  jobId: string;
  markdownContent: string;
  jsonContent: Record<string, unknown>;
  generatedAt: string;
  sourceMode: AnalysisMode;
}

export interface ProgressEvent {
  eventId: string;
  jobId: string;
  eventType: ProgressEventType;
  sequence: number;
  timestamp: string;
  message?: string;
  step?: string;
  percent?: number;
}

export interface AnalysisJob {
  jobId: string;
  configuration: RunConfiguration;
  state: JobState;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  cancelRequestedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  reportRef?: string;
}

export interface ExportArtifact {
  jobId: string;
  format: "md" | "json";
  fileName: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ErrorResponse {
  errorCode: string;
  message: string;
}
