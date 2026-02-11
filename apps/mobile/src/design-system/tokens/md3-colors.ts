/**
 * Material Design 3 Color Tokens - Warm Recovery Theme
 * 
 * Colors:
 * - Sage Green: #6B9B8D (Primary)
 * - Amber: #D4A574 (Secondary)
 * - Coral: #E8A89A (Tertiary)
 * 
 * Following MD3 color system with tonal palettes
 */

// ============================================================================
// PRIMARY - Sage Green (#6B9B8D)
// ============================================================================

export const sageGreen = {
  0: '#000000',
  10: '#00201A',
  20: '#00382E',
  30: '#005144',
  40: '#006B5A',
  50: '#008671',
  60: '#2EA28A',
  70: '#4EBEA4',
  80: '#6B9B8D', // Base color
  90: '#B4E9D6',
  95: '#CFF8E5',
  99: '#F5FFF9',
  100: '#FFFFFF',
} as const;

// ============================================================================
// SECONDARY - Amber (#D4A574)
// ============================================================================

export const amber = {
  0: '#000000',
  10: '#291800',
  20: '#462B00',
  30: '#663E00',
  40: '#855300',
  50: '#A66900',
  60: '#C7811F',
  70: '#E69B36',
  80: '#D4A574', // Base color
  90: '#FFDDB6',
  95: '#FFEED8',
  99: '#FFFCFF',
  100: '#FFFFFF',
} as const;

// ============================================================================
// TERTIARY - Coral (#E8A89A)
// ============================================================================

export const coral = {
  0: '#000000',
  10: '#380C07',
  20: '#561F18',
  30: '#74352D',
  40: '#934C42',
  50: '#B36459',
  60: '#D27D70',
  70: '#F19687',
  80: '#E8A89A', // Base color
  90: '#FFDAD4',
  95: '#FFEDE9',
  99: '#FFFBFF',
  100: '#FFFFFF',
} as const;

// ============================================================================
// ERROR - Soft Red
// ============================================================================

export const error = {
  0: '#000000',
  10: '#410002',
  20: '#690005',
  30: '#93000A',
  40: '#BA1A1A',
  50: '#DE3730',
  60: '#FF5449',
  70: '#FF897D',
  80: '#FFB4AB',
  90: '#FFDAD6',
  95: '#FFEDEA',
  99: '#FFFBFF',
  100: '#FFFFFF',
} as const;

// ============================================================================
// NEUTRAL - Warm Gray
// ============================================================================

export const neutral = {
  0: '#000000',
  10: '#1C1C1A',
  20: '#31302E',
  30: '#484644',
  40: '#605D5B',
  50: '#797674',
  60: '#93908D',
  70: '#AEAAA7',
  80: '#CAC5C2',
  90: '#E6E1DD',
  95: '#F5F0EB',
  99: '#FFFCF8',
  100: '#FFFFFF',
} as const;

// ============================================================================
// NEUTRAL VARIANT - Slightly tinted
// ============================================================================

export const neutralVariant = {
  0: '#000000',
  10: '#1D1F1D',
  20: '#323432',
  30: '#484B48',
  40: '#60635F',
  50: '#797C78',
  60: '#939590',
  70: '#ADB0AA',
  80: '#C8CBC5',
  90: '#E4E7E1',
  95: '#F3F5EF',
  99: '#FCFDF7',
  100: '#FFFFFF',
} as const;

// ============================================================================
// LIGHT THEME - MD3 Color Roles
// ============================================================================

