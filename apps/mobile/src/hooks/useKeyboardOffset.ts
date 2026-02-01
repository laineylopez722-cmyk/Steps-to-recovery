/**
 * Hook to calculate dynamic keyboard avoiding offset for Android
 *
 * Android gesture navigation can have varying heights (20-120+ pixels)
 * This hook provides a safe default that works across devices
 */

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Returns the appropriate keyboard vertical offset for KeyboardAvoidingView
 *
 * iOS: Uses default padding behavior (offset not needed)
 * Android: Calculates offset based on safe area insets
 *
 * @returns Keyboard vertical offset value
 */
export function useKeyboardOffset(): number {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    return 0;
  }

  // Android: Account for status bar + potential gesture navigation
  // Base offset + bottom inset (covers gesture nav bar)
  const baseOffset = 24;
  const bottomInset = insets.bottom || 0;

  // On devices with gesture navigation, bottom inset can be 20-48dp
  // On devices with button navigation, it's typically 0
  // Add extra padding to ensure content isn't covered
  return baseOffset + Math.max(bottomInset, 20);
}

/**
 * Returns keyboard avoiding behavior based on platform
 */
export function useKeyboardBehavior(): 'padding' | 'height' | 'position' {
  // iOS: padding works best
  // Android: height is more reliable with gesture navigation
  return Platform.OS === 'ios' ? 'padding' : 'height';
}

/**
 * Combined hook for keyboard avoiding configuration
 */
export function useKeyboardConfig(): {
  behavior: 'padding' | 'height' | 'position';
  keyboardVerticalOffset: number;
} {
  return {
    behavior: useKeyboardBehavior(),
    keyboardVerticalOffset: useKeyboardOffset(),
  };
}
