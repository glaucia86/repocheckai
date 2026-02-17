import { readFileSync } from "node:fs";

const FALLBACK_VERSION = "0.0.0-dev";
const PACKAGE_JSON_URL = new URL("../../../package.json", import.meta.url);

export const APP_TAGLINE = "AI-Powered GitHub Repository Health Analyzer";
export const PROJECT_MARK = "<git:ok:ai>";
export const DISPLAY_NAME = `RepoCheckAI ${PROJECT_MARK}`;

function readPackageVersion(): string {
  try {
    const packageJsonRaw = readFileSync(PACKAGE_JSON_URL, "utf8");
    const parsed = JSON.parse(packageJsonRaw) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : FALLBACK_VERSION;
  } catch {
    return FALLBACK_VERSION;
  }
}

export const APP_VERSION = readPackageVersion();
