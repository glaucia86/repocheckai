/**
 * Interactive prompts for RepoCheckAI CLI
 * Uses @inquirer/prompts for beautiful terminal interactions
 * 
 * Note: @inquirer/prompts is an optional dependency.
 * These functions are only used in interactive mode.
 */

import { c, ICON } from "./themes.js";
import { clearScreen, printHeader } from "./display.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface RepoSelection {
  owner: string;
  repo: string;
  url: string;
}

export interface AnalysisOptionsPrompt {
  categories: string[];
  maxFiles: number;
  verbosity: "silent" | "normal" | "verbose";
}

// ════════════════════════════════════════════════════════════════════════════
// DYNAMIC IMPORT FOR INQUIRER
// ════════════════════════════════════════════════════════════════════════════

interface InquirerPrompts {
  input: (config: {
    message: string;
    validate?: (value: string) => string | boolean;
    transformer?: (value: string) => string;
  }) => Promise<string>;
  select: <T>(config: {
    message: string;
    choices: Array<{ name: string; value: T; description?: string }>;
    default?: T;
  }) => Promise<T>;
  confirm: (config: { message: string; default?: boolean }) => Promise<boolean>;
  checkbox: <T>(config: {
    message: string;
    choices: Array<{ name: string; value: T; checked?: boolean }>;
  }) => Promise<T[]>;
}

let inquirer: InquirerPrompts | null = null;

