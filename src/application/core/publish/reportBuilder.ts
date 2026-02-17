import type { PublishableReport } from "../../../domain/types/publish.js";
import { extractReportOnly, generateCondensedSummary } from "../../../utils/reportExtractor.js";

export interface BuildReportInput {
  content: string;
  repoFullName?: string;
}

export interface PotentialIssue {
  title: string;
  summary?: string;
  evidence?: string;
  impact?: string;
  fix?: string;
  details?: string;
}

function sliceSection(content: string, headerRegexes: RegExp[]): string | null {
  const lines = content.split("\n");
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    if (headerRegexes.some((regex) => regex.test(lines[i] ?? ""))) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) return null;

  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^#{2,3}\s+/.test(lines[i] ?? "")) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end).join("\n").trim();
}

function extractBullets(section: string): string[] {
  const items: string[] = [];
  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (bulletMatch && bulletMatch[1]) {
      items.push(bulletMatch[1].trim());
      continue;
    }
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (numberedMatch && numberedMatch[1]) {
      items.push(numberedMatch[1].trim());
      continue;
    }
    const headingMatch = trimmed.match(/^####\s+(.+)/);
    if (headingMatch && headingMatch[1]) {
      items.push(headingMatch[1].trim().replace(/^\d+\.\s+/, ""));
    }
  }
  return items;
}

function extractSummaryFromTable(section: string): string[] {
  const lines = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));

  const rows = lines.filter((line) => !line.includes("---"));
  return rows
    .map((row) => row.split("|").map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 2)
    .filter((cells) => {
      const header = cells[0]?.toLowerCase();
      return header !== "category" && header !== "metric";
    })
    .map((cells) => `${cells[0]}: ${cells[1]}`);
}

function ensureFallback(items: string[], fallback: string): string[] {
  return items.length > 0 ? items : [fallback];
}

function slicePotentialIssuesSection(content: string): string | null {
  return sliceSection(content, [
    /^###\s+🐛\s*Potential Issues/m,
    /^##\s+🐛\s*Potential Issues/m,
    /^##\s+Potential Issues/m,
  ]);
}

