/**
 * Haptic Feedback System
 * Material Design 3 tactile feedback patterns
 *
 * Uses expo-haptics for cross-platform haptic feedback.
 * Falls back gracefully on unsupported platforms (web, simulator).
 *
 * @example
 * ```tsx
 * import { haptics } from './hapticFeedback';
 *
 * // Light feedback for saves
 * await haptics.light();
 *
 * // Medium feedback for milestones
 * await haptics.medium();
 *
 * // 3-pulse sequence for achievements
 * await haptics.achievement();
 * ```
 */

import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  selectionAsync,
} from 'expo-haptics';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/** Whether haptics are available on current platform */
export const isHapticsAvailable = Platform.OS !== 'web';

/** Haptic capability info */
export const hapticCapabilities = {
  isAvailable: isHapticsAvailable,
  platform: Platform.OS,
  supportsImpact: isHapticsAvailable,
  supportsNotification: isHapticsAvailable,
  supportsSelection: isHapticsAvailable,
} as const;

// ============================================================================
// BASE HAPTIC FUNCTIONS
// ============================================================================

/**
 * Light impact feedback (50ms)
 * Use for: Button presses, toggles, micro-interactions
 *
 * @example
 * ```tsx
 * <Pressable onPress={() => {
 *   haptics.light();
 *   handlePress();
 * }}>
 * ```
 */
export async function hapticLight(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await impactAsync(ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail on unsupported devices
  }
}

/**
 * Medium impact feedback (100ms)
 * Use for: Primary actions, navigation, confirmations
 *
 * @example
 * ```tsx
 * <Pressable onPress={() => {
 *   haptics.medium();
 *   saveData();
 * }}>
 * ```
 */
export async function hapticMedium(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await impactAsync(ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail
  }
}

/**
 * Heavy impact feedback (150ms)
 * Use for: Deletions, warnings, significant actions
 *
 * @example
 * ```tsx
 * <Pressable onPress={() => {
 *   haptics.heavy();
 *   deleteItem();
 * }}>
 * ```
 */
export async function hapticHeavy(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await impactAsync(ImpactFeedbackStyle.Heavy);
  } catch {
    // Silently fail
  }
}

/**
 * Rigid impact feedback
 * Use for: Precise mechanical feedback
 */
export async function hapticRigid(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await impactAsync(ImpactFeedbackStyle.Rigid);
  } catch {
    // Silently fail
  }
}

/**
 * Soft impact feedback
 * Use for: Gentle confirmations, subtle feedback
 */
export async function hapticSoft(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await impactAsync(ImpactFeedbackStyle.Soft);
  } catch {
    // Silently fail
  }
}

// ============================================================================
// NOTIFICATION FEEDBACK
// ============================================================================

/**
 * Success notification feedback
 * Use for: Completion, success states, milestones
 *
 * @example
 * ```tsx
 * const handleSave = async () => {
 *   await saveData();
 *   await haptics.success();
 *   showSuccessMessage();
 * };
 * ```
 */
export async function hapticSuccess(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await notificationAsync(NotificationFeedbackType.Success);
  } catch {
    // Silently fail
  }
}

/**
 * Error notification feedback
 * Use for: Errors, failures, deletions
 *
 * @example
 * ```tsx
 * try {
 *   await saveData();
 * } catch {
 *   await haptics.error();
 *   showError();
 * }
 * ```
 */
export async function hapticError(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await notificationAsync(NotificationFeedbackType.Error);
  } catch {
    // Silently fail
  }
}

/**
 * Warning notification feedback
 * Use for: Alerts, important notices, cravings
 *
 * @example
 * ```tsx
 * if (cravingIntensity > 7) {
 *   await haptics.warning();
 *   showSupportOptions();
 * }
 * ```
 */
export async function hapticWarning(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await notificationAsync(NotificationFeedbackType.Warning);
  } catch {
    // Silently fail
  }
}

