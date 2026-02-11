/**
 * Accessibility Constants
 *
 * WCAG compliance constants and accessibility values.
 *
 * @example
 * ```tsx
 * import { MIN_TOUCH_TARGET, CONTRAST_AAA_NORMAL } from '@/design-system/accessibility/constants';
 *
 * const size = Math.max(requestedSize, MIN_TOUCH_TARGET);
 * ```
 */

// Standard accessibility constants
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
  TEXT_SCALE_ACCESSIBILITY,

  // Durations
  DURATION_INSTANT,
  DURATION_FAST,
  DURATION_QUICK,
  DURATION_NORMAL,
  DURATION_STANDARD,
  DURATION_EMPHASIZED,
  DURATION_SLOW,
  DURATION_REDUCED_MOTION,
  DURATION_REDUCED_ALT,

  // Roles
  ACCESSIBILITY_ROLES,
  RECOVERY_ACCESSIBILITY_ROLES,

  // Announcement
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_DELAY,

  // Focus
  FOCUS_DELAY,
  FOCUS_RING_WIDTH,
  FOCUS_RING_COLOR,
  FOCUS_RING_HIGH_CONTRAST,

  // Error
  ERROR_ANNOUNCEMENT_PRIORITY,
  ERROR_RETRY_LABEL,
  ERROR_DISMISS_LABEL,

  // Labels
  DEFAULT_LABELS,

  // Reduced motion
  REDUCED_MOTION_MAX_DURATION,
  REDUCED_MOTION_DISABLE_PARALLAX,
  REDUCED_MOTION_DISABLE_AUTOPLAY,
  REDUCED_MOTION_PREFER_OPACITY,

  // Battery
  LOW_BATTERY_THRESHOLD,
  LOW_POWER_MODE_REDUCTION,

  // Types
  type TouchTargetSize,
  type ContrastLevel,
  type FocusPriority,
  type AnimationIntensity,

  // Helpers
  getTouchTargetSize,
  getRequiredContrastRatio,
  requiresLayoutAdjustment,
} from './a11y';

// Crisis-specific constants
export {
  // Response time
  CRISIS_MAX_RESPONSE_TIME_MS,
  CRISIS_TARGET_RESPONSE_TIME_MS,
  CRISIS_ACTION_TIMEOUT_MS,

  // Touch targets
  CRISIS_TOUCH_TARGET_MIN,
  CRISIS_TOUCH_TARGET_PREFERRED,
  CRISIS_TOUCH_PADDING,

  // Contrast
  CRISIS_CONTRAST_RATIO,
  CRISIS_MIN_CONTRAST_RATIO,
  CRISIS_ALERT_CONTRAST,

  // Animation
  CRISIS_ANIMATION_DURATION,
  CRISIS_MAX_ANIMATION_DURATION,
  CRISIS_DISABLE_DECORATIVE_ANIMATIONS,

  // Announcement
  CRISIS_ANNOUNCEMENT_PRIORITY,
  CRISIS_ANNOUNCEMENT_DELAY,

  // Labels
  CRISIS_LABELS,
  CRISIS_SCREEN_READER_MESSAGES,

  // Colors
  CRISIS_COLORS,

  // Typography
  CRISIS_TYPOGRAPHY,
  CRISIS_FONT_WEIGHTS,

  // Focus
  CRISIS_FOCUS_DELAY_MS,
  CRISIS_FOCUS_RING_WIDTH,
  CRISIS_FOCUS_RING_COLOR,

  // Helpers
  getCrisisAnnouncementDelay,
  formatCrisisAnnouncement,
  meetsCrisisContrast,
  getEmergencyColor,
} from './crisisA11y';

// Legacy constants for backward compatibility
export const MIN_CONTRAST_RATIO = 4.5;
export const MIN_CONTRAST_RATIO_LARGE_TEXT = 3;
export const MAX_TEXT_SCALE = 2.0;
export const MIN_TEXT_SCALE = 1.0;
export const DEFAULT_TEXT_SCALE = 1.0;
export const HIGH_CONTRAST_BORDER_WIDTH = 2;
export const FOCUS_RING_WIDTH_LEGACY = 3;
export const REDUCED_MOTION_DURATION = 0;
export const STANDARD_ANIMATION_DURATION = 200;
