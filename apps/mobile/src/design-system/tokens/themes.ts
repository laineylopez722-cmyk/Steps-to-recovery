/**
 * Design Tokens - Themes
 *
 * Complete theme definitions for the Steps to Recovery app.
 * Includes light, dark, and high-contrast variants.
 *
 * All themes follow Material Design 3 specification with
 * warm, supportive color palette optimized for accessibility.
 */

import { semantics } from './semantics';
import { highContrast } from './primitives';

// =============================================================================
// LIGHT THEME
// =============================================================================

export const lightTheme = {
  name: 'light' as const,

  // Primary
  primary: semantics.primary.light,
  onPrimary: semantics.primary.onLight,
  primaryContainer: semantics.primary.containerLight,
  onPrimaryContainer: semantics.primary.onContainerLight,
  primaryFixed: semantics.primary.fixed,
  primaryFixedDim: semantics.primary.fixedDim,
  onPrimaryFixed: semantics.primary.onFixed,
  onPrimaryFixedVariant: semantics.primary.onFixedVariant,
  inversePrimary: semantics.primary.inverseLight,

  // Secondary
  secondary: semantics.secondary.light,
  onSecondary: semantics.secondary.onLight,
  secondaryContainer: semantics.secondary.containerLight,
  onSecondaryContainer: semantics.secondary.onContainerLight,
  secondaryFixed: semantics.secondary.fixed,
  secondaryFixedDim: semantics.secondary.fixedDim,
  onSecondaryFixed: semantics.secondary.onFixed,
  onSecondaryFixedVariant: semantics.secondary.onFixedVariant,

  // Tertiary
  tertiary: semantics.tertiary.light,
  onTertiary: semantics.tertiary.onLight,
  tertiaryContainer: semantics.tertiary.containerLight,
  onTertiaryContainer: semantics.tertiary.onContainerLight,
  tertiaryFixed: semantics.tertiary.fixed,
  tertiaryFixedDim: semantics.tertiary.fixedDim,
  onTertiaryFixed: semantics.tertiary.onFixed,
  onTertiaryFixedVariant: semantics.tertiary.onFixedVariant,

  // Error
  error: semantics.error.light,
  onError: semantics.error.onLight,
  errorContainer: semantics.error.containerLight,
  onErrorContainer: semantics.error.onContainerLight,

  // Surface
  surface: semantics.surface.light,
  onSurface: semantics.surface.onLight,
  surfaceVariant: semantics.surface.variantLight,
  onSurfaceVariant: semantics.surface.onVariantLight,
  surfaceTint: semantics.surface.tintLight,

  // Surface Containers (MD3 elevation levels)
  surfaceContainerLowest: semantics.surfaceContainer.lowestLight,
  surfaceContainerLow: semantics.surfaceContainer.lowLight,
  surfaceContainer: semantics.surfaceContainer.defaultLight,
  surfaceContainerHigh: semantics.surfaceContainer.highLight,
  surfaceContainerHighest: semantics.surfaceContainer.highestLight,
  surfaceBright: semantics.surfaceContainer.brightLight,
  surfaceDim: semantics.surfaceContainer.dimLight,

  // Background
  background: semantics.background.light,
  onBackground: semantics.background.onLight,

  // Outline
  outline: semantics.outline.light,
  outlineVariant: semantics.outline.variantLight,

  // Inverse
  inverseSurface: semantics.inverse.surfaceLight,
  inverseOnSurface: semantics.inverse.onSurfaceLight,

  // Shadow & Scrim
  shadow: semantics.shadow.light,
  scrim: semantics.scrim.light,

  // Status Colors
  success: semantics.status.success.light,
  onSuccess: semantics.status.success.onLight,
  successContainer: semantics.status.success.containerLight,
  onSuccessContainer: semantics.status.success.onContainerLight,

  warning: semantics.status.warning.light,
  onWarning: semantics.status.warning.onLight,
  warningContainer: semantics.status.warning.containerLight,
  onWarningContainer: semantics.status.warning.onContainerLight,

  info: semantics.status.info.light,
  onInfo: semantics.status.info.onLight,
  infoContainer: semantics.status.info.containerLight,
  onInfoContainer: semantics.status.info.onContainerLight,

  // Disabled
  disabledContainer: semantics.disabled.containerLight,
  onDisabled: semantics.disabled.textLight,

  // State Overlays
  hover: semantics.stateOverlay.hoverLight,
  pressed: semantics.stateOverlay.pressedLight,
  dragged: semantics.stateOverlay.draggedLight,
  focus: semantics.stateOverlay.focusLight,

  // Glow Effects
  glow: semantics.glow.light,
  glowStrong: semantics.glow.strongLight,
  glowAmber: semantics.glow.amberLight,
  glowCoral: semantics.glow.coralLight,
} as const;

