/**
 * Icons for Repo Check AI CLI
 * Single Responsibility: Icon definitions
 */

// ════════════════════════════════════════════════════════════════════════════
// ICONS
// ════════════════════════════════════════════════════════════════════════════

export const ICON = {
  // Medical/Doctor theme
  doctor: "🩺",
  pulse: "💓",
  health: "🏥",
  pill: "💊",
  syringe: "💉",
  dna: "🧬",
  microscope: "🔬",

  // Categories
  docs: "📚",
  dx: "⚡",
  ci: "🔄",
  tests: "🧪",
  governance: "📋",
  security: "🔐",

  // Priorities
  p0: "🚨",
  p1: "⚠️",
  p2: "💡",

  // Status
  check: "✓",
  cross: "✗",
  warn: "⚠",
  info: "ℹ",
  dot: "●",
  healthy: "✅",
  warning: "⚡",
  critical: "❌",

  // Actions
  analyze: "🔍",
  report: "📊",
  fix: "🔧",
  copy: "📋",
  save: "💾",
  refresh: "🔄",

  // Misc
  rocket: "🚀",
  sparkle: "✨",
  fire: "🔥",
  bolt: "⚡",
  star: "★",
  heart: "♥",
  model: "🤖",
  github: "🐙",
  folder: "📁",
  file: "📄",
  lock: "🔒",
};

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY & PRIORITY MAPPINGS
// ════════════════════════════════════════════════════════════════════════════

export const CATEGORY_ICONS: Record<string, string> = {
  docs: ICON.docs,
  dx: ICON.dx,
  ci: ICON.ci,
  tests: ICON.tests,
  governance: ICON.governance,
  security: ICON.security,
};

export const CATEGORY_LABELS: Record<string, string> = {
  docs: "Docs & Onboarding",
  dx: "Developer Experience",
  ci: "CI/CD",
  tests: "Quality & Tests",
  governance: "Governance",
  security: "Security",
};

export const PRIORITY_ICONS: Record<string, string> = {
  P0: ICON.p0,
  P1: ICON.p1,
  P2: ICON.p2,
};

export const PRIORITY_LABELS: Record<string, string> = {
  P0: "Critical Issues",
  P1: "High Priority",
  P2: "Suggestions",
};

