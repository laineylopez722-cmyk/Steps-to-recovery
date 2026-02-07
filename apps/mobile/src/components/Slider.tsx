import React from 'react';
import RNSlider from '@react-native-community/slider';
import type { SliderProps } from '@react-native-community/slider';

export interface AccessibleSliderProps extends SliderProps {
  /**
   * Accessibility label for the slider
   * Highly recommended for screen reader support
   */
  accessibilityLabel?: string;
  /**
   * Optional hint describing what the slider does
   */
  accessibilityHint?: string;
  /**
   * Unit suffix for the value announcement (e.g., "percent", "out of 10")
   */
  accessibilityUnits?: string;
}

/**
 * Accessible wrapper for @react-native-community/slider
 *
 * Ensures proper accessibility props are passed and provides
 * sensible defaults for screen reader announcements.
 *
 * @example
 * ```tsx
 * <Slider
 *   value={mood}
 *   onValueChange={setMood}
 *   minimumValue={1}
 *   maximumValue={10}
 *   accessibilityLabel="Mood rating"
 *   accessibilityUnits="out of 10"
 * />
 * ```
 */
export function Slider({
  accessibilityLabel,
  accessibilityHint,
  accessibilityUnits,
  ...props
}: AccessibleSliderProps): React.ReactElement {
  const NativeSlider = RNSlider as unknown as React.ComponentType<SliderProps>;

  // Build accessibility value object for enhanced screen reader support
  const accessibilityValue = accessibilityUnits
    ? {
        min: Number(props.minimumValue),
        max: Number(props.maximumValue),
        now: Number(props.value),
        text: `${props.value} ${accessibilityUnits}`,
      }
    : undefined;

  return (
    <NativeSlider
      {...props}
      minimumValue={Number(props.minimumValue)}
      maximumValue={Number(props.maximumValue)}
      value={Number(props.value)}
      step={Number(props.step)}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="adjustable"
      accessibilityValue={accessibilityValue}
    />
  );
}
