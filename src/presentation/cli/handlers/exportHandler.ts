/**
 * Export Handler
 * Single Responsibility: Handle /export command
 */

import { appState } from "../state/appState.js";
import { extractReportOnly } from "../parsers/reportExtractor.js";
import { printSuccess, printWarning } from "../../ui/index.js";

// ════════════════════════════════════════════════════════════════════════════
// HANDLER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Handle /export command
 * Supports: /export, /export ~/Desktop, /export ./report.md, /export ~/Desktop json
 */
export async function handleExport(
  customPath?: string,
  format?: "md" | "json"
): Promise<void> {
  if (!appState.lastAnalysis) {
    printWarning("No analysis to export. Run /analyze first.");
    return;
  }

  const fs = await import("fs");
  const path = await import("path");
  const os = await import("os");

  const timestamp = new Date().toISOString().slice(0, 10);
  const repoSlug = appState.lastRepo?.replace("/", "_") || "report";
  const ext = format === "json" ? "json" : "md";
  const defaultFilename = `${repoSlug}_${timestamp}.${ext}`;

  let targetPath: string;

  if (customPath) {
    // Expand ~ to home directory
    const expandedPath = customPath.startsWith("~")
      ? path.join(os.homedir(), customPath.slice(1))
      : customPath;

    // Check if path looks like a directory (ends with / or \) or has no extension
    const hasExtension = /\.(md|json)$/i.test(expandedPath);

    if (hasExtension) {
      // Full file path provided
      targetPath = expandedPath;
    } else {
      // Directory path provided - append default filename
      targetPath = path.join(expandedPath, defaultFilename);
    }
  } else {
    // Default: ~/repocheckai/reports/
    const defaultDir = path.join(os.homedir(), "repocheckai", "reports");
    targetPath = path.join(defaultDir, defaultFilename);
  }

  // Get absolute path for display
  const absolutePath = path.resolve(targetPath);
  const targetDir = path.dirname(absolutePath);

  // Ensure directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (format === "json") {
    // JSON export: include full content for debugging/analysis purposes
    fs.writeFileSync(
      absolutePath,
      JSON.stringify(
        {
          repo: appState.lastRepo,
          model: appState.lastAnalysis.model,
          date: new Date().toISOString(),
          content: appState.lastAnalysis.content, // Full content including phases
          report: extractReportOnly(appState.lastAnalysis.content), // Clean report only
          toolCallCount: appState.lastAnalysis.toolCallCount,
          durationMs: appState.lastAnalysis.durationMs,
        },
        null,
        2
      ),
      { encoding: "utf8" }
    );

    console.log();
    printSuccess(`Report exported to ${absolutePath}`);
    console.log();
    return;
  }

  // Default to markdown - extract only the report (no phase logs)
  const BOM = "\uFEFF";
  const reportContent = extractReportOnly(appState.lastAnalysis.content);
  fs.writeFileSync(absolutePath, BOM + reportContent, { encoding: "utf8" });

  console.log();
  printSuccess(`Report exported to ${absolutePath}`);
  console.log();
}
