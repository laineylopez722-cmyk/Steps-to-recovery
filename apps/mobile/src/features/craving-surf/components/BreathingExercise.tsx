/**
 * Breathing Exercise Component
 *
 * Uses the design system BreathingCircle with 4-7-8 timing pattern.
 * 3 cycles of: 4s inhale → 7s hold → 8s exhale.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { BreathingCircle } from '../../../design-system/components/BreathingCircle';
import { Text } from '../../../design-system/components/Text';
import { ProgressBar } from '../../../design-system/components/ProgressBar';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import type { BreathingState } from '../hooks/useCravingSurf';

interface BreathingExerciseProps {
  breathingState: BreathingState | null;
  isBreathing: boolean;
  onStart: () => void;
  onComplete: () => void;
  testID?: string;
}

const STEP_LABELS: Record<string, string> = {
  inhale: 'Breathe In... 4 seconds',
  hold: 'Hold... 7 seconds',
  exhale: 'Breathe Out... 8 seconds',
};

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
      lineHeight: 22,
    },
    circleContainer: {
      marginVertical: ds.space[6],
      alignItems: 'center' as const,
    },
    stepLabel: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginTop: ds.space[4],
      minHeight: 28,
    },
    progressContainer: {
      width: '100%' as const,
      paddingHorizontal: ds.space[4],
      marginTop: ds.space[4],
    },
    cycleLabel: {
      fontSize: 14,
      color: ds.semantic.text.muted,
      textAlign: 'center' as const,
      marginTop: ds.space[2],
    },
    tapHint: {
      fontSize: 14,
      color: ds.semantic.text.muted,
      textAlign: 'center' as const,
      marginTop: ds.space[3],
      fontStyle: 'italic' as const,
    },
  }) as const;

export function BreathingExercise({
  breathingState,
  isBreathing,
  onStart,
  onComplete,
  testID,
}: BreathingExerciseProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  const progress = breathingState
    ? breathingState.elapsedMs / breathingState.totalMs
    : 0;

  // Auto-start breathing when component mounts
  useEffect(() => {
    if (!isBreathing && !breathingState) {
      onStart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel="Breathing exercise"
      accessibilityRole="timer"
    >
      <Text style={styles.title}>Let&apos;s Breathe Together</Text>
      <Text style={styles.subtitle}>
        Follow the 4-7-8 pattern: breathe in for 4 seconds, hold for 7, breathe out for 8.
      </Text>

      <View style={styles.circleContainer}>
        <BreathingCircle
          size={220}
          cycles={3}
          phaseDuration={4000}
          color={ds.colors.accent}
          autoStart={true}
          onComplete={onComplete}
          testID={testID ? `${testID}-circle` : undefined}
        />
      </View>

      {breathingState && (
        <>
          <Text
            style={styles.stepLabel}
            accessibilityLabel={STEP_LABELS[breathingState.step] || ''}
            accessibilityLiveRegion="polite"
          >
            {STEP_LABELS[breathingState.step]}
          </Text>

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
            />
          </View>

          <Text style={styles.cycleLabel}>
            Cycle {breathingState.cycle} of {breathingState.totalCycles}
          </Text>
        </>
      )}

      {!isBreathing && !breathingState && (
        <Text style={styles.tapHint}>Tap the circle to begin</Text>
      )}
    </View>
  );
}
