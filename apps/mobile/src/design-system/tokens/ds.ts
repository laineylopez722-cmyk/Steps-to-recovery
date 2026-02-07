/**
 * Design System Tokens
 * 
 * Single source of truth for all design values.
 * Based on 4px grid, 1.25 type scale.
 */

// ============================================================================
// SPACING (4px base)
// ============================================================================

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const fontSize = {
  micro: 11,
  caption: 13,
  bodySm: 15,
  body: 17,
  h3: 20,
  h2: 24,
  h1: 32,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  micro: 14,
  caption: 18,
  bodySm: 22,
  body: 26,
  h3: 28,
  h2: 32,
  h1: 40,
  display: 48,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.display,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h1,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h2,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h3,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.body,
    letterSpacing: 0,
  },
  bodySm: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.bodySm,
    letterSpacing: 0,
  },
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.caption,
    letterSpacing: 0.1,
  },
  micro: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.micro,
    letterSpacing: 0.2,
  },
} as const;

// ============================================================================
// COLORS
// ============================================================================

export const palette = {
  // Backgrounds
  black: '#000000',
  gray950: '#0C0C0E',
  gray900: '#161618',
  gray850: '#1C1C1E',
  gray800: '#2C2C2E',
  gray700: '#3A3A3C',
  
  // Text
  white: '#FFFFFF',
  gray100: 'rgba(255, 255, 255, 0.72)',
  gray200: 'rgba(255, 255, 255, 0.48)',
  gray300: 'rgba(255, 255, 255, 0.32)',
  
  // Accents (muted, sophisticated)
  warmGold: '#E8A855',
  warmGoldMuted: 'rgba(232, 168, 85, 0.12)',
  
  calmBlue: '#6B9EBF',
  calmBlueMuted: 'rgba(107, 158, 191, 0.12)',
  
  sageGreen: '#7BA873',
  sageGreenMuted: 'rgba(123, 168, 115, 0.12)',
  
  dustyRose: '#C97B7B',
  dustyRoseMuted: 'rgba(201, 123, 123, 0.12)',
  
  softPurple: '#9B8FC7',
  softPurpleMuted: 'rgba(155, 143, 199, 0.12)',
} as const;

export const colors = {
  // Background layers
  bgPrimary: palette.black,
  bgSecondary: palette.gray950,
  bgTertiary: palette.gray900,
  bgQuaternary: palette.gray850,
  
  // Text hierarchy
  textPrimary: palette.white,
  textSecondary: palette.gray100,
  textTertiary: palette.gray200,
  textQuaternary: palette.gray300,
  
  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  divider: 'rgba(255, 255, 255, 0.08)',
  
  // Accents
  accent: palette.warmGold,
  accentMuted: palette.warmGoldMuted,
  
  // Semantic
  success: palette.sageGreen,
  successMuted: palette.sageGreenMuted,
  warning: palette.warmGold,
  warningMuted: palette.warmGoldMuted,
  error: palette.dustyRose,
  errorMuted: palette.dustyRoseMuted,
  info: palette.calmBlue,
  infoMuted: palette.calmBlueMuted,
} as const;

// ============================================================================
// RADIUS
// ============================================================================

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const sizes = {
  // Touch targets
  touchMin: 44,
  touchLg: 52,
  
  // Buttons
  buttonHeight: 52,
  buttonHeightSm: 40,
  
  // Inputs
  inputHeight: 52,
  
  // Header
  headerHeight: 56,
  
  // Icons
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  
  // Content
  contentPadding: 20,
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const timing = {
  quick: 150,
  standard: 250,
  slow: 400,
} as const;

// ============================================================================
// COMBINED THEME EXPORT
// ============================================================================

export const ds = {
  space,
  typography,
  fontSize,
  fontWeight,
  lineHeight,
  colors,
  palette,
  radius,
  shadows,
  sizes,
  timing,
} as const;

export type DS = typeof ds;
