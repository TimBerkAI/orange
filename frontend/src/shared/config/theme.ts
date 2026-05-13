export const colors = {
  primary: "#E8862D",
  primaryLight: "#FFF3E8",
  primaryMedium: "#FEE8D0",
  primaryDark: "#C96A1F",
  primaryHover: "#D47825",

  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceHover: "#FFF8F2",

  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",

  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  success: "#16A34A",
  successLight: "#F0FDF4",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  heading: {
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "1.2",
  },
  subheading: {
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: "1.3",
  },
  body: {
    fontSize: "14px",
    fontWeight: "400",
    lineHeight: "1.5",
  },
  caption: {
    fontSize: "12px",
    fontWeight: "400",
    lineHeight: "1.5",
  },
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
} as const;
