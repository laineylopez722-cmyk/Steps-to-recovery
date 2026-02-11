/**
 * Accessibility Constants
 *
 * WCAG AAA compliance constants for the Steps to Recovery design system.
 * Centralizes all accessibility-related values for consistency.
 */

// ============================================================================
// TOUCH TARGETS
// ============================================================================

/** Minimum touch target size in density-independent pixels (dp) - WCAG AAA */
export const MIN_TOUCH_TARGET = 48;

/** Large touch target size for emergency/critical actions */
export const LARGE_TOUCH_TARGET = 56;

/** Extra large touch target for high-stress situations */
export const EXTRA_LARGE_TOUCH_TARGET = 64;

/** Minimum touch target padding */
export const MIN_TOUCH_PADDING = 8;

// ============================================================================
// CONTRAST RATIOS (WCAG)
// ============================================================================

/** WCAG AA minimum contrast ratio for normal text */
export const CONTRAST_AA_NORMAL = 4.5;

/** WCAG AA minimum contrast ratio for large text (18pt+ or 14pt+ bold) */
export const CONTRAST_AA_LARGE = 3;

/** WCAG AAA minimum contrast ratio for normal text */
export const CONTRAST_AAA_NORMAL = 7;

/** WCAG AAA minimum contrast ratio for large text */
export const CONTRAST_AAA_LARGE = 4.5;

/** Enhanced contrast for critical/emergency UI */
export const CONTRAST_ENHANCED = 10;

// ============================================================================
// TEXT SCALING
// ============================================================================

/** Default text scale factor (100%) */
export const TEXT_SCALE_DEFAULT = 1.0;

/** Minimum text scale factor */
export const TEXT_SCALE_MIN = 1.0;

/** Maximum text scale factor (200%) - WCAG requirement */
export const TEXT_SCALE_MAX = 2.0;

/** Large text threshold (130%) */
export const TEXT_SCALE_LARGE_THRESHOLD = 1.3;

/** Text scale factor for accessibility sizes */
export const TEXT_SCALE_ACCESSIBILITY = {
  xs: 0.85,
  sm: 0.95,
  base: 1.0,
  lg: 1.15,
  xl: 1.3,
  '2xl': 1.5,
  '3xl': 1.75,
  max: 2.0,
} as const;

// ============================================================================
// ANIMATION DURATIONS (Material Design 3)
// ============================================================================

/** Instant - no animation */
export const DURATION_INSTANT = 0;

/** Fast feedback (50ms) */
export const DURATION_FAST = 50;

/** Quick feedback (100ms) */
export const DURATION_QUICK = 100;

/** Normal micro-interaction (150ms) */
export const DURATION_NORMAL = 150;

/** Standard transition (200ms) */
export const DURATION_STANDARD = 200;

/** Emphasized animation (300ms) */
export const DURATION_EMPHASIZED = 300;

/** Slow animation for emphasis (500ms) */
export const DURATION_SLOW = 500;

/** Reduced motion duration - instant or minimal */
export const DURATION_REDUCED_MOTION = 0;

/** Reduced motion alternative - subtle indication */
export const DURATION_REDUCED_ALT = 50;

// ============================================================================
// ACCESSIBILITY ROLES
// ============================================================================

/** Standard accessibility roles for recovery app components */
export const ACCESSIBILITY_ROLES = {
  /** Interactive button */
  button: 'button',
  /** Navigation link */
  link: 'link',
  /** Page/section header */
  header: 'header',
  /** Image/graphic */
  image: 'image',
  /** Text content */
  text: 'text',
  /** Search input */
  search: 'search',
  /** Toggle switch */
  switch: 'switch',
  /** Checkbox */
  checkbox: 'checkbox',
  /** Radio button */
  radio: 'radio',
  /** Menu */
  menu: 'menu',
  /** Menu item */
  menuitem: 'menuitem',
  /** Progress indicator */
  progressbar: 'progressbar',
  /** Slider/adjustable */
  adjustable: 'adjustable',
  /** Alert message */
  alert: 'alert',
  /** Dialog/modal */
  dialog: 'dialog',
  /** List */
  list: 'list',
  /** List item */
  listitem: 'listitem',
  /** Summary */
  summary: 'summary',
  /** Timer */
  timer: 'timer',
  /** Status update */
  status: 'status',
} as const;

/** Recovery-specific accessibility roles */
export const RECOVERY_ACCESSIBILITY_ROLES = {
  /** Sobriety counter display */
  sobrietyCounter: 'timer',
  /** Daily check-in card */
  checkInCard: 'button',
  /** Journal entry */
  journalEntry: 'button',
  /** Step work progress */
  stepProgress: 'progressbar',
  /** Milestone achievement */
  milestone: 'alert',
  /** Crisis support button */
  crisisButton: 'button',
  /** Emergency contact */
  emergencyContact: 'link',
  /** Support group meeting */
  meetingCard: 'button',
  /** Coping tool/resource */
  copingTool: 'button',
  /** Affirmation/motivation */
  affirmation: 'text',
} as const;

// ============================================================================
// SCREEN READER ANNOUNCEMENT PRIORITIES
// ============================================================================

/** Announcement priority levels */
export const ANNOUNCEMENT_PRIORITY = {
  /** Critical - interrupts current announcement */
  critical: 'critical',
  /** Normal - queued and announced in order */
  normal: 'normal',
  /** Info - low priority, may be skipped if busy */
  info: 'info',
} as const;

/** Default announcement delays (ms) */
export const ANNOUNCEMENT_DELAY = {
  critical: 0,
  normal: 100,
  info: 500,
} as const;

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/** Focus priority delays (ms) */
export const FOCUS_DELAY = {
  critical: 0,
  high: 100,
  normal: 250,
  low: 500,
} as const;