export const md3LightColors = {
  // Primary
  primary: sageGreen[40],
  onPrimary: sageGreen[100],
  primaryContainer: sageGreen[90],
  onPrimaryContainer: sageGreen[10],
  
  // Secondary
  secondary: amber[40],
  onSecondary: amber[100],
  secondaryContainer: amber[90],
  onSecondaryContainer: amber[10],
  
  // Tertiary
  tertiary: coral[40],
  onTertiary: coral[100],
  tertiaryContainer: coral[90],
  onTertiaryContainer: coral[10],
  
  // Error
  error: error[40],
  onError: error[100],
  errorContainer: error[90],
  onErrorContainer: error[10],
  
  // Surface
  surface: neutral[99],
  onSurface: neutral[10],
  surfaceVariant: neutralVariant[90],
  onSurfaceVariant: neutralVariant[30],
  surfaceTint: sageGreen[40],
  
  // Background
  background: neutral[99],
  onBackground: neutral[10],
  
  // Outline
  outline: neutralVariant[50],
  outlineVariant: neutralVariant[80],
  
  // Shadow
  shadow: neutral[0],
  scrim: neutral[0],
  
  // Inverse
  inverseSurface: neutral[20],
  inverseOnSurface: neutral[95],
  inversePrimary: sageGreen[80],
  
  // Fixed (MD3 adaptive colors)
  primaryFixed: sageGreen[90],
  primaryFixedDim: sageGreen[80],
  onPrimaryFixed: sageGreen[10],
  onPrimaryFixedVariant: sageGreen[30],
  secondaryFixed: amber[90],
  secondaryFixedDim: amber[80],
  onSecondaryFixed: amber[10],
  onSecondaryFixedVariant: amber[30],
  tertiaryFixed: coral[90],
  tertiaryFixedDim: coral[80],
  onTertiaryFixed: coral[10],
  onTertiaryFixedVariant: coral[30],
  
  // Surface containers (MD3 elevation)
  surfaceContainerHighest: neutralVariant[90],
  surfaceContainerHigh: neutralVariant[90],
  surfaceContainer: neutralVariant[90],
  surfaceContainerLow: neutralVariant[95],
  surfaceContainerLowest: neutralVariant[99],
  surfaceBright: neutralVariant[95],
  surfaceDim: neutralVariant[80],
  
  // Status colors
  success: sageGreen[40],
  successContainer: sageGreen[90],
  warning: amber[40],
  warningContainer: amber[90],
  info: '#5A7A8A',
  
  // Legacy aliases for compatibility
  primaryLight: sageGreen[60],
  primaryDark: sageGreen[30],
  secondaryLight: amber[60],
  secondaryDark: amber[30],
  tertiaryLight: coral[60],
  tertiaryDark: coral[30],
} as const;

// ============================================================================
// DARK THEME - MD3 Color Roles
// ============================================================================

export const md3DarkColors = {
  // Primary
  primary: sageGreen[80],
  onPrimary: sageGreen[20],
  primaryContainer: sageGreen[30],
  onPrimaryContainer: sageGreen[90],
  
  // Secondary
  secondary: amber[80],
  onSecondary: amber[20],
  secondaryContainer: amber[30],
  onSecondaryContainer: amber[90],
  
  // Tertiary
  tertiary: coral[80],
  onTertiary: coral[20],
  tertiaryContainer: coral[30],
  onTertiaryContainer: coral[90],
  
  // Error
  error: error[80],
  onError: error[20],
  errorContainer: error[30],
  onErrorContainer: error[90],
  
  // Surface
  surface: neutral[10],
  onSurface: neutral[90],
  surfaceVariant: neutralVariant[30],
  onSurfaceVariant: neutralVariant[80],
  surfaceTint: sageGreen[80],
  
  // Background
  background: neutral[10],
  onBackground: neutral[90],
  
  // Outline
  outline: neutralVariant[60],
  outlineVariant: neutralVariant[30],
  
  // Shadow
  shadow: neutral[0],
  scrim: neutral[0],
  
  // Inverse
  inverseSurface: neutral[90],
  inverseOnSurface: neutral[20],
  inversePrimary: sageGreen[40],
  
  // Fixed
  primaryFixed: sageGreen[90],
  primaryFixedDim: sageGreen[80],
  onPrimaryFixed: sageGreen[10],
  onPrimaryFixedVariant: sageGreen[30],
  secondaryFixed: amber[90],
  secondaryFixedDim: amber[80],
  onSecondaryFixed: amber[10],
  onSecondaryFixedVariant: amber[30],
  tertiaryFixed: coral[90],
  tertiaryFixedDim: coral[80],
  onTertiaryFixed: coral[10],
  onTertiaryFixedVariant: coral[30],
  
  // Surface containers - using valid neutralVariant tones
  surfaceContainerHighest: neutralVariant[30],
  surfaceContainerHigh: neutralVariant[30],
  surfaceContainer: neutralVariant[30],
  surfaceContainerLow: neutralVariant[20],
  surfaceContainerLowest: neutralVariant[10],
  surfaceBright: neutralVariant[40],
  surfaceDim: neutralVariant[20],
  
  // Status colors
  success: sageGreen[80],
  successContainer: sageGreen[30],
  warning: amber[80],
  warningContainer: amber[30],
  info: '#7A9AAA',
  
  // Legacy aliases
  primaryLight: sageGreen[70],
  primaryDark: sageGreen[90],
  secondaryLight: amber[70],
  secondaryDark: amber[90],
  tertiaryLight: coral[70],
  tertiaryDark: coral[90],
} as const;

// ============================================================================
// ELEVATION OVERLAY OPACITIES (MD3)
// ============================================================================

export const elevationOverlayOpacity = {
  level0: 0,
  level1: 0.05,
  level2: 0.08,
  level3: 0.11,
  level4: 0.12,
  level5: 0.14,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MD3LightColors = typeof md3LightColors;
export type MD3DarkColors = typeof md3DarkColors;
export type MD3Colors = MD3LightColors | MD3DarkColors;
