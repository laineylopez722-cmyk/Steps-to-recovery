/**
 * useAccessibility Hook
 *
 * Primary hook for accessing accessibility settings and helpers.
 * Provides scaled sizes, animation status, and accessibility checks.
 */

import { useCallback, useMemo } from 'react';
import { useAccessibilityContext } from './AccessibilityProvider';
import {
  scaleSize as scaleSizeUtil,
  calculateContrastRatio,
  getAccessibleTextColor,
  isValidTouchTargetSize,
} from './accessibilityUtils';
import { MIN_CONTRAST_RATIO, MIN_TOUCH_TARGET } from './constants';
import type { ContrastValidation } from './types';

/**
 * Hook return type
 */
export interface UseAccessibilityReturn {
  // Settings
  /** High contrast mode enabled */
  highContrast: boolean;
  /** Reduce motion enabled */
  reduceMotion: boolean;
  /** Large text scale (1.0 - 2.0) */
  largeText: number;
  /** Screen reader currently enabled */
  screenReaderEnabled: boolean;
  /** Bold text enabled (iOS only) */
  boldTextEnabled: boolean;
  /** Grayscale enabled (iOS only) */
  grayscaleEnabled: boolean;
  /** Invert colors enabled */
  invertColorsEnabled: boolean;

  // Helpers
  /** Scale a size based on large text setting */
  scaleSize: (baseSize: number) => number;
  /** Scale font size specifically */
  scaleFontSize: (baseSize: number) => number;
  /** Check if animations should be disabled */
  shouldDisableAnimations: boolean;
  /** Check if high contrast mode is active */
  isHighContrast: boolean;
  /** Get adjusted duration for animations */
  getAnimationDuration: (baseDuration: number) => number;
  /** Validate contrast ratio */
  validateContrast: (
    foreground: string,
    background: string,
    isLargeText?: boolean,
  ) => ContrastValidation;
  /** Get accessible text color for background */
  getAccessibleText: (backgroundColor: string) => string;
  /** Check if touch target size is valid */
  isValidTouchTarget: (size: number) => boolean;
  /** Ensure minimum touch target size */
  ensureTouchTarget: (size: number) => number;
  /** Format announcement for screen reader */
  formatAnnouncement: (text: string) => string;
  /** Whether settings are still loading */
  isLoading: boolean;

  // Actions
  /** Toggle high contrast mode */
  toggleHighContrast: () => Promise<void>;
  /** Toggle reduce motion */
  toggleReduceMotion: () => Promise<void>;
  /** Set text scale */
  setTextScale: (scale: number) => Promise<void>;
}

/**
 * Hook for accessing accessibility features and helpers
 * @returns Accessibility settings and utility functions
 */
export function useAccessibility(): UseAccessibilityReturn {
  const context = useAccessibilityContext();

  const {
    highContrast,
    reduceMotion,
    largeText,
    screenReaderEnabled,
    boldTextEnabled,
    grayscaleEnabled,
    invertColorsEnabled,
    toggleHighContrast,
    toggleReduceMotion,
    setTextScale,
    isLoading,
  } = context;

  /**
   * Scale a size based on the current text scale setting
   */
  const scaleSize = useCallback(
    (baseSize: number): number => scaleSizeUtil(baseSize, largeText),
    [largeText],
  );

  /**
   * Scale font size with additional adjustment for bold text
   */
  const scaleFontSize = useCallback(
    (baseSize: number): number => {
      const scaled = scaleSizeUtil(baseSize, largeText);
      // Bold text can appear larger, so slightly reduce size to compensate
      return boldTextEnabled ? Math.round(scaled * 0.95) : scaled;
    },
    [largeText, boldTextEnabled],
  );

  /**
   * Whether animations should be completely disabled
   */
  const shouldDisableAnimations = useMemo(
    () => reduceMotion || screenReaderEnabled,
    [reduceMotion, screenReaderEnabled],
  );

  /**
   * Whether high contrast mode is active
   */
  const isHighContrast = useMemo(
    () => highContrast || grayscaleEnabled,
    [highContrast, grayscaleEnabled],
  );

  /**
   * Get adjusted animation duration
   * Returns 0 if animations should be disabled
   */
  const getAnimationDuration = useCallback(
    (baseDuration: number): number => {
      if (shouldDisableAnimations) {
        return 0;
      }
      if (reduceMotion) {
        // Reduce animation duration when reduced motion is preferred
        return Math.max(50, baseDuration * 0.5);
      }
      return baseDuration;
    },
    [shouldDisableAnimations, reduceMotion],
  );

  /**
   * Validate contrast ratio between colors
   */
  const validateContrast = useCallback(
    (foreground: string, background: string, isLargeText = false): ContrastValidation => {
      const ratio = calculateContrastRatio(foreground, background);
      const requiredRatio = isLargeText ? 4.5 : MIN_CONTRAST_RATIO;

      return {
        valid: ratio >= requiredRatio,
        ratio: Math.round(ratio * 100) / 100,
        requiredRatio,
        suggestedColor: ratio < requiredRatio ? getAccessibleTextColor(background) : undefined,
      };
    },
    [],
  );

  /**
   * Get accessible text color for a background
   */
  const getAccessibleText = useCallback(
    (backgroundColor: string): string => getAccessibleTextColor(backgroundColor),
    [],
  );

  /**
   * Check if touch target size meets WCAG requirements
   */
  const isValidTouchTarget = useCallback(
    (size: number): boolean => isValidTouchTargetSize(size),
    [],
  );

  /**
   * Ensure minimum touch target size
   */
  const ensureTouchTarget = useCallback(
    (size: number): number => Math.max(size, MIN_TOUCH_TARGET),
    [],
  );

  /**
   * Format text for screen reader announcement
   */
  const formatAnnouncement = useCallback((text: string): string => {
    // Add pauses for better comprehension
    return text
      .replace(/(\d+)(\s*)(days?|hours?|minutes?|seconds?|weeks?|months?|years?)/gi, '$1 $3')
      .replace(/\.{3}/g, ', ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space in camelCase
      .trim();
  }, []);

  return {
    // Settings
    highContrast,
    reduceMotion,
    largeText,
    screenReaderEnabled,
    boldTextEnabled,
    grayscaleEnabled,
    invertColorsEnabled,

    // Helpers
    scaleSize,
    scaleFontSize,
    shouldDisableAnimations,
    isHighContrast,
    getAnimationDuration,
    validateContrast,
    getAccessibleText,
    isValidTouchTarget,
    ensureTouchTarget,
    formatAnnouncement,
    isLoading,

    // Actions
    toggleHighContrast,
    toggleReduceMotion,
    setTextScale,
  };
}

export default useAccessibility;
