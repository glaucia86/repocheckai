/**
 * Chat Loop
 * Single Responsibility: Interactive REPL for Repo Check AI
 */

import * as readline from "readline";
import { analyzeRepositoryWithCopilot } from "../../application/core/agent.js";
import { parseCommand } from "../ui/commands.js";
import { parseRepoRef, buildRepoUrl, buildRepoSlug } from "./parsers/repoParser.js";
import {
  appState,
} from "./state/appState.js";
import {
  handleAnalyze,
  handleExport,
  handleCopy,
  handleModel,
  handleHistory,
  handleLast,
  handleClear,
  handleSummary,
  handleHelp,
  showPostAnalysisOptions,
} from "./handlers/index.js";
import { type CLIAnalyzeOptions } from "./types.js";
import { promptModelSelection } from "./handlers/sharedPrompts.js";
import {
  clearScreen,
  printChatHeader,
  printChatStatusBar,
  printWelcome,
  printQuickCommands,
  printRepo,
  printModel,
  printSuccess,
  printError,
  printWarning,
  printGoodbye,
  printUnknownCommand,
  c,
  ICON,
} from "../ui/index.js";

// ════════════════════════════════════════════════════════════════════════════
// ONBOARDING PROMPTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Prompt for repository URL using readline (one-shot)
 */
