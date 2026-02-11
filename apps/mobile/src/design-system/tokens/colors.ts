/**
 * Color Palette - Serene Olive Theme
 *
 * Inspired by: Calm, wellness apps
 * - Soft olive/sage green gradients
 * - Cream/white accents
 * - Frosted glass effects
 * - Calming, muted tones
 */

// =============================================================================
// MATERIAL DESIGN 3 - WARM PALETTE
// =============================================================================

/**
 * Material Design 3 Warm Color Palette
 * Designed for recovery apps - warm, supportive, accessible
 * All colors maintain 7:1 contrast ratios where required
 */
export const md3Colors = {
  // Primary - Warm Sage Green
  primary: '#6B9B8D',
  primaryLight: '#8AB8AC',
  primaryDark: '#4A7A6D',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D4EBE5',
  onPrimaryContainer: '#1F4D42',

  // Secondary - Warm Amber
  secondary: '#D4A574',
  secondaryLight: '#E8C8A8',
  secondaryDark: '#B08356',
  onSecondary: '#000000',
  secondaryContainer: '#F5E6D3',
  onSecondaryContainer: '#4D3A24',

  // Tertiary - Soft Coral
  tertiary: '#E8A89A',
  tertiaryLight: '#F5C8BE',
  tertiaryDark: '#C98878',
  onTertiary: '#000000',
  tertiaryContainer: '#FCE8E4',
  onTertiaryContainer: '#5D3A32',

  // Status Colors
  success: '#7CB869',
  successLight: '#A3D494',
  successDark: '#5A9448',
  onSuccess: '#000000',
  successContainer: '#E3F2DE',
  onSuccessContainer: '#1E4415',

  warning: '#F4B942',
  warningLight: '#F9D88A',
  warningDark: '#C9942A',
  onWarning: '#000000',
  warningContainer: '#FDF3D8',
  onWarningContainer: '#4D3A0F',

  error: '#E07856',
  errorLight: '#F2A88C',
  errorDark: '#B85A3A',
  onError: '#FFFFFF',
  errorContainer: '#FBE8E2',
  onErrorContainer: '#5A2A1A',

  info: '#6B9B8D',
  infoLight: '#8AB8AC',
  infoDark: '#4A7A6D',
  onInfo: '#FFFFFF',
  infoContainer: '#D4EBE5',
  onInfoContainer: '#1F4D42',

  // Neutrals - Warm Gray Scale
  surface: '#F8F7F5',
  surfaceVariant: '#E8E6E1',
  surfaceTint: '#6B9B8D',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',

  // Background
  background: '#F8F7F5',
  onBackground: '#1C1B1F',

  // Outline
  outline: '#999385',
  outlineVariant: '#D4CFC7',

  // Inverse (for snackbars, dialogs)
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#B3D4CC',

  // Scrim/Overlay
  scrim: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',

  // Surface containers (MD3 elevation levels)
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F5F3F0',
  surfaceContainer: '#EFEDE9',
  surfaceContainerHigh: '#E9E7E3',
  surfaceContainerHighest: '#E3E1DD',

  // Disabled states
  disabled: '#C7C7CC',
  onDisabled: '#8E8E93',
  disabledContainer: 'rgba(28, 27, 31, 0.12)',

  // Interactive states (opacity-based)
  pressed: 'rgba(0, 0, 0, 0.08)',
  dragged: 'rgba(0, 0, 0, 0.16)',
  focus: 'rgba(107, 155, 141, 0.12)',
  hover: 'rgba(0, 0, 0, 0.04)',

  // Glow accents
  glow: 'rgba(107, 155, 141, 0.3)',
  glowStrong: 'rgba(107, 155, 141, 0.5)',
} as const;

/**
 * Material Design 3 Dark Mode - Warm Palette
 * Optimized for OLED displays with true blacks
 */
export const md3ColorsDark = {
  // Primary - Warm Sage Green (brighter for dark mode)
  primary: '#B3D4CC',
  primaryLight: '#D4EBE5',
  primaryDark: '#8AB8AC',
  onPrimary: '#1F4D42',
  primaryContainer: '#1F4D42',
  onPrimaryContainer: '#D4EBE5',

  // Secondary - Warm Amber
  secondary: '#E8C8A8',
  secondaryLight: '#F5E6D3',
  secondaryDark: '#C9A885',
  onSecondary: '#4D3A24',
  secondaryContainer: '#4D3A24',
  onSecondaryContainer: '#F5E6D3',

  // Tertiary - Soft Coral
  tertiary: '#F5C8BE',
  tertiaryLight: '#FCE8E4',
  tertiaryDark: '#D4A89C',
  onTertiary: '#5D3A32',
  tertiaryContainer: '#5D3A32',
  onTertiaryContainer: '#FCE8E4',

  // Status Colors
  success: '#A3D494',
  successLight: '#C8E8BE',
  successDark: '#7CB869',
  onSuccess: '#1E4415',
  successContainer: '#1E4415',
  onSuccessContainer: '#E3F2DE',

  warning: '#F9D88A',
  warningLight: '#FDF3D8',
  warningDark: '#F4B942',
  onWarning: '#4D3A0F',
  warningContainer: '#4D3A0F',
  onWarningContainer: '#FDF3D8',

  error: '#F2A88C',
  errorLight: '#FBE8E2',
  errorDark: '#E07856',
  onError: '#5A2A1A',
  errorContainer: '#5A2A1A',
  onErrorContainer: '#FBE8E2',

  info: '#B3D4CC',
  infoLight: '#D4EBE5',
  infoDark: '#8AB8AC',
  onInfo: '#1F4D42',
  infoContainer: '#1F4D42',
  onInfoContainer: '#D4EBE5',

  // Neutrals - Dark warm gray scale
  surface: '#1C1B1F',
  surfaceVariant: '#49454F',
  surfaceTint: '#B3D4CC',
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',

  // Background
  background: '#000000',
  onBackground: '#E6E1E5',

  // Outline
  outline: '#938F99',
  outlineVariant: '#49454F',

  // Inverse
  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#1C1B1F',
  inversePrimary: '#6B9B8D',

  // Scrim/Overlay
  scrim: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',

  // Surface containers (MD3 elevation levels with surface tint overlay)
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#0F0F10',
  surfaceContainer: '#1C1B1F',
  surfaceContainerHigh: '#252428',
  surfaceContainerHighest: '#313033',

  // Disabled states
  disabled: '#5A5A5C',
  onDisabled: '#8E8E93',
  disabledContainer: 'rgba(230, 225, 229, 0.12)',

  // Interactive states
  pressed: 'rgba(255, 255, 255, 0.10)',
  dragged: 'rgba(255, 255, 255, 0.16)',
  focus: 'rgba(179, 212, 204, 0.12)',
  hover: 'rgba(255, 255, 255, 0.08)',

  // Glow accents (OLED-optimized)
  glow: 'rgba(179, 212, 204, 0.25)',
  glowStrong: 'rgba(179, 212, 204, 0.45)',
} as const;