async function loadInquirer(): Promise<InquirerPrompts> {
  if (inquirer) return inquirer;
  
  try {
    const mod = await import("@inquirer/prompts");
    inquirer = {
      input: mod.input,
      select: mod.select,
      confirm: mod.confirm,
      checkbox: mod.checkbox,
    };
    return inquirer;
  } catch {
    throw new Error(
      "Interactive mode requires @inquirer/prompts.\n" +
      "Install it with: npm install @inquirer/prompts"
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REPOSITORY INPUT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Prompt user for repository URL/slug
 */
export async function promptForRepo(): Promise<string> {
  const { input } = await loadInquirer();
  
  const repoRef = await input({
    message: c.brand("Enter repository URL or slug:"),
    validate: (value: string) => {
      if (!value.trim()) {
        return "Please enter a repository reference";
      }
      // Basic validation
      if (
        value.includes("github.com") ||
        value.match(/^[\w-]+\/[\w.-]+$/) ||
        value.startsWith("git@")
      ) {
        return true;
      }
      return "Invalid format. Use: owner/repo, https://github.com/owner/repo, or git@github.com:owner/repo.git";
    },
    transformer: (value: string) => c.info(value),
  });

  return repoRef.trim();
}

/**
 * Prompt to select from recent repositories
 */
export async function promptSelectRepo(
  recentRepos: RepoSelection[]
): Promise<RepoSelection | null> {
  if (recentRepos.length === 0) {
    return null;
  }

  const { select } = await loadInquirer();

  const choices = [
    ...recentRepos.map((repo) => ({
      name: `${c.brand(repo.owner)}/${c.infoBold(repo.repo)}`,
      value: repo as RepoSelection | null,
      description: c.dim(repo.url),
    })),
    {
      name: c.muted("Enter a new repository"),
      value: null as RepoSelection | null,
      description: c.dim("Type a new URL or slug"),
    },
  ];

  const selected = await select({
    message: c.brand("Select a repository to analyze:"),
    choices,
  });

  return selected;
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS OPTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Prompt for analysis options
 */
export async function promptAnalysisOptions(): Promise<AnalysisOptionsPrompt> {
  const { checkbox, select } = await loadInquirer();

  const categories = await checkbox<string>({
    message: c.brand("Select categories to analyze:"),
    choices: [
      { name: `${ICON.docs} Docs & Onboarding`, value: "docs", checked: true },
      { name: `${ICON.dx} Developer Experience`, value: "dx", checked: true },
      { name: `${ICON.ci} CI/CD`, value: "ci", checked: true },
      { name: `${ICON.tests} Quality & Tests`, value: "tests", checked: true },
      { name: `${ICON.governance} Governance`, value: "governance", checked: true },
      { name: `${ICON.security} Security`, value: "security", checked: true },
    ],
  });

  const verbosity = await select<"silent" | "normal" | "verbose">({
    message: c.brand("Output verbosity:"),
    choices: [
      { name: "Normal", value: "normal", description: "Standard output with findings" },
      { name: "Verbose", value: "verbose", description: "Detailed output with all evidence" },
      { name: "Silent", value: "silent", description: "Minimal output (good for scripts)" },
    ],
    default: "normal",
  });

  return {
    categories,
    maxFiles: 800,
    verbosity,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIRMATION PROMPTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Confirm before analyzing a private repository
 */
export async function confirmPrivateRepo(repoName: string): Promise<boolean> {
  const { confirm } = await loadInquirer();
  
  return confirm({
    message: c.warning(`${ICON.lock} ${repoName} appears to be private. Continue with analysis?`),
    default: true,
  });
}

/**
 * Confirm before a long-running analysis
 */
export async function confirmLargeRepo(
  fileCount: number,
  estimatedTime: string
): Promise<boolean> {
  const { confirm } = await loadInquirer();
  
  return confirm({
    message: c.warning(`Repository has ${fileCount} files. Analysis may take ${estimatedTime}. Continue?`),
    default: true,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// TOKEN INPUT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Prompt for GitHub token
 */
export async function promptForToken(): Promise<string | undefined> {
  const { confirm, input } = await loadInquirer();

  const useToken = await confirm({
    message: c.brand("Do you want to provide a GitHub token for private repos?"),
    default: false,
  });

  if (!useToken) {
    return undefined;
  }

  const token = await input({
    message: c.brand("Enter your GitHub token:"),
    validate: (value: string) => {
      if (!value.trim()) {
        return "Token cannot be empty";
      }
      if (!value.startsWith("ghp_") && !value.startsWith("github_pat_")) {
        return c.warning("Token doesn't look like a GitHub token, but will try anyway");
      }
      return true;
    },
    transformer: (value: string) => c.dim("*".repeat(value.length)),
  });

  return token.trim() || undefined;
}

// ════════════════════════════════════════════════════════════════════════════
// MODEL SELECTION
// ════════════════════════════════════════════════════════════════════════════

export interface ModelChoice {
  id: string;
  name: string;
  premium: boolean;
}

/**
 * Interactive model selector with premium indicators
 */
export async function promptModelSelect(
  models: ModelChoice[],
  currentModel: string
): Promise<ModelChoice | null> {
  const { select } = await loadInquirer();

  const choices = models.map((model) => {
    const premiumIcon = model.premium ? c.premium(" ⚡") : c.healthy(" ✓ FREE");
    const isCurrent = model.id === currentModel;
    const currentIndicator = isCurrent ? c.dim(" (current)") : "";
    
    return {
      name: `${c.infoBold(model.name)}${premiumIcon}${currentIndicator}`,
      value: model,
      description: model.premium 
        ? c.dim("Requires Copilot Pro/Business subscription")
        : c.healthy("Available to all Copilot users"),
    };
  });

  console.log();
  
  const selected = await select<ModelChoice>({
    message: c.brand("Select AI model:"),
    choices,
    default: models.find((m) => m.id === currentModel),
  });

  return selected;
}

// ════════════════════════════════════════════════════════════════════════════
// OUTPUT FORMAT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Prompt for output format
 */
export async function promptOutputFormat(): Promise<"pretty" | "json" | "minimal"> {
  const { select } = await loadInquirer();

  return select<"pretty" | "json" | "minimal">({
    message: c.brand("Output format:"),
    choices: [
      { name: "Pretty", value: "pretty", description: "Colorful terminal output with boxes" },
      { name: "JSON", value: "json", description: "Structured JSON for scripting" },
      { name: "Minimal", value: "minimal", description: "One-line summary" },
    ],
    default: "pretty",
  });
}

// ════════════════════════════════════════════════════════════════════════════
// INTERACTIVE MODE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Run interactive mode to gather all options
 */
export async function runInteractiveMode(): Promise<{
  repoRef: string;
  token?: string;
  options: AnalysisOptionsPrompt;
  format: "pretty" | "json" | "minimal";
}> {
  clearScreen();
  await printHeader(false, true); // not compact, animated

  console.log("  " + c.brand(ICON.sparkle) + " " + c.text("Welcome to RepoCheckAI!"));
  console.log();

  // Get repository
  const repoRef = await promptForRepo();

  // Get token if needed
  const token = await promptForToken();

  // Get analysis options
  const options = await promptAnalysisOptions();

  // Get output format
  const format = await promptOutputFormat();

  return {
    repoRef,
    token,
    options,
    format,
  };
}
