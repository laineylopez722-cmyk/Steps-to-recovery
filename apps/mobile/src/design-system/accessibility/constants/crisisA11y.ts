/**
 * Crisis Accessibility Constants
 *
 * Emergency-specific accessibility constants for crisis situations.
 * Fast response, clear communication, no decorative elements.
 */

// ============================================================================
// RESPONSE TIME
// ============================================================================

/** Maximum response time for emergency UI elements (ms) */
export const CRISIS_MAX_RESPONSE_TIME_MS = 100;

/** Target response time (ms) */
export const CRISIS_TARGET_RESPONSE_TIME_MS = 50;

/** Timeout for emergency actions (ms) */
export const CRISIS_ACTION_TIMEOUT_MS = 5000;

// ============================================================================
// TOUCH TARGETS
// ============================================================================

/** Emergency button minimum size (larger than standard) */
export const CRISIS_TOUCH_TARGET_MIN = 64;

/** Preferred emergency button size */
export const CRISIS_TOUCH_TARGET_PREFERRED = 72;

/** Crisis touch target padding */
export const CRISIS_TOUCH_PADDING = 12;

// ============================================================================
// CONTRAST
// ============================================================================

/** Enhanced contrast ratio for crisis situations */
export const CRISIS_CONTRAST_RATIO = 10;

/** Minimum contrast for crisis UI */
export const CRISIS_MIN_CONTRAST_RATIO = 7;

/** Emergency alert background contrast */
export const CRISIS_ALERT_CONTRAST = 15;

// ============================================================================
// ANIMATION
// ============================================================================

/** Crisis animations disabled (instant response) */
export const CRISIS_ANIMATION_DURATION = 0;

/** Maximum animation duration for crisis UI (ms) */
export const CRISIS_MAX_ANIMATION_DURATION = 50;

/** No decorative animations in crisis mode */
export const CRISIS_DISABLE_DECORATIVE_ANIMATIONS = true;

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

/** Announcement priorities for crisis situations */
export const CRISIS_ANNOUNCEMENT_PRIORITY = {
  /** Immediate - interrupts everything */
  IMMEDIATE: 'immediate',
  /** Critical - high priority */
  CRITICAL: 'critical',
  /** Important - standard priority */
  IMPORTANT: 'important',
  /** Status - updates */
  STATUS: 'status',
} as const;

/** Crisis announcement delays (ms) - minimal */
export const CRISIS_ANNOUNCEMENT_DELAY = {
  immediate: 0,
  critical: 0,
  important: 50,
  status: 100,
} as const;

// ============================================================================
// EMERGENCY LABELS
// ============================================================================

/** Emergency action labels for screen readers */
export const CRISIS_LABELS = {
  // Primary actions
  getHelp: 'Get help now, emergency button',
  callEmergency: 'Call emergency services, button',
  callSuicideHotline: 'Call suicide prevention hotline, button',
  callCrisisLine: 'Call crisis support line, button',
  textCrisisLine: 'Text crisis support, button',
  findMeeting: 'Find emergency meeting, button',

  // Secondary actions
  contactSponsor: 'Contact sponsor, button',
  contactSupport: 'Contact support person, button',
  viewCopingTools: 'View coping tools, button',
  breathingExercise: 'Start breathing exercise, button',
  groundingExercise: 'Start grounding exercise, button',

  // Status
  connecting: 'Connecting to support...',
  connected: 'Connected to support',
  connectionFailed: 'Connection failed, trying alternative',
  findingLocation: 'Finding nearby resources',

  // Navigation
  backToSafety: 'Back to safety, button',
  cancelEmergency: 'Cancel emergency, button',
  confirmEmergency: 'Confirm emergency, button',

  // Information
  youAreNotAlone: 'You are not alone. Help is available.',
  stayOnLine: 'Please stay on the line',
  helpIsComing: 'Help is on the way',
} as const;

// ============================================================================
// CRISIS SCREEN READER MESSAGES
// ============================================================================

/** Pre-formatted crisis messages for screen readers */
export const CRISIS_SCREEN_READER_MESSAGES = {
  // Opening crisis UI
  crisisScreenOpened: 'Crisis support screen opened. Emergency options available.',
  emergencyActivated: 'Emergency mode activated. Connecting you to help.',

  // Connection status
  callingEmergencyServices: 'Calling emergency services now.',
  connectingToCrisisLine: 'Connecting to crisis support line. Please hold.',
  connectedToCrisisCounselor: 'Connected to crisis counselor. You may speak now.',

  // Support options
  sponsorNotAvailable: 'Sponsor not available. Showing alternative options.',
  supportPersonContacted: 'Support person has been notified.',

  // Self-help
  breathingStarted: 'Breathing exercise started. Follow the guide.',
  groundingStarted: 'Grounding exercise started. Follow the prompts.',

  // Completion
  helpOnWay: 'Help is on the way. Stay where you are.',
  resourcesFound: 'Emergency resources found nearby.',

  // Reassurance
  stayStrong: 'Stay strong. You can get through this.',
  notAlone: 'Remember, you are not alone.',
  worthIt: 'Your life matters. Help is here.',
} as const;

