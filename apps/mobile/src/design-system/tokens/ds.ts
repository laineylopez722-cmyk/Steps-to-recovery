import { premiumTypographyAliases, serene } from './serene';

/**
 * Design System Tokens
 *
 * Apple-inspired dark theme.
 * Premium, minimal, confident.
 *
 * 4px grid, 1.25 type scale.
 */

// ============================================================================
// SPACING (4px base, generous)
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
// TYPOGRAPHY (Apple SF-style)
// ============================================================================

export const fontSize = {
  micro: 11,
  caption: 13,
  bodySm: 15,
  body: 17,
  h3: 20,
  h2: 24,
  h1: 34, // Larger for impact
  display: 48,
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
  h1: 42,
  display: 56,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.display,
    letterSpacing: -1,
  },
  h1: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h1,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h2,
    letterSpacing: -0.3,
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

  // Serene premium aliases (backward compatible additive aliases)
  hero: premiumTypographyAliases.hero,
  displayTight: premiumTypographyAliases.displayTight,
  stat: premiumTypographyAliases.stat,
  labelStrong: premiumTypographyAliases.labelStrong,
} as const;

// ============================================================================
// COLORS (Apple-inspired depth)
// ============================================================================

export const palette = {
  // Backgrounds - more distinct layers
  black: '#000000',
  gray950: '#0A0A0A', // True black for OLED depth
  gray900: '#141416', // Cards
  gray850: '#1C1C1E', // Elevated cards
  gray800: '#2C2C2E', // Interactive elements
  gray700: '#3A3A3C',
  gray600: '#48484A',

  // Text - refined opacity
  white: '#FFFFFF',
  gray100: 'rgba(255, 255, 255, 0.85)', // More readable
  gray200: 'rgba(255, 255, 255, 0.55)',
  gray300: 'rgba(255, 255, 255, 0.35)',

  // Accent - warm amber
  amber: '#F59E0B',
  amberLight: '#FBBF24',
  amberMuted: 'rgba(245, 158, 11, 0.15)',
  amberSubtle: 'rgba(245, 158, 11, 0.08)',

  // Semantic (avoid green cast in dark UI)
  green: '#FBBF24',
  greenMuted: 'rgba(251, 191, 36, 0.15)',

  blue: '#0A84FF',
  blueMuted: 'rgba(10, 132, 255, 0.15)',

  red: '#FF453A',
  redMuted: 'rgba(255, 69, 58, 0.15)',

  orange: '#FF9F0A',
  orangeMuted: 'rgba(255, 159, 10, 0.15)',

  // Legacy aliases (backwards compatibility)
  warmGold: '#F5A623',
  warmGoldMuted: 'rgba(245, 166, 35, 0.15)',
  calmBlue: '#0A84FF',
  calmBlueMuted: 'rgba(10, 132, 255, 0.15)',
  sageGreen: '#32D74B',
  sageGreenMuted: 'rgba(50, 215, 75, 0.15)',
  dustyRose: '#FF453A',
  dustyRoseMuted: 'rgba(255, 69, 58, 0.15)',
} as const;

export const colors = {
  // Background layers (distinct enough to avoid borders)
  bgPrimary: palette.black,
  bgSecondary: palette.gray950,
  bgTertiary: palette.gray900,
  bgQuaternary: palette.gray850,
  bgElevated: palette.gray800,
  bgOverlay: 'rgba(0, 0, 0, 0.55)',
  overlay: 'rgba(0, 0, 0, 0.55)',
  transparent: 'transparent',

  // Text hierarchy
  textPrimary: palette.white,
  textSecondary: palette.gray100,
  textTertiary: palette.gray200,
  textQuaternary: palette.gray300,
  text: palette.white,
  textMuted: palette.gray200,

  // Borders (use sparingly)
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.06)',
  shadow: 'rgba(0, 0, 0, 0.35)',

  // Accent
  accent: palette.amber,
  accentLight: palette.amberLight,
  accentMuted: palette.amberMuted,
  accentSubtle: palette.amberSubtle,

  // Semantic
  success: palette.green,
  successMuted: palette.greenMuted,
  warning: palette.orange,
  warningMuted: palette.orangeMuted,
  error: palette.red,
  errorMuted: palette.redMuted,
  info: palette.blue,
  infoMuted: palette.blueMuted,
} as const;

