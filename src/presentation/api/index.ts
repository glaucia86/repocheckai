import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { printError, printInfo, printSuccess } from "../ui/index.js";
import { createCancelJobRoute } from "./routes/cancelJobRoute.js";
import { createCreateJobRoute } from "./routes/createJobRoute.js";
import { createExportReportRoute } from "./routes/exportReportRoute.js";
import { createGetReportRoute } from "./routes/getReportRoute.js";
import { createStreamEventsRoute } from "./routes/streamEventsRoute.js";
import { EventStreamHub } from "./jobs/eventStreamHub.js";
import { InMemoryJobRegistry } from "./jobs/jobRegistry.js";
import { getAvailableModels, refreshAvailableModels } from "../cli/state/appState.js";

interface JsonBody {
  [key: string]: unknown;
}

const isDirectExecution = (): boolean => {
  const argvPath = process.argv[1];
  if (!argvPath) return false;
  return resolve(argvPath) === resolve(fileURLToPath(import.meta.url));
};

const readPortFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) return fallback;
  return parsed;
};

const sendJson = (res: ServerResponse, statusCode: number, body: unknown): void => {
  res.statusCode = statusCode;
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const readJsonBody = async (req: IncomingMessage): Promise<JsonBody> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    }
  }
  if (chunks.length === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as JsonBody;
  } catch {
    return {};
  }
};

export function startLocalApiServer(port: number = 3001): void {
  const registry = new InMemoryJobRegistry();
  const streamHub = new EventStreamHub(registry);
  const stopHub = streamHub.start();

  const createJob = createCreateJobRoute(registry);
  const getReport = createGetReportRoute(registry);
  const cancelJob = createCancelJobRoute(registry);
  const streamEvents = createStreamEventsRoute(registry, streamHub);
  const exportReport = createExportReportRoute(registry);

  const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("access-control-allow-origin", "*");
      res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
      res.setHeader("access-control-allow-headers", "content-type");
      res.end();
      return;
    }

    if (method === "GET" && pathname === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (method === "GET" && pathname === "/models") {
      const models = await refreshAvailableModels().catch(() => getAvailableModels());
      sendJson(res, 200, { models });
      return;
    }

    if (method === "POST" && pathname === "/jobs") {
      const body = await readJsonBody(req);
      const response = createJob({ body });
      sendJson(res, response.statusCode, response.body);
      return;
    }

    const reportMatch = pathname.match(/^\/jobs\/([^/]+)\/report$/);
    if (method === "GET" && reportMatch) {
      const response = getReport({
        params: { jobId: reportMatch[1] },
        query: { format: (url.searchParams.get("format") as "markdown" | "json" | null) ?? undefined },
      });
      sendJson(res, response.statusCode, response.body);
      return;
    }

    const cancelMatch = pathname.match(/^\/jobs\/([^/]+)\/cancel$/);
    if (method === "POST" && cancelMatch) {
      const response = cancelJob({ params: { jobId: cancelMatch[1] } });
      sendJson(res, response.statusCode, response.body);
      return;
    }

    const exportMatch = pathname.match(/^\/jobs\/([^/]+)\/export$/);
    if (method === "GET" && exportMatch) {
      const response = exportReport({
        params: { jobId: exportMatch[1] },
        query: { format: (url.searchParams.get("format") as "md" | "json" | null) ?? undefined },
      });
      if (response.statusCode !== 200) {
        sendJson(res, response.statusCode, response.body);
        return;
      }
      const artifact = response.body as {
        content: Buffer;
        contentType: string;
        fileName: string;
      };
      res.statusCode = 200;
      res.setHeader("access-control-allow-origin", "*");
      res.setHeader("content-type", artifact.contentType);
      res.setHeader("content-disposition", `attachment; filename="${artifact.fileName}"`);
      res.end(artifact.content);
      return;
    }

    const streamMatch = pathname.match(/^\/jobs\/([^/]+)\/events$/);
    if (method === "GET" && streamMatch) {
      const response = streamEvents({ params: { jobId: streamMatch[1] } });
      if (response.statusCode !== 200) {
        sendJson(res, response.statusCode, response.body);
        return;
      }

      const stream = response.body as {
        seedEvents: Array<Record<string, unknown>>;
        subscribe: (onEvent: (event: Record<string, unknown>) => void) => () => void;
      };
      res.statusCode = 200;
      res.setHeader("access-control-allow-origin", "*");
      res.setHeader("content-type", "text/event-stream");
      res.setHeader("cache-control", "no-cache");
      res.setHeader("connection", "keep-alive");
      for (const event of stream.seedEvents) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
      const unsubscribe = stream.subscribe((event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });
      req.on("close", () => {
        unsubscribe();
      });
      return;
    }

    sendJson(res, 404, { errorCode: "NOT_FOUND", message: "Route not found." });
  };

  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  server.listen(port, () => {
    printSuccess(`Local API server running at http://localhost:${port}`);
    printInfo("Health check: GET /health");
  });

  const shutdown = () => {
    stopHub();
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (isDirectExecution()) {
  try {
    startLocalApiServer(readPortFromEnv(process.env.REPO_DOCTOR_API_PORT, 3001));
  } catch (error) {
    printError(error instanceof Error ? error.message : "Failed to start local API server.");
    process.exit(1);
  }
}
