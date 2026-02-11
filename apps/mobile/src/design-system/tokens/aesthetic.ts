/**
 * Design System Tokens - Premium App Quality
 *
 * Inspired by: Spotify, Apple Health, Calm, Notion
 * Goals: Clean, spacious, trustworthy, calming
 *
 * Standards:
 * - 8px grid system
 * - iOS dark mode color conventions
 * - System fonts with clear hierarchy
 * - Subtle shadows over borders
 */

import type { TextStyle } from 'react-native';

// ============================================================================
// COLOR SYSTEM - iOS Dark Mode Inspired
// ============================================================================

export const aestheticColors = {
  // Primary: Warm Amber (use sparingly - CTAs only)
  primary: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main accent
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Backgrounds - True dark (Spotify/YouTube style)
  dark: {
    background: '#0A0A0A', // True black, OLED
    elevated: '#1C1C1E', // iOS elevated surface
    card: '#1C1C1E', // Card background (iOS style)
    surface: '#2C2C2E', // Secondary surface
    surfaceHover: '#3A3A3C', // Hover/pressed state
    border: '#38383A', // iOS separator
    borderSubtle: '#2C2C2E', // Subtle borders
  },

  // Text - iOS conventions
  text: {
    primary: '#FFFFFF', // Primary text
    secondary: '#8E8E93', // iOS secondary gray
    tertiary: '#636366', // iOS tertiary gray
    quaternary: '#48484A', // iOS quaternary gray
    placeholder: '#636366', // Placeholder text
  },

  // Semantic Colors - Muted, not harsh
  semantic: {
    success: '#30D158', // iOS green
    successMuted: 'rgba(48, 209, 88, 0.12)',
    warning: '#FFD60A', // iOS yellow
    warningMuted: 'rgba(255, 214, 10, 0.12)',
    danger: '#FF453A', // iOS red
    dangerMuted: 'rgba(255, 69, 58, 0.12)',
    info: '#0A84FF', // iOS blue
    infoMuted: 'rgba(10, 132, 255, 0.12)',
  },

  // Legacy compatibility
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#30D158', // iOS green
    600: '#28CD50',
    700: '#22C55E',
    800: '#16A34A',
    900: '#15803D',
  },

  accent: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },

  success: {
    light: '#4ADE80',
    DEFAULT: '#30D158',
    dark: '#22C55E',
    glow: 'rgba(48, 209, 88, 0.2)',
  },

  warning: {
    light: '#FBBF24',
    DEFAULT: '#FFD60A',
    dark: '#F59E0B',
    glow: 'rgba(255, 214, 10, 0.2)',
  },

  navy: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#1C1C1E',
    700: '#0A0A0A',
    800: '#000000',
    900: '#000000',
  },

  gold: {
    light: '#FDE68A',
    DEFAULT: '#F59E0B',
    dark: '#B45309',
    glow: 'rgba(245, 158, 11, 0.2)',
  },
} as const;

// ============================================================================
// GRADIENTS - Mostly solid, minimal gradients
// ============================================================================

export const gradients = {
  // Background - solid
  background: ['#0A0A0A', '#0A0A0A'] as const,

  // Card - solid
  card: ['#1C1C1E', '#1C1C1E'] as const,

  // Primary button - subtle gradient
  primary: ['#F59E0B', '#D97706'] as const,

  // Success
  success: ['#30D158', '#28CD50'] as const,

  // Danger
  danger: ['#FF453A', '#FF3B30'] as const,

  // Milestone - gold shimmer
  milestone: ['#FDE68A', '#F59E0B', '#D97706'] as const,

  // Calming - amber
  calming: ['#F59E0B', '#D97706'] as const,

  // Nav - solid
  nav: ['#0A0A0A', '#0A0A0A'] as const,

  // No glass
  glass: ['transparent', 'transparent'] as const,
} as const;

// ============================================================================
// SHADOWS - Subtle, iOS style
// ============================================================================

export const atmosphericShadows = {
  // Subtle lift
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  // Standard card
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  // Elevated (modals, sheets)
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  // Accent glows (use sparingly)
  glow: {
    primary: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
    success: {
      shadowColor: '#30D158',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    gold: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
  },
} as const;

// ============================================================================
// TYPOGRAPHY - System fonts, clear hierarchy
// ============================================================================

export const aestheticTypography = {
  // Large title (32px) - Screen headers
  largeTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  // Title 1 (28px) - Major sections
  title1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  } as TextStyle,

  // Title 2 (22px) - Section headers
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  } as TextStyle,

  // Title 3 (20px) - Card titles
  title3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,

  // Headline (17px) - Emphasized text
  headline: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.1,
  } as TextStyle,

  // Body (17px) - Main content
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  // Callout (16px) - Secondary content
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  // Subhead (15px) - Supporting text
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  // Footnote (13px) - Small text, labels
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  // Caption 1 (12px) - Captions, timestamps
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  // Caption 2 (11px) - Smallest text
  caption2: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    letterSpacing: 0.1,
  } as TextStyle,

  // Legacy aliases
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  } as TextStyle,

  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  } as TextStyle,

  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,

  h4: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.1,
  } as TextStyle,

  bodySmall: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0,
  } as TextStyle,

  stat: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
} as const;

