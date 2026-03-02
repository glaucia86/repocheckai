/**
 * Analyze Handler
 * Single Responsibility: Handle /analyze and /deep commands
 */

import { analyzeRepositoryWithCopilot } from "../../../application/core/agent.js";
import { isRepomixAvailable } from "../../../application/core/repoPacker.js";
import { parseRepoRef, buildRepoUrl, buildRepoSlug } from "../parsers/repoParser.js";
import { appState } from "../state/appState.js";
import {
  printRepo,
  printModel,
  printError,
  printWarning,
  printSuccess,
  c,
} from "../../ui/index.js";
import { publishReport } from "../../../application/core/publish/index.js";
import { isAuthenticated } from "../../../infrastructure/providers/github.js";
import { type CLIAnalyzeOptions } from "../types.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

// AnalyzeOptions imported from schema.ts

interface PublishFlagParseResult {
  repoRef: string;
  issue: boolean;
}

function extractPublishFlags(input: string): PublishFlagParseResult {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  let issue = false;
  const repoParts: string[] = [];

  for (const token of tokens) {
    const normalized = token.toLowerCase();
    const isIssue = /^[-–—]+issue$/.test(normalized);

    if (normalized === "--issue" || isIssue) {
      issue = true;
    } else {
      repoParts.push(token);
    }
  }

  return {
    repoRef: repoParts.join(" "),
    issue,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Handle /analyze command
 */
export async function handleAnalyze(
  repoRef: string,
  options: CLIAnalyzeOptions,
  deep: boolean = false
): Promise<void> {
  const parsedFlags = extractPublishFlags(repoRef);
  let effectiveIssue = options.issue || parsedFlags.issue;

  if (effectiveIssue && !isAuthenticated(options.token)) {
    printWarning("GitHub token required for publishing issues. Use --token or set GITHUB_TOKEN environment variable.");
    console.log(c.dim("  Skipping issue creation."));
    effectiveIssue = false;
  }

  const parsed = parseRepoRef(parsedFlags.repoRef);
  if (!parsed) {
    printError("Invalid repository reference.");
    console.log(c.dim("  Expected formats:"));
    console.log(c.dim("    • https://github.com/owner/repo"));
    console.log(c.dim("    • owner/repo"));
    console.log();
    return;
  }

  const { owner, repo } = parsed;
  const repoUrl = buildRepoUrl(parsed);
  const repoSlug = buildRepoSlug(parsed);

  console.log();
  printRepo(owner, repo);
  printModel(appState.currentModel, appState.isPremium);
  if (deep) {
    console.log("  " + c.warning("Mode: Deep Analysis (Repomix)"));
    
    // Check if Repomix is available before starting
    // Note: Result is cached per session to avoid repeated 30s timeout delays
    const repomixReady = isRepomixAvailable();
    if (!repomixReady) {
      printWarning("Repomix not available. Deep analysis will use file-by-file fallback.");
      console.log(c.dim("  To enable full deep analysis, ensure Node.js and npx are working."));
      console.log(c.dim("  Test with: npx repomix --version"));
      console.log();
    }
  }
  console.log();

  try {
    // Run analysis with current model
    const result = await analyzeRepositoryWithCopilot({
      repoUrl,
      token: options.token,
      model: appState.currentModel,
      maxFiles: options.maxFiles,
      maxBytes: options.maxBytes,
      timeout: deep ? 300000 : options.timeout, // 5 min for deep analysis
      verbosity: options.verbosity,
      format: options.format,
      deep,
      skills: options.skills,
      skillsMax: options.skillsMax,
    });

    // Update state
    appState.setLastAnalysis(result, repoSlug);

    // Add to history
    appState.addToHistory({
      repo: repoSlug,
      score: 0, // Score would be parsed from result if needed
      date: new Date().toISOString(),
      findings: 0,
      result: null,
    });

    const target = effectiveIssue ? "issue" : undefined;

    if (target) {
      console.log();
      console.log(c.dim(`  Publishing report as GitHub issue(s)...`));
      const publishResult = await publishReport({
        target,
        repo: {
          owner,
          name: repo,
          fullName: `${owner}/${repo}`,
          url: repoUrl,
        },
        analysisContent: result.content,
        token: options.token!,
      });

      if (publishResult?.ok) {
        if (publishResult.targetUrls && publishResult.targetUrls.length > 0) {
          printSuccess(`Report published: ${publishResult.targetUrls.length} issue(s) created.`);
          publishResult.targetUrls.forEach((url) => {
            console.log(c.dim(`  ${url}`));
          });
        } else {
          printSuccess(
            publishResult.targetUrl
              ? `Report published: ${publishResult.targetUrl}`
              : "Report published successfully."
          );
        }
      } else if (publishResult?.error) {
        printWarning(`Publish failed: ${publishResult.error.message}`);
        console.log(c.dim(`  Error type: ${publishResult.error.type}`));
      }
    }

    // Show post-analysis options
    showPostAnalysisOptions();

  } catch (error) {
    printError(error instanceof Error ? error.message : "Analysis failed");
  }
}

/**
 * Show available actions after analysis completes
 */
export function showPostAnalysisOptions(): void {
  console.log();
  console.log("  " + c.border("─".repeat(50)));
  console.log("  " + c.whiteBold("📋 What would you like to do?"));
  console.log();
  console.log("  " + c.info("/copy") + c.dim("     → Copy report to clipboard"));
  console.log("  " + c.info("/export") + c.dim("   → Save as markdown file"));
  console.log("  " + c.info("/summary") + c.dim("  → Generate condensed summary"));
  console.log("  " + c.info("/analyze") + c.dim("  <repo> → Analyze another repo"));
  console.log("  " + c.info("/deep") + c.dim("     <repo> → Deep analysis with source code"));
  console.log("  " + c.info("/help") + c.dim("     → See all commands"));
  console.log();
}


