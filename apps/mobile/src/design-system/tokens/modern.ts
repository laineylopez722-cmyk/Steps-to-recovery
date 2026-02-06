/**
 * Modern 2025 Design Tokens for Steps to Recovery
 * Glassmorphism, refined gradients, and premium micro-interactions
 */

// Premium gradient presets
export const gradients = {
  // Primary action gradients
  primary: ['#6366F1', '#8B5CF6', '#A78BFA'] as const,
  primaryDark: ['#4F46E5', '#7C3AED', '#8B5CF6'] as const,
  
  // Success/accent gradients  
  success: ['#10B981', '#34D399', '#6EE7B7'] as const,
  successDark: ['#059669', '#10B981', '#34D399'] as const,
  
  // Glassmorphism backgrounds
  glassLight: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as const,
  glassDark: ['rgba(26,35,50,0.8)', 'rgba(11,17,32,0.95)'] as const,
  
  // Decorative gradients
  aurora: ['#0EA5E9', '#8B5CF6', '#EC4899'] as const,
  sunset: ['#F59E0B', '#EF4444', '#EC4899'] as const,
  ocean: ['#06B6D4', '#3B82F6', '#6366F1'] as const,
  
  // Surface gradients
  surfaceElevated: ['#1E293B', '#0F172A'] as const,
  cardGradient: ['rgba(30,41,59,0.8)', 'rgba(15,23,42,0.6)'] as const,
} as const;

// Modern shadow system with colored shadows
export const modernShadows = {
  sm: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
  successGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 0,
  },
} as const;

// Glassmorphism styles
export const glass = {
  light: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  medium: {
    backgroundColor: 'rgba(30,41,59,0.7)',
    backdropFilter: 'blur(24px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heavy: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    backdropFilter: 'blur(32px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
} as const;

// Modern border radius
export const radius = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  xxl: 40,
  full: 9999,
} as const;

// Premium spacing with 8px grid
export const spacing = {
  0: 0,
  0.5: 4,
  1: 8,
  1.5: 12,
  2: 16,
  2.5: 20,
  3: 24,
  3.5: 28,
  4: 32,
  5: 40,
  6: 48,
  8: 64,
  10: 80,
  12: 96,
  16: 128,
  // Named aliases for convenience
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

// Modern animation timing
export const timing = {
  // Durations
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  
  // Easings
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// Typography scale - modern, refined
export const typography = {
  hero: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  h1: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
} as const;

// Color accents for dark theme
export const darkAccent = {
  // Primary purple/indigo
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',
  
  // Success green/teal
  success: '#34D399',
  successLight: '#6EE7B7',
  successDark: '#10B981',
  
  // Warning amber
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  
  // Error red
  error: '#F87171',
  errorLight: '#FCA5A5',
  
  // Info blue
  info: '#60A5FA',
  infoLight: '#93C5FD',
  
  // Neutral
  muted: '#94A3B8',
  subtle: '#64748B',
  
  // Additional aliases
  secondary: '#0EA5E9',
  danger: '#F87171',
  default: 'rgba(148,163,184,0.15)',
  
  // Surfaces
  background: '#020617',
  surface: '#0F172A',
  surfaceHigh: '#1E293B',
  surfaceHigher: '#334155',
  
  // Text
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  textSubtle: '#94A3B8',
  
  // Borders
  border: 'rgba(148,163,184,0.15)',
  borderStrong: 'rgba(148,163,184,0.25)',

  // Shadows
  shadows: modernShadows,
} as const;
