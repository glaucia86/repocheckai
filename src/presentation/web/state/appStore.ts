import type { AnalysisMode } from "../../../domain/shared/contracts.js";
import { JobsClient } from "../services/jobsClient.js";

export type AppStatus = "idle" | "running" | "completed" | "cancelled" | "error";

export interface TimelineEvent {
  sequence: number;
  eventType: string;
  message?: string;
  percent?: number;
}

export interface AppState {
  status: AppStatus;
  jobId?: string;
  markdownReport?: string;
  jsonReport?: Record<string, unknown>;
  timeline?: TimelineEvent[];
  errorMessage?: string;
}

export class AppStore {
  private state: AppState = { status: "idle" };

  constructor(
    private readonly client: Pick<JobsClient, "createJob" | "getReport" | "cancelJob" | "streamEvents">
  ) {}

  getState(): AppState {
    return { ...this.state };
  }

  async startAnalysis(input: {
    repositoryInput: string;
    analysisMode: AnalysisMode;
    model?: string;
    maxFiles?: number;
    timeoutSeconds?: number;
    skills?: "on" | "off";
    skillsMax?: number;
  }): Promise<AppState> {
    try {
      this.state = { status: "running", timeline: [] };
      const created = await this.client.createJob(input);
      this.state = { ...this.state, status: "running", jobId: created.jobId };
      return this.getState();
    } catch (error) {
      this.state = {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to create job.",
      };
      return this.getState();
    }
  }

  async loadCompletedReport(jobId: string): Promise<AppState> {
    try {
      const response = await this.client.getReport(jobId);
      this.state = {
        status: "completed",
        jobId,
        markdownReport: response.report.markdown,
        jsonReport: response.report.json,
        timeline: this.state.timeline ?? [],
      };
      return this.getState();
    } catch (error) {
      this.state = {
        ...this.state,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to load report.",
      };
      return this.getState();
    }
  }

  async refreshProgressEvents(jobId: string): Promise<AppState> {
    try {
      const events = await this.client.streamEvents(jobId);
      this.state = {
        ...this.state,
        timeline: events.map((event) => ({
          sequence: event.sequence,
          eventType: event.eventType,
          message: event.message,
          percent: event.percent,
        })),
      };
      return this.getState();
    } catch (error) {
      this.state = {
        ...this.state,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to load progress events.",
      };
      return this.getState();
    }
  }

  async cancelRunningJob(): Promise<AppState> {
    if (!this.state.jobId) {
      this.state = { ...this.state, status: "error", errorMessage: "No active job to cancel." };
      return this.getState();
    }

    try {
      await this.client.cancelJob(this.state.jobId);
      this.state = { ...this.state, status: "cancelled" };
      return this.getState();
    } catch (error) {
      this.state = {
        ...this.state,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to cancel job.",
      };
      return this.getState();
    }
  }
}

