/**
 * Message output functions
 * Single Responsibility: Print formatted status messages
 */

import { c, ICON } from "../themes.js";

// ════════════════════════════════════════════════════════════════════════════
// MESSAGE FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print a success message
 */
export function printSuccess(message: string): void {
  console.log();
  console.log("  " + c.healthy(ICON.check) + " " + c.healthyBold(message));
  console.log();
}

/**
 * Print an error message
 */
export function printError(message: string): void {
  console.log();
  console.log("  " + c.critical(ICON.cross) + " " + c.criticalBold(message));
  console.log();
}

/**
 * Print a warning message
 */
export function printWarning(message: string): void {
  console.log();
  console.log("  " + c.warning(ICON.warning) + " " + c.warningBold(message));
  console.log();
}

export function formatLegacyCommandWarning(message: string): string {
  return `Legacy command notice: ${message}`;
}

/**
 * Print an info message
 */
export function printInfo(message: string): void {
  console.log();
  console.log("  " + c.info(ICON.info) + " " + c.text(message));
  console.log();
}

/**
 * Print a goodbye message
 */
export function printGoodbye(): void {
  console.log();
  console.log(
    "  " +
      c.brand("👋") +
      " " +
      c.text("Thank you for using ") +
      c.brand("RepoCheckAI") +
      c.text(". See you next time!")
  );
  console.log();
}