// =============================================================================
// DARK THEME
// =============================================================================

export const darkTheme = {
  name: 'dark' as const,

  // Primary
  primary: semantics.primary.dark,
  onPrimary: semantics.primary.onDark,
  primaryContainer: semantics.primary.containerDark,
  onPrimaryContainer: semantics.primary.onContainerDark,
  primaryFixed: semantics.primary.fixed,
  primaryFixedDim: semantics.primary.fixedDim,
  onPrimaryFixed: semantics.primary.onFixed,
  onPrimaryFixedVariant: semantics.primary.onFixedVariant,
  inversePrimary: semantics.primary.inverseDark,

  // Secondary
  secondary: semantics.secondary.dark,
  onSecondary: semantics.secondary.onDark,
  secondaryContainer: semantics.secondary.containerDark,
  onSecondaryContainer: semantics.secondary.onContainerDark,
  secondaryFixed: semantics.secondary.fixed,
  secondaryFixedDim: semantics.secondary.fixedDim,
  onSecondaryFixed: semantics.secondary.onFixed,
  onSecondaryFixedVariant: semantics.secondary.onFixedVariant,

  // Tertiary
  tertiary: semantics.tertiary.dark,
  onTertiary: semantics.tertiary.onDark,
  tertiaryContainer: semantics.tertiary.containerDark,
  onTertiaryContainer: semantics.tertiary.onContainerDark,
  tertiaryFixed: semantics.tertiary.fixed,
  tertiaryFixedDim: semantics.tertiary.fixedDim,
  onTertiaryFixed: semantics.tertiary.onFixed,
  onTertiaryFixedVariant: semantics.tertiary.onFixedVariant,

  // Error
  error: semantics.error.dark,
  onError: semantics.error.onDark,
  errorContainer: semantics.error.containerDark,
  onErrorContainer: semantics.error.onContainerDark,

  // Surface (OLED-optimized: not pure black)
  surface: '#121212',
  onSurface: semantics.surface.onDark,
  surfaceVariant: semantics.surface.variantDark,
  onSurfaceVariant: semantics.surface.onVariantDark,
  surfaceTint: semantics.surface.tintDark,

  // Surface Containers
  surfaceContainerLowest: semantics.surfaceContainer.lowestDark,
  surfaceContainerLow: semantics.surfaceContainer.lowDark,
  surfaceContainer: semantics.surfaceContainer.defaultDark,
  surfaceContainerHigh: semantics.surfaceContainer.highDark,
  surfaceContainerHighest: semantics.surfaceContainer.highestDark,
  surfaceBright: semantics.surfaceContainer.brightDark,
  surfaceDim: semantics.surfaceContainer.dimDark,

  // Background
  background: '#000000',
  onBackground: semantics.background.onDark,

  // Outline
  outline: semantics.outline.dark,
  outlineVariant: semantics.outline.variantDark,

  // Inverse
  inverseSurface: semantics.inverse.surfaceDark,
  inverseOnSurface: semantics.inverse.onSurfaceDark,

  // Shadow & Scrim
  shadow: semantics.shadow.dark,
  scrim: semantics.scrim.dark,

  // Status Colors
  success: semantics.status.success.dark,
  onSuccess: semantics.status.success.onDark,
  successContainer: semantics.status.success.containerDark,
  onSuccessContainer: semantics.status.success.onContainerDark,

  warning: semantics.status.warning.dark,
  onWarning: semantics.status.warning.onDark,
  warningContainer: semantics.status.warning.containerDark,
  onWarningContainer: semantics.status.warning.onContainerDark,

  info: semantics.status.info.dark,
  onInfo: semantics.status.info.onDark,
  infoContainer: semantics.status.info.containerDark,
  onInfoContainer: semantics.status.info.onContainerDark,

  // Disabled
  disabledContainer: semantics.disabled.containerDark,
  onDisabled: semantics.disabled.textDark,

  // State Overlays
  hover: semantics.stateOverlay.hoverDark,
  pressed: semantics.stateOverlay.pressedDark,
  dragged: semantics.stateOverlay.draggedDark,
  focus: semantics.stateOverlay.focusDark,

  // Glow Effects
  glow: semantics.glow.dark,
  glowStrong: semantics.glow.strongDark,
  glowAmber: semantics.glow.amberDark,
  glowCoral: semantics.glow.coralDark,
} as const;

