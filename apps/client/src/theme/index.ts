/**
 * MyDay Platform — Unified Theme & Design Tokens
 * Minimalist, calm, high-precision aesthetic inspired by Apple Journal & Linear.
 * Zero colored emojis — all UI indicators use theme-matched outline / filled vector icons.
 */

export const THEME = {
  colors: {
    // Canvas & Surfaces
    background: "#0c0d12", // Deep OLED matte slate
    surface: "#151720", // Elevated card surface
    surfaceSubtle: "#1c1f2b", // Secondary card/input surface
    surfaceHover: "#242838", // Hover / press state

    // Borders & Separators
    border: "rgba(255, 255, 255, 0.08)", // Crisp hairline border
    borderSubtle: "rgba(255, 255, 255, 0.04)",
    borderStrong: "rgba(255, 255, 255, 0.16)",

    // Typography
    textPrimary: "#f8fafc", // High contrast white
    textSecondary: "#94a3b8", // Muted slate
    textTertiary: "#64748b", // Subtle metadata
    textInverse: "#0c0d12", // On top of solid accent

    // Accents & Actions
    accent: "#6366f1", // Precision Iris
    accentHover: "#4f46e5",
    accentMuted: "rgba(99, 102, 241, 0.12)",
    accentBorder: "rgba(99, 102, 241, 0.35)",

    // Emotional / Status Tones (Theme-harmonized)
    emerald: "#10b981",
    emeraldMuted: "rgba(16, 185, 129, 0.12)",
    amber: "#f59e0b",
    amberMuted: "rgba(245, 158, 11, 0.12)",
    rose: "#f43f5e",
    roseMuted: "rgba(244, 63, 94, 0.12)",
    sky: "#0ea5e9",
    skyMuted: "rgba(14, 165, 233, 0.12)",
    purple: "#a855f7",
    purpleMuted: "rgba(168, 85, 247, 0.12)",
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;

/**
 * Mood Level Definitions (1 to 5)
 * Unselected: outline icon with muted border.
 * Selected: filled solid icon with active theme tint.
 */
export const THEME_MOODS = [
  {
    level: 1 as const,
    label: "Low",
    iconOutline: "cloud-outline" as const,
    iconFilled: "cloud" as const,
    accentColor: "#94a3b8",
  },
  {
    level: 2 as const,
    label: "Meh",
    iconOutline: "remove-circle-outline" as const,
    iconFilled: "remove-circle" as const,
    accentColor: "#38bdf8",
  },
  {
    level: 3 as const,
    label: "Calm",
    iconOutline: "happy-outline" as const,
    iconFilled: "happy" as const,
    accentColor: "#34d399",
  },
  {
    level: 4 as const,
    label: "Good",
    iconOutline: "sunny-outline" as const,
    iconFilled: "sunny" as const,
    accentColor: "#fbbf24",
  },
  {
    level: 5 as const,
    label: "Radiant",
    iconOutline: "sparkles-outline" as const,
    iconFilled: "sparkles" as const,
    accentColor: "#a855f7",
  },
];

/**
 * Energy Levels (1 to 5)
 */
export const THEME_ENERGIES = [
  { level: 1 as const, label: "Drained", activeBars: 1 },
  { level: 2 as const, label: "Low", activeBars: 2 },
  { level: 3 as const, label: "Steady", activeBars: 3 },
  { level: 4 as const, label: "Charged", activeBars: 4 },
  { level: 5 as const, label: "Peak", activeBars: 5 },
];
