/**
 * Design Tokens - Semantic Colors
 *
 * Material Design 3 semantic color roles mapped from primitives.
 * Each semantic role has a specific purpose in the UI.
 *
 * @see https://m3.material.io/styles/color/roles
 */

import {
  sageGreen,
  amber,
  coral,
  error,
  neutral,
  neutralVariant,
  status,
  highContrast,
} from './primitives';

// =============================================================================
// SEMANTIC COLOR ROLES
// =============================================================================

/**
 * Primary colors - Main brand color (Sage Green)
 * Used for: Key actions, active states, primary buttons
 */
export const primary = {
  /** Primary color for light theme */
  light: sageGreen[40],
  /** Primary color for dark theme */
  dark: sageGreen[80],
  /** Text/icon on primary color */
  onLight: sageGreen[100],
  onDark: sageGreen[20],
  /** Container for primary-tinted elements */
  containerLight: sageGreen[90],
  containerDark: sageGreen[30],
  /** Text on primary container */
  onContainerLight: sageGreen[10],
  onContainerDark: sageGreen[90],
  /** Fixed colors (don't change between themes) */
  fixed: sageGreen[90],
  fixedDim: sageGreen[80],
  onFixed: sageGreen[10],
  onFixedVariant: sageGreen[30],
  /** Inverse primary (for surfaces with primary color) */
  inverseLight: sageGreen[80],
  inverseDark: sageGreen[40],
} as const;

/**
 * Secondary colors - Complementary color (Warm Amber)
 * Used for: Secondary actions, filtering, selection
 */
export const secondary = {
  light: amber[40],
  dark: amber[80],
  onLight: amber[100],
  onDark: amber[20],
  containerLight: amber[90],
  containerDark: amber[30],
  onContainerLight: amber[10],
  onContainerDark: amber[90],
  fixed: amber[90],
  fixedDim: amber[80],
  onFixed: amber[10],
  onFixedVariant: amber[30],
} as const;

/**
 * Tertiary colors - Accent color (Soft Coral)
 * Used for: Contrasting accents, balance to primary/secondary
 */
export const tertiary = {
  light: coral[40],
  dark: coral[80],
  onLight: coral[100],
  onDark: coral[20],
  containerLight: coral[90],
  containerDark: coral[30],
  onContainerLight: coral[10],
  onContainerDark: coral[90],
  fixed: coral[90],
  fixedDim: coral[80],
  onFixed: coral[10],
  onFixedVariant: coral[30],
} as const;

/**
 * Error colors - Destructive actions and error states
 */
export const errorSemantic = {
  light: error[40],
  dark: error[80],
  onLight: error[100],
  onDark: error[20],
  containerLight: error[90],
  containerDark: error[30],
  onContainerLight: error[10],
  onContainerDark: error[90],
} as const;

/**
 * Surface colors - Backgrounds for components
 * Follows MD3 surface container elevation system
 */
export const surface = {
  /** Main app background */
  light: neutral[99],
  dark: neutral[10],
  /** Text/icons on surface */
  onLight: neutral[10],
  onDark: neutral[90],
  /** Variant surface for differentiation */
  variantLight: neutralVariant[90],
  variantDark: neutralVariant[30],
  /** Text on variant surface */
  onVariantLight: neutralVariant[30],
  onVariantDark: neutralVariant[80],
  /** Tint color applied to elevated surfaces */
  tintLight: sageGreen[40],
  tintDark: sageGreen[80],
} as const;

/**
 * Surface Containers - MD3 elevation levels
 * Used for: Cards, sheets, dialogs at different elevations
 */
export const surfaceContainer = {
  lowestLight: neutralVariant[99],
  lowestDark: neutralVariant[10],
  lowLight: neutralVariant[95],
  lowDark: neutralVariant[20],
  defaultLight: neutralVariant[90],
  defaultDark: neutralVariant[30],
  highLight: neutralVariant[90],
  highDark: neutralVariant[30],
  highestLight: neutralVariant[90],
  highestDark: neutralVariant[30],
  /** Bright/dim variants for emphasis */
  brightLight: neutralVariant[95],
  brightDark: neutralVariant[40],
  dimLight: neutralVariant[80],
  dimDark: neutralVariant[20],
} as const;

/**
 * Background colors - App-level backgrounds
 */
export const background = {
  light: neutral[99],
  dark: neutral[10],
  onLight: neutral[10],
  onDark: neutral[90],
} as const;

/**
 * Outline colors - Borders and dividers
 */
