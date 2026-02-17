/**
 * Display module - re-exports all display functions
 * This is the main entry point for the display module
 */

// Spinner management
export {
  startSpinner,
  updateSpinner,
  spinnerSuccess,
  spinnerFail,
  spinnerWarn,
  getCurrentSpinner,
} from "./spinner.js";

// Screen management
export {
  clearScreen,
  printHeader,
  printRepo,
  printModel,
} from "./screen.js";

// Message output
export {
  printSuccess,
  printError,
  printWarning,
  formatLegacyCommandWarning,
  printInfo,
  printGoodbye,
} from "./messages.js";

// Health reports
export {
  printHealthHeader,
  printCategoryScores,
  printFindings,
  printFinding,
  printNextSteps,
  type CategoryScore,
  type Finding,
} from "./reports.js";

// Progress display
export {
  printStatusBar,
  printProgress,
  type AnalysisPhase,
} from "./progress.js";

// Menus and interactive UI
export {
  printHelp,
  printChatHeader,
  printChatStatusBar,
  printCommandMenu,
  printHistory,
  printExportSuccess,
  printModelMenu,
  printWelcome,
  printQuickCommands,
  printPrompt,
  printUnknownCommand,
} from "./menus.js";
