/**
 * Command system for Repo Check AI CLI
 * Handles slash commands for chat-style interface
 */

import { c, ICON } from "./themes.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type CommandType =
  | { type: "analyze"; repoRef: string; issue?: boolean }
  | { type: "deep"; repoRef: string; issue?: boolean }
  | { type: "summary" }
  | { type: "last" }
  | { type: "export"; format?: "md" | "json"; path?: string }
  | { type: "copy" }
  | { type: "history" }
  | { type: "model"; modelName?: string }
  | { type: "clear" }
  | { type: "help" }
  | { type: "quit" }
  | { type: "unknown"; input: string };

// ════════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

export interface CommandDefinition {
  command: string;
  aliases: string[];
  description: string;
  usage: string;
  example?: string;
  category: "analysis" | "output" | "utility";
}

export const COMMANDS: CommandDefinition[] = [
  // Analysis commands
  {
    command: "/analyze",
    aliases: ["/a", "/scan", "/check"],
    description: "Analyze a GitHub repository",
    usage: "/analyze <repo-url or owner/repo> [--issue]",
    example: "/analyze vercel/next.js --issue",
    category: "analysis",
  },
  {
    command: "/deep",
    aliases: ["/d", "/full"],
    description: "Deep analysis with full source code review (uses Repomix)",
    usage: "/deep <repo-url or owner/repo> [--issue]",
    example: "/deep vercel/swr --issue",
    category: "analysis",
  },
  {
    command: "/last",
    aliases: ["/l", "/prev"],
    description: "Show the last analysis result",
    usage: "/last",
    category: "analysis",
  },
  {
    command: "/history",
    aliases: ["/h", "/recent"],
    description: "Show recent analyses",
    usage: "/history",
    category: "analysis",
  },

  // Output commands
  {
    command: "/summary",
    aliases: ["/sum", "/brief"],
    description: "Generate condensed summary of last analysis",
    usage: "/summary",
    category: "output",
  },
  {
    command: "/export",
    aliases: ["/save", "/e"],
    description: "Export report to markdown file",
    usage: "/export [path] [md|json]",
    example: "/export ~/Desktop/report.md",
    category: "output",
  },
  {
    command: "/copy",
    aliases: ["/cp", "/clipboard"],
    description: "Copy last analysis to clipboard",
    usage: "/copy",
    category: "output",
  },

  // Utility commands
  {
    command: "/model",
    aliases: ["/m"],
    description: "Switch AI model",
    usage: "/model [model-name]",
    example: "/model gpt-4o",
    category: "utility",
  },
  {
    command: "/clear",
    aliases: ["/cls", "/c"],
    description: "Clear the screen",
    usage: "/clear",
    category: "utility",
  },
  {
    command: "/help",
    aliases: ["/h", "/?"],
    description: "Show available commands",
    usage: "/help",
    category: "utility",
  },
  {
    command: "/quit",
    aliases: ["/q", "/exit"],
    description: "Exit Repo Check AI",
    usage: "/quit",
    category: "utility",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// COMMAND PARSING
// ════════════════════════════════════════════════════════════════════════════

/**
 * Parse arguments for analyze/deep commands, extracting flags and repo ref
 */
function parseAnalyzeArgs(args: string[]): { repoRef: string; issue?: boolean } {
  let repoRef = "";
  let issue = false;

  for (const arg of args) {
    const normalizedFlag = arg.toLowerCase();
    const isIssueFlag = /^[-–—]+issue$/.test(normalizedFlag);

    if (normalizedFlag === "--issue" || isIssueFlag) {
      issue = true;
    } else {
      // Assume it's part of the repo ref
      repoRef += (repoRef ? " " : "") + arg;
    }
  }

  return { repoRef: repoRef.trim(), issue };
}

/**
 * Parse user input into a command
 */
export function parseCommand(input: string): CommandType {
  const trimmed = input.trim();

  // Empty input
  if (!trimmed) {
    return { type: "unknown", input: "" };
  }

  // Not a command - could be a natural language request
  if (!trimmed.startsWith("/")) {
    // Check if it looks like a repo reference
    if (
      trimmed.includes("github.com") ||
      trimmed.match(/^[\w-]+\/[\w.-]+$/) ||
      trimmed.startsWith("git@")
    ) {
      return { type: "analyze", repoRef: trimmed };
    }
    return { type: "unknown", input: trimmed };
  }

  // Parse command and arguments
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0]?.toLowerCase() || "";
  const args = parts.slice(1);

  // Match against known commands
  const commandDef = COMMANDS.find(
    (c) => c.command === cmd || c.aliases.includes(cmd)
  );

  if (!commandDef) {
    return { type: "unknown", input: trimmed };
  }

  // Parse specific commands
  switch (commandDef.command) {
    case "/analyze": {
      if (args.length === 0) {
        return { type: "unknown", input: trimmed };
      }
      try {
        const { repoRef, issue } = parseAnalyzeArgs(args);
        return { type: "analyze", repoRef, issue };
      } catch (error) {
        console.log("Error parsing /analyze command:", error);
        return { type: "unknown", input: trimmed };
      }
    }

    case "/deep": {
      if (args.length === 0) {
        return { type: "unknown", input: trimmed };
      }
      try {
        const { repoRef, issue } = parseAnalyzeArgs(args);
        return { type: "deep", repoRef, issue };
      } catch (error) {
        console.log("Error parsing /deep command:", error);
        return { type: "unknown", input: trimmed };
      }
    }

    case "/export": {
      // Parse args: could be path, format, or both
      // /export → default
      // /export md → format only
      // /export ~/Desktop → path only
      // /export ~/Desktop/report.md → path only
      // /export ~/Desktop json → path + format
      let format: "md" | "json" | undefined;
      let path: string | undefined;
      
      for (const arg of args) {
        const lower = arg.toLowerCase();
        if (lower === "md" || lower === "json") {
          format = lower;
        } else if (arg) {
          path = arg;
        }
      }
      
      return { type: "export", format, path };
    }

    case "/copy":
      return { type: "copy" };

    case "/summary":
      return { type: "summary" };

    case "/model":
      return { type: "model", modelName: args[0] };

    case "/last":
      return { type: "last" };

    case "/history":
      return { type: "history" };

    case "/clear":
      return { type: "clear" };

    case "/help":
      return { type: "help" };

    case "/quit":
      return { type: "quit" };

    default:
      return { type: "unknown", input: trimmed };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HELP FORMATTING
// ════════════════════════════════════════════════════════════════════════════

/**
 * Format commands for display
 */
export function formatHelpCommands(): string[] {
  const lines: string[] = [];

  const categories = {
    analysis: { label: "Analysis Commands", icon: ICON.analyze },
    output: { label: "Output Commands", icon: ICON.save },
    utility: { label: "Utility Commands", icon: "⚙️" },
  };

  for (const [catKey, catInfo] of Object.entries(categories)) {
    const catCommands = COMMANDS.filter((c) => c.category === catKey);
    if (catCommands.length === 0) continue;

    lines.push("");
    lines.push(`${catInfo.icon} ${c.brandBold(catInfo.label)}`);
    lines.push("");

    for (const cmd of catCommands) {
      const aliasStr = cmd.aliases.length > 0 
        ? c.muted(` (${cmd.aliases.join(", ")})`)
        : "";
      lines.push(`  ${c.info(cmd.command)}${aliasStr}`);
      lines.push(`    ${c.dim(cmd.description)}`);
      if (cmd.example) {
        lines.push(`    ${c.muted("Example:")} ${c.text(cmd.example)}`);
      }
    }
  }

  return lines;
}

/**
 * Get command suggestions for autocomplete
 */
export function getCommandSuggestions(partial: string): string[] {
  const lower = partial.toLowerCase();
  const suggestions: string[] = [];

  for (const cmd of COMMANDS) {
    if (cmd.command.startsWith(lower)) {
      suggestions.push(cmd.command);
    }
    for (const alias of cmd.aliases) {
      if (alias.startsWith(lower)) {
        suggestions.push(alias);
      }
    }
  }

  return suggestions;
}

/**
 * Get quick command reference
 */
export function getQuickReference(): string {
  const quickCmds = [
    { cmd: "/analyze", desc: "analyze repo" },
    { cmd: "/export", desc: "save report" },
    { cmd: "/history", desc: "recent" },
    { cmd: "/help", desc: "help" },
    { cmd: "/quit", desc: "exit" },
  ];

  return quickCmds
    .map((c) => `${c.cmd} ${c.desc}`)
    .join("  •  ");
}

