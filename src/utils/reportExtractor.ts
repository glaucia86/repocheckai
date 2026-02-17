/**
 * Report Extractor
 * Single Responsibility: Extract and clean analysis reports from raw output
 */

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXTRACTOR
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extract only the final report from analysis output
 * Removes phase logs, debug messages, and keeps only the health report
 */
export function extractReportOnly(content: string): string {
  // Step 1: Remove common debug/noise patterns
  const cleaned = content
    // Remove local CLI subprocess prefix noise
    .replace(/^\[CLI subprocess\]\s*/gim, "")
    // Remove npm/repomix warnings and deprecation notices
    .replace(/npm warn.*\n?/gi, "")
    .replace(/npm notice.*\n?/gi, "")
    .replace(/npm WARN.*\n?/gi, "")
    .replace(/\(node:\d+\).*Warning:.*\n?/gi, "")
    .replace(/^\(Use `node --trace-warnings .*?\)\s*$/gim, "")
    .replace(/ExperimentalWarning:.*\n?/gi, "")
    .replace(/DeprecationWarning:.*\n?/gi, "")
    .replace(/^\s*⚡\s*Analysis timed out after .*$/gim, "")
    // Remove repomix progress/info messages
    .replace(/Repomix.*processing.*\n?/gi, "")
    .replace(/Packing repository.*\n?/gi, "")
    .replace(/Successfully packed.*\n?/gi, "")
    .replace(/\[repomix\].*\n?/gi, "")
    // Remove Repomix failure messages (may appear multiple times)
    .replace(/Repomix failed\..*?(?:analysis|read_repo_file)\.?\n?/gi, "")
    .replace(/Falling back to reading source files.*\n?/gi, "")
    // Remove phase markers from streaming output (line-based and inline duplicates)
    .replace(/^\*\*PHASE \d+.*\*\*\s*$/gm, "")
    .replace(/\*\*PHASE\s+\d+\s+[^\n*]+\*\*/gim, "")
    // Remove common assistant meta-narration that can leak into final output
    .replace(/^Now I have enough context.*\n?/gim, "")
    .replace(/^Let me generate.*\n?/gim, "")
    .replace(/^Let me\s+.*\n?/gim, "")
    .replace(/^I(?:'ve| have)\s+now\s+.*\n?/gim, "")
    .replace(/^Based on my comprehensive analysis.*\n?/gim, "")
    // Remove tool call annotations
    .replace(/^Calling tool:.*\n?/gm, "")
    .replace(/^Tool result:.*\n?/gm, "")
    // Remove duplicate blank lines
    .replace(/\n{4,}/g, "\n\n\n")
    // Trim leading/trailing whitespace from lines
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

  // Step 2: Prefer the last health report occurrence to avoid duplicated captures
  const lastReportMatch = findLastReportHeader(cleaned);
  if (lastReportMatch >= 0) {
    const report = cleaned.slice(lastReportMatch).trim();
    return normalizeReportConsistency(cleanAssistantNarration(removeDuplicateSections(report)));
  }

  // Step 3: Find the start of the report content
  // IMPORTANT: For deep analysis, we need to capture BOTH the health report AND the deep analysis section
  // Priority: Start from the Health Report header (which should include Deep Analysis section at the end)
  const reportStartPatterns = [
    // Standard report patterns (prioritized - start from the beginning of the full report)
    /^##?\s*🩺\s*Repository Health Report/m,
    /^##?\s*Repository Health Report/mi,
    /^##?\s*Health Report/mi,
    /^##\s*📊\s*Health Score/m,
    /^---\s*\n+##?\s*🩺/m,
    // Evidence sections (if report starts with evidence extraction)
    /^##?\s*Evidence Extraction/mi,
    /^##?\s*Evidence Collection Summary/mi,
    // Deep analysis section (fallback if no health report header found)
    // This should only match if there's no health report section
    /^##?\s*🔬\s*Deep Analysis/mi,
    // Phase headers (if the report starts with phases)
    /^\*\*PHASE \d+.*\*\*/m,
    // Any markdown header that might be the start
    /^##\s+[A-Z]/m,
  ];

  for (const pattern of reportStartPatterns) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      // Include content from the match onwards
      // If there's a "---" before, include it for proper markdown formatting
      let startIndex = match.index;
      const beforeMatch = cleaned.slice(Math.max(0, startIndex - 10), startIndex);
      if (beforeMatch.includes("---")) {
        startIndex = cleaned.lastIndexOf("---", startIndex);
      }
      const report = cleaned.slice(startIndex).trim();

      // Step 4: Remove duplicate sections (keep only last occurrence)
      return normalizeReportConsistency(cleanAssistantNarration(removeDuplicateSections(report)));
    }
  }

  // Fallback: if no report header found, try to find the first significant section
  // This handles cases where content before the main report header is orphaned
  const firstSectionMatch = cleaned.match(/^(##\s+[^\n]+)/m);
  if (firstSectionMatch && firstSectionMatch.index !== undefined) {
    // Check if there's orphaned content before this section (tables, partial text)
    const beforeSection = cleaned.slice(0, firstSectionMatch.index).trim();
    // If the content before is short or looks like a fragment, skip it
    if (beforeSection.length < 500 && !beforeSection.includes("## ")) {
      const report = cleaned.slice(firstSectionMatch.index).trim();
      return normalizeReportConsistency(cleanAssistantNarration(removeDuplicateSections(report)));
    }
  }

  // Final fallback: just clean and return
  return normalizeReportConsistency(
    cleanAssistantNarration(removeDuplicateSections(cleaned.trim()))
  );
}

function findLastReportHeader(content: string): number {
  const reportRegex = /^##?\s*(?:🩺\s*)?Repository Health Report\b/gmi;
  let lastIndex = -1;
  let match: RegExpExecArray | null = null;

  while ((match = reportRegex.exec(content)) !== null) {
    if (match.index !== undefined) {
      lastIndex = match.index;
    }
  }

  return lastIndex;
}

function cleanAssistantNarration(content: string): string {
  return content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;

      // Strip conversational bridge lines that are not part of report structure
      if (/^(let me|now i|i have now|i've now)\b/i.test(trimmed)) return false;
      if (/^based on my comprehensive analysis\b/i.test(trimmed)) return false;
      if (/^i now have sufficient information\b/i.test(trimmed)) return false;
      if (/^perfect!?\s*now i\b/i.test(trimmed)) return false;
      if (/^great!?\s*now i\b/i.test(trimmed)) return false;

      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizeReportConsistency(content: string): string {
  const withDeterministicRules = applyDeterministicFindingRules(content);
  const withVerify = demoteInconclusiveFindings(withDeterministicRules);
  return reconcileCategoryIssueCounts(withVerify);
}

function applyDeterministicFindingRules(content: string): string {
  let updated = content;

  // Rule: If workflows are detected/found, don't keep "No CI/CD Pipeline" absolute claim
  const workflowsDetected =
    /(workflows?\/|\bci\.yml\b|\bpages\.yml\b).{0,120}\b(detected|found|present|exists?)\b/i.test(updated) ||
    /\b(detected|found|present|exists?)\b.{0,120}(workflows?\/|\bci\.yml\b|\bpages\.yml\b)/i.test(updated);
  if (workflowsDetected) {
    updated = updated.replace(
      /^(####\s+(?:🚨\s+)?)(No CI\/CD Pipeline)\s*$/gim,
      "$1CI/CD Configuration Inconsistent"
    );
    updated = updated.replace(
      /\*\*Impact:\*\s*No automated validation[^\n]*/i,
      "**Impact:** CI signals exist, but workflow access/execution appears inconsistent, reducing trust in automated validation."
    );
  }

  return updated;
}

function demoteInconclusiveFindings(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];

  const isFindingHeader = (line: string): boolean => /^####\s+/.test(line.trim());
  const isSectionBoundary = (line: string): boolean => /^###\s+/.test(line.trim());
  const hasInconclusiveSignals = (block: string): boolean =>
    /(might exist|not visible|not returned in file listing|could not verify|verify(?:\s+its)?\s+presence|inconclusive)/i.test(
      block
    );
  const isLockfileClaim = (header: string): boolean => /lockfile|package-lock\.json|yarn\.lock|pnpm-lock\.yaml/i.test(header);
  const hasDefinitiveLockfileEvidence = (block: string): boolean =>
    /package-lock\.json.*404|404.*package-lock\.json|contents\/package-lock\.json.*404|read_repo_file.*package-lock\.json.*404/i.test(
      block
    );

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!isFindingHeader(line)) {
      out.push(line);
      i++;
      continue;
    }

    const block: string[] = [line];
    i++;
    while (i < lines.length) {
      const current = lines[i] ?? "";
      if (isFindingHeader(current) || isSectionBoundary(current)) break;
      block.push(current);
      i++;
    }

    const blockText = block.join("\n");
    const shouldDemoteForInconclusive = hasInconclusiveSignals(blockText);
    const shouldDemoteLockfile = isLockfileClaim(block[0] ?? "") && !hasDefinitiveLockfileEvidence(blockText);

    if (shouldDemoteForInconclusive || shouldDemoteLockfile) {
      const header = block[0] ?? "";
      if (!/verify first/i.test(header)) {
        block[0] = header.replace(/^####\s+/, "#### Verify First: ");
      }

      const hasConfidenceLine = block.some((l) => /^\*\*Confidence:\*\*/i.test(l.trim()));
      if (!hasConfidenceLine) {
        block.push("");
        block.push(
          shouldDemoteLockfile
            ? "**Confidence:** Lockfile absence is not conclusively proven; verify by directly checking repository root contents."
            : "**Confidence:** Needs verification against repository file listing."
        );
      }
    }

    out.push(...block);
  }

  return out.join("\n");
}

function reconcileCategoryIssueCounts(content: string): string {
  const lines = content.split("\n");
  type CategoryLabel =
    | "📚 Docs & Onboarding"
    | "⚡ Developer Experience"
    | "🔄 CI/CD"
    | "🧪 Quality & Tests"
    | "📋 Governance"
    | "🔐 Security";

  const categoryRows: Record<CategoryLabel, number> = {
    "📚 Docs & Onboarding": 0,
    "⚡ Developer Experience": 0,
    "🔄 CI/CD": 0,
    "🧪 Quality & Tests": 0,
    "📋 Governance": 0,
    "🔐 Security": 0,
  };

  const findings: string[] = [];
  let currentSection: "P0" | "P1" | "P2" | null = null;
  let inDeepAnalysis = false;

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? "").trim();
    if (/^##\s+🔬\s*Deep Analysis/i.test(line)) {
      inDeepAnalysis = true;
    }
    if (inDeepAnalysis) continue;

    if (/^###\s+.*\bP0\b/i.test(line)) currentSection = "P0";
    else if (/^###\s+.*\bP1\b/i.test(line)) currentSection = "P1";
    else if (/^###\s+.*\bP2\b/i.test(line)) currentSection = "P2";
    else if (/^###\s+/.test(line)) currentSection = null;

    const headingMatch = line.match(/^####\s+(.+)/);
    if (currentSection && headingMatch?.[1]) {
      findings.push(headingMatch[1].trim());
      continue;
    }

    if (currentSection === "P2") {
      const bullet = line.match(/^-+\s+\*\*(.+?)\*\*/)?.[1] ?? line.match(/^-+\s+([A-Za-z0-9][^`]*)/)?.[1];
      if (bullet) findings.push(bullet.trim());
    }
  }

  for (const finding of findings) {
    const category = classifyFindingCategory(finding);
    categoryRows[category]++;
  }

  const updated = lines.map((line) => {
    const rowMatch = line.match(
      /^\|\s*(📚 Docs & Onboarding|⚡ Developer Experience|🔄 CI\/CD|🧪 Quality & Tests|📋 Governance|🔐 Security)\s*\|\s*([^|]+)\|\s*([^|]+)\|$/
    );
    if (!rowMatch) return line;

    const categoryLabel = rowMatch[1]! as CategoryLabel;
    const score = rowMatch[2]!.trim();
    const issues = categoryRows[categoryLabel] ?? 0;
    return `| ${categoryLabel} | ${score} | ${issues} |`;
  });

  return updated.join("\n");
}

