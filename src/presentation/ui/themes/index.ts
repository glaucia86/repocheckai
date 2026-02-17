/**
 * Theme system for Repo Check AI CLI
 * Beautiful terminal styling with gradients and box drawing
 * Inspired by Video Promo's design system
 */

// ─────────────────────────────────────────────────────────────
// Re-export everything from submodules
// ─────────────────────────────────────────────────────────────

// Colors and chalk shortcuts
export { COLORS, c } from "./colors.js";

// Icons and category/priority mappings
export {
  ICON,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  PRIORITY_ICONS,
  PRIORITY_LABELS,
} from "./icons.js";

// Box drawing characters and helpers
export {
  BOX,
  stripAnsi,
  visibleLength,
  line,
  box,
} from "./box.js";

// Logo renderers
export {
  renderLogo,
  renderBigLogo,
  renderCompactLogo,
} from "./logo.js";

// Badges and progress indicators
export {
  progressBar,
  healthScore,
  categoryBar,
  modelBadge,
  priorityBadge,
  keyHint,
} from "./badges.js";

