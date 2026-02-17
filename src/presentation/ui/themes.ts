/**
 * Theme system for Repo Check AI CLI (Backward Compatibility)
 * 
 * This file re-exports from the refactored themes/ module.
 * For new imports, prefer importing from './themes/index.js'
 *
 * @deprecated Use imports from './themes/index.js' directly
 */

// Re-export everything from the refactored module
export {
  // Colors
  COLORS,
  c,
  // Icons
  ICON,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  PRIORITY_ICONS,
  PRIORITY_LABELS,
  // Box drawing
  BOX,
  stripAnsi,
  visibleLength,
  line,
  box,
  // Logo
  renderLogo,
  renderBigLogo,
  renderCompactLogo,
  // Badges
  progressBar,
  healthScore,
  categoryBar,
  modelBadge,
  priorityBadge,
  keyHint,
} from "./themes/index.js";

