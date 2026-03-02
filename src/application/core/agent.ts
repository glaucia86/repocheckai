import { CopilotClient, type CopilotSession } from "@github/copilot-sdk";
import { repoTools, deepAnalysisTools } from "../../infrastructure/tools/repoTools.js";
import {
  loadBundledAnalysisSkills,
  formatSkillsCatalogForPrompt,
  formatSelectedSkillsForPrompt,
  matchAnalysisSkills,
} from "./skills/index.js";
import { createOctokit, parseRepoUrl } from "../../infrastructure/providers/github.js";
import type { AnalysisSkillDocument } from "../../domain/types/analysisSkill.js";
import {
  startSpinner,
  updateSpinner,
  spinnerSuccess,
  spinnerFail,
  printWarning,
  c,
  ICON,
  box,
} from "../../presentation/ui/index.js";

// Import extracted modules (SOLID refactoring)
import {
  SYSTEM_PROMPT,
  QUICK_SYSTEM_PROMPT,
  DEEP_SYSTEM_PROMPT,
  composeSystemPrompt,
  getSystemPrompt,
  buildAnalysisPrompt,
  createGuardrails,
  createEventHandler,
} from "./agent/index.js";
import type { EventHandlerState } from "./agent/eventHandler.js";
import type { AgentGuardrails } from "./agent/guardrails.js";

// Re-export for backward compatibility
export { SYSTEM_PROMPT, QUICK_SYSTEM_PROMPT, DEEP_SYSTEM_PROMPT, getSystemPrompt };

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface AnalyzeOptions {
  repoUrl: string;
  token?: string;
  model?: string;
  maxFiles?: number;
  maxBytes?: number;
  timeout?: number;
  verbosity?: "silent" | "normal" | "verbose";
  format?: "pretty" | "json" | "minimal";
  /** Enable deep analysis using Repomix for comprehensive codebase analysis */
  deep?: boolean;
  /** Analysis skills mode */
  skills?: "on" | "off";
  /** Maximum number of skills to apply */
  skillsMax?: number;
}

export interface AnalysisOutput {
  content: string;
  toolCallCount: number;
  durationMs: number;
  repoUrl: string;
  model: string;
}

type StackDetectionConfidence = "high" | "medium" | "low";

interface StackDetectionResult {
  stacks: string[];
  confidence: StackDetectionConfidence;
}

// ════════════════════════════════════════════════════════════════════════════
// NOTE: SYSTEM_PROMPT, PHASES, and AnalysisPhase moved to ./agent/ (SOLID)
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Initialize Copilot client and create analysis session
 */
async function initializeCopilotSession(options: {
  repoUrl: string;
  model: string;
  isDeep: boolean;
  token?: string;
  maxFiles: number;
  maxBytes: number;
  skillsMode: "on" | "off";
  skillsMax: number;
}) {
  const { repoUrl, model, isDeep, token, maxFiles, maxBytes, skillsMode, skillsMax } = options;
  const mode = isDeep ? "deep" : "quick";
  const analysisSkills = skillsMode === "on" ? loadBundledAnalysisSkills() : [];
  const stackDetection =
    skillsMode === "on"
      ? await detectStacksForSkills(repoUrl, token)
      : { stacks: [], confidence: "low" as const };
  const selectedSkills =
    skillsMode === "on"
      ? selectPreselectedSkills(
        analysisSkills,
        mode,
        stackDetection.stacks,
        stackDetection.confidence,
        skillsMax
      )
      : [];

  // Create and start client
  const client = new CopilotClient();
  await client.start();

  // Create session with tools
  const baseTools = repoTools({
    token,
    maxFiles,
    maxBytes,
    analysisSkills,
    skillsEnabled: skillsMode === "on",
  });
  const tools = isDeep 
    ? [...baseTools, ...deepAnalysisTools({ maxBytes: 512000 })]
    : baseTools;

  // Select the appropriate system prompt based on analysis mode
  const skillsCatalog = formatSkillsCatalogForPrompt(analysisSkills, mode);
  const selectedSkillsDirective = formatSelectedSkillsForPrompt(selectedSkills);
  const mergedSkillRules = [skillsCatalog, selectedSkillsDirective]
    .filter(Boolean)
    .join("\n\n");
  const systemPrompt = skillsCatalog
    ? composeSystemPrompt({
      mode,
      additionalRules: mergedSkillRules,
    })
    : getSystemPrompt(mode);

  const session = await client.createSession({
    model: model,
    streaming: true,
    tools,
    systemMessage: {
      mode: "append",
      content: systemPrompt,
    },
    // Enable infinite sessions for long-running analyses (v0.1.18+)
    // Automatically compacts context when buffer approaches limits
    infiniteSessions: {
      enabled: true,
      backgroundCompactionThreshold: 0.80,  // Start compaction at 80% buffer
      bufferExhaustionThreshold: 0.95,      // Block at 95% until compaction completes
    },
  });

  return { client, session, selectedSkills };
}

