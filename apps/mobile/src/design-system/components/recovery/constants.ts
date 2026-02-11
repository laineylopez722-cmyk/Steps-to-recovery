/**
 * Recovery Component Constants
 * Design tokens and configuration for recovery components
 */

// Colors from design system
export const COLORS = {
  // Primary
  primary: '#6B9B8D',
  primaryLight: '#7DAA9A',
  primaryDark: '#4A6B5D',

  // Secondary
  secondary: '#D4A574',
  secondaryLight: '#E0B889',

  // Tertiary
  tertiary: '#E8A89A',

  // Status
  success: '#7CB869',
  warning: '#F4B942',
  error: '#E07856',
  info: '#6B9B8D',

  // Neutrals
  surface: '#F8F7F5',
  surfaceVariant: '#E8E6E1',
  outline: '#999385',
  outlineVariant: '#C4C0B8',

  // Dark mode
  darkSurface: '#121212',
  darkSurfaceVariant: '#1E1E1E',

  // Grayscale
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',
  black: '#000000',
} as const;

// Mood mappings
export const MOOD_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  anxious: { emoji: '😰', label: 'Anxious', color: '#E07856' },
  sad: { emoji: '😢', label: 'Sad', color: '#6B9B8D' },
  neutral: { emoji: '😐', label: 'Neutral', color: '#999385' },
  good: { emoji: '🙂', label: 'Good', color: '#D4A574' },
  great: { emoji: '😊', label: 'Great', color: '#7CB869' },
};

// Milestone messages
export const MILESTONE_MESSAGES: Record<number, string> = {
  1: "Your first step is the hardest. You did it! 🌱",
  7: "One week! You're proving it to yourself. 💪",
  30: "A full month! You're unstoppable! 🔥",
  60: "Two months! Your commitment is inspiring. 💜",
  90: "Three months! This is real change. ✨",
  180: "Six months of strength! You're a warrior. ⚔️",
  365: "ONE YEAR! You rewrote your story! 🏆",
};

// Animation durations (ms)
export const ANIMATION = {
  standard: 200,
  emphasized: 500,
  decelerated: 150,
  accelerated: 100,
  milestone: 1200,
  celebration: 2000,
} as const;

// Dimensions (dp)
export const DIMENSIONS = {
  streakCounterSize: 120,
  dailyCheckInHeight: 160,
  journalEntryHeight: 120,
  stepNodeSize: 44,
  achievementBadgeSize: 96,
  crisisFABStandard: 56,
  crisisFABExtended: 96,
  touchTargetMin: 48,
  cornerRadius: {
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 28,
  },
} as const;

// Elevation shadows
export const SHADOWS = {
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// Typography scale
export const TYPOGRAPHY = {
  displayLarge: { fontSize: 57, fontWeight: '700' as const },
  displayMedium: { fontSize: 45, fontWeight: '700' as const },
  headingLarge: { fontSize: 32, fontWeight: '600' as const },
  headingMedium: { fontSize: 28, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  labelLarge: { fontSize: 14, fontWeight: '600' as const },
  labelSmall: { fontSize: 12, fontWeight: '600' as const },
} as const;

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
} as const;