function classifyFindingCategory(
  title: string
):
  | "📚 Docs & Onboarding"
  | "⚡ Developer Experience"
  | "🔄 CI/CD"
  | "🧪 Quality & Tests"
  | "📋 Governance"
  | "🔐 Security" {
  const text = title.toLowerCase();
  const map = getCategoryMap();

  if (map.cicd.some((k) => text.includes(k))) return "🔄 CI/CD";
  if (map.security.some((k) => text.includes(k))) return "🔐 Security";
  if (map.quality.some((k) => text.includes(k))) return "🧪 Quality & Tests";
  if (map.docs.some((k) => text.includes(k))) return "📚 Docs & Onboarding";
  if (map.governance.some((k) => text.includes(k))) return "📋 Governance";
  if (map.devex.some((k) => text.includes(k))) return "⚡ Developer Experience";

  return "📋 Governance";
}

function getCategoryMap() {
  return {
    docs: ["readme", "documentation", "docs", "tutorial", "onboarding"],
    devex: ["node version", ".nvmrc", "engines", "lockfile", "developer experience"],
    cicd: ["ci/cd", "ci", "pipeline", "workflow", "github actions", "build verification"],
    quality: ["test", "coverage", "lint", "eslint", "prettier", "quality"],
    governance: [
      "license",
      "code of conduct",
      "issue template",
      "pull request template",
      "contributing",
      "governance",
      "changelog",
    ],
    security: ["security", "dependabot", "renovate", "vulnerability", "secret", "injection"],
  };
}