/**
 * Run analysis with timeout handling
 */
async function runAnalysisWithTimeout(session: CopilotSession, prompt: string, timeout: number, isSilent: boolean, isJson: boolean) {
  try {
    const response = await session.sendAndWait({ prompt }, timeout);
    
    if (!response && !isSilent && !isJson) {
      printWarning("No response received from Copilot");
    }
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("timeout")) {
      printWarning(`Analysis timed out after ${timeout / 1000}s. Partial results shown above.`);
    } else {
      throw error;
    }
  }
}

/**
 * Handle analysis completion and logging
 */
function handleAnalysisCompletion(
  state: EventHandlerState,
  guardrails: AgentGuardrails,
  durationMs: number,
  isVerbose: boolean,
  isSilent: boolean,
  isJson: boolean
) {
  // Final message
  if (!isSilent && !isJson) {
    // Print completion summary
    console.log();
    
    if (state.aborted) {
      console.log(
        "  " +
          c.warning(ICON.warn) +
          " " +
          c.warningBold("Analysis stopped by guardrails")
      );
      console.log(
        "  " +
          c.dim(`Reason: ${state.abortReason}`)
      );
    } else {
      console.log(
        "  " +
          c.healthy(ICON.check) +
          " " +
          c.healthyBold("Analysis completed successfully!")
      );
    }
    
    console.log(
      "  " +
        c.dim(`Made ${state.toolCallCount} API calls in ${(durationMs / 1000).toFixed(1)}s`)
    );
    
    // Log guardrail stats in verbose mode
    if (isVerbose) {
      const stats = guardrails.getStats();
      if (stats.warningCount > 0) {
        console.log(
          "  " +
            c.warning(`Guardrail warnings: ${stats.warningCount}`)
        );
      }
      console.timeEnd("Analysis duration");
    }
    console.log();
  }
}

export async function analyzeRepositoryWithCopilot(options: AnalyzeOptions): Promise<AnalysisOutput> {
  const startTime = Date.now();
  if (options.verbosity === "verbose") {
    console.time("Analysis duration");
  }
  
  const {
    repoUrl,
    token,
    model = "claude-sonnet-4",
    maxFiles = 800,
    maxBytes = 204800,
    timeout = 120000,
    verbosity = "normal",
    format = "pretty",
    deep = false,
    skills = "on",
    skillsMax = 2,
  } = options;

  const isVerbose = verbosity === "verbose";
  const isSilent = verbosity === "silent";
  const isJson = format === "json";
  const isDeep = deep;

  // Initialize guardrails for loop detection and step limits
  const guardrails = createGuardrails(isDeep ? "deep" : "standard");

  // Start spinner
  let spinner = !isSilent && !isJson ? startSpinner("Initializing Copilot...") : null;

  try {
    // Initialize Copilot session
    const { client, session, selectedSkills } = await initializeCopilotSession({
      repoUrl,
      model,
      isDeep,
      token,
      maxFiles,
      maxBytes,
      skillsMode: skills,
      skillsMax,
    });

    if (spinner) {
      updateSpinner("Creating analysis session...");
      spinnerSuccess("Session created");
      spinner = null;
    }

    // Set up event handling using shared handler (SOLID - single source of truth)
    const { handler, state } = createEventHandler({
      verbose: isVerbose,
      silent: isSilent,
      json: isJson,
      hasSpinner: !!spinner,
      guardrails,
    });

    session.on(handler);

    // Build the analysis prompt using extracted function (SOLID refactoring)
    const prompt = buildAnalysisPrompt({
      repoUrl,
      deep: isDeep,
      skillsEnabled: skills === "on",
      skillsMax,
    });

    // Start analysis spinner
    if (!isSilent && !isJson) {
      // Print analysis info box
      const analysisInfoLines = box(
        [
          "",
          `${c.dim("Repository:")} ${c.brand(repoUrl)}`,
          `${c.dim("Model:")} ${c.info(model)}`,
          `${c.dim("Max Files:")} ${c.text(String(maxFiles))}`,
          isDeep ? `${c.dim("Mode:")} ${c.warning("Deep Analysis (Repomix)")}` : "",
          "",
        ].filter(Boolean),
        {
          minWidth: 50,
          maxWidth: 100,
          title: `${ICON.analyze} ANALYSIS`,
        }
      );
      for (const line of analysisInfoLines) {
        console.log("  " + line);
      }
      console.log();
    }

    // Run analysis with timeout
    await runAnalysisWithTimeout(session, prompt, timeout, isSilent, isJson);

    // Cleanup
    await client.stop();

    const durationMs = Date.now() - startTime;

    // Handle completion logging
    handleAnalysisCompletion(state, guardrails, durationMs, isVerbose, isSilent, isJson);

    // Return analysis result (DO NOT call process.exit!)
    const targetRepoSlug = getTargetRepoSlug(repoUrl);
    return {
      content: appendEvidenceIntegritySection(
        appendAppliedSkillsSection(
          state.outputBuffer,
          selectedSkills.map((skill) => skill.meta.name),
          state.appliedSkillNames ?? [],
          skills
        ),
        {
          targetRepoSlug,
          evidenceRepoFullName: state.evidence.repoFullName,
          listedPaths: state.evidence.listedPaths,
          readPaths: state.evidence.readPaths,
        }
      ),
      toolCallCount: state.toolCallCount,
      durationMs,
      repoUrl,
      model,
    };
  } catch (error) {
    if (spinner) {
      spinnerFail("Analysis failed");
    }
    throw error;
  }
}

