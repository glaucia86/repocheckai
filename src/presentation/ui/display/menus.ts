/**
 * Menu and interactive UI functions
 * Single Responsibility: Render menus, prompts, and chat interface elements
 */

import {
  c,
  box,
  modelBadge,
  stripAnsi,
  renderBigLogo,
  BOX,
  ICON,
} from "../themes.js";
import {
  APP_TAGLINE,
  APP_VERSION,
  DISPLAY_NAME,
} from "../../../domain/config/runtimeMetadata.js";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const CHAT_WIDTH = 80;

// ════════════════════════════════════════════════════════════════════════════
// HELP
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print help/usage information
 */
export function printHelp(): void {
  const lines = box(
    [
      "",
      c.whiteBold("Usage:"),
      `  ${c.brand("repocheck analyze")} ${c.dim("<repoRef>")} ${c.muted("[options]")}`,
      "",
      c.whiteBold("Repository Reference:"),
      `  ${c.text("https://github.com/owner/repo")}  ${c.dim("Full URL")}`,
      `  ${c.text("owner/repo")}                     ${c.dim("Short form")}`,
      `  ${c.text("git@github.com:owner/repo.git")}  ${c.dim("SSH URL")}`,
      "",
      c.whiteBold("Options:"),
      `  ${c.key("--token")} ${c.dim("<TOKEN>")}    ${c.text("GitHub token for private repos")}`,
      `  ${c.key("--issue")}             ${c.text("Publish report as a GitHub issue")}`,
      `  ${c.key("--deep")}               ${c.text("Deep analysis with full source code (Repomix)")}`,
      `  ${c.key("--max-files")} ${c.dim("<N>")}   ${c.text("Max files to list (default: 800)")}`,
      `  ${c.key("--max-bytes")} ${c.dim("<N>")}   ${c.text("Max bytes per file (default: 200KB)")}`,
      `  ${c.key("--timeout")} ${c.dim("<ms>")}     ${c.text("Analysis timeout (default: 120000)")}`,
      `  ${c.key("--verbose")}            ${c.text("Show detailed output")}`,
      "",
      c.whiteBold("Examples:"),
      `  ${c.brand("$")} repocheck analyze vercel/next.js`,
      `  ${c.brand("$")} repocheck analyze vercel/swr --deep`,
      `  ${c.brand("$")} repocheck analyze owner/private-repo --token ghp_xxx`,
      "",
    ],
    {
      width: 70,
      title: `${ICON.doctor} REPO CHECK AI HELP`,
    }
  );

  console.log();
  for (const line of lines) {
    console.log("  " + line);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT INTERFACE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print the chat-style header with big colorful logo
 */
export async function printChatHeader(): Promise<void> {
  console.log();
  console.log();

  // Render the big colorful logo with elegant line-by-line reveal
  const logo = renderBigLogo();
  const isInteractive = Boolean(process.stdout.isTTY) && !process.env.CI;

  if (!isInteractive) {
    for (const line of logo) {
      console.log("  " + line);
    }
    console.log();
  } else {
    // Dynamic energy effect: lines pulse with energy before settling
    for (let i = 0; i < logo.length; i++) {
      const line = logo[i];

      // Energy pulse: brighter flash
      process.stdout.write("  " + c.premium(line) + "\r");
      await new Promise((resolve) => setTimeout(resolve, 30));

      // Quick dim
      process.stdout.write("  " + c.dim(line) + "\r");
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Energy surge: even brighter
      process.stdout.write("  " + c.brand(line) + "\r");
      await new Promise((resolve) => setTimeout(resolve, 25));

      // Settle to normal with cascade timing
      console.log("  " + line);

      // Dynamic pause: faster for lower lines (energy cascade)
      const pause = Math.max(25, 60 - i * 8);
      await new Promise((resolve) => setTimeout(resolve, pause));
    }

    console.log();
  }

  console.log();

  const taglineText = `${APP_TAGLINE} │ ${DISPLAY_NAME} │ v${APP_VERSION}`;
  const lineWidth = Math.max(86, stripAnsi(taglineText).length + 4);

  console.log("  " + c.brand("━".repeat(lineWidth)));
  console.log("  " + c.text(APP_TAGLINE) + c.dim(" │ ") + c.brandBold(DISPLAY_NAME) + c.dim(" │ ") + c.premium(`v${APP_VERSION}`));
  console.log("  " + c.dim("─".repeat(lineWidth)));
  console.log();
}
export function printChatStatusBar(
  model: string,
  isPremium: boolean,
  lastRepo?: string
): void {
  // Build content first to measure it
  const badge = modelBadge(model, isPremium);
  
  let repoDisplay = "";
  if (lastRepo) {
    repoDisplay = c.dim(" │ ") + c.muted("Last: ") + c.info(lastRepo);
  }
  
  const hint = c.dim(" │ ") + c.brand("/help");
  
  // Calculate content length
  const statusContent = " " + badge + repoDisplay + hint + " ";
  const contentLen = stripAnsi(statusContent).length;
  
  // Dynamic width: content + some padding, min 55, max 100
  const innerWidth = Math.max(55, Math.min(100, contentLen + 4));
  const padding = innerWidth - contentLen;
  
  // Top border with brand color
  console.log("  " + c.brand(BOX.tl + BOX.h.repeat(innerWidth) + BOX.tr));
  
  // Status content
  console.log("  " + c.brand(BOX.v) + statusContent + " ".repeat(Math.max(0, padding)) + c.brand(BOX.v));
  
  // Bottom border
  console.log("  " + c.brand(BOX.bl + BOX.h.repeat(innerWidth) + BOX.br));
  console.log();
}

/**
 * Print the command menu
 */
export function printCommandMenu(): void {
  console.log();
  console.log("  " + c.whiteBold(ICON.sparkle + " Available Commands"));
  console.log("  " + c.border("─".repeat(CHAT_WIDTH - 4)));
  console.log();
  
  // Analysis Commands
  console.log("  " + c.brand(ICON.analyze + " Analysis"));
  console.log(`   ${c.info("/analyze")} ${c.dim("<repo>")}  ${c.muted("Analyze a repository")}`);
  console.log(`   ${c.info("/deep")} ${c.dim("<repo>")}     ${c.muted("Deep analysis with source code (Repomix)")}`);
  console.log(`   ${c.info("/last")}            ${c.muted("Show last analysis")}`);
  console.log(`   ${c.info("/history")}         ${c.muted("Recent analyses")}`);
  console.log();
  console.log(`   ${c.dim("Examples:")} ${c.muted("/analyze vercel/next.js --issue")}`);
  console.log(`             ${c.muted("/deep facebook/react --issue")}`);
  console.log();
  
  // Output Commands
  console.log("  " + c.brand(ICON.save + " Output"));
  console.log(`   ${c.info("/export")} ${c.dim("[path]")}   ${c.muted("Export report to file")}`);
  console.log(`   ${c.info("/copy")}            ${c.muted("Copy report to clipboard")}`);
  console.log();
  
  // Publishing Options
  console.log("  " + c.brand("📋 Publishing"));
  console.log(`   ${c.info("--issue")}           ${c.muted("Publish report as GitHub issue")}`);
  console.log();
  
  // Utility Commands
  console.log("  " + c.brand("⚙️  Utility"));
  console.log(`   ${c.info("/model")} ${c.dim("[name]")}   ${c.muted("Switch AI model")}`);
  console.log(`   ${c.info("/clear")}           ${c.muted("Clear screen")}`);
  console.log(`   ${c.info("/help")}            ${c.muted("Show this help")}`);
  console.log(`   ${c.info("/quit")}            ${c.muted("Exit RepoCheckAI")}`);
  console.log();
  
  console.log("  " + c.border("─".repeat(CHAT_WIDTH - 4)));
  console.log("  " + c.dim("💡 Tip: ") + c.muted("You can also paste a repo URL directly to analyze it"));
  console.log();
}

/**
 * Print analysis history
 */
export function printHistory(
  history: Array<{ repo: string; score: number; date: string; findings: number }>
): void {
  if (history.length === 0) {
    console.log();
    console.log("  " + c.muted("No analysis history yet."));
    console.log("  " + c.dim("Use /analyze <repo> to analyze a repository."));
    console.log();
    return;
  }

  console.log();
  console.log("  " + c.whiteBold(ICON.report + " Recent Analyses"));
  console.log("  " + c.border("─".repeat(CHAT_WIDTH - 4)));
  console.log();

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    if (!item) continue;
    
    const num = c.number(`  ${i + 1}.`);
    const scoreColor = item.score >= 70 ? c.healthy : item.score >= 50 ? c.warning : c.critical;
    
    console.log(
      `${num} ${c.info(item.repo)} ${c.dim("│")} ${scoreColor(`${item.score}%`)} ${c.dim("│")} ${c.muted(item.findings + " findings")} ${c.dim("│")} ${c.muted(item.date)}`
    );
  }
  console.log();
}

/**
 * Print export success message
 */
export function printExportSuccess(paths: { fullReportPath: string; summaryPath: string }): void {
  console.log();
  console.log("  " + c.healthy(ICON.check) + " " + c.healthyBold("Reports exported successfully!"));
  console.log();
  console.log("  " + c.dim("Full Report: ") + c.info(paths.fullReportPath));
  console.log("  " + c.dim("Summary:     ") + c.info(paths.summaryPath));
  console.log();
}

/**
 * Print model selection menu
 */
export function printModelMenu(
  models: Array<{ id: string; name: string; premium: boolean }>,
  currentModel: string
): void {
  console.log();
  console.log("  " + c.whiteBold(ICON.model + " Available Models"));
  console.log("  " + c.border("─".repeat(CHAT_WIDTH - 4)));
  console.log();

  for (const model of models) {
    const isCurrent = model.id === currentModel;
    const prefix = isCurrent ? c.healthy("● ") : c.muted("○ ");
    const badge = modelBadge(model.name, model.premium);
    const current = isCurrent ? c.dim(" (current)") : "";
    
    console.log(`  ${prefix}${badge}${current}`);
  }
  console.log();
  console.log("  " + c.dim("Use: ") + c.info("/model <model-name>") + c.dim(" to switch"));
  console.log();
}

/**
 * Print welcome message for chat mode
 */
export function printWelcome(): void {
  console.log(
    "  " + c.brandBold("Enter Repository URL")
  );
  console.log();
}

/**
 * Print quick commands reference on startup
 */
export function printQuickCommands(): void {
  console.log("  " + c.dim("─".repeat(55)));
  console.log();
  console.log("  " + c.whiteBold("⚡ Quick Commands"));
  console.log();
  console.log(`    ${c.info("/analyze")} ${c.dim("<repo>")}  ${c.muted("Standard governance analysis")}`);
  console.log(`    ${c.info("/deep")} ${c.dim("<repo>")}     ${c.muted("Deep analysis with source code")}`);
  console.log(`    ${c.info("/model")}           ${c.muted("Switch AI model")}`);
  console.log(`    ${c.info("/help")}            ${c.muted("See all commands")}`);
  console.log();
  console.log("  " + c.whiteBold("📋 Publishing Options"));
  console.log(`    ${c.info("--issue")}           ${c.muted("Publish report as GitHub issue")}`);
  console.log();
  console.log("  " + c.dim("💡 Tip: Paste a GitHub URL directly to analyze"));
  console.log();
}

/**
 * Print prompt prefix with cursor
 */
export function printPrompt(): void {
  process.stdout.write(c.brand("  ❯ "));
}

/**
 * Print unknown command message
 */
export function printUnknownCommand(input: string): void {
  console.log();
  console.log(
    "  " + c.warning(ICON.warn) + " " + c.warningBold("Unknown command: ") + c.text(input)
  );
  console.log("  " + c.dim("Type /help to see available commands"));
  console.log();
}

