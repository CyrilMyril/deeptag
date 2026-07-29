/**
 * DeepTag design tokens.
 *
 * Concept: a darkroom / scanner instrument. Files pass under a warm
 * amber scan-line that reveals what's hidden inside them; a cool teal
 * marks the data that can be edited and written back. Everything else
 * stays quiet so those two signals read clearly.
 *
 * This file is the single source of truth. `styles/tokens.css` mirrors
 * these values as CSS variables — keep the two in sync if you change
 * anything here.
 */

export const color = {
  bg: "#0B0D12",
  bgRaised: "#10131A",
  surface: "#131720",
  surfaceRaised: "#1A1F2B",
  border: "#232839",
  borderStrong: "#333A4E",

  textPrimary: "#EDEFF4",
  textSecondary: "#8A93A6",
  textMuted: "#565E70",

  accent: "#FFB24D", // warm scan-light amber — reveal, primary actions
  accentSoft: "#FFB24D26",
  data: "#4FD8C4", // cool teal — editable / writable fields
  dataSoft: "#4FD8C426",
  danger: "#FF6B6B",
  dangerSoft: "#FF6B6B26",
} as const;

export const font = {
  display: '"Space Grotesk", "Segoe UI", sans-serif',
  body: '"IBM Plex Sans", "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", "SF Mono", Consolas, monospace',
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
} as const;

export const motion = {
  scanDuration: "900ms",
  fast: "140ms",
  base: "220ms",
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const fontImportUrl =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
