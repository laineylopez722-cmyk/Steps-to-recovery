/**
 * Material Design 3 Elevation System
 * 
 * MD3 uses surface tonal overlays instead of shadows in light mode
 * In dark mode, shadows are more pronounced with surface color overlays
 */

import { Platform, type ViewStyle } from 'react-native';
import { md3LightColors, md3DarkColors, elevationOverlayOpacity } from './md3-colors';

// ============================================================================
// MD3 ELEVATION LEVELS (0-5)
// ============================================================================

export interface ElevationStyle extends ViewStyle {
  elevation?: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
}

// Light mode: subtle shadows + surface container colors
export const md3ElevationLight = {
  level0: {
    shadowColor: md3LightColors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    backgroundColor: md3LightColors.surfaceContainerLowest,
  } as ElevationStyle,
  
  level1: {
    shadowColor: md3LightColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    backgroundColor: md3LightColors.surfaceContainerLow,
  } as ElevationStyle,
  
  level2: {
    shadowColor: md3LightColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    backgroundColor: md3LightColors.surfaceContainer,
  } as ElevationStyle,
  
  level3: {
    shadowColor: md3LightColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    backgroundColor: md3LightColors.surfaceContainerHigh,
  } as ElevationStyle,
  
  level4: {
    shadowColor: md3LightColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
    backgroundColor: md3LightColors.surfaceContainerHigh,
  } as ElevationStyle,
  
  level5: {
    shadowColor: md3LightColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 5,
    backgroundColor: md3LightColors.surfaceContainerHighest,
  } as ElevationStyle,
} as const;

// Dark mode: stronger shadows + surface container colors
export const md3ElevationDark = {
  level0: {
    shadowColor: md3DarkColors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    backgroundColor: md3DarkColors.surfaceContainerLowest,
  } as ElevationStyle,
  
  level1: {
    shadowColor: md3DarkColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: md3DarkColors.surfaceContainerLow,
  } as ElevationStyle,
  
  level2: {
    shadowColor: md3DarkColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: md3DarkColors.surfaceContainer,
  } as ElevationStyle,
  
  level3: {
    shadowColor: md3DarkColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
    backgroundColor: md3DarkColors.surfaceContainerHigh,
  } as ElevationStyle,
  
  level4: {
    shadowColor: md3DarkColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    backgroundColor: md3DarkColors.surfaceContainerHigh,
  } as ElevationStyle,
  
  level5: {
    shadowColor: md3DarkColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 10,
    backgroundColor: md3DarkColors.surfaceContainerHighest,
  } as ElevationStyle,
} as const;

// ============================================================================
// STATE LAYER OPACITIES (MD3)
// ============================================================================

export const stateLayerOpacity = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
  disabled: 0.38,
} as const;

// ============================================================================
// RIPPLE CONFIGURATION
// ============================================================================

export const md3RippleConfig = {
  foreground: true,
  color: md3LightColors.primary,
  borderless: false,
};

// ============================================================================
// SHAPE (CORNER RADII) - MD3
// ============================================================================

export const md3Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
  // Component-specific
  cornerNone: 0,
  cornerExtraSmall: 4,
  cornerExtraSmallTop: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
  cornerSmall: 8,
  cornerMedium: 12,
  cornerLarge: 16,
  cornerLargeEnd: { topLeft: 0, topRight: 16, bottomLeft: 0, bottomRight: 16 },
  cornerLargeTop: { topLeft: 16, topRight: 16, bottomLeft: 0, bottomRight: 0 },
  cornerExtraLarge: 28,
  cornerExtraLargeTop: { topLeft: 28, topRight: 28, bottomLeft: 0, bottomRight: 0 },
  cornerFull: 9999,
} as const;

// ============================================================================
// MOTION - MD3
// ============================================================================

export const md3Motion = {
  // Durations
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
    extraLong1: 700,
    extraLong2: 800,
    extraLong3: 900,
    extraLong4: 1000,
  },
  
  // Easing
  easing: {
    linear: 'linear',
    standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
    standardAccelerate: 'cubic-bezier(0.3, 0.0, 1.0, 1.0)',
    standardDecelerate: 'cubic-bezier(0.0, 0.0, 0.0, 1.0)',
    emphasized: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
    legacy: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
    legacyDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    legacyAccelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
  },
  
  // Spring (React Native Reanimated compatible)
  spring: {
    gentle: { damping: 20, stiffness: 100 },
    standard: { damping: 15, stiffness: 150 },
    quick: { damping: 12, stiffness: 200 },
    bouncy: { damping: 10, stiffness: 250 },
  },
} as const;

// ============================================================================
// TYPOGRAPHY - MD3 Type Scale
// ============================================================================

export const md3Typography = {
  // Display
  displayLarge: {
    fontSize: 57,
    fontWeight: '400',
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400',
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 44,
    letterSpacing: 0,
  },
  
  // Headline
  headlineLarge: {
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
    letterSpacing: 0,
  },
  
  // Title
  titleLarge: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  
  // Label
  labelLarge: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

// ============================================================================
// COMBINED MD3 TOKENS
// ============================================================================

export const md3Tokens = {
  elevation: {
    light: md3ElevationLight,
    dark: md3ElevationDark,
  },
  stateLayer: stateLayerOpacity,
  shape: md3Shape,
  motion: md3Motion,
  typography: md3Typography,
};
