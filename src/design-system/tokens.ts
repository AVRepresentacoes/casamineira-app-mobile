export const colors = {
  page: "#07111f",
  surface: "rgba(10, 14, 26, 0.94)",
  surfaceStrong: "rgba(12, 17, 31, 0.92)",
  surfaceSoft: "rgba(255, 255, 255, 0.055)",
  border: "rgba(226, 232, 240, 0.14)",
  borderSoft: "rgba(226, 232, 240, 0.1)",
  text: "#f8fafc",
  textMuted: "#cbd5e1",
  textSubtle: "#94a3b8",
  brand: "#facc15",
  brandText: "#08101c",
  accent: "#22d3ee",
  focus: "rgba(250, 204, 21, 0.42)",
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 34,
  "3xl": 46,
} as const;

export const typography = {
  button: 14,
  body: 15,
  bodyLarge: 16,
  title: 34,
  hero: 64,
} as const;

export const shadows = {
  card: {
    shadowColor: "#1c2d66",
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  brand: {
    shadowColor: "#facc15",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
} as const;

export const componentSizes = {
  buttonHeight: 44,
  inputHeight: 52,
  headerHeight: 76,
  cardPadding: 20,
} as const;

export const webMotion = {
  transitionProperty: "transform, box-shadow, background-color, border-color, opacity",
  transitionDuration: "180ms",
  transitionTimingFunction: "ease",
} as any;
