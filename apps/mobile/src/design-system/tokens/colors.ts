/**
 * Color Palette - Serene Olive Theme
 * 
 * Inspired by: Calm, wellness apps
 * - Soft olive/sage green gradients
 * - Cream/white accents
 * - Frosted glass effects
 * - Calming, muted tones
 */

export const lightColors = {
  // Primary accent - Olive/Sage
  primary: '#6B7B5E',           // Muted olive
  primaryLight: '#8A9A7C',      // Lighter sage
  primaryDark: '#4A5A42',       // Darker olive

  // Secondary - Cream/Gold
  secondary: '#D4C5A9',         // Warm cream
  secondaryLight: '#E8DCC6',    // Light cream
  secondaryDark: '#B8A88C',     // Darker cream

  // Semantic colors
  danger: '#C45C5C',
  dangerLight: '#D47474',
  success: '#6B8E6B',
  successLight: '#8AAD8A',
  successMuted: 'rgba(107, 142, 107, 0.15)',
  warning: '#D4A855',
  info: '#5A7A8A',

  // System grays
  muted: '#8E8E93',
  disabled: '#C7C7CC',

  // Background colors
  background: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceVariant: '#F0F0EB',

  // Text colors
  text: '#2C3E2C',
  textSecondary: '#5A6B5A',
  textTertiary: '#8A9A8A',
  textInverse: '#FFFFFF',

  // Border colors
  border: 'rgba(60, 80, 60, 0.12)',
  borderLight: 'rgba(60, 80, 60, 0.08)',
  divider: 'rgba(60, 80, 60, 0.12)',

  // Interactive states
  pressed: 'rgba(0, 0, 0, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Glow colors
  glow: 'rgba(107, 123, 94, 0.3)',
  glowStrong: 'rgba(107, 123, 94, 0.5)',

  // Semantic aliases (Phase 1)
  semantic: {
    intent: {
      primary: {
        solid: '#6B7B5E',
        muted: 'rgba(107, 123, 94, 0.15)',
        subtle: 'rgba(107, 123, 94, 0.08)',
        onSolid: '#FFFFFF',
      },
      secondary: {
        solid: '#5A7A8A',
        muted: 'rgba(90, 122, 138, 0.15)',
        subtle: 'rgba(90, 122, 138, 0.08)',
        onSolid: '#FFFFFF',
      },
      alert: {
        solid: '#C45C5C',
        muted: 'rgba(196, 92, 92, 0.15)',
        subtle: 'rgba(196, 92, 92, 0.08)',
        onSolid: '#FFFFFF',
      },
    },
    surface: {
      app: '#F5F5F0',
      canvas: '#FFFFFF',
      card: '#F0F0EB',
      elevated: '#FFFFFF',
      interactive: '#F0F0EB',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
    text: {
      primary: '#2C3E2C',
      secondary: '#5A6B5A',
      tertiary: '#8A9A8A',
      muted: '#8E8E93',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onAlert: '#FFFFFF',
      inverse: '#2C3E2C',
    },
  },
} as const;

export const darkColors = {
  // Primary accent - Soft Cream/White (for ring and accents)
  primary: '#E8E0D0',           // Warm cream
  primaryLight: '#F5EDE0',      // Bright cream
  primaryDark: '#D4C8B8',       // Muted cream

  // Secondary - Olive/Sage (for subtle elements)
  secondary: '#8A9A7C',         // Sage green
  secondaryLight: '#9DAD8F',    // Light sage
  secondaryDark: '#6B7B5E',     // Darker olive

  // Semantic colors
  danger: '#D47474',
  dangerLight: '#E08A8A',
  success: '#8AAD8A',
  successLight: '#9DBD9D',
  successMuted: 'rgba(138, 173, 138, 0.15)',
  warning: '#E0B860',
  info: '#7A9AAA',

  // System grays
  muted: '#A8A8AD',
  disabled: '#5A5A5C',

  // Background colors - Olive gradient base
  background: '#3A4A38',        // Deep olive
  surface: 'rgba(255, 255, 255, 0.08)', // Frosted glass
  surfaceElevated: 'rgba(255, 255, 255, 0.12)',
  surfaceVariant: 'rgba(255, 255, 255, 0.06)',

  // Text colors
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textInverse: '#2C3E2C',

  // Border colors
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.1)',

  // Interactive states
  pressed: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Glow colors - Soft cream
  glow: 'rgba(232, 224, 208, 0.2)',
  glowStrong: 'rgba(232, 224, 208, 0.4)',
  glowRing: 'rgba(232, 224, 208, 0.6)',

  // Semantic aliases (Phase 1)
  semantic: {
    intent: {
      primary: {
        solid: '#E8E0D0',
        muted: 'rgba(232, 224, 208, 0.15)',
        subtle: 'rgba(232, 224, 208, 0.08)',
        onSolid: '#000000',
      },
      secondary: {
        solid: '#7A9AAA',
        muted: 'rgba(122, 154, 170, 0.15)',
        subtle: 'rgba(122, 154, 170, 0.08)',
        onSolid: '#FFFFFF',
      },
      alert: {
        solid: '#D47474',
        muted: 'rgba(212, 116, 116, 0.15)',
        subtle: 'rgba(212, 116, 116, 0.08)',
        onSolid: '#FFFFFF',
      },
    },
    surface: {
      app: '#3A4A38',
      canvas: 'rgba(255, 255, 255, 0.08)',
      card: 'rgba(255, 255, 255, 0.08)',
      elevated: 'rgba(255, 255, 255, 0.12)',
      interactive: 'rgba(255, 255, 255, 0.06)',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      muted: '#A8A8AD',
      onPrimary: '#000000',
      onSecondary: '#FFFFFF',
      onAlert: '#FFFFFF',
      inverse: '#2C3E2C',
    },
  },
} as const;

/**
 * Category colors - Muted naturals
 */
export const categoryColors = {
  gratitude: '#8A9A7C',   // Sage
  reflection: '#7A8AAA',  // Soft blue
  action: '#8AAD8A',      // Soft green
  connection: '#A89A8A',  // Warm taupe
  'self-care': '#AA8A9A', // Dusty rose
  sponsor: '#D4C5A9',     // Cream
  meeting: '#8AAD8A',     // Soft green
} as const;

// Type definitions
export type ColorPalette = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  successMuted: string;
  warning: string;
  info: string;
  muted: string;
  disabled: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  pressed: string;
  overlay: string;
  glow: string;
  glowStrong: string;
  glowRing?: string;
  semantic: {
    intent: {
      primary: { solid: string; muted: string; subtle: string; onSolid: string };
      secondary: { solid: string; muted: string; subtle: string; onSolid: string };
      alert: { solid: string; muted: string; subtle: string; onSolid: string };
    };
    surface: {
      app: string;
      canvas: string;
      card: string;
      elevated: string;
      interactive: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      muted: string;
      onPrimary: string;
      onSecondary: string;
      onAlert: string;
      inverse: string;
    };
  };
};

export type CategoryColor = keyof typeof categoryColors;
