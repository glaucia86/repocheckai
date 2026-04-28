/**
 * Model Handler
 * Single Responsibility: Handle /model command
 */

import {
  appState,
  getAvailableModels,
  refreshAvailableModels,
  findModel,
  findModelByIndex,
} from "../state/appState.js";
import {
  printSuccess,
  printWarning,
  printChatStatusBar,
  c,
} from "../../ui/index.js";
import { promptModelSelectionWithCurrent } from "./sharedPrompts.js";

// ════════════════════════════════════════════════════════════════════════════
// INTERACTIVE MODEL PROMPT
// ════════════════════════════════════════════════════════════════════════════

// Model selection moved to sharedPrompts.ts to reduce duplication

// ════════════════════════════════════════════════════════════════════════════
// HANDLER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Handle /model command - Model selection
 */
export async function handleModel(modelName?: string): Promise<void> {
  await refreshAvailableModels().catch(() => undefined);
  const models = getAvailableModels();

  if (!modelName) {
    // Interactive model selection
    const selected = await promptModelSelectionWithCurrent();
    
    if (!selected) {
      console.log();
      printWarning("Model selection cancelled.");
      console.log();
      return;
    }

    appState.setModel(selected.id, selected.premium);
    console.log();
    printSuccess(`Switched to ${selected.name}`);
    printChatStatusBar(
      appState.currentModel,
      appState.isPremium,
      appState.lastRepo || undefined
    );
    return;
  }

  // Check if it's a number
  const modelIndex = parseInt(modelName, 10);
  const model = !isNaN(modelIndex)
    ? findModelByIndex(modelIndex, models)
    : findModel(modelName, models);

  if (!model) {
    printWarning(`Unknown model: ${modelName}`);
    console.log(
      "  " + c.dim("Use ") + c.info("/model") + c.dim(" to see available models")
    );
    console.log();
    return;
  }

  appState.setModel(model.id, model.premium);
  console.log();
  printSuccess(`Switched to ${model.name}`);
  printChatStatusBar(
    appState.currentModel,
    appState.isPremium,
    appState.lastRepo || undefined
  );
}