// =============================================================================
// LEGACY SERENE OLIVE THEME (Backward Compatibility)
// =============================================================================

export const lightColors = {
  // Primary accent - Olive/Sage
  primary: '#6B7B5E', // Muted olive
  primaryLight: '#8A9A7C', // Lighter sage
  primaryDark: '#4A5A42', // Darker olive

  // Secondary - Cream/Gold
  secondary: '#D4C5A9', // Warm cream
  secondaryLight: '#E8DCC6', // Light cream
  secondaryDark: '#B8A88C', // Darker cream

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
      overlayModal: 'rgba(0, 0, 0, 0.85)',
    },
    text: {
      primary: '#2C3E2C',
      secondary: '#5A6B5A',
      tertiary: '#8A9A8A',
      muted: '#8E8E93',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onAlert: '#FFFFFF',
      onDark: '#FFFFFF',
      inverse: '#2C3E2C',
    },
    emergency: {
      calm: '#7A9AAA',
      calmMuted: 'rgba(122, 154, 170, 0.15)',
      calmSubtle: 'rgba(122, 154, 170, 0.08)',
      onCalm: '#FFFFFF',
    },
  },
} as const;

export const darkColors = {
  // Primary accent - Enhanced for OLED vibrancy
  primary: '#F0E8D8', // Vibrant warm cream (OLED-enhanced)
  primaryLight: '#FFF8E8', // Bright cream with subtle glow
  primaryDark: '#D4C8B8', // Muted cream

  // Secondary - Olive/Sage (for subtle elements)
  secondary: '#8A9A7C', // Sage green
  secondaryLight: '#9DAD8F', // Light sage
  secondaryDark: '#6B7B5E', // Darker olive

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

  // Background colors - OLED-optimized true blacks
  background: '#000000', // Pure black for OLED power savings
  surface: 'rgba(255, 255, 255, 0.05)', // Subtle frosted glass
  surfaceElevated: 'rgba(255, 255, 255, 0.08)',
  surfaceVariant: 'rgba(255, 255, 255, 0.03)',

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

  // Glow colors - OLED-optimized soft cream (more vibrant against black)
  glow: 'rgba(240, 232, 216, 0.25)',
  glowStrong: 'rgba(240, 232, 216, 0.5)',
  glowRing: 'rgba(240, 232, 216, 0.7)',

  // Semantic aliases (Phase 1)
  semantic: {
    intent: {
      primary: {
        solid: '#F0E8D8',
        muted: 'rgba(240, 232, 216, 0.15)',
        subtle: 'rgba(240, 232, 216, 0.08)',
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
      app: '#000000', // OLED true black
      canvas: 'rgba(255, 255, 255, 0.05)',
      card: 'rgba(255, 255, 255, 0.05)',
      elevated: 'rgba(255, 255, 255, 0.08)',
      interactive: 'rgba(255, 255, 255, 0.03)',
      overlay: 'rgba(0, 0, 0, 0.7)',
      overlayModal: 'rgba(0, 0, 0, 0.95)', // Almost pure black for modals
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      muted: '#A8A8AD',
      onPrimary: '#000000',
      onSecondary: '#FFFFFF',
      onAlert: '#FFFFFF',
      onDark: '#FFFFFF',
      inverse: '#2C3E2C',
    },
    emergency: {
      calm: '#9DBDCD',
      calmMuted: 'rgba(157, 189, 205, 0.15)',
      calmSubtle: 'rgba(157, 189, 205, 0.08)',
      onCalm: '#000000',
    },
  },
} as const;

/**
 * Category colors - Muted naturals
 */
export const categoryColors = {
  gratitude: '#8A9A7C', // Sage
  reflection: '#7A8AAA', // Soft blue
  action: '#8AAD8A', // Soft green
  connection: '#A89A8A', // Warm taupe
  'self-care': '#AA8A9A', // Dusty rose
  sponsor: '#D4C5A9', // Cream
  meeting: '#8AAD8A', // Soft green
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MD3Colors = typeof md3Colors;
export type MD3ColorsDark = typeof md3ColorsDark;

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
      overlayModal: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      muted: string;
      onPrimary: string;
      onSecondary: string;
      onAlert: string;
      onDark: string;
      inverse: string;
    };
    emergency: {
      calm: string;
      calmMuted: string;
      calmSubtle: string;
      onCalm: string;
    };
  };
};

export type CategoryColor = keyof typeof categoryColors;
