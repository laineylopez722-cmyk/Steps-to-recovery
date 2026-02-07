/**
 * Design Tokens for Recovery Companion V2
 *
 * Dark Navy Theme - Inspired by reference site design
 *
 * Design Philosophy:
 * 1. Dark Navy Background — Calming, focused environment
 * 2. Blue Primary Accents — Trust, calm, recovery
 * 3. Green Success States — Progress, streaks, achievements
 * 4. Accessible — High contrast, readable text
 * 5. Professional — Clean, modern, not overly "app-like"
 */

// ============================================
// COLORS - Dark Navy Theme
// ============================================

export const COLORS = {
  // Background colors
  background: {
    primary: '#0a0f1c', // Main app background
    secondary: '#162540', // Slightly lighter sections
    card: 'rgba(30, 41, 59, 0.6)', // Semi-transparent cards
    elevated: 'rgba(30, 41, 59, 0.8)', // More opaque elevated elements
  },

  // Primary Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary Teal
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  // Success Green
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#166534',
    badge: '#22c55e', // Streak intact badge
  },

  // Warning Orange
  warning: {
    light: '#fef3c7',
    main: '#f97316',
    dark: '#92400e',
  },

  // Danger Red
  danger: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#991b1b',
  },

  // Text colors
  text: {
    primary: '#f1f5f9', // Main text
    secondary: '#94a3b8', // Muted text
    muted: '#64748b', // Very muted
    inverse: '#0f172a', // For light backgrounds
  },

  // Border colors
  border: {
    subtle: 'rgba(51, 65, 85, 0.5)',
    default: 'rgba(71, 85, 105, 0.5)',
    strong: 'rgba(100, 116, 139, 0.5)',
  },

  // Keytags colors
  keytags: {
    white: '#ffffff',
    orange: '#f97316',
    green: '#22c55e',
    red: '#ef4444',
    blue: '#3b82f6',
    yellow: '#eab308',
    moonlight: '#e2e8f0',
    gray: '#6b7280',
    black: '#1f2937',
  },
} as const;

// ============================================
// SPACING
// ============================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const COMPONENT_SPACING = {
  cardPadding: SPACING.lg,
  sectionMargin: SPACING.xl,
  listGap: SPACING.md,
  inputPadding: SPACING.lg,
  buttonPaddingX: SPACING.xl,
  buttonPaddingY: SPACING.md,
  screenPaddingX: SPACING.lg,
  screenPaddingY: SPACING.xl,
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.75,
} as const;

export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const TYPOGRAPHY = {
  display: {
    fontSize: FONT_SIZES['5xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.tight,
  },
  h1: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.tight,
  },
  h2: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.snug,
  },
  h3: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.snug,
  },
  h4: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.normal,
  },
  body: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.relaxed,
  },
  bodyLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.relaxed,
  },
  small: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },
  button: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.tight,
  },
} as const;

// ============================================
// TOUCH TARGETS
// ============================================

export const TOUCH_TARGETS = {
  minimum: 44,
  comfortable: 48,
  large: 56,
  extraLarge: 64,
} as const;

// ============================================
// BORDERS & RADIUS
// ============================================

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const BORDER_WIDTH = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

// ============================================
// SHADOWS (minimal for dark theme)
// ============================================

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// ============================================
// ANIMATIONS
// ============================================

export const ANIMATION_DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

export const EASING = {
  out: 'ease-out',
  inOut: 'ease-in-out',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// ============================================
// Z-INDEX
// ============================================

export const Z_INDEX = {
  base: 0,
  elevated: 10,
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
  fab: 60,
  toast: 70,
  max: 100,
} as const;

// ============================================
// EXPORTS
// ============================================

export const designTokens = {
  colors: COLORS,
  spacing: SPACING,
  componentSpacing: COMPONENT_SPACING,
  fontSizes: FONT_SIZES,
  lineHeights: LINE_HEIGHTS,
  fontWeights: FONT_WEIGHTS,
  typography: TYPOGRAPHY,
  touchTargets: TOUCH_TARGETS,
  borderRadius: BORDER_RADIUS,
  borderWidth: BORDER_WIDTH,
  shadows: SHADOWS,
  animationDurations: ANIMATION_DURATIONS,
  easing: EASING,
  zIndex: Z_INDEX,
} as const;
