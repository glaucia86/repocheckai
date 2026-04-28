/**
 * Shared UI helpers for interactive prompts
 * Reduces duplication across CLI handlers
 */

import * as readline from "readline";
import { getAvailableModels, refreshAvailableModels, type ModelInfo } from "../state/appState.js";
import {
  c,
  ICON,
} from "../../ui/index.js";

/**
 * Generic model selection prompt used across CLI handlers
 */
export async function promptModelSelection(): Promise<ModelInfo> {
  await refreshAvailableModels().catch(() => undefined);

  return new Promise((resolve) => {
    const models = getAvailableModels();

    console.log();
    console.log("  " + c.whiteBold(ICON.model + " Select AI Model"));
    console.log("  " + c.border("─".repeat(50)));
    console.log();

    models.forEach((model, index) => {
      const num = c.info(`[${index + 1}]`);
      const premiumIcon = model.isAuto
        ? c.brand(" ☆ AUTO")
        : model.premium
          ? c.premium(" ⚡")
          : c.healthy(" ✓ INCLUDED");
      const isDefault = model.id === "claude-sonnet-4";
      const defaultIndicator = isDefault ? c.dim(" (default)") : "";
      console.log(`    ${num} ${c.text(model.name)}${premiumIcon}${defaultIndicator}`);
      console.log(`        ${c.dim(model.planSummary)}`);
      if (model.note) {
        console.log(`        ${c.dim(model.note)}`);
      }
    });

    console.log();
    console.log("  " + c.dim("Press Enter for default, or type a number:"));
    console.log();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(c.brand("  ❯ "), (answer) => {
      rl.close();
      const trimmed = answer.trim();

      if (!trimmed) {
        // Default: claude-sonnet-4
        resolve(models.find((m) => m.id === "claude-sonnet-4") || models[0]!);
        return;
      }

      const index = parseInt(trimmed, 10);
      if (!isNaN(index) && index >= 1 && index <= models.length) {
        resolve(models[index - 1]!);
      } else {
        // Try to find by name
        const found = models.find(
          (m) =>
            m.id.toLowerCase() === trimmed.toLowerCase() ||
            m.name.toLowerCase().includes(trimmed.toLowerCase())
        );
        resolve(found || models.find((m) => m.id === "claude-sonnet-4") || models[0]!);
      }
    });
  });
}

/**
 * Interactive model selection with current model indication
 */
export async function promptModelSelectionWithCurrent(): Promise<ModelInfo | null> {
  await refreshAvailableModels().catch(() => undefined);

  return new Promise((resolve) => {
    const models = getAvailableModels();

    console.log();
    console.log("  " + c.whiteBold(ICON.model + " Select AI Model"));
    console.log("  " + c.border("─".repeat(50)));
    console.log();

    models.forEach((model, index) => {
      const isCurrent = model.id === appState.currentModel;
      const num = c.info(`[${index + 1}]`);
      const premiumIcon = model.isAuto
        ? c.brand(" ☆ AUTO")
        : model.premium
          ? c.premium(" ⚡")
          : c.healthy(" ✓ INCLUDED");
      const currentIndicator = isCurrent ? c.dim(" (current)") : "";
      const prefix = isCurrent ? c.healthy("● ") : "  ";

      console.log(
        `  ${prefix}${num} ${c.text(model.name)}${premiumIcon}${currentIndicator}`
      );
      console.log(`      ${c.dim(model.planSummary)}`);
      if (model.note) {
        console.log(`      ${c.dim(model.note)}`);
      }
    });

    console.log();
    console.log("  " + c.dim("Enter number, name, or press Enter to cancel:"));
    console.log();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl.resume();

    rl.question(c.brand("  ❯ "), (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed) {
        resolve(null);
        return;
      }

      const index = parseInt(trimmed, 10);
      if (!isNaN(index) && index >= 1 && index <= models.length) {
        resolve(models[index - 1]!);
        return;
      }

      const found = models.find(
        (m) =>
          m.id.toLowerCase() === trimmed.toLowerCase() ||
          m.name.toLowerCase().includes(trimmed.toLowerCase())
      );

      resolve(found || null);
    });
  });
}

// Import appState here to avoid circular dependencies
import { appState } from "../state/appState.js";
