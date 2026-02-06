/**
 * iOS-style typography scale for Steps to Recovery
 * Font weights: 'normal' | 'bold' | '500' | '600' | '800'
 */

import { type TextStyle } from 'react-native';

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

export type TypographyStyle = keyof typeof typography;
