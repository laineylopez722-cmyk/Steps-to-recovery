import { useCallback } from 'react';
import * as Haptics from '@/platform/haptics';
import { Platform } from 'react-native';

// Check if haptics are available (not on web/simulator)
const isHapticsAvailable = Platform.OS !== 'web';

/**
 * Safe haptic wrapper — never throws, never blocks callers.
 * All haptics are best-effort: a failure should never affect
 * the success/error state of the calling operation.
 */
async function safeHaptic(fn: () => Promise<void>): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await fn();
  } catch {
    // Silently fail on unsupported devices / emulators
  }
}

interface UseHapticsReturn {
  light: () => Promise<void>;
  medium: () => Promise<void>;
  heavy: () => Promise<void>;
  success: () => Promise<void>;
  error: () => Promise<void>;
  warning: () => Promise<void>;
  selection: () => Promise<void>;
  milestone: () => Promise<void>;
  celebrate: () => Promise<void>;
}

/**
 * Comprehensive haptic feedback hook
 * Provides different feedback types for different interactions.
 * All methods are error-safe — they never throw.
 */
export function useHaptics(): UseHapticsReturn {
  // Light impact - subtle feedback
  const light = useCallback(
    () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    [],
  );

  // Medium impact - standard button press
  const medium = useCallback(
    () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
    [],
  );

  // Heavy impact - important actions
  const heavy = useCallback(
    () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
    [],
  );

  // Success - completion/achievement
  const success = useCallback(
    () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    [],
  );

  // Error - failure/warning
  const error = useCallback(
    () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    [],
  );

  // Warning - caution needed
  const warning = useCallback(
    () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
    [],
  );

  // Selection change - picker/menus
  const selection = useCallback(() => safeHaptic(() => Haptics.selectionAsync()), []);

  // Custom pattern for milestones
  const milestone = useCallback(async () => {
    if (!isHapticsAvailable) return;
    // Triple pulse for milestones — fire-and-forget delayed pulses
    await safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    setTimeout(() => {
      safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    }, 100);
    setTimeout(() => {
      safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    }, 200);
  }, []);

  // Celebration pattern
  const celebrate = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setTimeout(() => {
      safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    }, 150);
  }, []);

  return {
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    milestone,
    celebrate,
  };
}

/**
 * Preset haptic patterns for common interactions.
 * All methods are error-safe — they never throw.
 */
export const haptics = {
  // Navigation
  navigate: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  // Buttons
  buttonPress: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  // Toggles
  toggle: () => safeHaptic(() => Haptics.selectionAsync()),

  // Sliders
  sliderChange: () => safeHaptic(() => Haptics.selectionAsync()),

  // Pull to refresh
  refresh: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  // Swipe actions
  swipe: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  // Delete
  delete: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  // Save
  save: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  // Error
  error: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),

  // Achievement
  achievement: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  // Check-in complete
  checkInComplete: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};

