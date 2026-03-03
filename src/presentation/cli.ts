#!/usr/bin/env node

/**
 * RepoCheckAI CLI
 * AI-powered GitHub repository health analyzer
 *
 * This is the main entry point that sets up Commander and delegates
 * to the modular components in src/presentation/cli/
 */

// Ensure UTF-8 encoding for emojis on Windows
if (process.platform === "win32") {
  process.stdout.setDefaultEncoding?.("utf8");
  process.stderr.setDefaultEncoding?.("utf8");
}

import { Command, type OptionValues } from "commander";
import { resolveCommandPolicy } from "../domain/config/commandPolicy.js";
import { PROJECT_IDENTITY } from "../domain/config/projectIdentity.js";
import { APP_TAGLINE, APP_VERSION } from "../domain/config/runtimeMetadata.js";
import {
  clearScreen,
  printHeader,
  printHelp,
  printError,
  printSuccess,
  printWarning,
  formatLegacyCommandWarning,
  printRepo,
  printModel,
  c,
  ICON,
} from "./ui/index.js";
import { analyzeRepositoryWithCopilot } from "../application/core/agent.js";
import { publishReport } from "../application/core/publish/index.js";
import { appState, findModel, parseRepoRef } from "./cli/index.js";
import { runChatMode } from "./cli/chatLoop.js";
import { safeValidateCLIAnalyzeOptions } from "../utils/validation.js";
import { type CLIAnalyzeOptions } from "./cli/types.js";

const defaultOptions: Partial<CLIAnalyzeOptions> = {
  maxFiles: 800,
  maxBytes: 204800,
  timeout: 120000,
  verbosity: "normal",
  format: "pretty",
  issue: false,
  skills: "on",
  skillsMax: 2,
};

const getStringOption = (opts: OptionValues, key: string): string | undefined => {
  const value: unknown = opts[key];
  return typeof value === "string" ? value : undefined;
};

