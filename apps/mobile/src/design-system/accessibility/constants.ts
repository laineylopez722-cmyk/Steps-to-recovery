/**
 * WCAG AAA Accessibility Constants
 * 
 * WCAG AAA is the highest level of accessibility conformance,
 * ensuring the app is accessible to the widest range of users.
 */

/** Minimum touch target size in density-independent pixels (dp) */
export const MIN_TOUCH_TARGET = 48;

/** WCAG AAA minimum contrast ratio (7:1 for normal text) */
export const MIN_CONTRAST_RATIO = 7.0;

/** WCAG AAA minimum contrast ratio for large text (18pt+ or 14pt+ bold) */
export const MIN_CONTRAST_RATIO_LARGE_TEXT = 4.5;

/** Maximum text scale factor (200% = 2.0) */
export const MAX_TEXT_SCALE = 2.0;

/** Minimum text scale factor */
export const MIN_TEXT_SCALE = 1.0;

/** Default text scale factor */
export const DEFAULT_TEXT_SCALE = 1.0;

/** Border width for high contrast mode (2dp) */
export const HIGH_CONTRAST_BORDER_WIDTH = 2;

/** Focus ring width */
export const FOCUS_RING_WIDTH = 3;

/** Animation duration limits for reduced motion */
export const REDUCED_MOTION_DURATION = 0;

/** Standard animation duration */
export const STANDARD_ANIMATION_DURATION = 300;

// Re-export extended constants from constants directory
export {
  LARGE_TOUCH_TARGET,
  EXTRA_LARGE_TOUCH_TARGET,
  MIN_TOUCH_PADDING,
  CONTRAST_AA_NORMAL,
  CONTRAST_AA_LARGE,
  CONTRAST_AAA_NORMAL,
  CONTRAST_AAA_LARGE,
  CONTRAST_ENHANCED,
  TEXT_SCALE_DEFAULT,
  TEXT_SCALE_MIN,
  TEXT_SCALE_MAX,
  TEXT_SCALE_LARGE_THRESHOLD,
  DURATION_INSTANT,
  DURATION_FAST,
  DURATION_NORMAL,
  DURATION_STANDARD,
  DURATION_EMPHASIZED,
  DURATION_SLOW,
  DURATION_REDUCED_MOTION,
} from './constants/a11y';

export {
  CRISIS_MAX_RESPONSE_TIME_MS,
  CRISIS_TARGET_RESPONSE_TIME_MS,
  CRISIS_TOUCH_TARGET_MIN,
  CRISIS_CONTRAST_RATIO,
} from './constants/crisisA11y';