// ============================================================================
// SELECTION FEEDBACK
// ============================================================================

/**
 * Selection feedback - subtle tick
 * Use for: Sliders, pickers, steppers, value changes
 *
 * @example
 * ```tsx
 * <Slider
 *   onValueChange={(value) => {
 *     haptics.selection();
 *     setValue(value);
 *   }}
 * />
 * ```
 */
export async function hapticSelection(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await selectionAsync();
  } catch {
    // Silently fail
  }
}

// ============================================================================
// COMPLEX PATTERNS
// ============================================================================

/**
 * 3-pulse sequence for achievements
 * Pattern: light → medium → success
 *
 * @example
 * ```tsx
 * // On milestone reached
 * await haptics.achievement();
 * showCelebration();
 * ```
 */
export async function hapticAchievement(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticLight();
    await delay(80);
    await hapticMedium();
    await delay(80);
    await hapticSuccess();
  } catch {
    // Silently fail
  }
}

/**
 * Double-tap pattern
 * Pattern: light → light
 *
 * @example
 * ```tsx
 * // On double-tap action
 * await haptics.doubleTap();
 * ```
 */
export async function hapticDoubleTap(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticLight();
    await delay(50);
    await hapticLight();
  } catch {
    // Silently fail
  }
}

/**
 * Triple-pulse for emphasis
 * Pattern: light → medium → heavy
 *
 * @example
 * ```tsx
 * // On important confirmation
 * await haptics.triplePulse();
 * ```
 */
export async function hapticTriplePulse(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticLight();
    await delay(60);
    await hapticMedium();
    await delay(60);
    await hapticHeavy();
  } catch {
    // Silently fail
  }
}

/**
 * Heartbeat pattern
 * Pattern: soft → soft (rest) → soft → soft
 *
 * @example
 * ```tsx
 * // On connection moments
 * await haptics.heartbeat();
 * ```
 */
export async function hapticHeartbeat(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticSoft();
    await delay(100);
    await hapticSoft();
    await delay(300);
    await hapticSoft();
    await delay(100);
    await hapticSoft();
  } catch {
    // Silently fail
  }
}

/**
 * Ascending pattern for progression
 * Pattern: light → medium → heavy (building intensity)
 *
 * @example
 * ```tsx
 * // On progress completion
 * await haptics.ascending();
 * ```
 */
export async function hapticAscending(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticLight();
    await delay(100);
    await hapticMedium();
    await delay(100);
    await hapticHeavy();
  } catch {
    // Silently fail
  }
}

/**
 * Descending pattern for winding down
 * Pattern: heavy → medium → light
 *
 * @example
 * ```tsx
 * // On session complete
 * await haptics.descending();
 * ```
 */
export async function hapticDescending(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticHeavy();
    await delay(100);
    await hapticMedium();
    await delay(100);
    await hapticLight();
  } catch {
    // Silently fail
  }
}

// ============================================================================
// CONTEXTUAL HAPTICS
// ============================================================================

/**
 * Button press with automatic importance selection
 *
 * @example
 * ```tsx
 * <Button onPress={() => {
 *   haptics.buttonPress('high');
 *   handleImportantAction();
 * }} />
 * ```
 */
export async function hapticButtonPress(
  importance: 'low' | 'medium' | 'high' = 'medium',
): Promise<void> {
  switch (importance) {
    case 'low':
      return hapticLight();
    case 'high':
      return hapticMedium();
    default:
      return hapticMedium();
  }
}

/**
 * Toggle switch feedback
 *
 * @example
 * ```tsx
 * <Switch
 *   onValueChange={(value) => {
 *     haptics.toggle(value);
 *     setValue(value);
 *   }}
 * />
 * ```
 */
export async function hapticToggle(isOn: boolean): Promise<void> {
  if (isOn) {
    await hapticLight();
  } else {
    await hapticSoft();
  }
}