function parsePotentialIssueBlock(block: string): PotentialIssue {
  const lines = block.split("\n").map((line) => line.trimEnd());
  const issueHeadingLine = lines.find((line) => /^\*\*Issue\s+\d+:/i.test(line));
  const headingLine = lines.find((line) => /^####\s+/.test(line)) || "";

  let title = "";
  if (issueHeadingLine) {
    title = issueHeadingLine.replace(/^\*\*Issue\s+\d+:/i, "").replace(/\*\*$/i, "").trim();
  } else {
    title = headingLine.replace(/^####\s+/, "").replace(/^Issue\s*\d+[:\s-]+/i, "").trim();
  }

  const issueLine = lines.find((line) => /\*\*Issue:\*\*/i.test(line));
  const impactLine = lines.find((line) => /\*\*Impact:\*\*/i.test(line));
  const fixLine = lines.find((line) => /\*\*(Fix|Recommended Fix|Recommendation|Recommended Action):\*\*/i.test(line));

  const summary = issueLine
    ? issueLine.replace(/^[-*]\s*\*\*Issue:\*\*\s*/i, "").trim()
    : undefined;
  const impact = impactLine
    ? impactLine.replace(/^[-*]\s*\*\*Impact:\*\*\s*/i, "").trim()
    : undefined;
  const fix = fixLine
    ? fixLine.replace(/^[-*]\s*\*\*(Fix|Recommended Fix|Recommendation|Recommended Action):\*\*\s*/i, "").trim()
    : undefined;

  // For potential issues without explicit impact, use the issue description as impact
  const finalImpact = impact || summary || "See analysis report for impact details.";

  // Extract full fix content including code blocks
  let fixContent = fix;
  if (fixLine) {
    const fixIndex = lines.indexOf(fixLine);
    const nextIssueIndex = lines.findIndex((line, i) => i > fixIndex && /^\*\*Issue\s+\d+:/i.test(line));
    const endIndex = nextIssueIndex >= 0 ? nextIssueIndex : lines.length;
    fixContent = lines.slice(fixIndex, endIndex).join("\n").replace(/^[-*]\s*\*\*(Fix|Recommended Fix|Recommendation|Recommended Action):\*\*\s*/i, "").trim();
  }

  const codeBlockMatch = block.match(/```[\s\S]*?```/m);
  const sourceLine = lines.find((line) => /^From\s+`.+`:/i.test(line));
  const evidenceParts: string[] = [];
  if (sourceLine) evidenceParts.push(sourceLine.trim());
  if (codeBlockMatch) evidenceParts.push(codeBlockMatch[0].trim());
  const evidence = evidenceParts.length > 0 ? evidenceParts.join("\n") : undefined;

  const details = lines
    .filter((line) => !/^####\s+/.test(line))
    .join("\n")
    .trim();

  return {
    title,
    summary,
    evidence,
    impact: finalImpact,
    fix: fixContent,
    details: details || undefined,
  };
}

export function extractPotentialIssues(content: string): PotentialIssue[] {
  const cleaned = extractReportOnly(content);
  
  // First try to extract from "Potential Issues" section (deep analysis)
  const section = slicePotentialIssuesSection(cleaned);
  if (section) {
    const blocks: string[] = [];
    const lines = section.split("\n");
    let current: string[] = [];

    const isIssueStart = (line: string): boolean => {
      return /^\*\*Issue\s+\d+:/i.test(line) || /^####\s+/.test(line);
    };

    for (const line of lines) {
      if (isIssueStart(line)) {
        if (current.length > 0) {
          blocks.push(current.join("\n").trim());
        }
        current = [line];
        continue;
      }
      current.push(line);
    }

    if (current.length > 0) {
      blocks.push(current.join("\n").trim());
    }

    return blocks
      .map((block) => parsePotentialIssueBlock(block))
      .filter((issue) => issue.title.length > 0);
  }

  // Fallback: extract critical issues from condensed report
  return extractCriticalIssuesFromCondensedReport(cleaned);
}

function extractCriticalIssuesFromCondensedReport(content: string): PotentialIssue[] {
  const issues: PotentialIssue[] = [];
  
  // Extract from Recommended Actions section
  const actionsSection = sliceSection(content, [
    /^###\s+✅\s*Recommended Actions/m,
  ]);
  
  if (actionsSection) {
    const lines = actionsSection.split("\n");
    let currentIssue: Partial<PotentialIssue> | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for P0 (critical) actions
      const p0Match = trimmed.match(/^[-*]\s*\*\*(.+?)\*\*\s*\(P0\)/);
      if (p0Match && p0Match[1]) {
        // Save previous issue if exists
        if (currentIssue && currentIssue.title) {
          issues.push(currentIssue as PotentialIssue);
        }
        
        // Start new critical issue
        const title = p0Match[1].trim();
        currentIssue = {
          title,
          summary: title,
          impact: "Critical issue that requires immediate attention",
          fix: "See analysis report for detailed fix instructions",
        };
        continue;
      }
      
      // If we have a current issue, add evidence/details
      if (currentIssue && trimmed && !trimmed.startsWith("---")) {
        if (!currentIssue.evidence) {
          currentIssue.evidence = trimmed;
        } else {
          currentIssue.evidence += "\n" + trimmed;
        }
      }
    }
    
    // Save last issue
    if (currentIssue && currentIssue.title) {
      issues.push(currentIssue as PotentialIssue);
    }
  }
  
  // Also check Key Findings for additional critical issues
  const findingsSection = sliceSection(content, [
    /^###\s+🚨\s*Key Findings/m,
  ]);
  
  if (findingsSection) {
    const lines = findingsSection.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- 🚨") || trimmed.includes("🚨")) {
        // Extract critical finding
        const finding = trimmed.replace(/^-\s*🚨\s*/, "").trim();
        if (finding && !issues.some(issue => issue.title.includes(finding.substring(0, 20)))) {
          issues.push({
            title: finding,
            summary: finding,
            impact: "Critical finding that needs attention",
            fix: "See analysis report for resolution steps",
          });
        }
      }
    }
  }
  
  return issues;
}

function limitToFindingsScope(content: string): string {
  const marker = content.search(/^###?\s+🔬\s*Deep Analysis/m);
  if (marker >= 0) {
    return content.slice(0, marker).trim();
  }
  return content;
}

function extractIssueHeadings(content: string): string[] {
  const items: string[] = [];
  const seen = new Set<string>();

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^####\s+(.+)/);
    if (!headingMatch || !headingMatch[1]) continue;

    const cleaned = headingMatch[1].trim().replace(/^\d+\.\s+/, "");
    if (!cleaned || seen.has(cleaned)) continue;

    seen.add(cleaned);
    items.push(cleaned);
  }

  return items;
}

