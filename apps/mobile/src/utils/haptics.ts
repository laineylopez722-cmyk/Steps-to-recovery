/**
 * Haptic Feedback Utilities
 * Micro-interactions for premium tactile feedback
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Check if haptics are available (not on web/simulator)
const isHapticsAvailable = Platform.OS !== 'web';

/**
 * Light impact - subtle feedback
 * Use for: Button presses, toggles, selections
 */
export async function hapticLight(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail on unsupported devices
  }
}

/**
 * Medium impact - standard feedback
 * Use for: Primary actions, navigation, confirmations
 */
export async function hapticMedium(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail
  }
}

/**
 * Heavy impact - strong feedback
 * Use for: Deletions, warnings, emergency actions
 */
export async function hapticHeavy(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Silently fail
  }
}

/**
 * Success notification - positive feedback
 * Use for: Completion, success states, milestones
 */
export async function hapticSuccess(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail
  }
}

/**
 * Error notification - negative feedback
 * Use for: Errors, failures, deletions
 */
export async function hapticError(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Silently fail
  }
}

/**
 * Warning notification - caution feedback
 * Use for: Alerts, important notices, high craving warnings
 */
export async function hapticWarning(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Silently fail
  }
}

/**
 * Selection feedback - subtle tick
 * Use for: Sliders, pickers, steppers
 */
export async function hapticSelection(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Silently fail
  }
}

/**
 * Button press with appropriate feedback
 * Automatically selects impact based on button importance
 */
export async function hapticButtonPress(importance: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
  switch (importance) {
    case 'low':
      return hapticLight();
    case 'high':
      return hapticHeavy();
    default:
      return hapticMedium();
  }
}

// Aliases for backward compatibility
export function hapticImpact(style?: 'light' | 'medium' | 'heavy'): Promise<void> {
  if (style === 'light') return hapticLight();
  if (style === 'heavy') return hapticHeavy();
  return hapticMedium();
}
export const hapticTick = hapticSelection;
export const hapticCelebration = hapticSuccess;
export function hapticThreshold(): Promise<void> {
  return hapticWarning();
}