function appendAppliedSkillsSection(
  content: string,
  preselectedSkills: string[],
  appliedSkills: string[],
  skillsMode: "on" | "off"
): string {
  if (/^#+\s+Skills Used/m.test(content)) {
    return content;
  }

  const bulletLines =
    skillsMode === "off"
      ? ["- disabled"]
      : preselectedSkills.length > 0
        ? preselectedSkills.map((skill) => `- ${skill}`)
        : appliedSkills.length > 0
          ? appliedSkills.map((skill) => `- ${skill}`)
        : ["- none selected"];

  const lines = [
    "",
    "## Skills Used",
    ...bulletLines,
  ];

  return `${content.trimEnd()}\n${lines.join("\n")}\n`;
}

function getTargetRepoSlug(repoUrl: string): string {
  try {
    const parsed = parseRepoUrl(repoUrl);
    return `${parsed.owner}/${parsed.repo}`.toLowerCase();
  } catch {
    return repoUrl.trim().toLowerCase();
  }
}

function appendEvidenceIntegritySection(
  content: string,
  options: {
    targetRepoSlug: string;
    evidenceRepoFullName: string | null;
    listedPaths: string[];
    readPaths: string[];
  }
): string {
  if (/^##\s+Evidence Integrity Warnings/m.test(content)) {
    return content;
  }

  const warnings: string[] = [];
  const targetRepoSlug = options.targetRepoSlug.toLowerCase();

  if (options.evidenceRepoFullName) {
    const observed = options.evidenceRepoFullName.toLowerCase();
    if (observed !== targetRepoSlug) {
      warnings.push(
        `Tool evidence mismatch: get_repo_meta returned \`${options.evidenceRepoFullName}\`, expected \`${targetRepoSlug}\`.`
      );
    }
  }

  const listedSet = new Set(options.listedPaths.map((path) => path.toLowerCase()));
  const readSet = new Set(options.readPaths.map((path) => path.toLowerCase()));
  if (listedSet.size > 0) {
    const referencedPaths = extractReferencedPaths(content);
    const unknown = referencedPaths.filter(
      (path) => !listedSet.has(path) && !readSet.has(path)
    );
    if (unknown.length >= 3) {
      const sample = unknown.slice(0, 5).map((path) => `\`${path}\``).join(", ");
      warnings.push(
        `Report references paths not present in repository evidence (sample: ${sample}). Possible context leakage.`
      );
    }
  }

  if (warnings.length === 0) {
    return content;
  }

  const section = [
    "",
    "## Evidence Integrity Warnings",
    ...warnings.map((warning) => `- ${warning}`),
  ];

  return `${content.trimEnd()}\n${section.join("\n")}\n`;
}

