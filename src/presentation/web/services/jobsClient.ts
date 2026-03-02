import type { AnalysisMode } from "../../../domain/shared/contracts.js";

interface CreateJobPayload {
  repositoryInput: string;
  analysisMode: AnalysisMode;
  model?: string;
  maxFiles?: number;
  timeoutSeconds?: number;
  skills?: "on" | "off";
  skillsMax?: number;
}

interface CreateJobResponse {
  jobId: string;
  state: string;
}

interface ReportResponse {
  jobId: string;
  state: string;
  report: {
    markdown?: string;
    json?: Record<string, unknown>;
  };
}

interface CancelJobResponse {
  jobId: string;
  state: string;
}

type ProgressEvent = {
  eventId: string;
  jobId: string;
  eventType: string;
  sequence: number;
  timestamp: string;
  message?: string;
  step?: string;
  percent?: number;
};

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class JobsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async createJob(payload: CreateJobPayload): Promise<CreateJobResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return this.readJson<CreateJobResponse>(response);
  }

  async getReport(jobId: string, format?: "markdown" | "json"): Promise<ReportResponse> {
    const query = format ? `?format=${format}` : "";
    const response = await this.fetchImpl(`${this.baseUrl}/jobs/${jobId}/report${query}`, {
      method: "GET",
    });
    return this.readJson<ReportResponse>(response);
  }

  async cancelJob(jobId: string): Promise<CancelJobResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/jobs/${jobId}/cancel`, {
      method: "POST",
    });
    return this.readJson<CancelJobResponse>(response);
  }

  async streamEvents(jobId: string): Promise<ProgressEvent[]> {
    const response = await this.fetchImpl(`${this.baseUrl}/jobs/${jobId}/events`, {
      method: "GET",
    });
    if (!response.ok) {
      const payload = await this.readJson<{ message?: string }>(response);
      throw new Error(payload.message ?? "Request failed.");
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      return this.readSeedEventsFromSse(response);
    }

    const payload = await this.readJson<{ seedEvents?: ProgressEvent[] }>(response);
    return payload.seedEvents ?? [];
  }

  async exportReport(jobId: string, format: "md" | "json"): Promise<Blob> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/jobs/${jobId}/export?format=${format}`,
      { method: "GET" }
    );
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      throw new Error(body.message ?? "Export failed.");
    }
    return response.blob();
  }

  private async readJson<T>(response: Response): Promise<T> {
    const payload = (await response.json()) as T & { message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "Request failed.");
    }
    return payload;
  }

  private async readSeedEventsFromSse(response: Response): Promise<ProgressEvent[]> {
    const reader = response.body?.getReader();
    if (!reader) {
      return [];
    }

    const firstChunk = await this.readFirstSseChunk(reader, 750);
    await reader.cancel();
    if (!firstChunk) {
      return [];
    }

    const text = new TextDecoder().decode(firstChunk);
    const blocks = text.split(/\r?\n\r?\n/);
    if (!text.match(/\r?\n\r?\n$/)) {
      blocks.pop();
    }

    const events: ProgressEvent[] = [];
    for (const block of blocks) {
      for (const line of block.split(/\r?\n/)) {
        if (!line.startsWith("data:")) {
          continue;
        }
        const data = line.slice(5).trim();
        if (!data) {
          continue;
        }
        try {
          events.push(JSON.parse(data) as ProgressEvent);
        } catch {
          // Ignore malformed chunks and return valid events only.
        }
      }
    }

    return events;
  }

  private async readFirstSseChunk(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    timeoutMs: number
  ): Promise<Uint8Array | null> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        reader.read(),
        new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) => {
          timeoutHandle = setTimeout(() => resolve({ done: true, value: undefined }), timeoutMs);
        }),
      ]);
      if (result.done || !result.value) {
        return null;
      }
      return result.value;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}

