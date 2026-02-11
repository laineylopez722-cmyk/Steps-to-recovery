/**
 * Contrast Checker Utility
 *
 * WCAG contrast ratio calculator for accessibility compliance.
 * Validates AA (4.5:1) and AAA (7:1) conformance levels.
 *
 * @example
 * ```tsx
 * // Check contrast ratio
 * const result = getContrastRatio('#FFFFFF', '#000000');
 * console.log(result.ratio); // 21
 * console.log(result.aaa); // true
 *
 * // Suggest accessible color
 * const accessible = suggestAccessibleColor('#CCCCCC', '#FFFFFF', 7);
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/** RGB color values */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** Contrast ratio result */
export interface ContrastResult {
  /** The calculated contrast ratio (1-21) */
  ratio: number;
  /** Whether it meets WCAG AA standard (4.5:1) */
  aa: boolean;
  /** Whether it meets WCAG AA for large text (3:1) */
  aaLarge: boolean;
  /** Whether it meets WCAG AAA standard (7:1) */
  aaa: boolean;
  /** Whether it meets WCAG AAA for large text (4.5:1) */
  aaaLarge: boolean;
  /** Suggested color if current fails AAA */
  suggestedColor?: string;
}

/** Contrast validation options */
export interface ContrastOptions {
  /** Whether the text is large (18pt+ or 14pt+ bold) */
  isLargeText?: boolean;
  /** Minimum ratio required */
  minRatio?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** WCAG AA minimum contrast ratio for normal text */
export const AA_NORMAL_RATIO = 4.5;

/** WCAG AA minimum contrast ratio for large text */
export const AA_LARGE_RATIO = 3;

/** WCAG AAA minimum contrast ratio for normal text */
export const AAA_NORMAL_RATIO = 7;

/** WCAG AAA minimum contrast ratio for large text */
export const AAA_LARGE_RATIO = 4.5;

/** Minimum touch target size in dp */
export const MIN_TOUCH_TARGET = 48;

// ============================================================================
// COLOR CONVERSION
// ============================================================================

/**
 * Parse hex color to RGB values
 * Supports: #RGB, #RRGGBB, #RRGGBBAA
 * @param hex - Hex color string
 * @returns RGB color object
 */
export function hexToRgb(hex: string): RGBColor {
  // Remove # and spaces
  const cleanHex = hex.replace('#', '').trim();

  // Handle shorthand (#RGB or #RGBA)
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }

