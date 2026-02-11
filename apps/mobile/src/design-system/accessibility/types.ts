/**
 * Accessibility Type Definitions
 *
 * Shared types for the accessibility system.
 */

/** User accessibility settings persisted in storage */
export interface AccessibilitySettings {
  /** High contrast mode enabled */
  highContrast: boolean;
  /** Reduce motion preference */
  reduceMotion: boolean;
  /** Text scale factor (1.0 - 2.0) */
  largeText: number;
  /** Screen reader (TalkBack/VoiceOver) is enabled */
  screenReaderEnabled: boolean;
  /** Bold text enabled (iOS only) */
  boldTextEnabled: boolean;
  /** Grayscale mode enabled (iOS only) */
  grayscaleEnabled: boolean;
  /** Invert colors enabled */
  invertColorsEnabled: boolean;
}

/** RGB color values */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** Contrast validation result */
export interface ContrastValidation {
  valid: boolean;
  ratio: number;
  requiredRatio: number;
  suggestedColor?: string;
}

/** Touch target validation result */
export interface TouchTargetValidation {
  valid: boolean;
  currentSize: number;
  minimumSize: number;
  suggestedSize: number;
}
