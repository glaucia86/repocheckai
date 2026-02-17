/**
 * Tests for Report Extractor
 */

import { describe, it, expect } from "vitest";
import {
  extractReportOnly,
  removeDuplicateSections,
  generateCondensedSummary,
} from "../../../src/presentation/cli/parsers/reportExtractor.js";

describe("reportExtractor", () => {
  describe("extractReportOnly", () => {
    it("should extract health report from full output", () => {
      const input = `
**PHASE 1 — RECONNAISSANCE**
Some debug output here

## 🩺 Repository Health Report

**Repository:** vercel/next.js
**Health Score:** 85%

Some findings here
`;
      const result = extractReportOnly(input);
      expect(result).toContain("🩺 Repository Health Report");
      expect(result).toContain("vercel/next.js");
      expect(result).not.toContain("PHASE 1");
    });

    it("should remove npm warnings and noise", () => {
      const input = `
npm warn deprecated package@1.0.0
npm WARN old warning
(node:12345) ExperimentalWarning: feature is experimental

## 🩺 Repository Health Report
Clean content here
`;
      const result = extractReportOnly(input);
      expect(result).not.toContain("npm warn");
      expect(result).not.toContain("npm WARN");
      expect(result).not.toContain("ExperimentalWarning");
      expect(result).toContain("Clean content here");
    });

    it("should remove phase markers", () => {
      const input = `
**PHASE 1 — RECONNAISSANCE**
**PHASE 2 — STACK DETECTION**
## 🩺 Repository Health Report
Content
`;
      const result = extractReportOnly(input);
      expect(result).not.toMatch(/\*\*PHASE \d+/);
    });

    it("should remove inline duplicated phase markers on the same line", () => {
      const input = `
**PHASE 1 — RECONNAISSANCE****PHASE 2 — STACK DETECTION**
## 🩺 Repository Health Report
Content
`;
      const result = extractReportOnly(input);
      expect(result).not.toContain("PHASE 1");
      expect(result).not.toContain("PHASE 2");
      expect(result).toContain("Repository Health Report");
    });

    it("should keep only the last health report when duplicates exist", () => {
      const input = `
## 🩺 Repository Health Report
**Repository:** wrong/repo

## 🩺 Repository Health Report
**Repository:** right/repo
`;
      const result = extractReportOnly(input);
      expect(result).not.toContain("wrong/repo");
      expect(result).toContain("right/repo");
    });

    it("should remove assistant meta narration around deep analysis", () => {
      const input = `
## 🩺 Repository Health Report
**Repository:** test/repo

Let me read the packed repository content:
Let me continue viewing the source code sections:
Based on my comprehensive analysis of the packed repository content, I now have sufficient information to generate the deep analysis section.

## 🔬 Deep Analysis
Content
`;
      const result = extractReportOnly(input);
      expect(result).not.toContain("Let me read");
      expect(result).not.toContain("Let me continue");
      expect(result).not.toContain("Based on my comprehensive analysis");
      expect(result).toContain("## 🔬 Deep Analysis");
    });

    it("should recalculate category issue counts from findings headings", () => {
      const input = `
## 🩺 Repository Health Report

### 📊 Health Score: 60%

| Category | Score | Issues |
|----------|-------|--------|
| 📚 Docs & Onboarding | 80% | 0 |
| ⚡ Developer Experience | 80% | 0 |
| 🔄 CI/CD | 80% | 0 |
| 🧪 Quality & Tests | 80% | 0 |
| 📋 Governance | 80% | 0 |
| 🔐 Security | 80% | 0 |

### 🚨 P0 — Critical Issues
#### No CI/CD Pipeline

### ⚠️ P1 — High Priority
#### No Test Suite
#### No CONTRIBUTING Guide
#### No SECURITY.md Policy
`;
      const result = extractReportOnly(input);
      expect(result).toContain("| 🔄 CI/CD | 80% | 1 |");
      expect(result).toContain("| 🧪 Quality & Tests | 80% | 1 |");
      expect(result).toContain("| 📋 Governance | 80% | 1 |");
      expect(result).toContain("| 🔐 Security | 80% | 1 |");
    });

    it("should demote inconclusive findings to Verify First", () => {
      const input = `
## 🩺 Repository Health Report

### ⚠️ P1 — High Priority
#### No Lockfile Visible

**Evidence found:**
- File tree does NOT include package-lock.json
- Note: The lockfile might exist but wasn't returned in file listing. Verify its presence in the repository root.
`;
      const result = extractReportOnly(input);
      expect(result).toContain("#### Verify First: No Lockfile Visible");
      expect(result).toContain("**Confidence:** Lockfile absence is not conclusively proven");
    });

    it("should demote lockfile claim to Verify First when evidence is indirect", () => {
      const input = `
## 🩺 Repository Health Report

### 🚨 P0 — Critical Issues
#### No Lockfile Committed

**Evidence found:**
- Lockfile search results: package-lock.json ❌, yarn.lock ❌, pnpm-lock.yaml ❌
- File tree listing did not show lockfile
`;
      const result = extractReportOnly(input);
      expect(result).toContain("#### Verify First: No Lockfile Committed");
      expect(result).toContain("Lockfile absence is not conclusively proven");
    });

    it("should keep lockfile claim assertive when package-lock 404 evidence is explicit", () => {
      const input = `
## 🩺 Repository Health Report

### 🚨 P0 — Critical Issues
#### No Lockfile Committed

**Evidence found:**
- GET /repos/acme/demo/contents/package-lock.json - 404
- package-lock.json request returned 404
`;
      const result = extractReportOnly(input);
      expect(result).toContain("#### No Lockfile Committed");
      expect(result).not.toContain("#### Verify First: No Lockfile Committed");
    });

    it("should rewrite absolute CI missing claim when workflows are detected", () => {
      const input = `
## 🩺 Repository Health Report

### 🚨 P0 — Critical Issues
#### No CI/CD Pipeline

**Evidence found:**
- .github/workflows/ directory detected in file tree (ci.yml, pages.yml)
- Workflow files returned 404 when accessed
`;
      const result = extractReportOnly(input);
      expect(result).toContain("#### CI/CD Configuration Inconsistent");
      expect(result).not.toContain("#### No CI/CD Pipeline");
    });

    it("should keep CI missing claim when ci.yml is only mentioned as a recommendation", () => {
      const input = `
## 🩺 Repository Health Report

### 🚨 P0 — Critical Issues
#### No CI/CD Pipeline

**Evidence found:**
- No .github/workflows directory was found in repository root listing

**Recommended fix:**
- Create .github/workflows/ci.yml to run lint/test on pull requests
`;
      const result = extractReportOnly(input);
      expect(result).toContain("#### No CI/CD Pipeline");
      expect(result).not.toContain("#### CI/CD Configuration Inconsistent");
    });

    it("should not count deep analysis headings in category issue table", () => {
      const input = `
## 🩺 Repository Health Report

### 📊 Health Score: 70%
| Category | Score | Issues |
|----------|-------|--------|
| 📚 Docs & Onboarding | 80% | 0 |
| ⚡ Developer Experience | 80% | 0 |
| 🔄 CI/CD | 80% | 0 |
| 🧪 Quality & Tests | 80% | 0 |
| 📋 Governance | 80% | 0 |
| 🔐 Security | 80% | 0 |

### ⚠️ P1 — High Priority
#### No CONTRIBUTING Guide

## 🔬 Deep Analysis
#### Many Internal Headings
#### Another Heading
`;
      const result = extractReportOnly(input);
      expect(result).toContain("| 📋 Governance | 80% | 1 |");
      expect(result).not.toContain("| 📋 Governance | 80% | 3 |");
    });

    it("should handle deep analysis output", () => {
      const input = `
## Evidence Extraction

Some evidence here

## 🔬 Deep Analysis

Deep findings
`;
      const result = extractReportOnly(input);
      expect(result).toContain("Evidence Extraction");
    });
  });

  describe("removeDuplicateSections", () => {
    it("should keep section with more content when duplicates exist", () => {
      const input = `
## Section A
Short

## Section B
Some content

## Section A
Longer content with more details (should keep this)
`;
      const result = removeDuplicateSections(input);
      // Should keep the longer content
      expect(result).toContain("Longer content with more details");
      expect(result).not.toContain("Short\n");
    });

    it("should preserve original document order for first occurrence", () => {
      const input = `
## First
Content 1

## Second
Content 2

## First
Content 1 again (duplicate, uses first position but better content if longer)
`;
      const result = removeDuplicateSections(input);
      // Section A should still appear before Section B (original order)
      const firstIndex = result.indexOf("## First");
      const secondIndex = result.indexOf("## Second");
      expect(firstIndex).toBeLessThan(secondIndex);
    });

    it("should preserve section order", () => {
      const input = `
## First
Content 1

## Second
Content 2

## Third
Content 3
`;
      const result = removeDuplicateSections(input);
      const firstIndex = result.indexOf("First");
      const secondIndex = result.indexOf("Second");
      const thirdIndex = result.indexOf("Third");
      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });
  });

  describe("generateCondensedSummary", () => {
    it("should generate summary with repo name", () => {
      const content = "## 🩺 Repository Health Report\n**Health Score:** 85%";
      const result = generateCondensedSummary(content, "vercel/next.js");
      expect(result).toContain("Quick Summary: vercel/next.js");
    });

    it("should extract health score", () => {
      const content = "Health Score: 75%";
      const result = generateCondensedSummary(content, "test/repo");
      expect(result).toContain("75%");
    });

    it("should include issues count section", () => {
      const content = "🚨 Critical issue\n⚠️ Warning\n💡 Suggestion";
      const result = generateCondensedSummary(content, "test/repo");
      expect(result).toContain("Issues Found");
    });
  });
});