/**
 * Stepper increment/decrement feedback
 *
 * @example
 * ```tsx
 * <Stepper
 *   onIncrement={() => haptics.stepper('up')}
 *   onDecrement={() => haptics.stepper('down')}
 * />
 * ```
 */
export async function hapticStepper(direction: 'up' | 'down'): Promise<void> {
  if (direction === 'up') {
    await hapticLight();
  } else {
    await hapticSoft();
  }
}

/**
 * Slider feedback with value threshold
 * Triggers selection feedback at intervals
 *
 * @example
 * ```tsx
 * const lastHapticValue = useRef(0);
 *
 * <Slider
 *   onValueChange={(value) => {
 *     haptics.slider(value, lastHapticValue.current, 10);
 *     lastHapticValue.current = Math.floor(value / 10) * 10;
 *   }}
 * />
 * ```
 */
export function hapticSlider(currentValue: number, lastHapticValue: number, step: number): void {
  const currentStep = Math.floor(currentValue / step);
  const lastStep = Math.floor(lastHapticValue / step);

  if (currentStep !== lastStep) {
    hapticSelection();
  }
}

/**
 * Scroll boundary feedback
 * Triggers when reaching scroll limits
 *
 * @example
 * ```tsx
 * <ScrollView
 *   onScroll={({ nativeEvent }) => {
 *     const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
 *     const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 10;
 *     if (isAtBottom) haptics.boundary();
 *   }}
 * />
 * ```
 */
export async function hapticBoundary(): Promise<void> {
  await hapticRigid();
}

/**
 * Refresh/pull-to-refresh feedback
 *
 * @example
 * ```tsx
 * <RefreshControl
 *   onRefresh={() => {
 *     haptics.refresh();
 *     loadData();
 *   }}
 * />
 * ```
 */
export async function hapticRefresh(): Promise<void> {
  await hapticMedium();
}

// ============================================================================
// RECOVERY-SPECIFIC PATTERNS
// ============================================================================

/**
 * Check-in completion feedback
 * Pattern: selection tick + success notification
 *
 * @example
 * ```tsx
 * // On daily check-in complete
 * await haptics.checkInComplete();
 * showSuccessAnimation();
 * ```
 */
export async function hapticCheckInComplete(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticSelection();
    await delay(100);
    await hapticSuccess();
  } catch {
    // Silently fail
  }
}

/**
 * Milestone reached feedback
 * Pattern: ascending + achievement pulse
 *
 * @example
 * ```tsx
 * // On milestone reached
 * await haptics.milestone();
 * triggerConfetti();
 * ```
 */
export async function hapticMilestone(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticLight();
    await delay(60);
    await hapticMedium();
    await delay(60);
    await hapticHeavy();
    await delay(100);
    await hapticSuccess();
  } catch {
    // Silently fail
  }
}

/**
 * Sobriety anniversary feedback
 * Grand celebration pattern
 *
 * @example
 * ```tsx
 * // On anniversary
 * await haptics.anniversary();
 * showAnniversaryModal();
 * ```
 */
export async function hapticAnniversary(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticLight();
    await delay(50);
    await hapticMedium();
    await delay(50);
    await hapticMedium();
    await delay(50);
    await hapticHeavy();
    await delay(100);
    await hapticSuccess();
    await delay(100);
    await hapticSuccess();
  } catch {
    // Silently fail
  }
}

/**
 * Craving alert feedback
 * Pattern: warning + heartbeat
 *
 * @example
 * ```tsx
 * // On high craving detected
 * await haptics.cravingAlert();
 * showSupportOptions();
 * ```
 */
export async function hapticCravingAlert(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticWarning();
    await delay(200);
    await hapticHeartbeat();
  } catch {
    // Silently fail
  }
}

/**
 * Emergency support feedback
 * Pattern: urgent triple pulse
 *
 * @example
 * ```tsx
 * // On emergency button press
 * await haptics.emergency();
 * connectToSupport();
 * ```
 */