/** Focus ring width in dp */
export const FOCUS_RING_WIDTH = 3;

/** Focus ring color (will be overridden by theme) */
export const FOCUS_RING_COLOR = '#0066CC';

/** High contrast focus ring */
export const FOCUS_RING_HIGH_CONTRAST = '#FFFFFF';

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

/** Error announcement priority */
export const ERROR_ANNOUNCEMENT_PRIORITY = 'critical';

/** Error retry button label */
export const ERROR_RETRY_LABEL = 'Retry, button';

/** Error dismiss button label */
export const ERROR_DISMISS_LABEL = 'Dismiss error, button';

// ============================================================================
// DEFAULT ACCESSIBILITY LABELS
// ============================================================================

/** Common UI element labels */
export const DEFAULT_LABELS = {
  // Navigation
  backButton: 'Go back',
  closeButton: 'Close',
  menuButton: 'Open menu',
  searchButton: 'Search',

  // Actions
  saveButton: 'Save',
  cancelButton: 'Cancel',
  deleteButton: 'Delete',
  editButton: 'Edit',
  shareButton: 'Share',

  // Form elements
  submitButton: 'Submit',
  clearButton: 'Clear input',
  showPassword: 'Show password',
  hidePassword: 'Hide password',

  // Recovery-specific
  checkInButton: 'Daily check-in',
  journalButton: 'Journal',
  stepsButton: 'Step work',
  progressButton: 'Progress',
  meetingsButton: 'Meetings',
  sponsorButton: 'Sponsor',
  crisisButton: 'Get help now',
  emergencyButton: 'Emergency support',

  // Milestones
  milestoneReached: 'Milestone reached',
  dayCounter: 'Days clean',
  streakCounter: 'Day streak',

  // Status
  loading: 'Loading',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
} as const;

// ============================================================================
// ANIMATION LIMITS FOR REDUCED MOTION
// ============================================================================

/** Maximum allowed animation duration when reduced motion is on */
export const REDUCED_MOTION_MAX_DURATION = 50;

/** Disable parallax effects when reduced motion is on */
export const REDUCED_MOTION_DISABLE_PARALLAX = true;

/** Disable auto-play animations when reduced motion is on */
export const REDUCED_MOTION_DISABLE_AUTOPLAY = true;

/** Prefer opacity fades over movement when reduced motion is on */
export const REDUCED_MOTION_PREFER_OPACITY = true;

// ============================================================================
// BATTERY & PERFORMANCE
// ============================================================================

/** Disable animations when battery is below this percentage */
export const LOW_BATTERY_THRESHOLD = 20;

/** Reduce animation complexity in low power mode */
export const LOW_POWER_MODE_REDUCTION = 0.5;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Touch target size variants */
export type TouchTargetSize = 'default' | 'large' | 'extraLarge';

/** Contrast level */
export type ContrastLevel = 'AA' | 'AAA' | 'enhanced';

/** Focus priority level */
export type FocusPriority = 'low' | 'normal' | 'high' | 'critical';

/** Animation intensity level */
export type AnimationIntensity = 'minimal' | 'reduced' | 'standard' | 'enhanced';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get touch target size based on context
 */
export function getTouchTargetSize(context: 'default' | 'emergency' | 'crisis' | 'form'): number {
  switch (context) {
    case 'crisis':
    case 'emergency':
      return EXTRA_LARGE_TOUCH_TARGET;
    case 'form':
      return LARGE_TOUCH_TARGET;
    default:
      return MIN_TOUCH_TARGET;
  }
}

/**
 * Get contrast ratio requirement based on context
 */
export function getRequiredContrastRatio(
  context: 'normal' | 'large' | 'critical',
  level: ContrastLevel = 'AAA',
): number {
  const isLarge = context === 'large';

  if (level === 'enhanced' || context === 'critical') {
    return CONTRAST_ENHANCED;
  }

  if (level === 'AAA') {
    return isLarge ? CONTRAST_AAA_LARGE : CONTRAST_AAA_NORMAL;
  }

  return isLarge ? CONTRAST_AA_LARGE : CONTRAST_AA_NORMAL;
}

/**
 * Check if text scale requires layout adjustments
 */
export function requiresLayoutAdjustment(textScale: number): boolean {
  return textScale >= TEXT_SCALE_LARGE_THRESHOLD;
}

export default {
  // Touch targets
  MIN_TOUCH_TARGET,
  LARGE_TOUCH_TARGET,
  EXTRA_LARGE_TOUCH_TARGET,

  // Contrast
  CONTRAST_AA_NORMAL,
  CONTRAST_AA_LARGE,
  CONTRAST_AAA_NORMAL,
  CONTRAST_AAA_LARGE,
  CONTRAST_ENHANCED,

  // Text scale
  TEXT_SCALE_DEFAULT,
  TEXT_SCALE_MAX,

  // Durations
  DURATION_INSTANT,
  DURATION_FAST,
  DURATION_NORMAL,
  DURATION_STANDARD,
  DURATION_EMPHASIZED,
  DURATION_SLOW,
  DURATION_REDUCED_MOTION,

  // Roles
  ACCESSIBILITY_ROLES,
  RECOVERY_ACCESSIBILITY_ROLES,

  // Announcement
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_DELAY,

  // Focus
  FOCUS_DELAY,
  FOCUS_RING_WIDTH,

  // Labels
  DEFAULT_LABELS,

  // Helpers
  getTouchTargetSize,
  getRequiredContrastRatio,
  requiresLayoutAdjustment,
};
