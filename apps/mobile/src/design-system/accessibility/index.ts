/**
 * Accessibility System
 *
 * Comprehensive accessibility utilities for the Steps to Recovery app.
 * WCAG AAA compliance with crisis-first design.
 */

// ============================================================================
// HOOKS
// ============================================================================

export {
  useReducedMotion,
  type UseReducedMotionReturn,
  type ReducedMotionSettings,
} from './hooks/useReducedMotion';

export {
  useAccessibilityInfo,
  type UseAccessibilityInfoReturn,
  type AccessibilityInfoState,
  type ColorBlindnessType,
} from './hooks/useAccessibilityInfo';

export {
  useA11yAnnouncer,
  type UseA11yAnnouncerReturn,
  type AnnouncementPriority,
  type AnnouncementOptions,
} from './hooks/useA11yAnnouncer';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  hexToRgb,
  rgbToHex,
  parseColor,
  getRelativeLuminance,
  calculateContrastRatio,
  getContrastRatio,
  validateContrast,
  getAccessibleTextColor,
  suggestAccessibleColor,
  validateTouchTarget,
  isValidTouchTarget,
  ensureMinTouchTarget,
  validateColorPairs,
  type RGBColor,
  type ContrastResult,
  type ContrastOptions,
  type ColorPair,
  type BatchValidationResult,
  type TouchTargetResult,
} from './utils/contrastChecker';

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  // Touch targets
  MIN_TOUCH_TARGET,
  LARGE_TOUCH_TARGET,
  EXTRA_LARGE_TOUCH_TARGET,
  MIN_TOUCH_PADDING,

  // Contrast ratios
  CONTRAST_AA_NORMAL,
  CONTRAST_AA_LARGE,
  CONTRAST_AAA_NORMAL,
  CONTRAST_AAA_LARGE,
  CONTRAST_ENHANCED,

  // Text scaling
  TEXT_SCALE_DEFAULT,
  TEXT_SCALE_MIN,
  TEXT_SCALE_MAX,
  TEXT_SCALE_LARGE_THRESHOLD,

  // Durations
  DURATION_INSTANT,
  DURATION_FAST,
  DURATION_NORMAL,
  DURATION_STANDARD,
  DURATION_EMPHASIZED,
  DURATION_SLOW,
  DURATION_REDUCED_MOTION,

  // Crisis
  CRISIS_MAX_RESPONSE_TIME_MS,
  CRISIS_TARGET_RESPONSE_TIME_MS,
  CRISIS_TOUCH_TARGET_MIN,
  CRISIS_CONTRAST_RATIO,
} from './constants';

// ============================================================================
// COMPONENTS
// ============================================================================

export {
  AccessibleWrapper,
  withAccessibility,
  AccessibleButton,
  AccessibleInput,
  AccessibleHeader,
  AccessibleImage,
  type AccessibleWrapperProps,
} from './components/AccessibleWrapper';

export {
  EmergencyButton,
  EmergencyCard,
  EmergencyText,
  EmergencyContainer,
} from './components/EmergencyAccessibility';
