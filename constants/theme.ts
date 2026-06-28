// Shared design tokens. Single source of truth for the brand navy accent,
// neutrals, radii, and shadows so screens stop re-declaring their own palette.
// COLORS.success/error mirror tailwind.config.js's declared tokens so
// RN-StyleSheet-based files (which can't use Tailwind classes) stay in sync.
export const COLORS = {
  navy: "#2D4A6A",
  navyDark: "#1F3A4A",
  navySoft: "#EEF3F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  background: "#F2F5F7",
  border: "#E2E8F0",
  borderSoft: "#D8E8ED",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#2F9B65",
  successSoft: "#E6F5EC",
  error: "#F14141",
  errorSoft: "#FDECEC",
  warning: "#F59E0B",
} as const;

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

export const SHADOW = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
