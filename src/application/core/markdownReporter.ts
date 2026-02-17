/**
 * Markdown Reporter for RepoCheckAI
 * Generates comprehensive markdown reports for analyzed repositories
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { AnalysisResult } from "../../domain/types/schema.js";
import { CATEGORY_LABELS, PRIORITY_LABELS, CATEGORY_ICONS, PRIORITY_ICONS } from "../../presentation/ui/themes.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface MarkdownReportOptions {
  outputDir?: string;
  includeRawData?: boolean;
  includeTimestamp?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get health status label based on score
 */
function getHealthStatus(score: number): { label: string; emoji: string } {
  if (score >= 85) return { label: "Excellent", emoji: "🌟" };
  if (score >= 70) return { label: "Good", emoji: "👍" };
  if (score >= 50) return { label: "Needs Improvement", emoji: "⚠️" };
  return { label: "Critical", emoji: "🚨" };
}

/**
 * Get priority color for markdown
 * @deprecated Currently unused but kept for potential future use
 */
// function getPriorityBadge(priority: string): string {
//   switch (priority) {
//     case "P0":
//       return "🔴 **P0 - Critical**";
//     case "P1":
//       return "🟠 **P1 - High Priority**";
//     case "P2":
//       return "🟢 **P2 - Suggestion**";
//     default:
//       return priority;
//   }
// }

/**
 * Generate a progress bar for markdown
 */
function markdownProgressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${percent}%`;
}

/**
 * Format date for report
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MARKDOWN GENERATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generate the full markdown report
 */
export function generateMarkdownReport(result: AnalysisResult): string {
  const { repoMeta, overallScore, categoryScores, findings, nextSteps } = result;
  const healthStatus = getHealthStatus(overallScore);

  const lines: string[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────────────────────────────────

  lines.push(`# 🩺 RepoCheckAI Health Report`);
  lines.push("");
  lines.push(`## ${repoMeta.fullName}`);
  lines.push("");
  lines.push(`> ${repoMeta.description || "No description available"}`);
  lines.push("");

  // ─────────────────────────────────────────────────────────────────────────
  // Quick Summary
  // ─────────────────────────────────────────────────────────────────────────

  lines.push("---");
  lines.push("");
  lines.push("## 📊 Quick Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| **Overall Health Score** | ${healthStatus.emoji} **${overallScore}%** (${healthStatus.label}) |`);
  lines.push(`| **Total Findings** | ${findings.length} |`);
  lines.push(`| **Critical Issues (P0)** | ${findings.filter(f => f.priority === "P0").length} |`);
  lines.push(`| **High Priority (P1)** | ${findings.filter(f => f.priority === "P1").length} |`);
  lines.push(`| **Suggestions (P2)** | ${findings.filter(f => f.priority === "P2").length} |`);
  lines.push(`| **Repository Visibility** | ${repoMeta.visibility} |`);
  lines.push(`| **Default Branch** | \`${repoMeta.defaultBranch}\` |`);
  lines.push("");

  // ─────────────────────────────────────────────────────────────────────────
  // Repository Details
  // ─────────────────────────────────────────────────────────────────────────

  lines.push("---");
  lines.push("");
  lines.push("## 📁 Repository Details");
  lines.push("");
  lines.push(`- **Owner:** ${repoMeta.owner}`);
  lines.push(`- **Name:** ${repoMeta.name}`);
  lines.push(`- **URL:** https://github.com/${repoMeta.fullName}`);
  lines.push(`- **Visibility:** ${repoMeta.visibility === "private" ? "🔒 Private" : "🌐 Public"}`);
  lines.push(`- **Default Branch:** \`${repoMeta.defaultBranch}\``);
  lines.push(`- **License:** ${repoMeta.license ? repoMeta.license.name : "❌ No license found"}`);
  lines.push(`- **Size:** ${(repoMeta.size / 1024).toFixed(2)} MB`);
  lines.push(`- **Open Issues:** ${repoMeta.openIssuesCount}`);
  lines.push(`- **Created:** ${formatDate(repoMeta.createdAt)}`);
  lines.push(`- **Last Updated:** ${formatDate(repoMeta.updatedAt)}`);
  lines.push(`- **Last Push:** ${formatDate(repoMeta.pushedAt)}`);
  lines.push("");

  // Languages
  if (repoMeta.languages && Object.keys(repoMeta.languages).length > 0) {
    lines.push("### 💻 Languages");
    lines.push("");
    const totalBytes = Object.values(repoMeta.languages).reduce((a, b) => a + b, 0);
    const sortedLangs = Object.entries(repoMeta.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    lines.push("| Language | Usage |");
    lines.push("|----------|-------|");
    for (const [lang, bytes] of sortedLangs) {
      const percent = ((bytes / totalBytes) * 100).toFixed(1);
      lines.push(`| ${lang} | ${percent}% |`);
    }
    lines.push("");
  }

  // Topics
  if (repoMeta.topics && repoMeta.topics.length > 0) {
    lines.push("### 🏷️ Topics");
    lines.push("");
    lines.push(repoMeta.topics.map(t => `\`${t}\``).join(" "));
    lines.push("");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Category Scores
  // ─────────────────────────────────────────────────────────────────────────

  lines.push("---");
  lines.push("");
  lines.push("## 📈 Category Scores");
  lines.push("");
  lines.push("| Category | Score | Status |");
  lines.push("|----------|-------|--------|");

  for (const cat of categoryScores) {
    const icon = CATEGORY_ICONS[cat.category] || "📦";
    const label = CATEGORY_LABELS[cat.category] || cat.category;
    const status = getHealthStatus(cat.score);
    lines.push(`| ${icon} ${label} | ${markdownProgressBar(cat.score)} | ${status.emoji} ${status.label} |`);
  }
  lines.push("");

  // ─────────────────────────────────────────────────────────────────────────
  // Findings by Priority
  // ─────────────────────────────────────────────────────────────────────────

  lines.push("---");
  lines.push("");
  lines.push("## 🔍 Findings");
  lines.push("");

  const priorities = ["P0", "P1", "P2"] as const;

  for (const priority of priorities) {
    const priorityFindings = findings.filter(f => f.priority === priority);
    if (priorityFindings.length === 0) continue;

    const icon = PRIORITY_ICONS[priority] || "📌";
    const label = PRIORITY_LABELS[priority] || priority;

    lines.push(`### ${icon} ${priority} - ${label} (${priorityFindings.length})`);
    lines.push("");

    for (const finding of priorityFindings) {
      const catIcon = CATEGORY_ICONS[finding.category] || "📦";
      const catLabel = CATEGORY_LABELS[finding.category] || finding.category;

      lines.push(`#### ${finding.title}`);
      lines.push("");
      lines.push(`> **Category:** ${catIcon} ${catLabel}`);
      lines.push("");
      lines.push(`**📋 Evidence:**`);
      lines.push(`> ${finding.evidence}`);
      lines.push("");
      lines.push(`**⚡ Impact:**`);
      lines.push(`> ${finding.impact}`);
      lines.push("");
      lines.push(`**🔧 Recommended Action:**`);
      lines.push(`> ${finding.action}`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Next Steps
  // ─────────────────────────────────────────────────────────────────────────

  if (nextSteps && nextSteps.length > 0) {
    lines.push("## 📈 Recommended Next Steps");
    lines.push("");
    nextSteps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
    lines.push("");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Footer
  // ─────────────────────────────────────────────────────────────────────────

  lines.push("---");
  lines.push("");
  lines.push("## 📋 Report Metadata");
  lines.push("");
  lines.push(`- **Generated by:** 🩺 RepoCheckAI v2.5`);
  lines.push(`- **Analysis Date:** ${formatDate(result.analyzedAt)}`);
  lines.push(`- **Analysis Duration:** ${(result.durationMs / 1000).toFixed(2)}s`);
  lines.push(`- **Model Used:** claude-sonnet-4.5`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*This report was automatically generated by [RepoCheckAI](https://github.com/glaucia86/repocheckai), an AI-powered GitHub repository health analyzer using the GitHub Copilot SDK.*");

  return lines.join("\n");
}

/**
 * Generate a summary markdown (shorter version)
 */
export function generateSummaryReport(result: AnalysisResult): string {
  const { repoMeta, overallScore, findings, nextSteps } = result;
  const healthStatus = getHealthStatus(overallScore);

  const lines: string[] = [];

  lines.push(`# 🩺 ${repoMeta.fullName} - Health Summary`);
  lines.push("");
  lines.push(`## ${healthStatus.emoji} Score: ${overallScore}% (${healthStatus.label})`);
  lines.push("");
  lines.push("### Quick Stats");
  lines.push("");
  lines.push(`- 🔴 Critical: ${findings.filter(f => f.priority === "P0").length}`);
  lines.push(`- 🟠 High Priority: ${findings.filter(f => f.priority === "P1").length}`);
  lines.push(`- 🟢 Suggestions: ${findings.filter(f => f.priority === "P2").length}`);
  lines.push("");

  // Top 5 issues
  const topIssues = findings.slice(0, 5);
  if (topIssues.length > 0) {
    lines.push("### Top Issues to Address");
    lines.push("");
    topIssues.forEach((f, i) => {
      const badge = f.priority === "P0" ? "🔴" : f.priority === "P1" ? "🟠" : "🟢";
      lines.push(`${i + 1}. ${badge} **${f.title}** - ${f.action}`);
    });
    lines.push("");
  }

  if (nextSteps && nextSteps.length > 0) {
    lines.push("### Next Steps");
    lines.push("");
    nextSteps.slice(0, 3).forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
  }

  lines.push("");
  lines.push(`---`);
  lines.push(`*Generated by 🩺 RepoCheckAI on ${formatDate(result.analyzedAt)}*`);

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════════════════
// FILE OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Save the markdown report to a file
 */
export function saveMarkdownReport(
  result: AnalysisResult,
  options: MarkdownReportOptions = {}
): { fullReportPath: string; summaryPath: string } {
  const { outputDir = "./reports" } = options;

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename based on repo and timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const repoSlug = result.repoMeta.fullName.replace("/", "_");
  
  const fullReportFilename = `${repoSlug}_health-report_${timestamp}.md`;
  const summaryFilename = `${repoSlug}_summary_${timestamp}.md`;

  const fullReportPath = join(outputDir, fullReportFilename);
  const summaryPath = join(outputDir, summaryFilename);

  // Generate and save reports
  const fullReport = generateMarkdownReport(result);
  const summaryReport = generateSummaryReport(result);

  writeFileSync(fullReportPath, fullReport, "utf-8");
  writeFileSync(summaryPath, summaryReport, "utf-8");

  return { fullReportPath, summaryPath };
}

/**
 * Get the default report directory
 */
export function getDefaultReportDir(): string {
  return join(process.cwd(), "reports");
}