function promptRepoUrl(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log();
    console.log("  " + c.whiteBold(ICON.github + " Repository to analyze"));
    console.log("  " + c.border("─".repeat(50)));
    console.log();
    console.log("  " + c.dim("Formats accepted:"));
    console.log("  " + c.dim("  • ") + c.info("owner/repo") + c.dim(" (e.g., vercel/next.js)"));
    console.log("  " + c.dim("  • ") + c.info("https://github.com/owner/repo"));
    console.log();

    rl.question(c.brand("  ❯ "), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Model selection moved to sharedPrompts.ts to reduce duplication

// ════════════════════════════════════════════════════════════════════════════
// INITIAL ANALYSIS
// ════════════════════════════════════════════════════════════════════════════

async function runInitialAnalysis(
  repoRef: string,
  options: CLIAnalyzeOptions
): Promise<void> {
  const parsed = parseRepoRef(repoRef);
  if (!parsed) {
    printError("Invalid repository format.");
    console.log(c.dim("  Use /analyze <repo> in chat to try again."));
    console.log();
    return;
  }

  const { owner, repo } = parsed;
  const repoUrl = buildRepoUrl(parsed);
  const repoSlug = buildRepoSlug(parsed);

  printRepo(owner, repo);
  printModel(appState.currentModel, appState.isPremium);
  console.log();

  try {
    const result = await analyzeRepositoryWithCopilot({
      repoUrl,
      token: options.token,
      model: appState.currentModel,
      maxFiles: options.maxFiles,
      maxBytes: options.maxBytes,
      timeout: options.timeout,
      verbosity: options.verbosity,
      format: options.format,
    });

    appState.setLastAnalysis(result, repoSlug);

    appState.addToHistory({
      repo: repoSlug,
      score: 0,
      date: new Date().toISOString(),
      findings: 0,
      result: null,
    });

    showPostAnalysisOptions();
  } catch (error) {
    printError(error instanceof Error ? error.message : "Analysis failed");
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN CHAT LOOP
// ════════════════════════════════════════════════════════════════════════════

/**
 * Handle initial onboarding when no repo is provided
 */
async function handleInitialOnboarding(options: CLIAnalyzeOptions): Promise<string | null> {
  const repoRef = await promptRepoUrl();

  if (!repoRef) {
    console.log();
    printWarning("No repository provided. Use /analyze <repo> in chat to try again.");
    console.log();
    return null;
  }

  if (repoRef.startsWith("/")) {
    // User entered a command - parse and execute it
    const command = parseCommand(repoRef);
    
    if (command.type === "analyze") {
      // Run analysis with the repo ref from the command
      const selectedModel = await promptModelSelection();
      appState.setModel(selectedModel.id, selectedModel.premium);
      console.log();
      printSuccess(`Model: ${selectedModel.name}`);
      console.log();
      await handleAnalyze(
        command.repoRef,
        { ...options, issue: command.issue },
        false
      );
      return null; // Don't continue with initial analysis
    } else if (command.type === "deep") {
      // Run deep analysis
      const selectedModel = await promptModelSelection();
      appState.setModel(selectedModel.id, selectedModel.premium);
      console.log();
      printSuccess(`Model: ${selectedModel.name}`);
      console.log();
      await handleAnalyze(
        command.repoRef,
        { ...options, issue: command.issue },
        true
      );
      return null; // Don't continue with initial analysis
    } else if (command.type === "model") {
      // Handle model selection
      await handleModel(command.modelName);
      return null; // Don't continue with initial analysis
    } else {
      // Other commands - skip to chat loop
      console.log();
      printWarning(`Command "${repoRef}" will be processed in chat mode.`);
      console.log();
      return null;
    }
  } else {
    const parsed = parseRepoRef(repoRef);
    if (!parsed) {
      console.log();
      printError("Invalid repository format.");
      console.log(c.dim("  Use /analyze <repo> in chat to try again."));
      console.log();
      return null;
    } else {
      // Ask for model
      const selectedModel = await promptModelSelection();
      appState.setModel(selectedModel.id, selectedModel.premium);

      console.log();
      printSuccess(`Model: ${selectedModel.name}`);
      console.log();

      return repoRef;
    }
  }
}

/**
 * Setup the readline interface for chat
 */
function setupChatInterface(): { rl: readline.Interface; promptUser: () => void; } {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: c.brand("  ❯ "),
  });

  // Prevent readline from closing when stdin pauses
  process.stdin.on("end", () => {
    // Do nothing - keep readline alive
  });

  // Ensure stdin is in flowing mode for readline
  if (process.stdin.isPaused()) {
    process.stdin.resume();
  }

  const promptUser = (): void => {
    // Use rl.prompt() instead of manual stdout.write for proper readline integration
    rl.prompt();
  };

  return { rl, promptUser };
}

/**
 * Process a command in the chat loop
 */
async function processCommandInChat(
  input: string,
  options: CLIAnalyzeOptions,
  rl: readline.Interface
): Promise<void> {
  const command = parseCommand(input);

  // For async commands, pause readline to prevent input issues during analysis
  // "model" is included because its handler creates its own readline
  const shouldPause = [
    "analyze",
    "deep", 
    "export",
    "copy",
    "model"
  ].includes(command.type);

  if (shouldPause) {
    rl.pause();
  }

  try {
    switch (command.type) {
      case "analyze":
        await handleAnalyze(command.repoRef, { ...options, issue: command.issue }, false);
        break;

      case "deep":
        await handleAnalyze(command.repoRef, { ...options, issue: command.issue }, true);
        break;

      case "export":
        await handleExport(command.path, command.format);
        break;

      case "copy":
        await handleCopy();
        break;

      case "summary":
        handleSummary();
        break;

      case "history":
        handleHistory();
        break;

      case "model":
        await handleModel(command.modelName);
        break;

      case "last":
        handleLast();
        break;

      case "clear":
        await handleClear();
        break;

      case "help":
        handleHelp();
        break;

      case "quit":
        appState.setRunning(false);
        printGoodbye();
        rl.close();
        process.exit(0);
        return;

      case "unknown":
        if (command.input.trim()) {
          printUnknownCommand(command.input);
        }
        break;
    }
  } finally {
    // Resume readline after async operations complete
    if (shouldPause) {
      rl.resume();
    }
  }
}

/**
 * Run the interactive chat loop
 */
export async function runChatMode(
  options: CLIAnalyzeOptions,
  initialRepoRef?: string
): Promise<void> {
  options.issue = options.issue ?? false;
  // Ensure token is initialized from environment if not explicitly provided
  options.token = options.token || process.env.GITHUB_TOKEN;

  clearScreen();
  await printChatHeader();
  printWelcome();
  printQuickCommands();

  // ═══════════════════════════════════════════════════════════════════════════
  // ONBOARDING: If no repo provided, ask for one
  // ═══════════════════════════════════════════════════════════════════════════
  if (!initialRepoRef) {
    initialRepoRef = await handleInitialOnboarding(options) || undefined;
  }

  if (initialRepoRef) {
    // Repo provided via argument - analyze directly
    await runInitialAnalysis(initialRepoRef, options);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  printChatStatusBar(
    appState.currentModel,
    appState.isPremium,
    appState.lastRepo || undefined
  );

  const { rl, promptUser } = setupChatInterface();

  // Flag to prevent re-entrance during async operations
  let isProcessing = false;

  const handleLine = async (input: string): Promise<void> => {
    // Prevent multiple simultaneous command executions
    if (isProcessing) {
      return;
    }

    isProcessing = true;
    try {
      await processCommandInChat(input, options, rl);
    } finally {
      isProcessing = false;
    }

    if (appState.isRunning) {
      promptUser();
    }
  };

  rl.on("line", (input) => {
    void handleLine(input);
  });

  rl.on("close", () => {
    if (appState.isRunning) {
      printGoodbye();
      process.exit(0);
    }
  });

  // Start prompting
  promptUser();
}


