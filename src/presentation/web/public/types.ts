export type AnalysisMode = "quick" | "deep";
export type JobState = "idle" | "running" | "completed" | "cancelled" | "error";
export type ReportTab = "markdown" | "json";
export type ExportFormat = "md" | "json";
export type Locale = "pt-BR" | "en-US";

export type UiEventName =
  | "analysis_start"
  | "analysis_cancel"
  | "report_ready"
  | "export_md"
  | "export_json"
  | "copy_markdown"
  | "copy_json"
  | "error_shown"
  | "empty_state_cta";

export interface ModelOption {
  id: string;
  name: string;
  premium: boolean;
}

export interface FormState {
  repositoryInput: string;
  analysisMode: AnalysisMode;
  model: string;
  maxFiles: string;
  timeoutSeconds: string;
  publishAsIssue: boolean;
  githubToken: string;
}

export interface JobStateData {
  id: string;
  state: JobState;
}

export interface ProgressEvent {
  eventId?: string;
  eventType: string;
  sequence: number;
  percent?: number;
  message?: string;
}

export interface ReportState {
  markdown: string;
  json: Record<string, unknown> | null;
}

export interface UiEvent {
  name: UiEventName;
  timestamp: string;
  context?: Record<string, string | number | boolean>;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
}