export const semantic = {
  intent: {
    primary: {
      solid: colors.accent,
      muted: colors.accentMuted,
      subtle: colors.accentSubtle,
      onSolid: palette.black,
    },
    secondary: {
      solid: colors.info,
      muted: colors.infoMuted,
      subtle: 'rgba(10, 132, 255, 0.08)',
      onSolid: palette.white,
    },
    alert: {
      solid: colors.error,
      muted: colors.errorMuted,
      subtle: 'rgba(255, 69, 58, 0.08)',
      onSolid: palette.white,
    },
    success: {
      solid: colors.success,
      muted: colors.successMuted,
      subtle: 'rgba(48, 209, 88, 0.08)',
      onSolid: palette.white,
    },
    warning: {
      solid: colors.warning,
      muted: colors.warningMuted,
      subtle: 'rgba(255, 159, 10, 0.08)',
      onSolid: palette.black,
    },
  },
  surface: {
    app: colors.bgPrimary,
    canvas: colors.bgSecondary,
    card: colors.bgTertiary,
    elevated: colors.bgElevated,
    interactive: colors.bgQuaternary,
    overlay: 'rgba(0, 0, 0, 0.55)',
    overlayModal: 'rgba(0, 0, 0, 0.72)',
  },
  text: {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    muted: colors.textQuaternary,
    onPrimary: palette.black,
    onSecondary: palette.white,
    onAlert: palette.white,
    onDark: palette.white,
    inverse: palette.black,
  },
  emergency: {
    calm: palette.blue,
    calmMuted: 'rgba(10, 132, 255, 0.15)',
    calmSubtle: 'rgba(10, 132, 255, 0.08)',
  },
  elevation: {
    base: 'sm',
    raised: 'md',
    overlay: 'lg',
    focus: 'glow',
  },
  layout: {
    screenPadding: space[6],
    sectionGap: space[6],
    cardPadding: space[5],
    listItemPadding: space[4],
    touchTarget: 44,
  },
  typography: {
    screenTitle: typography.h1,
    sectionLabel: typography.caption,
    body: typography.body,
    bodySmall: typography.bodySm,
    meta: typography.micro,
    button: typography.body,
  },
} as const;

// ============================================================================
// RADIUS (larger = more premium)
// ============================================================================

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20, // Primary cards
  xl: 28, // Hero elements
  '2xl': 36, // Modals
  full: 9999,
} as const;

// ============================================================================
// SHADOWS (subtle, layered)
// ============================================================================

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: palette.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  },
} as const;

// ============================================================================
// COMPONENT SIZES (generous touch targets)
// ============================================================================

export const sizes = {
  // Touch targets (Apple minimum)
  touchMin: 44,
  touchLg: 56,

  // Buttons
  buttonHeight: 56,
  buttonHeightSm: 44,

  // Inputs
  inputHeight: 56,

  // Header
  headerHeight: 60,

  // Icons
  iconSm: 18,
  iconMd: 22,
  iconLg: 28,
  iconXl: 32,

  // Content
  contentPadding: 24, // More breathing room
  cardPadding: 20,
} as const;

// ============================================================================
// ANIMATION (spring-based for Apple feel)
// ============================================================================

export const timing = {
  instant: 100,
  quick: 200,
  standard: 300,
  slow: 500,
} as const;

export const spring = {
  snappy: { damping: 20, stiffness: 300 },
  smooth: { damping: 15, stiffness: 150 },
  bouncy: { damping: 10, stiffness: 200 },
} as const;

// ============================================================================
// LIGHT MODE PALETTE
// ============================================================================

export const paletteLight = {
  // Backgrounds - warm sage/cream
  white: '#FFFFFF',
  cream: '#F5F5F0',
  creamDark: '#F0F0EB',
  creamDeep: '#E8E8E3',
  sage100: '#D8DDD5',
  sage200: '#C0C8BC',

  // Text - dark sage greens (7:1+ AAA contrast on #F5F5F0)
  textDark: '#2C3E2C',
  textMedium: '#5A6B5A',
  textLight: '#8A9A8A',
  textMuted: '#A0ADA0',

  // Accent - amber (works in both modes)
  amber: '#D4880A', // Slightly darker amber for better contrast on light
  amberLight: '#F59E0B',
  amberMuted: 'rgba(212, 136, 10, 0.15)',
  amberSubtle: 'rgba(212, 136, 10, 0.08)',

  // Semantic
  green: '#6B8E6B',
  greenMuted: 'rgba(107, 142, 107, 0.15)',

  blue: '#2E6B8A',
  blueMuted: 'rgba(46, 107, 138, 0.15)',

  red: '#C45C5C',
  redMuted: 'rgba(196, 92, 92, 0.15)',

  orange: '#C87A1A',
  orangeMuted: 'rgba(200, 122, 26, 0.15)',

  // Legacy aliases
  warmGold: '#C88D20',
  warmGoldMuted: 'rgba(200, 141, 32, 0.15)',
  calmBlue: '#2E6B8A',
  calmBlueMuted: 'rgba(46, 107, 138, 0.15)',
  sageGreen: '#5A9448',
  sageGreenMuted: 'rgba(90, 148, 72, 0.15)',
  dustyRose: '#C45C5C',
  dustyRoseMuted: 'rgba(196, 92, 92, 0.15)',
} as const;

// ============================================================================
// LIGHT MODE COLORS
// ============================================================================

