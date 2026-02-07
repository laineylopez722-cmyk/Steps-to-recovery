/**
 * Theme System - Serene Olive Theme
 * 
 * Inspired by: Calm, wellness apps
 * - Soft olive/sage green gradients
 * - Cream/white accents
 * - Frosted glass effects
 * - Calming, muted tones
 */

import { useColorScheme } from 'react-native';

// ============================================================================
// COLOR PALETTES
// ============================================================================

const darkColors = {
  // Backgrounds - Olive gradient
  background: {
    primary: '#2E3E2C',         // Deep olive
    secondary: 'rgba(255, 255, 255, 0.08)',
    tertiary: 'rgba(255, 255, 255, 0.12)',
    elevated: 'rgba(255, 255, 255, 0.08)',
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    inverse: '#2C3E2C',
  },
  
  // Primary - Warm Cream
  primary: {
    50: '#FFFEF5',
    100: '#FDF9E8',
    200: '#F5EDE0',
    300: '#E8E0D0',
    400: '#D4C8B8',
    500: '#E8E0D0',
    600: '#D4C5A9',
    700: '#B8A88C',
    800: '#9C8C70',
    900: '#807054',
  },
  
  // Secondary - Sage Green
  secondary: {
    50: '#F5F8F4',
    100: '#E8EDE6',
    200: '#D4DDD1',
    300: '#B8C8B4',
    400: '#9DAD8F',
    500: '#8A9A7C',
    600: '#6B7B5E',
    700: '#4A5A42',
    800: '#3A4A38',
    900: '#2E3E2C',
  },
  
  // Accent
  accent: {
    DEFAULT: '#E8E0D0',
    light: '#F5EDE0',
    dark: '#D4C8B8',
  },
  
  // Semantic - Muted for calm feel
  success: '#8AAD8A',
  warning: '#E0B860',
  error: '#D47474',
  info: '#7A9AAA',
  
  // Glass/Surface
  glass: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.12)',
    card: 'rgba(255, 255, 255, 0.08)',
    modal: 'rgba(255, 255, 255, 0.12)',
    subtle: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Borders
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  
  // Glow effects - Soft cream
  glow: {
    primary: 'rgba(232, 224, 208, 0.2)',
    secondary: 'rgba(138, 154, 124, 0.2)',
    accent: 'rgba(232, 224, 208, 0.3)',
  },
};

const lightColors = {
  // Backgrounds
  background: {
    primary: '#F5F5F0',
    secondary: '#FFFFFF',
    tertiary: '#F0F0EB',
    elevated: '#FFFFFF',
  },
  
  // Text
  text: {
    primary: '#2C3E2C',
    secondary: '#5A6B5A',
    tertiary: '#8A9A8A',
    inverse: '#FFFFFF',
  },
  
  // Primary - Olive
  primary: {
    50: '#F5F8F4',
    100: '#E8EDE6',
    200: '#D4DDD1',
    300: '#B8C8B4',
    400: '#9DAD8F',
    500: '#6B7B5E',
    600: '#5A6A4E',
    700: '#4A5A42',
    800: '#3A4A38',
    900: '#2E3E2C',
  },
  
  // Secondary - Cream
  secondary: {
    50: '#FFFEF5',
    100: '#FDF9E8',
    200: '#F5EDE0',
    300: '#E8E0D0',
    400: '#D4C8B8',
    500: '#D4C5A9',
    600: '#B8A88C',
    700: '#9C8C70',
    800: '#807054',
    900: '#645438',
  },
  
  // Accent
  accent: {
    DEFAULT: '#6B7B5E',
    light: '#8A9A7C',
    dark: '#4A5A42',
  },
  
  // Semantic
  success: '#6B8E6B',
  warning: '#D4A855',
  error: '#C45C5C',
  info: '#5A7A8A',
  
  // Glass/Surface
  glass: {
    background: '#FFFFFF',
    border: 'rgba(60, 80, 60, 0.12)',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    subtle: '#F5F5F0',
  },
  
  // Borders
  border: 'rgba(60, 80, 60, 0.12)',
  borderLight: 'rgba(60, 80, 60, 0.08)',
  
  // Glow effects
  glow: {
    primary: 'rgba(107, 123, 94, 0.15)',
    secondary: 'rgba(212, 197, 169, 0.2)',
    accent: 'rgba(107, 123, 94, 0.2)',
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  screen: 16,
  card: 16,
  section: 32,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  largeTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  // Legacy aliases
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: 0,
  },
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
};

// ============================================================================
// SHADOWS
// ============================================================================

const darkShadows = {
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
    shadowColor: '#E8E0D0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  glowPurple: {
    shadowColor: '#8A9A7C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  smDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  mdDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  lgDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

const lightShadows = {
  sm: {
    shadowColor: '#2E3E2C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#2E3E2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2E3E2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6B7B5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  glowPurple: {
    shadowColor: '#8A9A7C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  smDark: {
    shadowColor: '#2E3E2C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  mdDark: {
    shadowColor: '#2E3E2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lgDark: {
    shadowColor: '#2E3E2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
  button: 12,
  card: 16,
  input: 8,
};

// ============================================================================
// THEME TYPE
// ============================================================================

export interface Theme {
  isDark: boolean;
  colors: typeof darkColors;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof darkShadows;
  borderRadius: typeof borderRadius;
  radius: typeof borderRadius;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    shadows: isDark ? darkShadows : lightShadows,
    borderRadius,
    radius: borderRadius,
  };
}

// ============================================================================
// GRADIENTS - Olive theme
// ============================================================================

export const getGradients = (isDark: boolean) => ({
  background: isDark 
    ? ['#4A5A42', '#3A4A38', '#2E3E2C'] as const
    : ['#F5F5F0', '#FFFFFF', '#F5F5F0'] as const,
  card: isDark
    ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)'] as const
    : ['#FFFFFF', '#FFFFFF'] as const,
  cardElevated: isDark
    ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'] as const
    : ['#FFFFFF', '#FAFAFA'] as const,
  surface: isDark
    ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)'] as const
    : ['#FAFAFA', '#F5F5F0'] as const,
  inset: isDark
    ? ['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.05)'] as const
    : ['#F0F0EB', '#F5F5F0'] as const,
  highlight: isDark
    ? ['rgba(232, 224, 208, 0.15)', 'rgba(232, 224, 208, 0.05)'] as const
    : ['#FFFEF5', '#FFFFFF'] as const,
  button: isDark
    ? ['#E8E0D0', '#D4C5A9'] as const
    : ['#6B7B5E', '#4A5A42'] as const,
  header: isDark
    ? ['#3A4A38', '#2E3E2C'] as const
    : ['#FFFFFF', '#F5F5F0'] as const,
  primary: ['#E8E0D0', '#D4C5A9'] as const,
  secondary: ['#8A9A7C', '#6B7B5E'] as const,
  milestone: ['#E8E0D0', '#D4C8B8', '#B8A88C'] as const,
});

// ============================================================================
// EXPORTS
// ============================================================================

export { darkColors, lightColors, darkShadows, lightShadows };