// ============================================================================
// EMERGENCY COLORS (HIGH CONTRAST)
// ============================================================================

/** Crisis color palette with maximum accessibility */
export const CRISIS_COLORS = {
  // Primary emergency
  emergencyRed: '#DC2626',
  emergencyRedDark: '#991B1B',
  emergencyRedLight: '#FEE2E2',

  // Warning/alert
  warningAmber: '#F59E0B',
  warningAmberDark: '#B45309',
  warningAmberLight: '#FEF3C7',

  // Success/safe
  safeGreen: '#059669',
  safeGreenDark: '#065F46',
  safeGreenLight: '#D1FAE5',

  // Information
  infoBlue: '#2563EB',
  infoBlueDark: '#1E40AF',
  infoBlueLight: '#DBEAFE',

  // Neutral
  textPrimary: '#000000',
  textSecondary: '#374151',
  background: '#FFFFFF',
  backgroundMuted: '#F3F4F6',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/** Crisis typography sizes (larger for stress situations) */
export const CRISIS_TYPOGRAPHY = {
  title: 28,
  heading: 24,
  body: 18,
  button: 20,
  caption: 16,
} as const;

/** Crisis font weights */
export const CRISIS_FONT_WEIGHTS = {
  title: '800',
  heading: '700',
  body: '500',
  button: '700',
} as const;

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/** Auto-focus delay for crisis elements (immediate) */
export const CRISIS_FOCUS_DELAY_MS = 0;

/** Focus ring width for crisis elements */
export const CRISIS_FOCUS_RING_WIDTH = 4;

/** Focus ring color */
export const CRISIS_FOCUS_RING_COLOR = '#DC2626';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get crisis announcement delay based on priority
 */
export function getCrisisAnnouncementDelay(
  priority: keyof typeof CRISIS_ANNOUNCEMENT_DELAY
): number {
  return CRISIS_ANNOUNCEMENT_DELAY[priority];
}

/**
 * Format message for crisis screen reader announcement
 * Adds appropriate pauses and emphasis
 */
export function formatCrisisAnnouncement(message: string): string {
  return message
    .replace(/\./g, ', ') // Add pauses for periods
    .replace(/!/g, ', ') // Add pauses for exclamation
    .trim();
}

/**
 * Check if contrast meets crisis standards
 */
export function meetsCrisisContrast(ratio: number): boolean {
  return ratio >= CRISIS_MIN_CONTRAST_RATIO;
}

/**
 * Get emergency color with proper contrast
 * @param type - Color type
 * @param isDarkMode - Whether dark mode is active
 * @returns Color hex code
 */
export function getEmergencyColor(
  type: 'primary' | 'warning' | 'success' | 'info',
  isDarkMode = false
): string {
  switch (type) {
    case 'primary':
      return isDarkMode ? CRISIS_COLORS.emergencyRedLight : CRISIS_COLORS.emergencyRed;
    case 'warning':
      return isDarkMode ? CRISIS_COLORS.warningAmberLight : CRISIS_COLORS.warningAmberDark;
    case 'success':
      return isDarkMode ? CRISIS_COLORS.safeGreenLight : CRISIS_COLORS.safeGreen;
    case 'info':
      return isDarkMode ? CRISIS_COLORS.infoBlueLight : CRISIS_COLORS.infoBlue;
    default:
      return CRISIS_COLORS.textPrimary;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  CRISIS_MAX_RESPONSE_TIME_MS,
  CRISIS_TARGET_RESPONSE_TIME_MS,
  CRISIS_TOUCH_TARGET_MIN,
  CRISIS_TOUCH_TARGET_PREFERRED,
  CRISIS_CONTRAST_RATIO,
  CRISIS_MIN_CONTRAST_RATIO,
  CRISIS_ANIMATION_DURATION,
  CRISIS_MAX_ANIMATION_DURATION,
  CRISIS_DISABLE_DECORATIVE_ANIMATIONS,
  CRISIS_ANNOUNCEMENT_PRIORITY,
  CRISIS_ANNOUNCEMENT_DELAY,
  CRISIS_LABELS,
  CRISIS_SCREEN_READER_MESSAGES,
  CRISIS_COLORS,
  CRISIS_TYPOGRAPHY,
  CRISIS_FONT_WEIGHTS,
  CRISIS_FOCUS_DELAY_MS,
  CRISIS_FOCUS_RING_WIDTH,
  getCrisisAnnouncementDelay,
  formatCrisisAnnouncement,
  meetsCrisisContrast,
  getEmergencyColor,
};