const getBooleanOption = (opts: OptionValues, key: string): boolean | undefined => {
  const value: unknown = opts[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return undefined;
};

const getNumberOption = (opts: OptionValues, key: string): number | undefined => {
  const value: unknown = opts[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const getEnumOption = <T extends string>(
  opts: OptionValues,
  key: string,
  allowed: readonly T[],
  fallback: T
): T => {
  const value = getStringOption(opts, key);
  return value && allowed.includes(value as T) ? (value as T) : fallback;
};

async function runDirectAnalyze(repoRef: string, options: CLIAnalyzeOptions): Promise<void> {
  const isJson = options.format === "json";
  if (!isJson) {
    clearScreen();
    await printHeader();
  }

  const parsed = parseRepoRef(repoRef);
  if (!parsed) {
    if (isJson) {
      console.log(JSON.stringify({ error: "Invalid repository reference", repoRef }));
    } else {
      printError("Invalid repository reference.");
      console.log(c.dim("  Expected formats:"));
      console.log(c.dim("    • https://github.com/owner/repo"));
      console.log(c.dim("    • git@github.com:owner/repo.git"));
      console.log(c.dim("    • owner/repo"));
    }
    process.exit(1);
  }

  const { owner, repo } = parsed;
  if (!isJson) {
    printRepo(owner, repo);
    printModel(appState.currentModel, appState.isPremium);
    if (options.deep) {
      console.log("  " + c.warning("Mode: Deep Analysis (Repomix)"));
    }
    console.log();
  }

  try {
    const repoUrl = `https://github.com/${owner}/${repo}`;
    const result = await analyzeRepositoryWithCopilot({
      repoUrl,
      token: options.token,
      model: appState.currentModel,
      maxFiles: options.maxFiles,
      maxBytes: options.maxBytes,
      timeout: options.deep ? 300000 : options.timeout,
      verbosity: options.verbosity,
      format: options.format,
      deep: options.deep,
      skills: options.skills,
      skillsMax: options.skillsMax,
    });

    const target = options.issue ? "issue" : undefined;
    if (target) {
      const publishResult = await publishReport({
        target,
        repo: {
          owner,
          name: repo,
          fullName: `${owner}/${repo}`,
          url: repoUrl,
        },
        analysisContent: result.content,
        token: options.token,
      });

      if (!isJson) {
        if (publishResult?.ok) {
          if (publishResult.targetUrls && publishResult.targetUrls.length > 0) {
            printSuccess(`Report published: ${publishResult.targetUrls.length} issues created.`);
            publishResult.targetUrls.forEach((url: string) => {
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
          printWarning(`Publish skipped: ${publishResult.error.message}`);
        }
      }
    }
  } catch (error) {
    if (isJson) {
      console.log(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Analysis failed",
          repoRef,
        })
      );
    } else {
      printError(error instanceof Error ? error.message : "Analysis failed");
    }
    process.exit(1);
  }
}

const program = new Command();
const commandPolicy = resolveCommandPolicy(process.argv);

if (commandPolicy.isLegacy) {
  printWarning(formatLegacyCommandWarning(commandPolicy.deprecationMessage));
}

program
  .name(PROJECT_IDENTITY.officialCommand)
  .description(`${ICON.doctor} ${APP_TAGLINE}`)
  .version(APP_VERSION);

program
  .command("chat", { isDefault: true })
  .description("Start interactive chat mode")
  .argument("[repoRef]", "Optional repository URL or slug to analyze immediately")
  .option("--token <TOKEN>", "GitHub token for private repositories")
  .option("--model <name>", "AI model to use", "claude-sonnet-4")
  .action(async (repoRef: string | undefined, opts: OptionValues) => {
    const modelOption = getStringOption(opts, "model");
    if (modelOption) {
      const model = findModel(modelOption);
      if (model) appState.setModel(model.id, model.premium);
    }

    const options: CLIAnalyzeOptions = safeValidateCLIAnalyzeOptions(
      {
        ...defaultOptions,
        token: getStringOption(opts, "token") || process.env.GITHUB_TOKEN,
      },
      defaultOptions
    );
    await runChatMode(options, repoRef);
  });

program
  .command("analyze")
  .description("Analyze a GitHub repository directly")
  .argument("<repoRef>", "Repository URL, SSH, or owner/repo slug")
  .option("--token <TOKEN>", "GitHub token for private repositories")
  .option("--issue", "Publish report as a GitHub issue", false)
  .option("--max-files <N>", "Maximum files to list", "800")
  .option("--max-bytes <N>", "Maximum bytes per file", "204800")
  .option("--timeout <ms>", "Analysis timeout in milliseconds", "120000")
  .option("--verbosity <level>", "Output verbosity (silent|normal|verbose)", "normal")
  .option("--format <type>", "Output format (pretty|json|minimal)", "pretty")
  .option("--model <name>", "AI model to use", "claude-sonnet-4")
  .option("--deep", "Enable deep analysis with full source code review", false)
  .option("--skills <mode>", "Enable or disable analysis skills (on|off)", "on")
  .option("--skills-max <N>", "Maximum number of skills to apply", "2")
  .option("--export", "Export report to markdown after analysis", false)
  .action(async (repoRef: string, opts: OptionValues) => {
    const modelOption = getStringOption(opts, "model");
    if (modelOption) {
      const model = findModel(modelOption);
      if (model) appState.setModel(model.id, model.premium);
    }

    const options: CLIAnalyzeOptions = safeValidateCLIAnalyzeOptions(
      {
        token: getStringOption(opts, "token") || process.env.GITHUB_TOKEN,
        maxFiles: getNumberOption(opts, "maxFiles") ?? defaultOptions.maxFiles,
        maxBytes: getNumberOption(opts, "maxBytes") ?? defaultOptions.maxBytes,
        timeout: getNumberOption(opts, "timeout") ?? defaultOptions.timeout,
        verbosity: getEnumOption(
          opts,
          "verbosity",
          ["silent", "normal", "verbose"] as const,
          defaultOptions.verbosity!
        ),
        format: getEnumOption(
          opts,
          "format",
          ["pretty", "json", "minimal"] as const,
          defaultOptions.format!
        ),
        deep: getBooleanOption(opts, "deep") ?? false,
        issue: getBooleanOption(opts, "issue") ?? false,
        skills: getEnumOption(opts, "skills", ["on", "off"] as const, defaultOptions.skills!),
        skillsMax: getNumberOption(opts, "skillsMax") ?? defaultOptions.skillsMax,
      },
      defaultOptions
    );
    await runDirectAnalyze(repoRef, options);
  });

program
  .command("help")
  .description("Show detailed help")
  .action(async () => {
    clearScreen();
    await printHeader(true, false);
    printHelp();
  });

program.parse();
