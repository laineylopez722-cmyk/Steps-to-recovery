import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Check if haptics are available (not on web/simulator)
const isHapticsAvailable = Platform.OS !== 'web';

/**
 * Comprehensive haptic feedback hook
 * Provides different feedback types for different interactions
 */
export function useHaptics() {
  // Light impact - subtle feedback
  const light = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Medium impact - standard button press
  const medium = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Heavy impact - important actions
  const heavy = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  // Success - completion/achievement
  const success = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Error - failure/warning
  const error = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  // Warning - caution needed
  const warning = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  // Selection change - picker/menus
  const selection = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.selectionAsync();
  }, []);

  // Custom pattern for milestones
  const milestone = useCallback(async () => {
    if (!isHapticsAvailable) return;
    // Triple pulse for milestones
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);
  }, []);

  // Celebration pattern
  const celebrate = useCallback(async () => {
    if (!isHapticsAvailable) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
 * Preset haptic patterns for common interactions
 */
export const haptics = {
  // Navigation
  navigate: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Buttons
  buttonPress: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Toggles
  toggle: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.selectionAsync();
  },

  // Sliders
  sliderChange: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.selectionAsync();
  },

  // Pull to refresh
  refresh: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Swipe actions
  swipe: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Delete
  delete: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // Save
  save: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Error
  error: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
