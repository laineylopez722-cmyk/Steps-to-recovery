/**
 * Modern Design Tokens - iOS Style
 *
 * Following iOS Human Interface Guidelines
 * Premium app quality: Spotify, Apple Health, Calm
 */

// ============================================================================
// GRADIENTS - Mostly solid, minimal gradients
// ============================================================================

export const gradients = {
  // Primary - amber
  primary: ['#F59E0B', '#D97706'] as const,
  primaryDark: ['#D97706', '#B45309'] as const,

  // Success - iOS green
  success: ['#30D158', '#28CD41'] as const,
  successDark: ['#28CD41', '#22C55E'] as const,

  // Solid backgrounds
  glassLight: ['transparent', 'transparent'] as const,
  glassDark: ['#000000', '#000000'] as const,

  // Decorative - amber themed
  aurora: ['#FBBF24', '#F59E0B', '#D97706'] as const,
  sunset: ['#FDE68A', '#F59E0B', '#D97706'] as const,
  ocean: ['#F59E0B', '#D97706', '#B45309'] as const,

  // Surfaces
  surfaceElevated: ['#1C1C1E', '#1C1C1E'] as const,
  cardGradient: ['#1C1C1E', '#1C1C1E'] as const,
} as const;

// ============================================================================
// SHADOWS - Subtle, iOS style
// ============================================================================

export const modernShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  successGlow: {
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// ============================================================================
// CARD STYLES
// ============================================================================

export const glass = {
  light: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  medium: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    ...modernShadows.sm,
  },
  heavy: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    ...modernShadows.md,
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  xxl: 28,
  full: 9999,
} as const;

// ============================================================================
// SPACING - 8px Grid
// ============================================================================

export const spacing = {
  0: 0,
  0.5: 4,
  1: 8,
  1.5: 12,
  2: 16,
  2.5: 20,
  3: 24,
  3.5: 28,
  4: 32,
  5: 40,
  6: 48,
  8: 64,
  10: 80,
  12: 96,
  16: 128,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const timing = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 400,

  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// ============================================================================
// TYPOGRAPHY - iOS Style
// ============================================================================

export const typography = {
  hero: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 18,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
} as const;

// ============================================================================
// DARK THEME ACCENTS
// ============================================================================

export const darkAccent = {
  // Primary - amber
  primary: '#F59E0B',
  primaryLight: '#FBBF24',
  primaryDark: '#D97706',

  // Success - iOS green
  success: '#30D158',
  successLight: '#4ADE80',
  successDark: '#28CD41',

  // Warning - iOS yellow
  warning: '#FFD60A',
  warningLight: '#FFEA00',

  // Error - iOS red
  error: '#FF453A',
  errorLight: '#FF6961',

  // Info - iOS blue
  info: '#0A84FF',
  infoLight: '#64D2FF',

  // Neutral
  muted: '#8E8E93',
  subtle: '#636366',

  // Aliases
  secondary: '#30D158',
  danger: '#FF453A',
  default: 'rgba(142, 142, 147, 0.1)',

  // Surfaces
  background: '#000000',
  surface: '#1C1C1E',
  surfaceHigh: '#2C2C2E',
  surfaceHigher: '#3A3A3C',

  // Text
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  textSubtle: '#636366',

  // Borders
  border: '#38383A',
  borderStrong: '#48484A',

  shadows: modernShadows,
} as const;
