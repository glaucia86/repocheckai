/**
 * Tests for Report Builder
 */

import { describe, it, expect } from "vitest";
import {
  buildPublishReport,
  extractPotentialIssues,
} from "../../../src/application/core/publish/reportBuilder.js";

describe("reportBuilder", () => {
  describe("buildPublishReport", () => {
    it("should extract and format a basic health report", () => {
      const input = `
## 🩺 Repository Health Report

**Repository:** test/repo
**Health Score:** 75%

### 🔍 Summary
- Overall health: 75%
- Tests present: Yes
- Documentation: Needs improvement

### 🚨 Key Findings
- Missing CI/CD configuration
- Test coverage is low (45%)
- No CONTRIBUTING.md file

### ✅ Recommended Actions
- Set up GitHub Actions workflow
- Increase test coverage to 80%
- Add contribution guidelines
`;

      const result = buildPublishReport({
        content: input,
        repoFullName: "test/repo",
      });

      expect(result.markdown).toContain("🩺 Repo Check AI Report");
      expect(result.markdown).toContain("Summary");
      expect(result.markdown).toContain("Key Findings");
      expect(result.markdown).toContain("Recommended Actions");

      expect(result.report.summary).toHaveLength(3);
      expect(result.report.keyFindings).toHaveLength(3);
      expect(result.report.recommendedActions).toHaveLength(3);

      expect(result.report.summary[0]).toContain("Overall health: 75%");
      expect(result.report.keyFindings[0]).toContain("Missing CI/CD configuration");
      expect(result.report.recommendedActions[0]).toContain("Set up GitHub Actions workflow");
    });

    it("should handle report with table format in summary", () => {
      const input = `
## 🩺 Repository Health Report

### 📊 Health Score

| Category | Score |
|----------|-------|
| Docs | 60% |
| CI/CD | 80% |
| Tests | 70% |

### 🚨 Key Findings
- Good test coverage
- CI pipeline configured

### ✅ Recommended Actions
- Improve documentation
`;

      const result = buildPublishReport({
        content: input,
        repoFullName: "test/repo",
      });

      expect(result.report.summary).toHaveLength(3);
      expect(result.report.summary[0]).toContain("Docs: 60%");
      expect(result.report.summary[1]).toContain("CI/CD: 80%");
      expect(result.report.summary[2]).toContain("Tests: 70%");
    });

    it("should handle missing sections with fallbacks", () => {
      const input = `
## 🩺 Repository Health Report

Some minimal content without structured sections.
`;

      const result = buildPublishReport({
        content: input,
        repoFullName: "test/repo",
      });

      expect(result.markdown).toBeDefined();
      expect(result.report.summary).toBeDefined();
      expect(result.report.keyFindings).toBeDefined();
      expect(result.report.recommendedActions).toBeDefined();

      // Should have fallback messages
      expect(result.report.summary.length).toBeGreaterThan(0);
      expect(result.report.keyFindings.length).toBeGreaterThan(0);
      expect(result.report.recommendedActions.length).toBeGreaterThan(0);
    });

    it("should handle completely empty or invalid content", () => {
      const input = `
Some random text without any health report structure.
No headers, no findings, nothing useful.
`;

      const result = buildPublishReport({
        content: input,
        repoFullName: "test/repo",
      });

      expect(result.markdown).toContain("🩺 Repo Check AI Report");
      // Should generate fallback report
      expect(result.report.summary[0]).toContain("Analysis may have failed");
    });

    it("should extract numbered list items from actions", () => {
      const input = `
## 🩺 Repository Health Report

### 🚨 Key Findings
- Finding one
- Finding two

### ✅ Recommended Actions
1. First action item
2. Second action item
3. Third action item
`;

      const result = buildPublishReport({
        content: input,
        repoFullName: "test/repo",
      });

      expect(result.report.recommendedActions).toHaveLength(3);
      expect(result.report.recommendedActions[0]).toContain("First action item");
      expect(result.report.recommendedActions[1]).toContain("Second action item");
      expect(result.report.recommendedActions[2]).toContain("Third action item");
    });

    it("should include metadata in the report", () => {
      const input = `
## 🩺 Repository Health Report

### 🔍 Summary
- Test summary

### 🚨 Key Findings
- Test finding

### ✅ Recommended Actions
- Test action
`;

      const result = buildPublishReport({
        content: input,
        repoFullName: "test/repo",
      });

      expect(result.report.generatedAt).toBeDefined();
      expect(result.report.source).toBe("Repo Check AI");
      expect(new Date(result.report.generatedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should handle reports with phase markers and noise", () => {
      const input = `
**PHASE 1 — RECONNAISSANCE**
Loading repository metadata...

npm warn deprecated package@1.0.0

## 🩺 Repository Health Report

### 🔍 Summary
- Clean summary item

### 🚨 Key Findings
- Clean finding

### ✅ Recommended Actions
- Clean action
`;

      const result = buildPublishReport({
        content: input,
        repoFullName: "test/repo",
      });

      // Should extract clean content without phase markers
      expect(result.report.summary[0]).toBe("Clean summary item");
      expect(result.report.keyFindings[0]).toBe("Clean finding");
      expect(result.report.recommendedActions[0]).toBe("Clean action");
    });
  });

  describe("extractPotentialIssues", () => {
    it("should extract issues from Potential Issues section", () => {
      const input = `
## 🩺 Repository Health Report

### 🐛 Potential Issues

#### Issue 1: Missing Security Policy

**Issue:** No SECURITY.md file found in the repository
**Impact:** Users don't know how to report security vulnerabilities
**Fix:** Create a SECURITY.md file with vulnerability reporting instructions

#### Issue 2: Outdated Dependencies

**Issue:** Several npm packages are outdated
**Impact:** Security vulnerabilities and missing features
**Fix:** Run npm update and test thoroughly
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(2);
      expect(issues[0]?.title).toBe("Missing Security Policy");
      expect(issues[0]?.summary).toContain("No SECURITY.md file");
      expect(issues[0]?.impact).toContain("report security vulnerabilities");
      expect(issues[0]?.fix).toContain("Create a SECURITY.md file");

      expect(issues[1]?.title).toBe("Outdated Dependencies");
      expect(issues[1]?.summary).toContain("npm packages are outdated");
    });

    it("should extract issues with bold format", () => {
      const input = `
## 🩺 Repository Health Report

### 🐛 Potential Issues

**Issue 1: Missing Tests**

- **Issue:** No test files found
- **Impact:** Code quality cannot be verified
- **Recommended Fix:** Add unit tests with Jest or Vitest
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(1);
      expect(issues[0]?.title).toBe("Missing Tests");
      expect(issues[0]?.summary).toContain("No test files found");
      expect(issues[0]?.impact).toContain("Code quality cannot be verified");
      expect(issues[0]?.fix).toContain("Add unit tests");
    });

    it("should handle issues with code blocks", () => {
      const input = `
## 🩺 Repository Health Report

### 🐛 Potential Issues

#### Issue 1: Hardcoded API Key

From \`src/config.js\`:
\`\`\`javascript
const API_KEY = "sk-1234567890abcdef";
\`\`\`

**Issue:** API key is hardcoded in source code
**Impact:** Security vulnerability - key could be exposed
**Fix:** Move API key to environment variables
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(1);
      expect(issues[0]?.title).toBe("Hardcoded API Key");
      expect(issues[0]?.evidence).toContain("src/config.js");
      expect(issues[0]?.evidence).toContain("sk-1234567890abcdef");
      expect(issues[0]?.fix).toContain("environment variables");
    });

    it("should return empty array when no issues found", () => {
      const input = `
## 🩺 Repository Health Report

### 🔍 Summary
Everything looks good!

### 🚨 Key Findings
- All checks passed
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(0);
    });

    it("should extract critical issues from condensed report", () => {
      const input = `
## 🩺 Repository Health Report

### 🔍 Summary
- Overall health: Good

### 🚨 Key Findings
- 🚨 Critical: No CI/CD pipeline configured
- ⚠️ Warning: Low test coverage

### ✅ Recommended Actions
- **Set up GitHub Actions** (P0)
- **Increase test coverage** (P1)
- Improve documentation (P2)
`;

      const issues = extractPotentialIssues(input);

      expect(issues.length).toBeGreaterThan(0);
      // Should extract at least the P0 action and critical finding
      const titles = issues.map((i) => i.title);
      expect(titles.some((t) => t.includes("Set up GitHub Actions") || t.includes("CI/CD"))).toBe(true);
    });

    it("should handle issues with alternative formats", () => {
      const input = `
## 🩺 Repository Health Report

### 🐛 Potential Issues

#### Missing README

**Issue:** No README.md file
**Impact:** Users cannot understand project purpose
**Recommendation:** Create comprehensive README.md

#### No License

**Issue:** Missing LICENSE file
**Impact:** Legal ambiguity for users
**Recommended Action:** Add MIT or Apache 2.0 license
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(2);
      expect(issues[0]?.title).toBe("Missing README");
      expect(issues[1]?.title).toBe("No License");
      // Should handle various fix field names
      expect(issues[0]?.fix).toContain("README.md");
      expect(issues[1]?.fix).toContain("MIT or Apache");
    });

    it("should handle multi-line fix content", () => {
      const input = `
## 🩺 Repository Health Report

### 🐛 Potential Issues

#### Issue 1: Configuration Issues

**Issue:** Multiple config problems detected
**Impact:** Build may fail in production
**Fix:** Update configuration:
1. Add .nvmrc file with Node 18
2. Update package.json engines field
3. Configure TypeScript strict mode

Some additional context here.
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(1);
      expect(issues[0]?.fix).toContain("Add .nvmrc file");
      expect(issues[0]?.fix).toContain("TypeScript strict mode");
    });

    it("should filter out empty or invalid issue blocks", () => {
      const input = `
## 🩺 Repository Health Report

### 🐛 Potential Issues

#### 

Empty issue block

#### Issue 1: Valid Issue

**Issue:** This is a valid issue
**Impact:** Has impact
**Fix:** Has fix
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(1);
      expect(issues[0]?.title).toBe("Valid Issue");
    });

    it("should handle reports without explicit impact", () => {
      const input = `
## 🩺 Repository Health Report

### 🐛 Potential Issues

#### Issue 1: Missing Tests

**Issue:** No test coverage
**Fix:** Add unit tests
`;

      const issues = extractPotentialIssues(input);

      expect(issues).toHaveLength(1);
      expect(issues[0]?.impact).toBeDefined();
      // Should use summary as impact fallback
      expect(issues[0]?.impact).toContain("No test coverage");
    });
  });
});

