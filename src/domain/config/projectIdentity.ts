export const PROJECT_IDENTITY = {
  officialProductName: "RepoCheckAI",
  officialPackageName: "repocheckai",
  officialCommand: "repocheck",
  legacyProductNames: ["Repo Check AI"],
  legacyCommands: ["repo-doctor", "repodoctor"],
  migrationStatus: "transition",
  effectiveFromRelease: "2.5.0",
  legacySupportUntilRelease: "2.6.x",
} as const;

export type CommandName = typeof PROJECT_IDENTITY.officialCommand | (typeof PROJECT_IDENTITY.legacyCommands)[number];

export function isLegacyCommand(commandName: string): boolean {
  return PROJECT_IDENTITY.legacyCommands.includes(commandName as (typeof PROJECT_IDENTITY.legacyCommands)[number]);
}

