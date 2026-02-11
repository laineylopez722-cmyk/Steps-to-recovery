/**
 * Accessibility Utilities
 *
 * Helper functions for accessibility compliance and validation.
 *
 * @example
 * ```tsx
 * import { getContrastRatio, suggestAccessibleColor } from '@/design-system/accessibility/utils';
 *
 * const ratio = getContrastRatio('#FFF', '#000');
 * const accessible = suggestAccessibleColor('#CCC', '#FFF', 7);
 * ```
 */

export {
  // Contrast checking
  hexToRgb,
  rgbToHex,
  parseColor,
  getRelativeLuminance,
  calculateContrastRatio,
  getContrastRatio,
  validateContrast,
  getAccessibleTextColor,
  suggestAccessibleColor,

  // Touch target validation
  validateTouchTarget,
  isValidTouchTarget,
  ensureMinTouchTarget,

  // Batch validation
  validateColorPairs,

  // Types
  type RGBColor,
  type ContrastResult,
  type ContrastOptions,
  type ColorPair,
  type BatchValidationResult,
  type TouchTargetResult,

  // Constants
  AA_NORMAL_RATIO,
  AA_LARGE_RATIO,
  AAA_NORMAL_RATIO,
  AAA_LARGE_RATIO,
  MIN_TOUCH_TARGET,
} from './contrastChecker';

// Re-export legacy utils for compatibility
export {
  // Color utilities
  hexToRgb as hexToRgbLegacy,
  getRelativeLuminance as getRelativeLuminanceLegacy,
  calculateContrastRatio as calculateContrastRatioLegacy,
  validateContrast as validateContrastLegacy,
  getAccessibleTextColor as getAccessibleTextColorLegacy,
  findAccessibleColor,
  generateAccessiblePalette,

  // Size utilities
  scaleSize,
  isTouchTargetValid,
  isValidTouchTargetSize,
  ensureMinimumTouchTarget,

  // Announcement utilities
  formatAnnouncement,
  debounceAnnouncement,

  // Types
  type RGBColor as RGBColorLegacy,
  type ContrastValidation,
  type TouchTargetValidation,
} from '../accessibilityUtils';
