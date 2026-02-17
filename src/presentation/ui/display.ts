/**
 * Display module for Repo Check AI CLI
 * REFACTORED: Now re-exports from modular submodules (SOLID)
 * 
 * For new code, prefer importing directly from:
 * - "./display/spinner.js" for spinner functions
 * - "./display/screen.js" for screen management
 * - "./display/messages.js" for message output
 * - "./display/reports.js" for health report display
 * - "./display/progress.js" for progress display
 * - "./display/menus.js" for menus and interactive UI
 */

// Re-export all from the new modular structure
export * from "./display/index.js";
