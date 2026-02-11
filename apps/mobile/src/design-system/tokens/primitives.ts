/**
 * Design Tokens - Primitives
 *
 * Raw color values with NO semantics attached.
 * These are the building blocks for the entire design system.
 *
 * Based on Material Design 3 warm palette:
 * - Primary: Warm sage green (#6B9B8D)
 * - Secondary: Warm amber (#D4A574)
 * - Tertiary: Soft coral (#E8A89A)
 */

// =============================================================================
// PRIMARY - Sage Green Tonal Palette
// =============================================================================

export const sageGreen = {
  0: '#000000',
  5: '#001411',
  10: '#00201A',
  15: '#002B23',
  20: '#00382E',
  25: '#00443A',
  30: '#005144',
  35: '#005E50',
  40: '#006B5A',
  50: '#008671',
  60: '#2EA28A',
  70: '#4EBEA4',
  80: '#6B9B8D', // Base color
  90: '#B4E9D6',
  95: '#CFF8E5',
  98: '#E8FFF1',
  99: '#F5FFF9',
  100: '#FFFFFF',
} as const;

// =============================================================================
// SECONDARY - Amber Tonal Palette
// =============================================================================

export const amber = {
  0: '#000000',
  5: '#150D00',
  10: '#291800',
  15: '#3B2500',
  20: '#462B00',
  25: '#563600',
  30: '#663E00',
  35: '#754800',
  40: '#855300',
  50: '#A66900',
  60: '#C7811F',
  70: '#E69B36',
  80: '#D4A574', // Base color
  90: '#FFDDB6',
  95: '#FFEED8',
  98: '#FFF8F2',
  99: '#FFFCFF',
  100: '#FFFFFF',
} as const;

// =============================================================================
// TERTIARY - Coral Tonal Palette
// =============================================================================

export const coral = {
  0: '#000000',
  5: '#240503',
  10: '#380C07',
  15: '#48140E',
  20: '#561F18',
  25: '#662921',
  30: '#74352D',
  35: '#844038',
  40: '#934C42',
  50: '#B36459',
  60: '#D27D70',
  70: '#F19687',
  80: '#E8A89A', // Base color
  90: '#FFDAD4',
  95: '#FFEDE9',
  98: '#FFF8F6',
  99: '#FFFBFF',
  100: '#FFFFFF',
} as const;

// =============================================================================
// ERROR - Soft Red Tonal Palette
// =============================================================================

export const error = {
  0: '#000000',
  5: '#2D0001',
  10: '#410002',
  15: '#540003',
  20: '#690005',
  25: '#7E0008',
  30: '#93000A',
  35: '#A9000E',
  40: '#BA1A1A',
  50: '#DE3730',
  60: '#FF5449',
  70: '#FF897D',
  80: '#FFB4AB',
  90: '#FFDAD6',
  95: '#FFEDEA',
  98: '#FFF8F7',
  99: '#FFFBFF',
  100: '#FFFFFF',
} as const;

// =============================================================================
// NEUTRAL - Warm Gray Tonal Palette
// =============================================================================

export const neutral = {
  0: '#000000',
  4: '#0C0C0B',
  6: '#111110',
  10: '#1C1C1A',
  12: '#21201E',
  17: '#2B2A28',
  20: '#31302E',
  22: '#363532',
  24: '#3B3A37',
  30: '#484644',
  40: '#605D5B',
  50: '#797674',
  60: '#93908D',
  70: '#AEAAA7',
  80: '#CAC5C2',
  87: '#DED9D5',
  90: '#E6E1DD',
  92: '#EBE7E2',
  94: '#F2EDE8',
  95: '#F5F0EB',
  96: '#F8F4EF',
  98: '#FCF8F3',
  99: '#FFFCF8',
  100: '#FFFFFF',
} as const;

// =============================================================================
// NEUTRAL VARIANT - Slightly Tinted Warm Gray
// =============================================================================