  // Handle full hex (#RRGGBB or #RRGGBBAA)
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB to hex color string
 * @param rgb - RGB color object
 * @returns Hex color string (#RRGGBB)
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number): string => {
    const clamped = Math.max(0, Math.min(255, n));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Parse any color format to RGB
 * Supports hex, rgb(r,g,b), rgba(r,g,b,a)
 * @param color - Color string in any format
 * @returns RGB color object or null if invalid
 */
export function parseColor(color: string): RGBColor | null {
  // Hex
  if (color.startsWith('#')) {
    try {
      return hexToRgb(color);
    } catch {
      return null;
    }
  }

  // rgb() or rgba()
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return null;
}

// ============================================================================
// LUMINANCE & CONTRAST
// ============================================================================

/**
 * Calculate relative luminance of a color (WCAG formula)
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @param rgb - RGB color object
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(rgb: RGBColor): number {
  const { r, g, b } = rgb;

  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * WCAG formula: (L1 + 0.05) / (L2 + 0.05)
 * @param color1 - First color (hex or rgb)
 * @param color2 - Second color (hex or rgb)
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  // Ensure lighter color is L1
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================================
// CONTRAST CHECKING
// ============================================================================

/**
 * Get contrast ratio with full WCAG compliance check
 * @param foreground - Foreground/text color
 * @param background - Background color
 * @returns Contrast result with AA/AAA compliance
 */
export function getContrastRatio(foreground: string, background: string): ContrastResult {
  const ratio = calculateContrastRatio(foreground, background);
  const roundedRatio = Math.round(ratio * 100) / 100;

  return {
    ratio: roundedRatio,
    aa: ratio >= AA_NORMAL_RATIO,
    aaLarge: ratio >= AA_LARGE_RATIO,
    aaa: ratio >= AAA_NORMAL_RATIO,
    aaaLarge: ratio >= AAA_LARGE_RATIO,
  };
}

/**
 * Validate contrast against a specific standard
 * @param foreground - Foreground/text color
 * @param background - Background color
 * @param standard - Target WCAG standard ('AA' | 'AAA')
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast meets the standard
 */
export function validateContrast(
  foreground: string,
  background: string,
  standard: 'AA' | 'AAA' = 'AA',
  isLargeText = false,
): boolean {
  const ratio = calculateContrastRatio(foreground, background);

  if (standard === 'AAA') {
    return isLargeText ? ratio >= AAA_LARGE_RATIO : ratio >= AAA_NORMAL_RATIO;
  }

  return isLargeText ? ratio >= AA_LARGE_RATIO : ratio >= AA_NORMAL_RATIO;
}

/**
 * Get accessible text color (black or white) for a background
 * Returns whichever provides better contrast
 * @param backgroundColor - Background color
 * @returns '#FFFFFF' or '#000000'
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = calculateContrastRatio('#FFFFFF', backgroundColor);
  const blackContrast = calculateContrastRatio('#000000', backgroundColor);

  return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Suggest an accessible color variant
 * Adjusts the target color to meet minimum contrast ratio
 * @param targetColor - Desired color
 * @param backgroundColor - Background color
 * @param minRatio - Minimum contrast ratio (default: 7 for AAA)
 * @returns Adjusted color that meets contrast requirements
 */
export function suggestAccessibleColor(
  targetColor: string,
  backgroundColor: string,
  minRatio = AAA_NORMAL_RATIO,
): string {
  const rgb = parseColor(targetColor);
  const bgRgb = parseColor(backgroundColor);

  if (!rgb || !bgRgb) {
    // Return black or white if colors are invalid
    return getAccessibleTextColor(backgroundColor);
  }

  // Check if already meets requirements
  const currentRatio = calculateContrastRatio(targetColor, backgroundColor);
  if (currentRatio >= minRatio) {
    return targetColor;
  }

  // Determine whether to lighten or darken
  const targetLuminance = getRelativeLuminance(rgb);
  const bgLuminance = getRelativeLuminance(bgRgb);

  let adjustedRgb = { ...rgb };
  let attempts = 0;
  const maxAttempts = 20;

  while (
    calculateContrastRatio(rgbToHex(adjustedRgb), backgroundColor) < minRatio &&
    attempts < maxAttempts
  ) {
    const step = 15 + attempts * 2;

    if (targetLuminance > bgLuminance) {
      // Lighten
      adjustedRgb = {
        r: Math.min(255, adjustedRgb.r + step),
        g: Math.min(255, adjustedRgb.g + step),
        b: Math.min(255, adjustedRgb.b + step),
      };
    } else {
      // Darken
      adjustedRgb = {
        r: Math.max(0, adjustedRgb.r - step),
        g: Math.max(0, adjustedRgb.g - step),
        b: Math.max(0, adjustedRgb.b - step),
      };
    }
    attempts++;
  }

  return rgbToHex(adjustedRgb);
}

// ============================================================================
// TOUCH TARGET VALIDATION
// ============================================================================

/** Touch target validation result */
export interface TouchTargetResult {
  /** Whether the touch target is valid */
  valid: boolean;
  /** Current size in dp */
  currentSize: number;
  /** Minimum required size */
  minSize: number;
  /** Suggested size to meet requirements */
  suggestedSize: number;
}

/**
 * Validate touch target size against WCAG requirements
 * @param width - Touch target width in dp
 * @param height - Touch target height in dp
 * @returns Validation result
 */
export function validateTouchTarget(width: number, height: number): TouchTargetResult {
  const currentSize = Math.min(width, height);
  const valid = width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;

  return {
    valid,
    currentSize,
    minSize: MIN_TOUCH_TARGET,
    suggestedSize: valid ? currentSize : MIN_TOUCH_TARGET,
  };
}

/**
 * Check if a single dimension meets minimum touch target
 * @param size - Size in dp (assumes square target)
 * @returns Whether it meets minimum
 */
export function isValidTouchTarget(size: number): boolean {
  return size >= MIN_TOUCH_TARGET;
}

/**
 * Ensure minimum compliant touch target size
 * @param size - Desired size
 * @returns Size that meets minimum requirements
 */
export function ensureMinTouchTarget(size: number): number {
  return Math.max(size, MIN_TOUCH_TARGET);
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

/** Color pair for batch validation */
export interface ColorPair {
  name: string;
  foreground: string;
  background: string;
  isLargeText?: boolean;
}

/** Batch validation result */
export interface BatchValidationResult {
  /** Individual results for each color pair */
  results: Record<string, ContrastResult & { foreground: string; background: string }>;
  /** Whether all pairs meet AAA */
  allAAA: boolean;
  /** Whether all pairs meet AA */
  allAA: boolean;
  /** Pairs that fail AAA */
  failingAAA: string[];
  /** Pairs that fail AA */
  failingAA: string[];
}

/**
 * Validate multiple color pairs at once
 * @param pairs - Array of color pairs to validate
 * @returns Batch validation results
 */
export function validateColorPairs(pairs: ColorPair[]): BatchValidationResult {
  const results: Record<string, ContrastResult & { foreground: string; background: string }> = {};
  const failingAAA: string[] = [];
  const failingAA: string[] = [];

  for (const pair of pairs) {
    const result = getContrastRatio(pair.foreground, pair.background);
    results[pair.name] = {
      ...result,
      foreground: pair.foreground,
      background: pair.background,
    };

    if (!result.aaa && !pair.isLargeText) {
      failingAAA.push(pair.name);
    }
    if (!result.aa && !pair.isLargeText) {
      failingAA.push(pair.name);
    }
  }

  return {
    results,
    allAAA: failingAAA.length === 0,
    allAA: failingAA.length === 0,
    failingAAA,
    failingAA,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getContrastRatio,
  validateContrast,
  getAccessibleTextColor,
  suggestAccessibleColor,
  validateTouchTarget,
  isValidTouchTarget,
  ensureMinTouchTarget,
  validateColorPairs,
  // Constants
  AA_NORMAL_RATIO,
  AA_LARGE_RATIO,
  AAA_NORMAL_RATIO,
  AAA_LARGE_RATIO,
  MIN_TOUCH_TARGET,
};
