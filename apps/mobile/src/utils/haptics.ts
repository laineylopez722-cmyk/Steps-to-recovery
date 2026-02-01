/**
 * Centralized Haptics System
 * Provides consistent haptic feedback patterns throughout the app
 *
 * Uses expo-haptics for cross-platform haptic support.
 * Falls back gracefully when haptics are not available (web, simulator).
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Check if haptics are available on this device/platform
 */
const isHapticsAvailable = Platform.OS !== 'web';

/**
 * Haptic feedback for successful actions
 * Light impact followed by success notification
 * Use for: save complete, task done, goal achieved
 */
export async function hapticSuccess(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Small delay before notification for distinction
    await new Promise((resolve) => setTimeout(resolve, 50));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Haptic feedback for errors
 * Medium impact followed by error notification
 * Use for: validation errors, failed actions, blocked operations
 */
export async function hapticError(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Haptic feedback for warnings
 * Warning notification feedback
 * Use for: confirmations, important notices, caution states
 */
export async function hapticWarning(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Haptic feedback for selection changes
 * Subtle selection feedback
 * Use for: toggles, option selection, slider changes
 */
export async function hapticSelection(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Haptic impact feedback with configurable intensity
 * Use for: button presses, taps, gestures
 */
export async function hapticImpact(
  style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'light',
): Promise<void> {
  if (!isHapticsAvailable) return;

  const styleMap: Record<string, Haptics.ImpactFeedbackStyle> = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
    soft: Haptics.ImpactFeedbackStyle.Soft,
    rigid: Haptics.ImpactFeedbackStyle.Rigid,
  };

  try {
    await Haptics.impactAsync(styleMap[style]);
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Celebration haptic sequence for milestones
 * Multi-step haptic pattern for achievements
 * Use for: milestone reached, streak completed, level up
 */
export async function hapticCelebration(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    // Staccato celebration pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Haptic tick for step-through interactions
 * Light tick feedback for incremental changes
 * Use for: stepping through values, scrolling snaps, pagination
 */
export async function hapticTick(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Haptic feedback for gesture thresholds
 * Rigid impact when user crosses an action threshold
 * Use for: swipe-to-delete threshold, pull-to-refresh trigger, snap points
 */
export async function hapticThreshold(): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  } catch {
    // Haptics not available on this device
  }
}

/**
 * Convenience namespace for organized haptic access
 *
 * @example
 * ```tsx
 * import { haptics } from '../utils/haptics';
 *
 * // In a button press handler
 * const handlePress = async () => {
 *   await haptics.impact('light');
 *   // ... do action
 *   await haptics.success();
 * };
 *
 * // In a toggle
 * const handleToggle = async () => {
 *   await haptics.selection();
 *   setValue(!value);
 * };
 *
 * // In milestone celebration
 * const handleMilestone = async () => {
 *   await haptics.celebration();
 *   showModal();
 * };
 * ```
 */
export const haptics = {
  success: hapticSuccess,
  error: hapticError,
  warning: hapticWarning,
  selection: hapticSelection,
  impact: hapticImpact,
  celebration: hapticCelebration,
  tick: hapticTick,
  threshold: hapticThreshold,
} as const;

export default haptics;
