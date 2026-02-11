/**
 * Accessibility Utility Functions
 * 
 * WCAG AAA compliance utilities for color contrast, touch targets,
 * text scaling, and other accessibility requirements.
 */

import {
  MIN_TOUCH_TARGET,
  MIN_CONTRAST_RATIO,
  MIN_CONTRAST_RATIO_LARGE_TEXT,
  MAX_TEXT_SCALE,
} from './constants';
import type { RGBColor, ContrastValidation, TouchTargetValidation } from './types';

/**
 * Parse hex color to RGB values
 * @param hex - Hex color string (#RGB, #RRGGBB, or #RRGGBBAA)
 * @returns RGB color object
 */
export function hexToRgb(hex: string): RGBColor {
  // Remove # and any alpha channel
  const cleanHex = hex.replace('#', '').substring(0, 6);
  
  // Handle shorthand (#RGB)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB to relative luminance (WCAG formula)
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
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  // Ensure lighter color is L1
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate contrast ratio against WCAG AAA
 * @param foreground - Foreground color
 * @param background - Background color
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Validation result
 */
export function validateContrast(
  foreground: string,
  background: string,
  isLargeText = false,
): ContrastValidation {
  const ratio = calculateContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? MIN_CONTRAST_RATIO_LARGE_TEXT : MIN_CONTRAST_RATIO;
  
  return {
    valid: ratio >= requiredRatio,
    ratio: Math.round(ratio * 100) / 100,
    requiredRatio,
  };
}

/**
 * Get accessible text color for a given background
 * Returns either black or white depending on which provides better contrast
 * @param backgroundColor - Background color (hex)
 * @returns Accessible text color (black or white hex)
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = calculateContrastRatio('#FFFFFF', backgroundColor);
  const blackContrast = calculateContrastRatio('#000000', backgroundColor);
  
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Find accessible color with minimum contrast ratio
 * @param baseColor - Base color to adjust
 * @param backgroundColor - Background color
 * @param targetRatio - Target contrast ratio (default: WCAG AAA)
 * @returns Color that meets contrast requirements
 */
export function findAccessibleColor(
  baseColor: string,
  backgroundColor: string,
  targetRatio: number = MIN_CONTRAST_RATIO,
): string {
  let rgb = hexToRgb(baseColor);
  let attempts = 0;
  const maxAttempts = 20;
  
  // Try adjusting lightness
  while (calculateContrastRatio(rgbToHex(rgb), backgroundColor) < targetRatio && attempts < maxAttempts) {
    const luminance = getRelativeLuminance(rgb);
    const bgLuminance = getRelativeLuminance(hexToRgb(backgroundColor));
    
    // Determine whether to lighten or darken
    if (luminance > bgLuminance) {
      // Lighten
      rgb = {
        r: Math.min(255, rgb.r + 15),
        g: Math.min(255, rgb.g + 15),
        b: Math.min(255, rgb.b + 15),
      };
    } else {
      // Darken
      rgb = {
        r: Math.max(0, rgb.r - 15),
        g: Math.max(0, rgb.g - 15),
        b: Math.max(0, rgb.b - 15),
      };
    }
    attempts++;
  }
  
  return rgbToHex(rgb);
}

/**
 * Convert RGB to hex color
 * @param rgb - RGB color object
 * @returns Hex color string
 */
function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number): string => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Scale size for large text mode
 * @param baseSize - Base size in dp
 * @param textScale - Current text scale factor (1.0 - 2.0)
 * @param maxScale - Maximum scale factor
 * @returns Scaled size
 */
export function scaleSize(
  baseSize: number,
  textScale: number,
  maxScale: number = MAX_TEXT_SCALE,
): number {
  const clampedScale = Math.max(1, Math.min(maxScale, textScale));
  return Math.round(baseSize * clampedScale);
}

/**
 * Validate touch target size
 * @param width - Touch target width
 * @param height - Touch target height
 * @returns Validation result
 */
export function isTouchTargetValid(
  width: number,
  height: number,
): TouchTargetValidation {
  const currentSize = Math.min(width, height);
  const valid = width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
  
  return {
    valid,
    currentSize,
    minimumSize: MIN_TOUCH_TARGET,
    suggestedSize: valid ? currentSize : MIN_TOUCH_TARGET,
  };
}

/**
 * Check if touch target meets minimum requirements
 * @param size - Touch target size (assumes square)
 * @returns True if valid
 */
export function isValidTouchTargetSize(size: number): boolean {
  return size >= MIN_TOUCH_TARGET;
}

/**
 * Get minimum compliant touch target size
 * @param requestedSize - Requested size
 * @returns Size that meets minimum requirements
 */
export function ensureMinimumTouchTarget(requestedSize: number): number {
  return Math.max(requestedSize, MIN_TOUCH_TARGET);
}

/**
 * Generate accessible color palette from base colors
 * Ensures all text/background combinations meet WCAG AAA
 * @param baseColors - Object of named hex colors
 * @returns Object with original and accessible variants
 */
export function generateAccessiblePalette(
  baseColors: Record<string, string>,
): Record<string, { original: string; accessible: string; contrast: number }> {
  const result: Record<string, { original: string; accessible: string; contrast: number }> = {};
  
  // Standard background colors to test against
  const backgrounds = ['#FFFFFF', '#000000', '#F5F5F0', '#1A1A1A'];
  
  Object.entries(baseColors).forEach(([name, color]) => {
    // Find best contrast against common backgrounds
    let bestContrast = 0;
    let bestBg = backgrounds[0];
    
    backgrounds.forEach(bg => {
      const contrast = calculateContrastRatio(color, bg);
      if (contrast > bestContrast) {
        bestContrast = contrast;
        bestBg = bg;
      }
    });
    
    // Generate accessible variant if needed
    const accessibleColor = bestContrast >= MIN_CONTRAST_RATIO
      ? color
      : findAccessibleColor(color, bestBg);
    
    result[name] = {
      original: color,
      accessible: accessibleColor,
      contrast: Math.round(bestContrast * 100) / 100,
    };
  });
  
  return result;
}

/**
 * Format announcement for screen reader
 * Adds pauses and ensures proper pronunciation
 * @param text - Raw announcement text
 * @returns Formatted announcement
 */
export function formatAnnouncement(text: string): string {
  // Add pauses for numbers (e.g., "30 days" -> "30, days")
  return text
    .replace(/(\d+)(\s+)/g, '$1, ')
    .replace(/\.{3}/g, ', ')
    .trim();
}

/**
 * Debounce announcements to prevent spam
 * @param fn - Function to debounce
 * @param delay - Debounce delay in ms
 * @returns Debounced function
 */
export function debounceAnnouncement<T extends (...args: string[]) => void>(
  fn: T,
  delay: number = 1000,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}
