/**
 * Shadow System
 * Includes: iOS-style shadows (legacy) + Material Design 3 Elevation
 */

import { Platform } from 'react-native';

interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

// =============================================================================
// MATERIAL DESIGN 3 ELEVATION SHADOWS
// =============================================================================

/**
 * MD3 Elevation Shadow System
 * 5 elevation levels (0-5) with corresponding shadow depths
 * Uses ambient and key shadow layers for realistic depth
 */

// Level 0 - No elevation
export const md3ShadowLevel0: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  android: { elevation: 0 },
  default: {},
}) as ShadowStyle;

// Level 1 - Cards at rest, chips
// 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
export const md3ShadowLevel1: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  android: { elevation: 1 },
  default: {},
}) as ShadowStyle;

// Level 2 - Cards on hover, raised buttons
// 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)
export const md3ShadowLevel2: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
  default: {},
}) as ShadowStyle;

// Level 3 - Navigation drawers, modals
export const md3ShadowLevel3: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
}) as ShadowStyle;

// Level 4 - FABs, dropdown menus
export const md3ShadowLevel4: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

// Level 5 - Dialogs, pickers
export const md3ShadowLevel5: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  android: { elevation: 5 },
  default: {},
}) as ShadowStyle;

/**
 * Dark mode shadows (slightly more visible for OLED contrast)
 */
export const md3ShadowLevel1Dark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  android: { elevation: 1 },
  default: {},
}) as ShadowStyle;

export const md3ShadowLevel2Dark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
  default: {},
}) as ShadowStyle;

export const md3ShadowLevel3Dark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
}) as ShadowStyle;

export const md3ShadowLevel4Dark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

export const md3ShadowLevel5Dark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  android: { elevation: 5 },
  default: {},
}) as ShadowStyle;

/**
 * MD3 Component shadow mappings
 */
export const md3ComponentShadows = {
  // Cards
  cardRest: md3ShadowLevel1,
  cardHovered: md3ShadowLevel2,
  cardDragged: md3ShadowLevel4,

  // Buttons
  buttonRest: md3ShadowLevel0,
  buttonHovered: md3ShadowLevel1,
  buttonPressed: md3ShadowLevel0,

  // FAB
  fabRest: md3ShadowLevel3,
  fabHovered: md3ShadowLevel4,
  fabPressed: md3ShadowLevel3,

  // Navigation
  bottomNav: md3ShadowLevel2,
  topAppBar: md3ShadowLevel2,
  drawer: md3ShadowLevel3,

  // Overlays
  modal: md3ShadowLevel5,
  dialog: md3ShadowLevel5,
  menu: md3ShadowLevel3,
  snackbar: md3ShadowLevel3,

  // Input
  textField: md3ShadowLevel0,
  textFieldFocused: md3ShadowLevel1,
} as const;

/**
 * MD3 Component shadow mappings (Dark mode)
 */
export const md3ComponentShadowsDark = {
  cardRest: md3ShadowLevel1Dark,
  cardHovered: md3ShadowLevel2Dark,
  cardDragged: md3ShadowLevel4Dark,
  buttonRest: md3ShadowLevel0,
  buttonHovered: md3ShadowLevel1Dark,
  buttonPressed: md3ShadowLevel0,
  fabRest: md3ShadowLevel3Dark,
  fabHovered: md3ShadowLevel4Dark,
  fabPressed: md3ShadowLevel3Dark,
  bottomNav: md3ShadowLevel2Dark,
  topAppBar: md3ShadowLevel2Dark,
  drawer: md3ShadowLevel3Dark,
  modal: md3ShadowLevel5Dark,
  dialog: md3ShadowLevel5Dark,
  menu: md3ShadowLevel3Dark,
  snackbar: md3ShadowLevel3Dark,
  textField: md3ShadowLevel0,
  textFieldFocused: md3ShadowLevel1Dark,
} as const;

// =============================================================================
// LEGACY iOS SHADOWS (Backward Compatibility)
// =============================================================================

// Light mode shadows
export const shadowSm: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  android: { elevation: 2 },
  default: {},
}) as ShadowStyle;

export const shadowMd: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

export const shadowLg: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: { elevation: 8 },
  default: {},
}) as ShadowStyle;

export const shadowXl: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: { elevation: 12 },
  default: {},
}) as ShadowStyle;

// Dark mode shadows
export const shadowSmDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  android: { elevation: 2 },
  default: {},
}) as ShadowStyle;

export const shadowMdDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

export const shadowLgDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  android: { elevation: 8 },
  default: {},
}) as ShadowStyle;

export const shadowXlDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  android: { elevation: 12 },
  default: {},
}) as ShadowStyle;

// Glow shadows
export const glowPrimary: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
  default: {},
}) as ShadowStyle;

export const glowSuccess: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

export const glowDanger: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

// =============================================================================
// EXPORTS
// =============================================================================

export const md3Shadows = {
  level0: md3ShadowLevel0,
  level1: md3ShadowLevel1,
  level2: md3ShadowLevel2,
  level3: md3ShadowLevel3,
  level4: md3ShadowLevel4,
  level5: md3ShadowLevel5,
  // Dark variants
  level1Dark: md3ShadowLevel1Dark,
  level2Dark: md3ShadowLevel2Dark,
  level3Dark: md3ShadowLevel3Dark,
  level4Dark: md3ShadowLevel4Dark,
  level5Dark: md3ShadowLevel5Dark,
} as const;

export const shadows = {
  // Light mode
  sm: shadowSm,
  md: shadowMd,
  lg: shadowLg,
  xl: shadowXl,
  // Dark mode
  smDark: shadowSmDark,
  mdDark: shadowMdDark,
  lgDark: shadowLgDark,
  xlDark: shadowXlDark,
  // Glow
  glowPrimary,
  glowSuccess,
  glowDanger,
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MD3ShadowLevel = keyof typeof md3Shadows;
export type MD3ComponentShadowKey = keyof typeof md3ComponentShadows;
export type ShadowKey = keyof typeof shadows;

/**
 * Complete shadow system
 */
export const shadowSystem = {
  md3: md3Shadows,
  md3Component: md3ComponentShadows,
  md3ComponentDark: md3ComponentShadowsDark,
  legacy: shadows,
} as const;