// =============================================================================
// HIGH CONTRAST LIGHT THEME (WCAG AAA)
// =============================================================================

export const highContrastLightTheme = {
  ...lightTheme,
  name: 'highContrastLight' as const,

  // Darker primary for 7:1 contrast
  primary: highContrast.primaryDark,
  onPrimary: '#FFFFFF',
  primaryContainer: '#D4EBE5',
  onPrimaryContainer: '#00201A',

  // Stronger text for readability
  onSurface: highContrast.textOnLight,
  onBackground: highContrast.textOnLight,
  onSurfaceVariant: '#2A2A2A',

  // Enhanced outlines
  outline: highContrast.outlineStrong,
  outlineVariant: highContrast.outlineStronger,

  // Stronger error
  error: highContrast.errorStrong,
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Stronger scrim
  scrim: 'rgba(0, 0, 0, 0.7)',
} as const;

// =============================================================================
// HIGH CONTRAST DARK THEME (WCAG AAA)
// =============================================================================

export const highContrastDarkTheme = {
  ...darkTheme,
  name: 'highContrastDark' as const,

  // Brighter primary for 7:1 contrast on dark
  primary: '#B3D4CC',
  onPrimary: '#00201A',
  primaryContainer: '#4EBEA4',
  onPrimaryContainer: '#000000',

  // Pure white text for maximum contrast
  onSurface: highContrast.textOnDark,
  onBackground: highContrast.textOnDark,
  onSurfaceVariant: '#E0E0E0',

  // Enhanced outlines
  outline: '#A0A0A0',
  outlineVariant: '#707070',

  // Stronger error
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFFFFF',

  // Stronger scrim
  scrim: 'rgba(0, 0, 0, 0.85)',
} as const;

// =============================================================================
// THEME TYPE DEFINITIONS
// =============================================================================

export type ThemeName = 'light' | 'dark' | 'highContrastLight' | 'highContrastDark';

export interface Theme {
  name: ThemeName;

  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  inversePrimary: string;

  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;

  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;

  // Error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Surface
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceTint: string;

  // Surface Containers
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceBright: string;
  surfaceDim: string;

  // Background
  background: string;
  onBackground: string;

  // Outline
  outline: string;
  outlineVariant: string;

  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;

  // Shadow & Scrim
  shadow: string;
  scrim: string;

  // Status
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  info: string;
  onInfo: string;
  infoContainer: string;
  onInfoContainer: string;

  // Disabled
  disabledContainer: string;
  onDisabled: string;

  // State Overlays
  hover: string;
  pressed: string;
  dragged: string;
  focus: string;

  // Glow Effects
  glow: string;
  glowStrong: string;
  glowAmber: string;
  glowCoral: string;
}

// =============================================================================
// THEME COLLECTION
// =============================================================================

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  highContrastLight: highContrastLightTheme,
  highContrastDark: highContrastDarkTheme,
} as const;

// =============================================================================
// THEME UTILITIES
// =============================================================================

/**
 * Get a theme by name
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

/**
 * Check if theme is dark mode
 */
export function isDarkTheme(name: ThemeName): boolean {
  return name === 'dark' || name === 'highContrastDark';
}

/**
 * Check if theme is high contrast
 */
export function isHighContrastTheme(name: ThemeName): boolean {
  return name === 'highContrastLight' || name === 'highContrastDark';
}

/**
 * Get the base theme variant (light/dark) from any theme
 */
export function getBaseThemeVariant(name: ThemeName): 'light' | 'dark' {
  return isDarkTheme(name) ? 'dark' : 'light';
}

/**
 * Toggle between light and dark variants of current theme type
 */
export function toggleTheme(name: ThemeName): ThemeName {
  switch (name) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'light';
    case 'highContrastLight':
      return 'highContrastDark';
    case 'highContrastDark':
      return 'highContrastLight';
    default:
      return 'light';
  }
}

/**
 * All available theme names
 */
export const themeNames: ThemeName[] = ['light', 'dark', 'highContrastLight', 'highContrastDark'];
