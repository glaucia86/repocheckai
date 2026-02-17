/**
 * Tests for Publish Report
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishReport } from "../../../src/application/core/publish/publishReport.js";
import type { PublishTarget } from "../../../src/domain/types/publish.js";

// Mock dependencies
vi.mock("../../../src/infrastructure/providers/githubPublish.js", () => ({
  createIssue: vi.fn(),
}));

vi.mock("../../../src/infrastructure/providers/github.js", () => ({
  isAuthenticated: vi.fn(),
}));

vi.mock("../../../src/application/core/publish/reportBuilder.js", () => ({
  buildPublishReport: vi.fn(),
  extractPotentialIssues: vi.fn(),
}));

vi.mock("../../../src/application/core/publish/labels.js", () => ({
  buildIssueLabels: vi.fn((categories: string[]) => categories.map((c: string) => `repocheckai:${c}`)),
}));

import { createIssue } from "../../../src/infrastructure/providers/githubPublish.js";
import { isAuthenticated } from "../../../src/infrastructure/providers/github.js";
import { buildPublishReport, extractPotentialIssues } from "../../../src/application/core/publish/reportBuilder.js";

describe("publishReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication checks", () => {
    it("should return null when target is not specified", async () => {
      const result = await publishReport({
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
      });

      expect(result).toBeNull();
    });

    it("should return error when not authenticated", async () => {
      vi.mocked(isAuthenticated).mockReturnValue(false);

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
      });

      expect(result).toEqual({
        ok: false,
        target: "issue",
        error: {
          type: "missing_token",
          message: "Missing GitHub token for publishing.",
        },
      });
    });

    it("should proceed when authenticated", async () => {
      vi.mocked(isAuthenticated).mockReturnValue(true);
      vi.mocked(buildPublishReport).mockReturnValue({
        markdown: "# Test Report",
        report: {
          summary: ["Test"],
          keyFindings: ["Finding"],
          recommendedActions: ["Action"],
          generatedAt: new Date().toISOString(),
          source: "RepoCheckAI",
        },
      });
      vi.mocked(extractPotentialIssues).mockReturnValue([]);
      vi.mocked(createIssue).mockResolvedValue("https://github.com/test/repo/issues/1");

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result?.ok).toBe(true);
      expect(isAuthenticated).toHaveBeenCalledWith("ghp_test123");
    });
  });

  describe("single issue creation", () => {
    beforeEach(() => {
      vi.mocked(isAuthenticated).mockReturnValue(true);
      vi.mocked(extractPotentialIssues).mockReturnValue([]);
      vi.mocked(buildPublishReport).mockReturnValue({
        markdown: "# Test Report\n\nThis is a test report.",
        report: {
          summary: ["Overall: Good"],
          keyFindings: ["No major issues"],
          recommendedActions: ["Keep it up"],
          generatedAt: new Date().toISOString(),
          source: "RepoCheckAI",
        },
      });
    });

    it("should create a single issue when no potential issues found", async () => {
      vi.mocked(createIssue).mockResolvedValue("https://github.com/test/repo/issues/1");

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result).toEqual({
        ok: true,
        target: "issue",
        targetUrl: "https://github.com/test/repo/issues/1",
      });

      expect(createIssue).toHaveBeenCalledTimes(1);
      expect(createIssue).toHaveBeenCalledWith({
        owner: "test",
        repo: "repo",
        title: "RepoCheckAI Report: test/repo",
        body: "# Test Report\n\nThis is a test report.",
        labels: expect.any(Array),
        token: "ghp_test123",
      });
    });

    it("should use inferred categories for labels", async () => {
      vi.mocked(createIssue).mockResolvedValue("https://github.com/test/repo/issues/1");

      const analysisContent = `
## 🩺 Repository Health Report

### Docs & Onboarding
Documentation needs work

### CI/CD
Pipeline is missing

### Tests
Test coverage is low
`;

      await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent,
        token: "ghp_test123",
      });

      expect(createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: expect.arrayContaining([
            "repocheckai:docs",
            "repocheckai:ci",
            "repocheckai:tests",
          ]),
        })
      );
    });

    it("should use provided categories when available", async () => {
      vi.mocked(createIssue).mockResolvedValue("https://github.com/test/repo/issues/1");

      await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
        categories: ["security", "governance"],
      });

      expect(createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: expect.arrayContaining([
            "repocheckai:security",
            "repocheckai:governance",
          ]),
        })
      );
    });
  });

  describe("multiple issues creation from potential issues", () => {
    beforeEach(() => {
      vi.mocked(isAuthenticated).mockReturnValue(true);
      vi.mocked(buildPublishReport).mockReturnValue({
        markdown: "# Test Report",
        report: {
          summary: ["Test"],
          keyFindings: ["Finding"],
          recommendedActions: ["Action"],
          generatedAt: new Date().toISOString(),
          source: "RepoCheckAI",
        },
      });
    });

    it("should create separate issues for each potential issue", async () => {
      vi.mocked(extractPotentialIssues).mockReturnValue([
        {
          title: "Missing Tests",
          summary: "No test files found",
          impact: "Code quality cannot be verified",
          fix: "Add unit tests with Vitest",
        },
        {
          title: "No CI Pipeline",
          summary: "No GitHub Actions workflows",
          impact: "No automated testing",
          fix: "Create .github/workflows/ci.yml",
        },
      ]);

      vi.mocked(createIssue)
        .mockResolvedValueOnce("https://github.com/test/repo/issues/2")
        .mockResolvedValueOnce("https://github.com/test/repo/issues/3");

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result).toEqual({
        ok: true,
        target: "issue",
        targetUrls: [
          "https://github.com/test/repo/issues/2",
          "https://github.com/test/repo/issues/3",
        ],
      });

      expect(createIssue).toHaveBeenCalledTimes(2);
      
      // Check first issue
      const firstCall = vi.mocked(createIssue).mock.calls[0]?.[0];
      expect(firstCall).toBeDefined();
      expect(firstCall?.owner).toBe("test");
      expect(firstCall?.repo).toBe("repo");
      expect(firstCall?.title).toBe("[RepoCheckAI] tests: Missing Tests");
      expect(firstCall?.body).toContain("## Summary");
      expect(firstCall?.body).toContain("No test files found");
      expect(firstCall?.body).toContain("## Impact");
      expect(firstCall?.body).toContain("Code quality cannot be verified");
      expect(firstCall?.body).toContain("## Recommended Fix");
      expect(firstCall?.body).toContain("Add unit tests with Vitest");
      expect(firstCall?.labels).toEqual(expect.arrayContaining(["repocheckai:tests", "p2"]));
      expect(firstCall?.token).toBe("ghp_test123");

      // Check second issue
      const secondCall = vi.mocked(createIssue).mock.calls[1]?.[0];
      expect(secondCall).toBeDefined();
      expect(secondCall?.owner).toBe("test");
      expect(secondCall?.repo).toBe("repo");
      expect(secondCall?.title).toBe("[RepoCheckAI] ci: No CI Pipeline");
      expect(secondCall?.body).toContain("No GitHub Actions workflows");
      expect(secondCall?.body).toContain("No automated testing");
      expect(secondCall?.body).toContain("Create .github/workflows/ci.yml");
      expect(secondCall?.labels).toEqual(expect.arrayContaining(["repocheckai:ci", "p2"]));
      expect(secondCall?.token).toBe("ghp_test123");
    });

    it("should infer priority from issue text", async () => {
      vi.mocked(extractPotentialIssues).mockReturnValue([
        {
          title: "Critical Security Issue",
          summary: "P0 critical vulnerability found",
          impact: "High impact",
          fix: "Fix immediately",
        },
        {
          title: "High Priority Bug",
          summary: "P1 high priority issue",
          impact: "Medium impact",
          fix: "Fix soon",
        },
        {
          title: "Minor Suggestion",
          summary: "P2 suggestion for improvement",
          impact: "Low impact",
          fix: "Consider fixing",
        },
      ]);

      vi.mocked(createIssue)
        .mockResolvedValueOnce("https://github.com/test/repo/issues/1")
        .mockResolvedValueOnce("https://github.com/test/repo/issues/2")
        .mockResolvedValueOnce("https://github.com/test/repo/issues/3");

      await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(createIssue).toHaveBeenCalledTimes(3);
      
      // P0 issue
      expect(createIssue).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          labels: expect.arrayContaining(["p0"]),
        })
      );

      // P1 issue
      expect(createIssue).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          labels: expect.arrayContaining(["p1"]),
        })
      );

      // P2 issue
      expect(createIssue).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          labels: expect.arrayContaining(["p2"]),
        })
      );
    });

    it("should infer category from issue content", async () => {
      vi.mocked(extractPotentialIssues).mockReturnValue([
        {
          title: "Missing README",
          summary: "No documentation found",
          impact: "Users can't understand the project",
          fix: "Create README.md",
        },
        {
          title: "Vulnerable Dependency",
          summary: "Security vulnerability in package",
          impact: "Potential security breach",
          fix: "Update package",
        },
        {
          title: "Test Coverage Low",
          summary: "Only 30% test coverage",
          impact: "Code quality issues",
          fix: "Add more unit tests",
        },
      ]);

      vi.mocked(createIssue)
        .mockResolvedValueOnce("https://github.com/test/repo/issues/1")
        .mockResolvedValueOnce("https://github.com/test/repo/issues/2")
        .mockResolvedValueOnce("https://github.com/test/repo/issues/3");

      await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      // Check categories
      expect(createIssue).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          title: "[RepoCheckAI] docs: Missing README",
          labels: expect.arrayContaining(["repocheckai:docs"]),
        })
      );

      expect(createIssue).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          title: "[RepoCheckAI] security: Vulnerable Dependency",
          labels: expect.arrayContaining(["repocheckai:security"]),
        })
      );

      expect(createIssue).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          title: "[RepoCheckAI] tests: Test Coverage Low",
          labels: expect.arrayContaining(["repocheckai:tests"]),
        })
      );
    });

    it("should format issue body correctly", async () => {
      vi.mocked(extractPotentialIssues).mockReturnValue([
        {
          title: "Test Issue",
          summary: "This is the summary",
          evidence: "Evidence from code",
          impact: "This is the impact",
          fix: "This is the fix",
        },
      ]);

      vi.mocked(createIssue).mockResolvedValue("https://github.com/test/repo/issues/1");

      await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      const issueBody = vi.mocked(createIssue).mock.calls[0]?.[0]?.body;
      expect(issueBody).toContain("## Summary");
      expect(issueBody).toContain("This is the summary");
      expect(issueBody).toContain("## Evidence");
      expect(issueBody).toContain("Evidence from code");
      expect(issueBody).toContain("## Impact");
      expect(issueBody).toContain("This is the impact");
      expect(issueBody).toContain("## Recommended Fix");
      expect(issueBody).toContain("This is the fix");
      expect(issueBody).toContain("_Generated by RepoCheckAI._");
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      vi.mocked(isAuthenticated).mockReturnValue(true);
      vi.mocked(buildPublishReport).mockReturnValue({
        markdown: "# Test Report",
        report: {
          summary: ["Test"],
          keyFindings: ["Finding"],
          recommendedActions: ["Action"],
          generatedAt: new Date().toISOString(),
          source: "RepoCheckAI",
        },
      });
      vi.mocked(extractPotentialIssues).mockReturnValue([]);
    });

    it("should handle 401 authentication errors", async () => {
      const error = new Error("Unauthorized");
      (error as { status?: number }).status = 401;
      vi.mocked(createIssue).mockRejectedValue(error);

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_invalid",
      });

      expect(result).toEqual({
        ok: false,
        target: "issue",
        error: {
          type: "permission",
          message: "Unauthorized",
        },
      });
    });

    it("should handle 403 rate limit errors", async () => {
      const error = new Error("Rate limit exceeded");
      (error as { status?: number }).status = 403;
      vi.mocked(createIssue).mockRejectedValue(error);

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result).toEqual({
        ok: false,
        target: "issue",
        error: {
          type: "rate_limited",
          message: "Rate limit exceeded",
        },
      });
    });

    it("should handle 403 permission errors", async () => {
      const error = new Error("Forbidden");
      (error as { status?: number }).status = 403;
      vi.mocked(createIssue).mockRejectedValue(error);

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result).toEqual({
        ok: false,
        target: "issue",
        error: {
          type: "permission",
          message: "Forbidden",
        },
      });
    });

    it("should handle 404 not found errors", async () => {
      const error = new Error("Repository not found");
      (error as { status?: number }).status = 404;
      vi.mocked(createIssue).mockRejectedValue(error);

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "nonexistent",
          fullName: "test/nonexistent",
          url: "https://github.com/test/nonexistent",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result).toEqual({
        ok: false,
        target: "issue",
        error: {
          type: "not_found",
          message: "Repository not found",
        },
      });
    });

    it("should handle unknown errors", async () => {
      const error = new Error("Something went wrong");
      vi.mocked(createIssue).mockRejectedValue(error);

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result).toEqual({
        ok: false,
        target: "issue",
        error: {
          type: "unknown",
          message: "Something went wrong",
        },
      });
    });

    it("should handle non-Error objects", async () => {
      vi.mocked(createIssue).mockRejectedValue("string error");

      const result = await publishReport({
        target: "issue" as PublishTarget,
        repo: {
          owner: "test",
          name: "repo",
          fullName: "test/repo",
          url: "https://github.com/test/repo",
        },
        analysisContent: "test content",
        token: "ghp_test123",
      });

      expect(result).toEqual({
        ok: false,
        target: "issue",
        error: {
          type: "unknown",
          message: "Unknown publish error",
        },
      });
    });
  });
});

