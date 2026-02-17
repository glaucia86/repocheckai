/**
 * Reporter module for Repo Check AI
 * Formats and outputs analysis results in various formats
 */

import type { AnalysisResult, Finding } from "../../domain/types/schema.js";
import {
  c,
  ICON,
  printHealthHeader,
  printCategoryScores,
  printFindings,
  printNextSteps,
  box,
  CATEGORY_LABELS,
} from "../../presentation/ui/index.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type OutputFormat = "pretty" | "json" | "minimal";

export interface ReporterOptions {
  format: OutputFormat;
  verbosity: "silent" | "normal" | "verbose";
  showTimings?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// REPORTER CLASS
// ════════════════════════════════════════════════════════════════════════════

export class Reporter {
  private options: ReporterOptions;

  constructor(options: ReporterOptions) {
    this.options = options;
  }

  /**
   * Output the analysis result
   */
  report(result: AnalysisResult): void {
    switch (this.options.format) {
      case "json":
        this.outputJson(result);
        break;
      case "minimal":
        this.outputMinimal(result);
        break;
      case "pretty":
      default:
        this.outputPretty(result);
        break;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // JSON OUTPUT
  // ──────────────────────────────────────────────────────────────────────────

  private outputJson(result: AnalysisResult): void {
    const output = {
      repo: {
        owner: result.repoMeta.owner,
        name: result.repoMeta.name,
        fullName: result.repoMeta.fullName,
        description: result.repoMeta.description,
        visibility: result.repoMeta.visibility,
        defaultBranch: result.repoMeta.defaultBranch,
      },
      health: {
        overallScore: result.overallScore,
        categories: result.categoryScores.map((cat) => ({
          name: cat.category,
          label: CATEGORY_LABELS[cat.category] || cat.category,
          score: cat.score,
          findingCount: cat.findingCount,
        })),
      },
      findings: {
        total: result.findings.length,
        byPriority: {
          P0: result.findings.filter((f) => f.priority === "P0").length,
          P1: result.findings.filter((f) => f.priority === "P1").length,
          P2: result.findings.filter((f) => f.priority === "P2").length,
        },
        items: result.findings.map((f) => ({
          id: f.id,
          priority: f.priority,
          category: f.category,
          title: f.title,
          evidence: f.evidence,
          impact: f.impact,
          action: f.action,
        })),
      },
      nextSteps: result.nextSteps,
      meta: {
        analyzedAt: result.analyzedAt,
        durationMs: result.durationMs,
      },
    };

    console.log(JSON.stringify(output, null, 2));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MINIMAL OUTPUT
  // ──────────────────────────────────────────────────────────────────────────

  private outputMinimal(result: AnalysisResult): void {
    const { repoMeta, overallScore, findings } = result;

    console.log();
    console.log(`${repoMeta.fullName}: ${overallScore}%`);

    const p0Count = findings.filter((f) => f.priority === "P0").length;
    const p1Count = findings.filter((f) => f.priority === "P1").length;
    const p2Count = findings.filter((f) => f.priority === "P2").length;

    console.log(`Findings: ${p0Count} P0, ${p1Count} P1, ${p2Count} P2`);
    console.log();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRETTY OUTPUT
  // ──────────────────────────────────────────────────────────────────────────

  private outputPretty(result: AnalysisResult): void {
    if (this.options.verbosity === "silent") return;

    // Repository info
    this.printRepoInfo(result);

    // Health score and categories
    printHealthHeader(result.overallScore);
    printCategoryScores(
      result.categoryScores.map((cat) => ({
        category: cat.category,
        score: cat.score,
      }))
    );

    // Findings
    const uiFindings = result.findings.map((f) => ({
      id: f.id,
      category: f.category,
      priority: f.priority as "P0" | "P1" | "P2",
      title: f.title,
      evidence: f.evidence,
      impact: f.impact,
      action: f.action,
    }));
    printFindings(uiFindings);

    // Next steps
    printNextSteps(result.nextSteps);

    // Timing info
    if (this.options.showTimings && this.options.verbosity === "verbose") {
      this.printTimings(result);
    }
  }

  private printRepoInfo(result: AnalysisResult): void {
    const { repoMeta } = result;

    const repoLines = [
      "",
      `${c.dim("Repository:")} ${c.brandBold(repoMeta.fullName)}`,
      `${c.dim("Description:")} ${c.text(repoMeta.description || "No description")}`,
      `${c.dim("Visibility:")} ${repoMeta.visibility === "private" ? c.warning("private") : c.healthy("public")}`,
      `${c.dim("Default Branch:")} ${c.info(repoMeta.defaultBranch)}`,
      "",
    ];

    if (repoMeta.languages && Object.keys(repoMeta.languages).length > 0) {
      const topLangs = Object.entries(repoMeta.languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang)
        .join(", ");
      repoLines.splice(4, 0, `${c.dim("Languages:")} ${c.text(topLangs)}`);
    }

    const lines = box(repoLines, {
      width: 70,
      title: `${ICON.github} REPOSITORY INFO`,
    });

    console.log();
    for (const line of lines) {
      console.log("  " + line);
    }
  }

  private printTimings(result: AnalysisResult): void {
    console.log();
    console.log(
      `  ${c.dim("Analyzed at:")} ${c.text(result.analyzedAt)}`
    );
    console.log(
      `  ${c.dim("Duration:")} ${c.text(`${result.durationMs}ms`)}`
    );
    console.log();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FINDING FORMATTERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Format a finding for console output
 */
export function formatFinding(finding: Finding, verbose = false): string[] {
  const lines: string[] = [];

  const priorityColor =
    finding.priority === "P0"
      ? c.critical
      : finding.priority === "P1"
        ? c.warning
        : c.p2;

  const icon =
    finding.priority === "P0"
      ? ICON.critical
      : finding.priority === "P1"
        ? ICON.warning
        : ICON.p2;

  lines.push(`${icon} ${priorityColor.bold(finding.title)}`);

  if (verbose) {
    lines.push(`   ${c.dim("Category:")} ${CATEGORY_LABELS[finding.category] || finding.category}`);
  }

  lines.push(`   ${c.dim("Evidence:")} ${c.text(finding.evidence)}`);
  lines.push(`   ${c.dim("Impact:")} ${c.text(finding.impact)}`);
  lines.push(`   ${c.dim("Action:")} ${c.info(finding.action)}`);

  return lines;
}

/**
 * Format a summary line
 */
export function formatSummary(result: AnalysisResult): string {
  const p0 = result.findings.filter((f) => f.priority === "P0").length;
  const p1 = result.findings.filter((f) => f.priority === "P1").length;
  const p2 = result.findings.filter((f) => f.priority === "P2").length;

  const parts: string[] = [];

  if (p0 > 0) parts.push(c.critical(`${p0} critical`));
  if (p1 > 0) parts.push(c.warning(`${p1} high-priority`));
  if (p2 > 0) parts.push(c.p2(`${p2} suggestions`));

  if (parts.length === 0) {
    return c.healthy("No issues found! 🎉");
  }

  return `Found: ${parts.join(", ")}`;
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create a reporter instance
 */
export function createReporter(options: Partial<ReporterOptions> = {}): Reporter {
  return new Reporter({
    format: options.format || "pretty",
    verbosity: options.verbosity || "normal",
    showTimings: options.showTimings ?? false,
  });
}



