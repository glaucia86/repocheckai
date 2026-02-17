/**
 * ASCII Art Logo for RepoCheckAI
 * Single Responsibility: Logo rendering
 */

import chalk from "chalk";
import { c } from "./colors.js";
import {
  APP_TAGLINE,
  APP_VERSION,
  DISPLAY_NAME,
} from "../../../domain/config/runtimeMetadata.js";

// ════════════════════════════════════════════════════════════════════════════
// ASCII ART HEADER
// ════════════════════════════════════════════════════════════════════════════

const LOGO_LINES = [
  "██████╗ ███████╗██████╗  ██████╗      ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗     █████╗ ██╗",
  "██╔══██╗██╔════╝██╔══██╗██╔═══██╗    ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝    ██╔══██╗██║",
  "██████╔╝█████╗  ██████╔╝██║   ██║    ██║     ███████║█████╗  ██║     █████╔╝     ███████║██║",
  "██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║    ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗     ██╔══██║██║",
  "██║  ██║███████╗██║     ╚██████╔╝    ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗    ██║  ██║██║",
  "╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝      ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝",
];

// Big stylized ASCII art logo for chat mode
const BIG_LOGO_LINES = [
  "██████╗ ███████╗██████╗  ██████╗      ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗     █████╗ ██╗",
  "██╔══██╗██╔════╝██╔══██╗██╔═══██╗    ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝    ██╔══██╗██║",
  "██████╔╝█████╗  ██████╔╝██║   ██║    ██║     ███████║█████╗  ██║     █████╔╝     ███████║██║",
  "██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║    ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗     ██╔══██║██║",
  "██║  ██║███████╗██║     ╚██████╔╝    ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗    ██║  ██║██║",
  "╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝      ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝",
];

// ════════════════════════════════════════════════════════════════════════════
// GRADIENT DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

// Gradient from teal to blue
const GRADIENT_COLORS = [
  "#00d4aa",
  "#00c4b0",
  "#00b4b6",
  "#00a4bc",
  "#0094c2",
  "#0084c8",
];

// Gradient for big logo (coral/pink to teal - vibrant medical theme)
const BIG_LOGO_GRADIENT = [
  "#ff6b6b", // Line 1 - coral
  "#ff8e72", // Line 2 - coral-orange
  "#ffa07a", // Line 3 - light coral
  "#00d4aa", // Line 4 - teal
  "#00c8a8", // Line 5 - teal
  "#00bca6", // Line 6 - teal
];

const HORIZONTAL_GRADIENT_STOPS = ["#ff6b6b", "#00d4aa", "#0077b6"];

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => n.toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  const clamp = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * clamp),
    g: Math.round(a.g + (b.g - a.g) * clamp),
    b: Math.round(a.b + (b.b - a.b) * clamp),
  };
}

function gradientColorAt(stops: string[], t: number): string {
  if (stops.length === 0) return "#00d4aa";
  if (stops.length === 1) return stops[0] || "#00d4aa";

  const normalized = Math.max(0, Math.min(1, t));
  const scaled = normalized * (stops.length - 1);
  const leftIndex = Math.floor(scaled);
  const rightIndex = Math.min(stops.length - 1, leftIndex + 1);
  const localT = scaled - leftIndex;

  const left = hexToRgb(stops[leftIndex] || "#00d4aa");
  const right = hexToRgb(stops[rightIndex] || "#0077b6");
  return rgbToHex(mixRgb(left, right, localT));
}

function colorizeLineWithGradient(line: string, stops: string[]): string {
  const chars = [...line];
  const visibleCount = chars.filter((ch) => ch !== " ").length;
  if (visibleCount === 0) return line;

  let visibleIndex = 0;
  let out = "";

  for (const ch of chars) {
    if (ch === " ") {
      out += ch;
      continue;
    }

    const t = visibleCount <= 1 ? 0 : visibleIndex / (visibleCount - 1);
    const color = gradientColorAt(stops, t);
    out += chalk.hex(color).bold(ch);
    visibleIndex += 1;
  }

  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// LOGO RENDERERS
// ════════════════════════════════════════════════════════════════════════════

export function renderLogo(): string[] {
  return LOGO_LINES.map((line, i) => {
    const color =
      GRADIENT_COLORS[i] ?? GRADIENT_COLORS[GRADIENT_COLORS.length - 1] ?? "#00d4aa";
    return colorizeLineWithGradient(line, [color, "#00d4aa", "#0077b6"]);
  });
}

/**
 * Render the big colorful logo for chat mode
 */
export function renderBigLogo(): string[] {
  return BIG_LOGO_LINES.map((line, i) => {
    const lineColor = BIG_LOGO_GRADIENT[i] ?? "#00d4aa";
    return colorizeLineWithGradient(line, [lineColor, ...HORIZONTAL_GRADIENT_STOPS]);
  });
}

/**
 * Render a compact version of the logo for smaller terminals
 */
export function renderCompactLogo(): string[] {
  const productLine = DISPLAY_NAME;
  const versionLabel = `v${APP_VERSION}`;
  const subtitleLine = APP_TAGLINE;

  const titleText = `${productLine} ${versionLabel}`;
  const innerWidth = Math.max(titleText.length, subtitleLine.length) + 4;

  const renderLine = (text: string, formatter: (value: string) => string): string => {
    const padded = ` ${formatter(text)}${" ".repeat(Math.max(0, innerWidth - text.length - 1))}`;
    return c.brand("│") + padded + c.brand("│");
  };

  return [
    c.brand(`╭${"─".repeat(innerWidth)}╮`),
    renderLine(titleText, (value) =>
      value.replace(productLine, c.brandBold(productLine)).replace(versionLabel, c.premium(versionLabel))
    ),
    renderLine(subtitleLine, (value) => c.dim(value)),
    c.brand(`╰${"─".repeat(innerWidth)}╯`),
  ];
}