export function buildPublishReport(input: BuildReportInput): {
  markdown: string;
  report: PublishableReport;
} {
  const cleaned = extractReportOnly(input.content);
  const findingsScope = limitToFindingsScope(cleaned);

  // Check if the content contains a valid report
  const hasReportHeader = /##\s*🩺.*(?:Repository Health|Health Report)/i.test(cleaned);
  const hasAnyFindings = /🚨|⚠️|💡|P[012]/i.test(cleaned);

  if (!hasReportHeader && !hasAnyFindings) {
    // Analysis likely failed or produced no output
    const fallbackMarkdown = `## 🩺 Repo Check AI Report

### 🔍 Summary
- Analysis may have failed or timed out. Check the repository for basic health indicators.

---

### 🚨 Key Findings
- No findings extracted from analysis output.

---

### ✅ Recommended Actions
- Verify the repository analysis completed successfully.
- Check for any error messages in the analysis logs.

---

_This report was automatically generated by Repo Check AI._`;

    return {
      markdown: fallbackMarkdown,
      report: {
        summary: ["Analysis may have failed or timed out."],
        keyFindings: ["No findings extracted."],
        recommendedActions: ["Verify analysis completed successfully."],
        generatedAt: new Date().toISOString(),
        source: "Repo Check AI",
      },
    };
  }

  const summarySection =
    sliceSection(cleaned, [
      /^##\s+📊\s*Quick Summary/m,
      /^##\s+Quick Summary/m,
      /^###\s+🔍\s*Summary/m,
      /^###\s+Summary/m,
      /^###\s+📊\s*Health Score/m,
    ]);
  let summaryItems: string[] = [];
  if (summarySection) {
    summaryItems = extractSummaryFromTable(summarySection);
    if (summaryItems.length === 0) {
      summaryItems = extractBullets(summarySection);
    }
  }

  const findingsSection =
    sliceSection(findingsScope, [
      /^##\s+🔍\s*Findings/m,
      /^##\s+Findings/m,
      /^###\s+🚨\s*Key Findings/m,
      /^###\s+🚨\s*P0/m,
      /^###\s+⚠️\s*P1/m,
      /^###\s+💡\s*P2/m,
    ]);
  let findingsItems = findingsSection ? extractBullets(findingsSection) : [];

  const actionsSection =
    sliceSection(cleaned, [
      /^##\s+📈\s*Recommended Next Steps/m,
      /^##\s+Recommended Next Steps/m,
      /^###\s+📈\s*Recommended Next Steps/m,
      /^###\s+✅\s*Recommended Actions/m,
    ]);
  let actionItems = actionsSection ? extractBullets(actionsSection) : [];

  if (summaryItems.length === 0 || findingsItems.length === 0 || actionItems.length === 0) {
    const condensed = generateCondensedSummary(cleaned, input.repoFullName || "Repository");
    if (summaryItems.length === 0) {
      const condensedSummary = sliceSection(condensed, [/^###\s+Quick Stats/m, /^##\s+📋\s*Quick Summary/m]);
      if (condensedSummary) summaryItems = extractBullets(condensedSummary);
    }
    if (findingsItems.length === 0) {
      const condensedFindings = sliceSection(condensed, [/^###\s+Top Issues/m]);
      if (condensedFindings) findingsItems = extractBullets(condensedFindings);
    }
    if (actionItems.length === 0) {
      const condensedActions = sliceSection(condensed, [/^###\s+Priority Actions/m]);
      if (condensedActions) actionItems = extractBullets(condensedActions);
    }
  }

  if (findingsItems.length === 0) {
    findingsItems = extractIssueHeadings(findingsScope);
  }

  summaryItems = ensureFallback(summaryItems, "Summary not available in current report.");
  findingsItems = ensureFallback(findingsItems, "No key findings detected in current report.");
  actionItems = ensureFallback(actionItems, "No recommended actions detected in current report.");

  const report: PublishableReport = {
    summary: summaryItems,
    keyFindings: findingsItems,
    recommendedActions: actionItems,
    generatedAt: new Date().toISOString(),
    source: "Repo Check AI",
  };

  const lines: string[] = [];
  lines.push("## 🩺 Repo Check AI Report");
  lines.push("");
  lines.push("### 🔍 Summary");
  report.summary.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("### 🚨 Key Findings");
  report.keyFindings.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("### ✅ Recommended Actions");
  report.recommendedActions.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("_This report was automatically generated by Repo Check AI._");

  return { markdown: lines.join("\n"), report };
}



