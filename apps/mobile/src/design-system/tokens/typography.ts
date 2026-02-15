/**
 * Typography System
 * Inter font family — loaded via expo-font in App.tsx
 * Includes: MD3-inspired scale + legacy iOS-style scale
 *
 * On Android/iOS, React Native requires explicit fontFamily per weight
 * (fontWeight alone doesn't select the correct Inter variant).
 * We map each weight to its loaded font asset name.
 */

import { type TextStyle } from 'react-native';
import { fonts } from '../../lib/fonts';

// =============================================================================
// MATERIAL DESIGN 3 TYPOGRAPHY (Inter)
// =============================================================================

/**
 * Material Design 3 Typescale
 * Uses Inter font family with precise sizing and line height ratios
 * Supports large fonts and accessibility scaling
 */
export const md3Typography = {
  // Display - Largest text, for branding/hero content
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontFamily: fonts.bold,
    letterSpacing: -0.25,
  } as TextStyle,

  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontFamily: fonts.bold,
    letterSpacing: 0,
  } as TextStyle,

  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontFamily: fonts.bold,
    letterSpacing: 0,
  } as TextStyle,

  // Headline - Large text for section headers
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.semiBold,
    letterSpacing: 0,
  } as TextStyle,

  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: fonts.semiBold,
    letterSpacing: 0,
  } as TextStyle,

  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.semiBold,
    letterSpacing: 0,
  } as TextStyle,

  // Title - Medium emphasis headlines
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.semiBold,
    letterSpacing: 0,
  } as TextStyle,

  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.15,
  } as TextStyle,

  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.1,
  } as TextStyle,

  // Body - Main content text
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.regular,
    letterSpacing: 0.5,
  } as TextStyle,

  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    letterSpacing: 0.25,
  } as TextStyle,

  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.regular,
    letterSpacing: 0.4,
  } as TextStyle,

  // Label - Small text for buttons, chips, captions
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  } as TextStyle,

  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  } as TextStyle,
} as const;

// =============================================================================
// LEGACY iOS TYPOGRAPHY (Backward Compatibility)
// =============================================================================

export const typography = {
  // Display styles - Extra large text
  displayLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fonts.bold,
  } as TextStyle,

  displayMedium: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: fonts.bold,
  } as TextStyle,

  // Headings - Primary hierarchy
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: fonts.bold,
  } as TextStyle,

  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  // Title styles - iOS naming convention
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontFamily: fonts.bold,
  } as TextStyle,

  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.bold,
  } as TextStyle,

  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.bold,
  } as TextStyle,

  title3: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.regular,
  } as TextStyle,

  // Body text - Main content
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.regular,
  } as TextStyle,

  bodyLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: fonts.regular,
  } as TextStyle,

  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.regular,
  } as TextStyle,

  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
  } as TextStyle,

  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  // Labels - Form labels, buttons
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  labelLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  // Caption - Small supporting text
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.regular,
  } as TextStyle,

  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.regular,
  } as TextStyle,

  captionSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.medium,
  } as TextStyle,

  // Callout - Emphasized content
  callout: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.semiBold,
  } as TextStyle,

  // Specialized - Numbers, counters
  number: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fonts.bold,
    fontVariant: ['tabular-nums'], // Monospaced numbers
  } as TextStyle,

  numberSmall: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.bold,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MD3TypographyStyle = keyof typeof md3Typography;
export type TypographyStyle = keyof typeof typography;

/**
 * Complete typography system combining MD3 and legacy
 * Use MD3 for new features, legacy for existing components
 */
export const typographySystem = {
  md3: md3Typography,
  legacy: typography,
} as const;
