/**
 * Craving Rating Slider Component
 *
 * A 1-10 rating slider with color gradient (green to red) and full accessibility.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text } from '../../../design-system/components/Text';
import { Button } from '../../../design-system/components/Button';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';

interface CravingRatingSliderProps {
  title: string;
  subtitle?: string;
  initialValue?: number;
  onSubmit: (rating: number) => void;
  submitLabel?: string;
  testID?: string;
}

const RATING_COLORS = [
  '#22C55E', // 1 - green
  '#4ADE80', // 2
  '#86EFAC', // 3
  '#BEF264', // 4
  '#FDE047', // 5 - yellow
  '#FBBF24', // 6
  '#FB923C', // 7
  '#F87171', // 8
  '#EF4444', // 9
  '#DC2626', // 10 - red
];

function getRatingColor(rating: number): string {
  const idx = Math.max(0, Math.min(9, Math.round(rating) - 1));
  return RATING_COLORS[idx];
}

function getRatingLabel(rating: number): string {
  if (rating <= 2) return 'Mild';
  if (rating <= 4) return 'Moderate';
  if (rating <= 6) return 'Strong';
  if (rating <= 8) return 'Very Strong';
  return 'Overwhelming';
}

const createStyles = (ds: DS) =>
  ({
    container: {
      alignItems: 'center' as const,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[6],
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: ds.space[2],
    },
    subtitle: {
      fontSize: 15,
      color: ds.semantic.text.muted,
      textAlign: 'center' as const,
      marginBottom: ds.space[6],
    },
    ratingDisplay: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[3],
    },
    ratingNumber: {
      fontSize: 40,
      fontWeight: '800' as const,
      color: '#FFFFFF',
    },
    ratingLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginBottom: ds.space[5],
    },
    sliderContainer: {
      width: '100%' as const,
      paddingHorizontal: ds.space[2],
      marginBottom: ds.space[3],
    },
    slider: {
      width: '100%' as const,
      height: 48,
    },
    scaleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      width: '100%' as const,
      paddingHorizontal: ds.space[2],
      marginBottom: ds.space[6],
    },
    scaleLabel: {
      fontSize: 13,
      color: ds.semantic.text.muted,
    },
    buttonContainer: {
      width: '100%' as const,
      paddingHorizontal: ds.space[2],
    },
  }) as const;

export function CravingRatingSlider({
  title,
  subtitle,
  initialValue = 5,
  onSubmit,
  submitLabel = 'Continue',
  testID,
}: CravingRatingSliderProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const [rating, setRating] = useState(initialValue);
  const roundedRating = Math.round(rating);
  const color = getRatingColor(roundedRating);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View
        style={[styles.ratingDisplay, { backgroundColor: color }]}
        accessibilityLabel={`Craving intensity: ${roundedRating} out of 10, ${getRatingLabel(roundedRating)}`}
        accessibilityRole="text"
      >
        <Text style={styles.ratingNumber}>{roundedRating}</Text>
      </View>

      <Text style={[styles.ratingLabel, { color }]}>{getRatingLabel(roundedRating)}</Text>

      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={rating}
          onValueChange={setRating}
          minimumTrackTintColor={color}
          maximumTrackTintColor={ds.semantic.text.muted}
          thumbTintColor={color}
          accessibilityLabel={`Craving intensity slider, current value ${roundedRating}`}
          accessibilityRole="adjustable"
          accessibilityHint="Slide to rate your craving from 1 to 10"
          testID={testID ? `${testID}-slider` : undefined}
        />
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleLabel}>1 — Mild</Text>
        <Text style={styles.scaleLabel}>10 — Overwhelming</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={() => onSubmit(roundedRating)}
          accessibilityLabel={`${submitLabel}, craving rated ${roundedRating} out of 10`}
          accessibilityRole="button"
          testID={testID ? `${testID}-submit` : undefined}
        >
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}