// ════════════════════════════════════════════════════════════════════════════
// DUPLICATE REMOVAL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Remove duplicate sections in markdown content
 * Keeps the last (most complete) occurrence of each major section
 *
 * Strategy:
 * 1. First pass: identify all sections and their positions
 * 2. For duplicates, keep the one with more content
 * 3. Rebuild in original document order (by first occurrence position)
 */
export function removeDuplicateSections(content: string): string {
  const lines = content.split("\n");

  interface SectionInfo {
    normalizedHeader: string;
    originalHeader: string;
    firstStart: number; // Position of FIRST occurrence (for ordering)
    lastStart: number; // Position of LAST occurrence (for content)
    content: string[];
    occurrenceCount: number;
  }

  const sections: Map<string, SectionInfo> = new Map();

  let currentHeader = "__intro__";
  let currentStart = 0;
  let currentLines: string[] = [];

  /**
   * Calculate total content size (characters) in a section
   */
  function getContentSize(lines: string[]): number {
    return lines.reduce((sum, line) => sum + line.length, 0);
  }

  function saveSection(_endIndex: number) {
    if (currentLines.length === 0) return;

    const normalizedHeader = currentHeader.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = sections.get(normalizedHeader);

    if (existing) {
      // Duplicate found - keep the one with more content (by character count)
      existing.occurrenceCount++;
      const currentSize = getContentSize(currentLines);
      const existingSize = getContentSize(existing.content);
      if (currentSize > existingSize) {
        existing.content = [...currentLines];
        existing.lastStart = currentStart;
      }
      // Keep firstStart unchanged (for ordering)
    } else {
      sections.set(normalizedHeader, {
        normalizedHeader,
        originalHeader: currentHeader,
        firstStart: currentStart,
        lastStart: currentStart,
        content: [...currentLines],
        occurrenceCount: 1,
      });
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headerMatch) {
      // Save previous section
      saveSection(i);

      currentHeader = headerMatch[2] || "__section__";
      currentStart = i;
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  // Save last section
  saveSection(lines.length);

  // Rebuild content - order by FIRST occurrence position (preserves document structure)
  const sortedSections = Array.from(sections.values()).sort(
    (a, b) => a.firstStart - b.firstStart
  );

  return sortedSections
    .map((section) => section.content.join("\n"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

// ════════════════════════════════════════════════════════════════════════════
// SUMMARY GENERATOR
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generate a condensed summary from a full analysis report
 */
export function generateCondensedSummary(content: string, repoName: string): string {
  const lines: string[] = [];

  // Header
  lines.push(`## 📋 Quick Summary: ${repoName}`);
  lines.push("");

  // Extract health score
  const scoreMatch =
    content.match(/Health Score[:\s]*(\d+)%/i) ||
    content.match(/Score[:\s]*(\d+)%/i) ||
    content.match(/(\d+)%\s*(?:health|score)/i);

  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]!, 10);
    const emoji = score >= 80 ? "🌟" : score >= 60 ? "👍" : score >= 40 ? "⚠️" : "🚨";
    lines.push(`**Health Score:** ${emoji} ${score}%`);
  }
  lines.push("");

  // Count issues by priority
  const p0Count = (content.match(/🚨|P0|Critical/gi) || []).length;
  const p1Count = (content.match(/⚠️|P1|High Priority/gi) || []).length;
  const p2Count = (content.match(/💡|P2|Suggestion/gi) || []).length;

  lines.push("### Issues Found");
  lines.push(`- 🚨 Critical (P0): ${Math.max(0, Math.floor(p0Count / 2))}`);
  lines.push(`- ⚠️ High Priority (P1): ${Math.max(0, Math.floor(p1Count / 2))}`);
  lines.push(`- 💡 Suggestions (P2): ${Math.max(0, Math.floor(p2Count / 2))}`);
  lines.push("");

  // Extract key issues (first 5 issue titles)
  const issuePatterns = [
    /#{2,4}\s*(?:🚨|⚠️|💡)?\s*(?:P[012][:\s-]*)?\s*(.+)/gm,
    /[-*]\s*\*\*(.+?)\*\*/gm,
  ];

  const issues: string[] = [];
  for (const pattern of issuePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null && issues.length < 5) {
      const title = match[1]?.trim();
      if (
        title &&
        title.length > 10 &&
        title.length < 100 &&
        !title.includes("Health") &&
        !title.includes("Score") &&
        !title.includes("Category")
      ) {
        issues.push(title);
      }
    }
  }

  if (issues.length > 0) {
    lines.push("### Top Issues");
    issues.forEach((issue, i) => {
      lines.push(`${i + 1}. ${issue}`);
    });
    lines.push("");
  }

  // Extract next steps if available
  const nextStepsMatch = content.match(/(?:Next Steps|Recommended).+?(?=#{1,3}|$)/is);
  if (nextStepsMatch) {
    const stepsContent = nextStepsMatch[0];
    const steps = stepsContent.match(/\d+\.\s*(.+)/g)?.slice(0, 3);
    if (steps && steps.length > 0) {
      lines.push("### Priority Actions");
      steps.forEach((step) => {
        lines.push(step);
      });
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("*Use `/export` for full report or `/copy` to clipboard*");

  return lines.join("\n");
}