// ============================================================================
// SPACING - 8px Grid System
// ============================================================================

export const aestheticSpacing = {
  // Base units (multiples of 8)
  0: 0,
  1: 4, // Half unit
  2: 8, // Base unit
  3: 12,
  4: 16, // Standard padding
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,

  // Named values
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,

  // Component-specific
  screen: 16, // Screen edge padding
  card: 16, // Card internal padding
  section: 32, // Section spacing
  element: 12, // Between elements
  listItem: 16, // List item padding
  iconGap: 12, // Gap after icons
} as const;

// ============================================================================
// RADIUS - Modern, consistent
// ============================================================================

export const aestheticRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12, // Standard for cards, inputs
  lg: 16, // Larger cards
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ============================================================================
// BUTTON SIZES - Touch friendly (min 44px)
// ============================================================================

export const buttonSizes = {
  sm: {
    height: 36,
    paddingHorizontal: 16,
    fontSize: 15,
    borderRadius: 8,
  },
  md: {
    height: 48, // Standard touch target
    paddingHorizontal: 24,
    fontSize: 17,
    borderRadius: 12,
  },
  lg: {
    height: 56,
    paddingHorizontal: 32,
    fontSize: 17,
    borderRadius: 14,
  },
} as const;

// ============================================================================
// MOTION - Subtle, fast (200-300ms)
// ============================================================================

export const calmingMotion = {
  // Fast - micro interactions
  fast: {
    duration: 150,
    damping: 20,
    stiffness: 400,
  },
  // Standard - most transitions
  normal: {
    duration: 250,
    damping: 20,
    stiffness: 300,
  },
  // Slow - page transitions
  slow: {
    duration: 350,
    damping: 25,
    stiffness: 200,
  },
  // Legacy aliases
  entrance: {
    duration: 250,
    damping: 20,
    stiffness: 300,
  },
  interaction: {
    duration: 150,
    damping: 20,
    stiffness: 400,
  },
  success: {
    duration: 300,
    damping: 15,
    stiffness: 250,
  },
  breathing: {
    inhale: 4000,
    hold: 4000,
    exhale: 4000,
  },
} as const;

// ============================================================================
// COMPONENT PATTERNS - Consistent styling
// ============================================================================

export const componentPatterns = {
  // Primary button - solid amber
  primaryButton: {
    backgroundColor: aestheticColors.primary[500],
    height: buttonSizes.md.height,
    borderRadius: buttonSizes.md.borderRadius,
    paddingHorizontal: buttonSizes.md.paddingHorizontal,
  },

  // Secondary button - outline
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: aestheticColors.dark.border,
    height: buttonSizes.md.height,
    borderRadius: buttonSizes.md.borderRadius,
    paddingHorizontal: buttonSizes.md.paddingHorizontal,
  },

  // Ghost button - no border
  ghostButton: {
    backgroundColor: 'transparent',
    height: buttonSizes.md.height,
    borderRadius: buttonSizes.md.borderRadius,
    paddingHorizontal: buttonSizes.md.paddingHorizontal,
  },

  // Card - elevated surface
  card: {
    backgroundColor: aestheticColors.dark.card,
    borderRadius: aestheticRadius.md,
    padding: aestheticSpacing.card,
    ...atmosphericShadows.sm,
  },

  // Input - iOS style
  input: {
    backgroundColor: aestheticColors.dark.surface,
    borderRadius: aestheticRadius.sm,
    height: 48,
    paddingHorizontal: 16,
  },

  // List item
  listItem: {
    backgroundColor: aestheticColors.dark.card,
    paddingVertical: aestheticSpacing.listItem,
    paddingHorizontal: aestheticSpacing.screen,
    minHeight: 48,
  },
} as const;

// ============================================================================
// ICON SIZES
// ============================================================================

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
} as const;

// ============================================================================
// DEPRECATED - Keep for backwards compatibility
// ============================================================================

/** @deprecated Use calmingMotion instead */
export const premiumEffects = {
  milestoneShimmer: { colors: gradients.milestone, animationDuration: 3000 },
  streakGlow: { color: aestheticColors.gold.glow, intensity: 0.3 },
  counterPulse: { scale: [1, 1.01, 1], duration: 2000 },
  cardLift: { translateY: -2, shadowOpacity: 0.25 },
} as const;
