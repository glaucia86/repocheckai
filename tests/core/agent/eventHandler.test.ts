import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEventHandler,
  createPhases,
  DEFAULT_PHASES,
  type EventHandlerOptions,
} from "../../../src/application/core/agent/eventHandler.js";

// Mock UI modules
vi.mock("../../../src/presentation/ui/index.js", () => ({
  updateSpinner: vi.fn(),
  c: {
    dim: (s: string) => s,
    healthy: (s: string) => s,
  },
  ICON: {
    check: "✓",
  },
}));

describe("createPhases", () => {
  it("should return a new array each time", () => {
    const phases1 = createPhases();
    const phases2 = createPhases();
    expect(phases1).not.toBe(phases2);
  });

  it("should return phases with pending status", () => {
    const phases = createPhases();
    expect(phases.every((p) => p.status === "pending")).toBe(true);
  });

  it("should have 6 default phases", () => {
    const phases = createPhases();
    expect(phases).toHaveLength(6);
  });
});

describe("DEFAULT_PHASES", () => {
  it("should include reconnaissance phase", () => {
    expect(DEFAULT_PHASES.some((p) => p.name.includes("metadata"))).toBe(true);
  });

  it("should include file tree phase", () => {
    expect(DEFAULT_PHASES.some((p) => p.name.includes("file tree"))).toBe(true);
  });
});

describe("createEventHandler", () => {
  const defaultOptions: EventHandlerOptions = {
    verbose: false,
    silent: false,
    json: false,
    hasSpinner: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should return handler and state", () => {
      const { handler, state } = createEventHandler(defaultOptions);
      expect(typeof handler).toBe("function");
      expect(state).toBeDefined();
    });

    it("should initialize state correctly", () => {
      const { state } = createEventHandler(defaultOptions);
      expect(state.outputBuffer).toBe("");
      expect(state.toolCallCount).toBe(0);
      expect(state.currentPhaseIndex).toBe(0);
      expect(state.phases).toHaveLength(6);
    });
  });

  describe("assistant.message_delta event", () => {
    it("should append delta to output buffer", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "assistant.message_delta",
        data: { deltaContent: "Hello " },
      } as any);

      handler({
        type: "assistant.message_delta",
        data: { deltaContent: "World" },
      } as any);

      expect(state.outputBuffer).toBe("Hello World");
    });
  });

  describe("assistant.message event", () => {
    it("should append full message to output buffer", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "assistant.message",
        data: { content: "Full message" },
      } as any);

      expect(state.outputBuffer).toBe("Full message");
    });

    it("should handle empty content", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "assistant.message",
        data: {},
      } as any);

      expect(state.outputBuffer).toBe("");
    });

    it("should avoid duplicating content when delta and full message are both emitted", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "assistant.message_delta",
        data: { deltaContent: "Hello " },
      } as any);

      handler({
        type: "assistant.message_delta",
        data: { deltaContent: "World" },
      } as any);

      handler({
        type: "assistant.message",
        data: { content: "Hello World" },
      } as any);

      expect(state.outputBuffer).toBe("Hello World");
    });
  });

  describe("tool.execution_start event", () => {
    it("should increment tool call count", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "tool.execution_start",
        data: { toolName: "get_repo_meta" },
      } as any);

      expect(state.toolCallCount).toBe(1);

      handler({
        type: "tool.execution_start",
        data: { toolName: "list_repo_files" },
      } as any);

      expect(state.toolCallCount).toBe(2);
    });

    it("should update phase for meta tool", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "tool.execution_start",
        data: { toolName: "get_repo_meta" },
      } as any);

      expect(state.phases[0].status).toBe("running");
    });

    it("should update phase for list tool", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "tool.execution_start",
        data: { toolName: "list_repo_files" },
      } as any);

      expect(state.phases[0].status).toBe("done");
      expect(state.phases[1].status).toBe("running");
      expect(state.currentPhaseIndex).toBe(1);
    });

    it("should update phase for read tool", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      state.currentPhaseIndex = 2;

      handler({
        type: "tool.execution_start",
        data: { toolName: "read_repo_file" },
      } as any);

      expect(state.phases[1].status).toBe("done");
      expect(state.phases[2].status).toBe("done");
      expect(state.phases[3].status).toBe("running");
      expect(state.currentPhaseIndex).toBe(3);
    });
  });

  describe("session.idle event", () => {
    it("should mark all phases as done", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      // Set some phases to running
      state.phases[0].status = "done";
      state.phases[1].status = "running";
      state.phases[2].status = "pending";

      handler({ type: "session.idle" } as any);

      expect(state.phases.every((p) => p.status === "done")).toBe(true);
    });

    it("should not change error status", () => {
      const { handler, state } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      state.phases[2].status = "error";

      handler({ type: "session.idle" } as any);

      expect(state.phases[2].status).toBe("error");
    });
  });

  describe("silent mode", () => {
    it("should not write to stdout in silent mode", () => {
      const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

      const { handler } = createEventHandler({
        ...defaultOptions,
        silent: true,
      });

      handler({
        type: "assistant.message_delta",
        data: { deltaContent: "test" },
      } as any);

      expect(writeSpy).not.toHaveBeenCalled();
      writeSpy.mockRestore();
    });
  });
});
