import path from "node:path";
import { PROJECT_IDENTITY, isLegacyCommand } from "./projectIdentity.js";

export type CommandPhase = "transition" | "post_transition";
export type LegacyBehavior = "allow_with_warning" | "reject_with_guidance";

export interface CommandResolution {
  invokedCommand: string | null;
  effectiveCommand: typeof PROJECT_IDENTITY.officialCommand;
  isLegacy: boolean;
  phase: CommandPhase;
  legacyBehavior: LegacyBehavior;
  deprecationMessage: string;
}

export const COMMAND_TRANSITION_RELEASES = 2 as const;
export const CURRENT_COMMAND_PHASE: CommandPhase = "transition";

function getCommandNameFromArgv(argv: string[] = process.argv): string | null {
  const commandPath = argv[1];
  if (!commandPath) return null;
  const parsed = path.parse(commandPath);
  return parsed.name.toLowerCase();
}

function createDeprecationMessage(legacyCommand: string): string {
  if (CURRENT_COMMAND_PHASE === "transition") {
    return `\`${legacyCommand}\` is deprecated and will be removed after ${COMMAND_TRANSITION_RELEASES} releases. Use \`${PROJECT_IDENTITY.officialCommand}\` from now on.`;
  }
  return `\`${legacyCommand}\` is no longer supported. Run \`${PROJECT_IDENTITY.officialCommand}\` instead.`;
}

export function resolveCommandPolicy(argv: string[] = process.argv): CommandResolution {
  const invokedCommand = getCommandNameFromArgv(argv);
  const isLegacy = invokedCommand ? isLegacyCommand(invokedCommand) : false;

  return {
    invokedCommand,
    effectiveCommand: PROJECT_IDENTITY.officialCommand,
    isLegacy,
    phase: CURRENT_COMMAND_PHASE,
    legacyBehavior:
      CURRENT_COMMAND_PHASE === "transition" ? "allow_with_warning" : "reject_with_guidance",
    deprecationMessage: createDeprecationMessage(invokedCommand || "legacy command"),
  };
}