export const outline = {
  /** Default outline color */
  light: neutralVariant[50],
  dark: neutralVariant[60],
  /** Subtle variant for less prominent borders */
  variantLight: neutralVariant[80],
  variantDark: neutralVariant[30],
  /** Strong outline for high contrast */
  strongLight: highContrast.outlineStrong,
  strongDark: highContrast.outlineStrong,
} as const;

/**
 * Inverse colors - For elements on colored surfaces
 */
export const inverse = {
  surfaceLight: neutral[20],
  surfaceDark: neutral[90],
  onSurfaceLight: neutral[95],
  onSurfaceDark: neutral[20],
  primaryLight: sageGreen[80],
  primaryDark: sageGreen[40],
} as const;

/**
 * Status colors - Semantic status indicators
 */
export const statusSemantic = {
  success: {
    light: status.success.base,
    dark: status.success[80],
    onLight: neutral[0],
    onDark: neutral[10],
    containerLight: status.success[90],
    containerDark: status.success[30],
    onContainerLight: status.success[10],
    onContainerDark: status.success[90],
  },
  warning: {
    light: status.warning.base,
    dark: status.warning[80],
    onLight: neutral[0],
    onDark: neutral[10],
    containerLight: status.warning[90],
    containerDark: status.warning[30],
    onContainerLight: status.warning[10],
    onContainerDark: status.warning[90],
  },
  info: {
    light: status.info.base,
    dark: status.info[80],
    onLight: neutral[0],
    onDark: neutral[10],
    containerLight: status.info[90],
    containerDark: status.info[30],
    onContainerLight: status.info[10],
    onContainerDark: status.info[90],
  },
} as const;

/**
 * Shadow and scrim colors
 */
export const shadow = {
  light: neutral[0],
  dark: neutral[0],
} as const;

export const scrim = {
  light: 'rgba(0, 0, 0, 0.5)',
  dark: 'rgba(0, 0, 0, 0.7)',
} as const;

/**
 * Disabled state colors
 */
export const disabled = {
  containerLight: 'rgba(28, 27, 31, 0.12)',
  containerDark: 'rgba(230, 225, 229, 0.12)',
  textLight: neutralVariant[40],
  textDark: neutralVariant[60],
} as const;

/**
 * Interactive state overlays (opacity-based)
 */
export const stateOverlay = {
  hoverLight: 'rgba(0, 0, 0, 0.04)',
  hoverDark: 'rgba(255, 255, 255, 0.08)',
  pressedLight: 'rgba(0, 0, 0, 0.08)',
  pressedDark: 'rgba(255, 255, 255, 0.10)',
  draggedLight: 'rgba(0, 0, 0, 0.16)',
  draggedDark: 'rgba(255, 255, 255, 0.16)',
  focusLight: 'rgba(107, 155, 141, 0.12)',
  focusDark: 'rgba(179, 212, 204, 0.12)',
} as const;

/**
 * Glow effects (accent overlays)
 */
export const glow = {
  light: 'rgba(107, 155, 141, 0.3)',
  dark: 'rgba(179, 212, 204, 0.25)',
  strongLight: 'rgba(107, 155, 141, 0.5)',
  strongDark: 'rgba(179, 212, 204, 0.45)',
  amberLight: 'rgba(212, 165, 116, 0.3)',
  amberDark: 'rgba(232, 200, 168, 0.25)',
  coralLight: 'rgba(232, 168, 154, 0.3)',
  coralDark: 'rgba(245, 200, 190, 0.25)',
} as const;

// =============================================================================
// SEMANTIC COLLECTION
// =============================================================================

export const semantics = {
  primary,
  secondary,
  tertiary,
  error: errorSemantic,
  surface,
  surfaceContainer,
  background,
  outline,
  inverse,
  status: statusSemantic,
  shadow,
  scrim,
  disabled,
  stateOverlay,
  glow,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SemanticPrimary = typeof primary;
export type SemanticSecondary = typeof secondary;
export type SemanticTertiary = typeof tertiary;
export type SemanticError = typeof errorSemantic;
export type SemanticSurface = typeof surface;
export type SemanticSurfaceContainer = typeof surfaceContainer;
export type SemanticBackground = typeof background;
export type SemanticOutline = typeof outline;
export type SemanticInverse = typeof inverse;
export type SemanticStatus = typeof statusSemantic;
export type SemanticShadow = typeof shadow;
export type SemanticScrim = typeof scrim;
export type SemanticDisabled = typeof disabled;
export type SemanticStateOverlay = typeof stateOverlay;
export type SemanticGlow = typeof glow;
export type Semantics = typeof semantics;
