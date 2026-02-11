/**
 * Typography System
 * Includes: iOS-style typography (legacy) + Material Design 3 Roboto scale
 */

import { type TextStyle } from 'react-native';

// =============================================================================
// MATERIAL DESIGN 3 TYPOGRAPHY (Roboto)
// =============================================================================

/**
 * Material Design 3 Typescale
 * Uses Roboto font family with precise sizing and line height ratios
 * Supports large fonts and accessibility scaling
 */
export const md3Typography = {
  // Display - Largest text, for branding/hero content
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '700', // Bold
    letterSpacing: -0.25,
    fontFamily: 'Roboto',
  } as TextStyle,

  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '700', // Bold
    letterSpacing: 0,
    fontFamily: 'Roboto',
  } as TextStyle,

  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700', // Bold
    letterSpacing: 0,
    fontFamily: 'Roboto',
  } as TextStyle,

  // Headline - Large text for section headers
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0,
    fontFamily: 'Roboto',
  } as TextStyle,

  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0,
    fontFamily: 'Roboto',
  } as TextStyle,

  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0,
    fontFamily: 'Roboto',
  } as TextStyle,

  // Title - Medium emphasis headlines
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0,
    fontFamily: 'Roboto',
  } as TextStyle,

  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0.15,
    fontFamily: 'Roboto',
  } as TextStyle,

  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0.1,
    fontFamily: 'Roboto',
  } as TextStyle,

  // Body - Main content text
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400', // Regular
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  } as TextStyle,

  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400', // Regular
    letterSpacing: 0.25,
    fontFamily: 'Roboto',
  } as TextStyle,

  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400', // Regular
    letterSpacing: 0.4,
    fontFamily: 'Roboto',
  } as TextStyle,

  // Label - Small text for buttons, chips, captions
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0.1,
    fontFamily: 'Roboto',
  } as TextStyle,

  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  } as TextStyle,

  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600', // Semi-bold
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
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
    fontWeight: '800',
  } as TextStyle,

  displayMedium: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '800',
  } as TextStyle,

  // Headings - Primary hierarchy
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 'bold',
  } as TextStyle,

  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  } as TextStyle,

  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  } as TextStyle,

  // Title styles - iOS naming convention
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: 'bold',
  } as TextStyle,

  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 'bold',
  } as TextStyle,

  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 'bold',
  } as TextStyle,

  title3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  } as TextStyle,

  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  } as TextStyle,

  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 'normal',
  } as TextStyle,

  // Body text - Main content
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'normal',
  } as TextStyle,

  bodyLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 'normal',
  } as TextStyle,

  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'normal',
  } as TextStyle,

  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'normal',
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'normal',
  } as TextStyle,

  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  // Labels - Form labels, buttons
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,

  labelLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  } as TextStyle,

  // Caption - Small supporting text
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'normal',
  } as TextStyle,

  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'normal',
  } as TextStyle,

  captionSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  } as TextStyle,

  // Callout - Emphasized content
  callout: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  // Specialized - Numbers, counters
  number: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'], // Monospaced numbers
  } as TextStyle,

  numberSmall: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
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