export const neutralVariant = {
  0: '#000000',
  5: '#0E110D',
  10: '#1D1F1D',
  15: '#272A26',
  20: '#323432',
  25: '#3D3F3C',
  30: '#484B48',
  35: '#545751',
  40: '#60635F',
  50: '#797C78',
  60: '#939590',
  70: '#ADB0AA',
  80: '#C8CBC5',
  87: '#DCDED8',
  90: '#E4E7E1',
  92: '#EAEDE6',
  94: '#EFF2EB',
  95: '#F3F5EF',
  96: '#F6F8F2',
  98: '#FCFDF7',
  99: '#F9FDF2',
  100: '#FFFFFF',
} as const;

// =============================================================================
// STATUS COLORS
// =============================================================================

export const status = {
  success: {
    0: '#000000',
    10: '#002200',
    20: '#003A00',
    30: '#005300',
    40: '#006E00',
    50: '#008A00',
    60: '#21A728',
    70: '#45C241',
    80: '#63DE59',
    90: '#81FB76',
    95: '#C7FFB8',
    99: '#F6FFF0',
    100: '#FFFFFF',
    // Aliases for the warm palette
    base: '#7CB869',
    light: '#A3D494',
    dark: '#5A9448',
  },
  warning: {
    0: '#000000',
    10: '#251900',
    20: '#402D00',
    30: '#5D4200',
    40: '#7B5800',
    50: '#9A7000',
    60: '#BA8A00',
    70: '#DBA500',
    80: '#FFC107',
    90: '#FFDE9C',
    95: '#FFF0CF',
    99: '#FFFBF7',
    100: '#FFFFFF',
    // Aliases for the warm palette
    base: '#F4B942',
    light: '#F9D88A',
    dark: '#C9942A',
  },
  info: {
    0: '#000000',
    10: '#001F28',
    20: '#003543',
    30: '#004D5F',
    40: '#00677D',
    50: '#00829D',
    60: '#009EBE',
    70: '#24BBDF',
    80: '#4ED6FF',
    90: '#96E9FF',
    95: '#D3F4FF',
    99: '#F8FCFF',
    100: '#FFFFFF',
    // Using sage green as info for warm palette consistency
    base: '#6B9B8D',
    light: '#8AB8AC',
    dark: '#4A7A6D',
  },
} as const;

// =============================================================================
// GRAY SCALE (for generic use cases)
// =============================================================================

export const gray = {
  50: '#F8F7F5',
  100: '#F0EEEB',
  150: '#E8E6E1',
  200: '#DDDAD4',
  250: '#D2CEC7',
  300: '#C7C2BA',
  350: '#BCB7AE',
  400: '#B1ABA1',
  450: '#A69F95',
  500: '#999385',
  550: '#8C8679',
  600: '#7F796D',
  650: '#726C61',
  700: '#656055',
  750: '#585349',
  800: '#4B463D',
  850: '#3E3A32',
  900: '#322E27',
  950: '#26231D',
} as const;

// =============================================================================
// HIGH CONTRAST VARIANTS (WCAG AAA Compliant)
// =============================================================================

export const highContrast = {
  // Darker primary for better contrast on light backgrounds
  primaryDark: '#4A6B5D',
  primaryDarker: '#3A5A4D',

  // Stronger error for visibility
  errorStrong: '#C43B2B',
  errorDark: '#A02020',

  // Enhanced text colors
  textOnLight: '#1A1A1A',
  textOnDark: '#FFFFFF',

  // Stronger outlines
  outlineStrong: '#757575',
  outlineStronger: '#555555',
} as const;

// =============================================================================
// PRIMITIVE COLLECTION
// =============================================================================

export const primitives = {
  sageGreen,
  amber,
  coral,
  error,
  neutral,
  neutralVariant,
  status,
  gray,
  highContrast,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SageGreenTone = keyof typeof sageGreen;
export type AmberTone = keyof typeof amber;
export type CoralTone = keyof typeof coral;
export type ErrorTone = keyof typeof error;
export type NeutralTone = keyof typeof neutral;
export type NeutralVariantTone = keyof typeof neutralVariant;
export type GrayTone = keyof typeof gray;

export type Primitives = typeof primitives;
