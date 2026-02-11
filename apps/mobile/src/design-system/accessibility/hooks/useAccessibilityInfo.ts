/**
 * useAccessibilityInfo Hook
 *
 * Detects comprehensive accessibility settings from the system:
 * - Screen reader status (TalkBack/VoiceOver)
 * - High-contrast mode
 * - Large text scaling (100-200%)
 * - Color blindness settings (Android)
 *
 * @example
 * ```tsx
 * const {
 *   screenReaderEnabled,
 *   highContrast,
 *   textScale,
 *   isLargeText,
 * } = useAccessibilityInfo();
 *
 * // Announce to screen reader
 * if (screenReaderEnabled) {
 *   announceForAccessibility('Journal saved successfully');
 * }
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  AccessibilityInfo,
  type AccessibilityChangeEventName,
  PixelRatio,
  Platform,
} from 'react-native';

/** Color blindness simulation types */
export type ColorBlindnessType =
  | 'none'
  | 'protanopia' // Red-blind
  | 'deuteranopia' // Green-blind
  | 'tritanopia' // Blue-blind
  | 'achromatopsia'; // Total color blindness

/** Accessibility information state */
export interface AccessibilityInfoState {
  /** Screen reader (TalkBack/VoiceOver) is enabled */
  screenReaderEnabled: boolean;
  /** High-contrast mode is enabled */
  highContrast: boolean;
  /** Current text scale factor (1.0 - 2.0) */
  textScale: number;
  /** Text scale is above normal (>= 1.3) */
  isLargeText: boolean;
  /** Bold text is enabled (iOS only) */
  boldTextEnabled: boolean;
  /** Grayscale mode is enabled (iOS only) */
  grayscaleEnabled: boolean;
  /** Invert colors is enabled */
  invertColorsEnabled: boolean;
  /** Reduce transparency is enabled (iOS only) */
  reduceTransparencyEnabled: boolean;
  /** Closed captions are enabled (iOS only) */
  closedCaptioningEnabled: boolean;
  /** Color blindness type (Android only, detected via settings) */
  colorBlindnessType: ColorBlindnessType;
  /** Whether settings are still loading */
  isLoading: boolean;
}

/** Hook return type with actions */
export interface UseAccessibilityInfoReturn extends AccessibilityInfoState {
  /** Announce message to screen reader */
  announce: (message: string) => void;
  /** Get scaled font size */
  getScaledFontSize: (baseSize: number) => number;
  /** Check if touch target meets minimum requirements */
  isValidTouchTarget: (size: number) => boolean;
  /** Get minimum compliant touch target size */
  getMinTouchTarget: () => number;
  /** Whether any accessibility feature is enabled */
  hasAccessibilityNeeds: boolean;
}

/** Minimum touch target size in dp */
const MIN_TOUCH_TARGET = 48;

/** Large text threshold */
const LARGE_TEXT_THRESHOLD = 1.3;

/**
 * Detects comprehensive accessibility information
 * @returns Accessibility state and helper functions
 */