export async function hapticEmergency(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await hapticHeavy();
    await delay(50);
    await hapticHeavy();
    await delay(50);
    await hapticHeavy();
  } catch {
    // Silently fail
  }
}

// ============================================================================
// GESTURE FEEDBACK
// ============================================================================

/**
 * Swipe gesture feedback
 *
 * @example
 * ```tsx
 * <Swipeable onSwipe={() => haptics.swipe()} />
 * ```
 */
export async function hapticSwipe(_direction: 'left' | 'right' | 'up' | 'down'): Promise<void> {
  await hapticLight();
}

/**
 * Long press confirmation feedback
 *
 * @example
 * ```tsx
 * <Pressable
 *   onLongPress={() => {
 *     haptics.longPressComplete();
 *     handleLongPress();
 *   }}
 *   delayLongPress={500}
 * />
 * ```
 */
export async function hapticLongPressComplete(): Promise<void> {
  await hapticMedium();
}

/**
 * Drag and drop feedback
 *
 * @example
 * ```tsx
 * // On drag start
 * haptics.dragStart();
 *
 * // On drop
 * haptics.dragEnd();
 * ```
 */
export async function hapticDragStart(): Promise<void> {
  await hapticLight();
}

export async function hapticDragEnd(): Promise<void> {
  await hapticMedium();
}

export async function hapticDragOver(): Promise<void> {
  await hapticSelection();
}

// ============================================================================
// UTILITY
// ============================================================================

/** Delay helper for sequential haptics */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Test all haptic patterns (for debugging) */
export async function hapticTestAll(): Promise<void> {
  if (!isHapticsAvailable) {
    logger.debug('Haptics not available on this platform');
    return;
  }

  const patterns = [
    { name: 'Light', fn: hapticLight },
    { name: 'Medium', fn: hapticMedium },
    { name: 'Heavy', fn: hapticHeavy },
    { name: 'Success', fn: hapticSuccess },
    { name: 'Error', fn: hapticError },
    { name: 'Warning', fn: hapticWarning },
    { name: 'Selection', fn: hapticSelection },
    { name: 'Achievement', fn: hapticAchievement },
    { name: 'Milestone', fn: hapticMilestone },
  ];

  for (const pattern of patterns) {
    logger.debug(`Testing: ${pattern.name}`);
    await pattern.fn();
    await delay(500);
  }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Haptic feedback namespace
 * Organized by context for easy discovery
 */
export const haptics = {
  // Basic impact
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  rigid: hapticRigid,
  soft: hapticSoft,

  // Notifications
  success: hapticSuccess,
  error: hapticError,
  warning: hapticWarning,

  // Selection
  selection: hapticSelection,

  // Patterns
  achievement: hapticAchievement,
  doubleTap: hapticDoubleTap,
  triplePulse: hapticTriplePulse,
  heartbeat: hapticHeartbeat,
  ascending: hapticAscending,
  descending: hapticDescending,

  // Contextual
  buttonPress: hapticButtonPress,
  toggle: hapticToggle,
  stepper: hapticStepper,
  slider: hapticSlider,
  boundary: hapticBoundary,
  refresh: hapticRefresh,

  // Recovery-specific
  checkInComplete: hapticCheckInComplete,
  milestone: hapticMilestone,
  anniversary: hapticAnniversary,
  cravingAlert: hapticCravingAlert,
  emergency: hapticEmergency,

  // Gestures
  swipe: hapticSwipe,
  longPressComplete: hapticLongPressComplete,
  dragStart: hapticDragStart,
  dragEnd: hapticDragEnd,
  dragOver: hapticDragOver,

  // Utilities
  capabilities: hapticCapabilities,
  testAll: hapticTestAll,
} as const;

// Backward compatibility exports
export const hapticImpact = hapticMedium;
export const hapticTick = hapticSelection;
export const hapticCelebration = hapticSuccess;
export const hapticThreshold = hapticWarning;
