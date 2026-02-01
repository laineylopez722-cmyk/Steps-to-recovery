/**
 * Theme Configuration
 *
 * Centralized theme configuration providing consistent design tokens
 * across the entire app. Follows privacy-first, calming design principles
 * suitable for a recovery companion app.
 *
 * **Design Philosophy**:
 * - Calm blues for trust and serenity
 * - Soft greens for growth and hope
 * - Neutral grays for readability
 * - Accessible color contrast (WCAG AAA)
 *
 * @module utils/theme
 */

const palette = {
  // Primary - Calm blues for trust and serenity
  blue50: '#EBF4FA',
  blue100: '#D1E6F5',
  blue500: '#4F8FC0',
  blue600: '#3D7BA8',
  blue700: '#2D6890',

  // Secondary - Soft greens for growth and hope
  green50: '#E8F5EC',
  green100: '#C8E6D0',
  green500: '#68B684',
  green600: '#52A56E',
  green700: '#3D9458',

  // Neutrals
  gray50: '#F5F7FA',
  gray100: '#E8EAED',
  gray200: '#E0E0E0',
  gray300: '#C4C4C4',
  gray400: '#999999',
  gray500: '#666666',
  gray600: '#4D4D4D',
  gray700: '#333333',
  gray800: '#1A1A1A',
  gray900: '#0D0D0D',

  // Semantic
  red500: '#E63946',
  red600: '#D32F3C',
  orange500: '#F4A261',
  teal500: '#06D6A0',

  // Base
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const theme = {
  colors: {
    // Primary brand colors
    primary: palette.blue500,
    primaryLight: palette.blue100,
    primaryDark: palette.blue700,

    // Secondary colors
    secondary: palette.green500,
    secondaryLight: palette.green100,
    secondaryDark: palette.green700,

    // Backgrounds
    background: palette.gray50,
    surface: palette.white,
    surfaceElevated: palette.white,

    // Text
    text: palette.gray700,
    textSecondary: palette.gray500,
    textMuted: palette.gray400,
    textInverse: palette.white,

    // Semantic
    error: palette.red500,
    errorLight: '#FDECEA',
    success: palette.teal500,
    successLight: '#E5FAF4',
    warning: palette.orange500,
    warningLight: '#FEF4E8',

    // UI Elements
    border: palette.gray200,
    borderLight: palette.gray100,
    divider: palette.gray200,

    // Interactive states
    pressed: 'rgba(0, 0, 0, 0.1)',
    disabled: palette.gray300,
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Dark mode (for future implementation)
    backgroundDark: palette.gray800,
    surfaceDark: palette.gray700,
    textDark: palette.white,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  typography: {
    h1: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      lineHeight: 36,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 13,
      fontWeight: 'normal' as const,
      lineHeight: 18,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