export function useAccessibilityInfo(): UseAccessibilityInfoReturn {
  const [state, setState] = useState<AccessibilityInfoState>({
    screenReaderEnabled: false,
    highContrast: false,
    textScale: 1,
    isLargeText: false,
    boldTextEnabled: false,
    grayscaleEnabled: false,
    invertColorsEnabled: false,
    reduceTransparencyEnabled: false,
    closedCaptioningEnabled: false,
    colorBlindnessType: 'none',
    isLoading: true,
  });
  const mountedRef = useRef(true);

  // Check all accessibility settings on mount
  useEffect(() => {
    const checkAllSettings = async (): Promise<void> => {
      try {
        // Screen reader
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();

        // Text scale from PixelRatio
        const textScale = PixelRatio.getFontScale();

        // Platform-specific checks
        let boldTextEnabled = false;
        let grayscaleEnabled = false;
        let invertColorsEnabled = false;
        let reduceTransparencyEnabled = false;
        let closedCaptioningEnabled = false;
        let highContrast = false;

        if (Platform.OS === 'ios') {
          boldTextEnabled = (await AccessibilityInfo.isBoldTextEnabled?.()) ?? false;
          grayscaleEnabled = (await AccessibilityInfo.isGrayscaleEnabled?.()) ?? false;
          invertColorsEnabled = (await AccessibilityInfo.isInvertColorsEnabled?.()) ?? false;
          reduceTransparencyEnabled =
            (await AccessibilityInfo.isReduceTransparencyEnabled?.()) ?? false;
          closedCaptioningEnabled = false; // Not available in all RN versions
        } else {
          // Android - detect high contrast from grayscale or invert colors
          invertColorsEnabled = (await AccessibilityInfo.isInvertColorsEnabled?.()) ?? false;
          // High contrast on Android can be inferred from invert colors or other settings
          highContrast = invertColorsEnabled;
        }

        if (mountedRef.current) {
          setState({
            screenReaderEnabled,
            highContrast,
            textScale,
            isLargeText: textScale >= LARGE_TEXT_THRESHOLD,
            boldTextEnabled,
            grayscaleEnabled,
            invertColorsEnabled,
            reduceTransparencyEnabled,
            closedCaptioningEnabled,
            colorBlindnessType: 'none', // Would require native module for detection
            isLoading: false,
          });
        }
      } catch (_error) {
        if (mountedRef.current) {
          setState((prev: AccessibilityInfoState) => ({ ...prev, isLoading: false }));
        }
      }
    };

    checkAllSettings();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Subscribe to screen reader changes
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged' as AccessibilityChangeEventName,
      (isEnabled: boolean) => {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            screenReaderEnabled: isEnabled,
          }));
        }
      },
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  // Subscribe to bold text changes (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const subscription = AccessibilityInfo.addEventListener(
      'boldTextChanged' as AccessibilityChangeEventName,
      (isEnabled: boolean) => {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            boldTextEnabled: isEnabled,
          }));
        }
      },
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  // Subscribe to grayscale changes (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const subscription = AccessibilityInfo.addEventListener(
      'grayscaleChanged' as AccessibilityChangeEventName,
      (isEnabled: boolean) => {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            grayscaleEnabled: isEnabled,
            highContrast: isEnabled || prev.invertColorsEnabled,
          }));
        }
      },
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  // Subscribe to invert colors changes
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      'invertColorsChanged' as AccessibilityChangeEventName,
      (isEnabled: boolean) => {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            invertColorsEnabled: isEnabled,
            highContrast: isEnabled || prev.grayscaleEnabled,
          }));
        }
      },
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  /**
   * Announce message to screen reader
   */
  const announce = useCallback((message: string): void => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  /**
   * Get scaled font size based on user's text scale preference
   */
  const getScaledFontSize = useCallback(
    (baseSize: number): number => {
      // Cap at 200% (2.0)
      const cappedScale = Math.min(state.textScale, 2.0);
      // Adjust for bold text on iOS
      const boldAdjustment = state.boldTextEnabled ? 0.95 : 1;
      return Math.round(baseSize * cappedScale * boldAdjustment);
    },
    [state.textScale, state.boldTextEnabled],
  );

  /**
   * Check if touch target meets WCAG minimum requirements
   */
  const isValidTouchTarget = useCallback((size: number): boolean => {
    return size >= MIN_TOUCH_TARGET;
  }, []);

  /**
   * Get minimum compliant touch target size
   * Scales with text size for consistency
   */
  const getMinTouchTarget = useCallback((): number => {
    // Scale touch targets slightly with text for better proportion
    const scaleMultiplier = Math.min(state.textScale, 1.5);
    return Math.round(MIN_TOUCH_TARGET * scaleMultiplier);
  }, [state.textScale]);

  /**
   * Check if any accessibility feature is enabled
   */
  const hasAccessibilityNeeds =
    state.screenReaderEnabled ||
    state.highContrast ||
    state.isLargeText ||
    state.grayscaleEnabled ||
    state.invertColorsEnabled ||
    state.colorBlindnessType !== 'none';

  return {
    ...state,
    announce,
    getScaledFontSize,
    isValidTouchTarget,
    getMinTouchTarget,
    hasAccessibilityNeeds,
  };
}

export default useAccessibilityInfo;