function extractReferencedPaths(content: string): string[] {
  const matches = content.match(/(?:^|[\s`"'(])([A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+\.[A-Za-z0-9_-]+)(?=$|[\s`"'):,])/gm) || [];
  const normalized = matches
    .map((raw) => raw.trim().replace(/^[\s`"'(]+/, "").toLowerCase())
    .filter((path) => !path.startsWith("http://") && !path.startsWith("https://"));

  return Array.from(new Set(normalized));
}

async function detectStacksForSkills(repoUrl: string, token?: string): Promise<StackDetectionResult> {
  try {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const octokit = createOctokit(token);
    const [repoMeta, repoLanguages] = await Promise.all([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listLanguages({ owner, repo }),
    ]);
    const rootEntries = await readRootEntriesSafe(octokit, owner, repo);

    const stacks = new Set<string>();
    const topLanguage = repoMeta.data.language?.toLowerCase();
    const languageNames = [
      ...(topLanguage ? [topLanguage] : []),
      ...Object.keys(repoLanguages.data || {}).map((lang) => lang.toLowerCase()),
    ];

    for (const language of languageNames) {
      if (language.includes("typescript") || language.includes("javascript")) {
        stacks.add("node");
        stacks.add("typescript");
        stacks.add("javascript");
      } else if (language.includes("python")) {
        stacks.add("python");
      } else if (language === "go") {
        stacks.add("go");
      } else if (language.includes("rust")) {
        stacks.add("rust");
      }
    }

    const manifestStacks = detectStacksFromManifestFiles(rootEntries);
    for (const stack of manifestStacks) {
      stacks.add(stack);
    }

    if (stacks.size === 0) {
      return {
        stacks: ["any"],
        confidence: "low",
      };
    }

    const confidence: StackDetectionConfidence =
      manifestStacks.size > 0 ? "high" : "medium";

    return {
      stacks: Array.from(stacks),
      confidence,
    };
  } catch {
    return {
      stacks: ["any"],
      confidence: "low",
    };
  }
}

function selectPreselectedSkills(
  skills: AnalysisSkillDocument[],
  mode: "quick" | "deep",
  detectedStacks: string[],
  detectionConfidence: StackDetectionConfidence,
  skillsMax: number
): AnalysisSkillDocument[] {
  const max = Math.max(1, Math.min(skillsMax, 6));
  const ranked = matchAnalysisSkills(skills, { mode, detectedStacks }, 12).map((m) => m.skill);
  const stackSet = new Set(detectedStacks.map((stack) => stack.toLowerCase()));
  const preferredOrder =
    detectionConfidence === "low"
      ? [
        "security-baseline",
        "ci-quality",
        "polyglot-governance",
        "insecure-defaults",
        "security-supply-chain",
        "security-scanning-dependencies",
      ]
      : [
        "security-baseline",
        "ci-quality",
        ...stackSpecificSkillOrder(stackSet),
        "insecure-defaults",
        "security-supply-chain",
        "security-scanning-dependencies",
        "owasp-security-check",
        "github-expert",
        "sast-readiness",
        "security-ownership-risk",
        "sharp-edges",
        "semgrep-guidance",
        "polyglot-governance",
      ];

  if (mode === "deep") {
    preferredOrder.push("variant-analysis");
  }

  const selected: AnalysisSkillDocument[] = [];
  const seen = new Set<string>();
  const addIfEligible = (name: string): void => {
    if (selected.length >= max || seen.has(name)) return;
    const skill = skills.find((candidate) => candidate.meta.name === name);
    if (!skill || !skill.meta.modes.includes(mode)) return;
    selected.push(skill);
    seen.add(skill.meta.name);
  };

  for (const preferred of preferredOrder) {
    addIfEligible(preferred);
  }

  for (const skill of ranked) {
    if (selected.length >= max) break;
    if (seen.has(skill.meta.name)) continue;
    selected.push(skill);
    seen.add(skill.meta.name);
  }

  return selected;
}

function stackSpecificSkillOrder(stacks: Set<string>): string[] {
  const order: string[] = [];
  if (stacks.has("node") || stacks.has("typescript") || stacks.has("javascript")) {
    order.push("node-governance");
  }
  if (stacks.has("python")) {
    order.push("python-quality");
  }
  if (stacks.has("go")) {
    order.push("go-reliability");
  }
  if (stacks.has("rust")) {
    order.push("rust-safety");
  }
  return order;
}

async function readRootEntriesSafe(
  octokit: ReturnType<typeof createOctokit>,
  owner: string,
  repo: string
): Promise<string[]> {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: "",
    });
    if (!Array.isArray(response.data)) {
      return [];
    }
    return response.data
      .map((entry) => entry.name?.toLowerCase())
      .filter((name): name is string => Boolean(name));
  } catch {
    return [];
  }
}

function detectStacksFromManifestFiles(rootEntries: string[]): Set<string> {
  const stacks = new Set<string>();
  const hasAny = (names: string[]): boolean => names.some((name) => rootEntries.includes(name));

  if (hasAny(["package.json", "pnpm-workspace.yaml", "yarn.lock", "package-lock.json"])) {
    stacks.add("node");
    stacks.add("typescript");
    stacks.add("javascript");
  }
  if (hasAny(["pyproject.toml", "requirements.txt", "requirements-dev.txt", "setup.py", "pipfile"])) {
    stacks.add("python");
  }
  if (hasAny(["go.mod", "go.work"])) {
    stacks.add("go");
  }
  if (hasAny(["cargo.toml", "cargo.lock"])) {
    stacks.add("rust");
  }

  return stacks;
}