export const colorsLight = {
  // Background layers
  bgPrimary: paletteLight.cream,
  bgSecondary: paletteLight.white,
  bgTertiary: paletteLight.creamDark,
  bgQuaternary: paletteLight.white,
  bgElevated: paletteLight.creamDeep,
  bgOverlay: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  transparent: 'transparent',

  // Text hierarchy
  textPrimary: paletteLight.textDark,
  textSecondary: paletteLight.textMedium,
  textTertiary: paletteLight.textLight,
  textQuaternary: paletteLight.textMuted,
  text: paletteLight.textDark,
  textMuted: paletteLight.textLight,

  // Borders (warm-tinted)
  borderSubtle: 'rgba(60, 80, 60, 0.06)',
  borderDefault: 'rgba(60, 80, 60, 0.12)',
  borderStrong: 'rgba(60, 80, 60, 0.18)',
  divider: 'rgba(60, 80, 60, 0.10)',
  shadow: 'rgba(60, 80, 60, 0.08)',

  // Accent
  accent: paletteLight.amber,
  accentLight: paletteLight.amberLight,
  accentMuted: paletteLight.amberMuted,
  accentSubtle: paletteLight.amberSubtle,

  // Semantic
  success: paletteLight.green,
  successMuted: paletteLight.greenMuted,
  warning: paletteLight.orange,
  warningMuted: paletteLight.orangeMuted,
  error: paletteLight.red,
  errorMuted: paletteLight.redMuted,
  info: paletteLight.blue,
  infoMuted: paletteLight.blueMuted,
} as const;

// ============================================================================
// LIGHT MODE SEMANTIC
// ============================================================================

export const semanticLight = {
  intent: {
    primary: {
      solid: colorsLight.accent,
      muted: colorsLight.accentMuted,
      subtle: colorsLight.accentSubtle,
      onSolid: paletteLight.white,
    },
    secondary: {
      solid: colorsLight.info,
      muted: colorsLight.infoMuted,
      subtle: 'rgba(46, 107, 138, 0.08)',
      onSolid: paletteLight.white,
    },
    alert: {
      solid: colorsLight.error,
      muted: colorsLight.errorMuted,
      subtle: 'rgba(196, 92, 92, 0.08)',
      onSolid: paletteLight.white,
    },
    success: {
      solid: colorsLight.success,
      muted: colorsLight.successMuted,
      subtle: 'rgba(52, 199, 89, 0.08)',
      onSolid: paletteLight.white,
    },
    warning: {
      solid: colorsLight.warning,
      muted: colorsLight.warningMuted,
      subtle: 'rgba(255, 149, 0, 0.08)',
      onSolid: '#000000',
    },
  },
  surface: {
    app: colorsLight.bgPrimary,
    canvas: colorsLight.bgSecondary,
    card: colorsLight.bgTertiary,
    elevated: colorsLight.bgElevated,
    interactive: colorsLight.bgQuaternary,
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayModal: 'rgba(0, 0, 0, 0.55)',
  },
  text: {
    primary: colorsLight.textPrimary,
    secondary: colorsLight.textSecondary,
    tertiary: colorsLight.textTertiary,
    muted: colorsLight.textQuaternary,
    onPrimary: paletteLight.white,
    onSecondary: paletteLight.white,
    onAlert: paletteLight.white,
    onDark: paletteLight.white,
    inverse: paletteLight.white,
  },
  emergency: {
    calm: paletteLight.blue,
    calmMuted: 'rgba(46, 107, 138, 0.15)',
    calmSubtle: 'rgba(46, 107, 138, 0.08)',
  },
  elevation: {
    base: 'sm',
    raised: 'md',
    overlay: 'lg',
    focus: 'glow',
  },
  layout: {
    screenPadding: space[6],
    sectionGap: space[6],
    cardPadding: space[5],
    listItemPadding: space[4],
    touchTarget: 44,
  },
  typography: {
    screenTitle: typography.h1,
    sectionLabel: typography.caption,
    body: typography.body,
    bodySmall: typography.bodySm,
    meta: typography.micro,
    button: typography.body,
  },
} as const;

// ============================================================================
// LIGHT MODE SHADOWS (warm-tinted, slightly more visible)
// ============================================================================

export const shadowsLight = {
  sm: {
    shadowColor: 'rgba(60, 80, 60, 1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(60, 80, 60, 1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(60, 80, 60, 1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: paletteLight.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 0,
  },
} as const;

// ============================================================================
// COMBINED THEME EXPORT (dark mode default — backward compatible)
// ============================================================================

export const ds = {
  space,
  typography,
  fontSize,
  fontWeight,
  lineHeight,
  colors,
  semantic,
  palette,
  radius,
  shadows,
  sizes,
  timing,
  spring,
  serene,
} as const;

export type DS = typeof ds;

// ============================================================================
// THEME FACTORY
// ============================================================================

/** Creates a theme-aware DS object for the given color scheme. */
export function createDs(isDark: boolean): DS {
  if (isDark) {
    return ds;
  }

  return {
    space,
    typography,
    fontSize,
    fontWeight,
    lineHeight,
    colors: colorsLight,
    semantic: semanticLight,
    palette: paletteLight,
    radius,
    shadows: shadowsLight,
    sizes,
    timing,
    spring,
    serene,
  } as unknown as DS;
}
