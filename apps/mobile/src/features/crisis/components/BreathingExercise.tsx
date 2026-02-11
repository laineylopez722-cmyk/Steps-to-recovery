/**
 * BreathingExercise - Animated Box Breathing Circle
 *
 * Guides users through box breathing (4-4-4-4) during crisis moments.
 * Uses the useBreathingExercise hook for timing and haptic feedback.
 *
 * WCAG AAA compliant with large touch targets (≥48dp).
 */

import React, { useCallback, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useBreathingExercise } from '../../../hooks/useBreathingExercise';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { spacing, radius } from '../../../design-system/tokens/modern';
import { Text } from '../../../design-system/components/Text';

interface BreathingExerciseProps {
  /** Number of breathing cycles (0 = infinite) */
  targetCycles?: number;
  /** Called when all cycles complete */
  onComplete?: () => void;
}

export function BreathingExercise({
  targetCycles = 4,
  onComplete,
}: BreathingExerciseProps): ReactElement {
  const styles = useThemedStyles(createStyles);

  const {
    phase,
    phaseLabel,
    progress,
    cycleCount,
    isRunning,
    isPaused,
    toggle,
    reset,
  } = useBreathingExercise({
    pattern: 'box',
    targetCycles,
    hapticFeedback: true,
    onComplete,
  });

  const handleToggle = useCallback((): void => {
    toggle();
  }, [toggle]);

  const handleReset = useCallback((): void => {
    reset();
  }, [reset]);

  // Animate circle scale based on breathing phase
  const circleStyle = useAnimatedStyle(() => {
    let targetScale = 1;
    if (phase === 'inhale') {
      targetScale = 1 + progress * 0.4;
    } else if (phase === 'hold-in') {
      targetScale = 1.4;
    } else if (phase === 'exhale') {
      targetScale = 1.4 - progress * 0.4;
    } else if (phase === 'hold-out') {
      targetScale = 1;
    }

    return {
      transform: [
        {
          scale: withTiming(targetScale, {
            duration: 100,
            easing: Easing.inOut(Easing.ease),
          }),
        },
      ],
    };
  }, [phase, progress]);

  const isIdle = phase === 'idle' && !isRunning && !isPaused;
  const statusText = isIdle
    ? 'Tap to begin'
    : isPaused
      ? 'Paused — tap to resume'
      : phaseLabel;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text
        style={styles.title}
        accessibilityRole="header"
      >
        Box Breathing
      </Text>
      <Text style={styles.description}>
        Breathe in 4 seconds, hold 4, out 4, hold 4
      </Text>

      {/* Breathing Circle */}
      <Pressable
        onPress={handleToggle}
        style={styles.circleWrapper}
        accessibilityLabel={
          isIdle
            ? 'Start breathing exercise'
            : isPaused
              ? 'Resume breathing exercise'
              : `${phaseLabel}. Tap to pause`
        }
        accessibilityRole="button"
        accessibilityHint="Controls the breathing exercise animation"
      >
        <View style={styles.circleOuter}>
          <Animated.View style={[styles.circleInner, circleStyle]}>
            <Text style={styles.phaseText}>{statusText}</Text>
            {isRunning && (
              <Text style={styles.cycleText}>
                Cycle {cycleCount + 1}{targetCycles > 0 ? ` of ${targetCycles}` : ''}
              </Text>
            )}
          </Animated.View>
        </View>
      </Pressable>

      {/* Reset button (only when running or paused) */}
      {!isIdle && (
        <Pressable
          onPress={handleReset}
          style={styles.resetButton}
          accessibilityLabel="Reset breathing exercise"
          accessibilityRole="button"
        >
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      alignItems: 'center' as const,
      paddingVertical: spacing[4],
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
      marginBottom: spacing[1],
      textAlign: 'center' as const,
    },
    description: {
      fontSize: 15,
      color: ds.semantic.text.tertiary,
      marginBottom: spacing[4],
      textAlign: 'center' as const,
    },
    circleWrapper: {
      minWidth: 48,
      minHeight: 48,
    },
    circleOuter: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: ds.semantic.emergency?.calmMuted ?? 'rgba(100, 160, 140, 0.15)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    circleInner: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: ds.semantic.emergency?.calmSubtle ?? 'rgba(100, 160, 140, 0.25)',
      borderWidth: 3,
      borderColor: ds.semantic.emergency?.calm ?? '#6B9B8D',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    phaseText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
    },
    cycleText: {
      fontSize: 13,
      color: ds.semantic.text.tertiary,
      marginTop: spacing[1],
      textAlign: 'center' as const,
    },
    resetButton: {
      marginTop: spacing[3],
      paddingVertical: spacing[1.5],
      paddingHorizontal: spacing[3],
      borderRadius: radius.full,
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    resetText: {
      fontSize: 15,
      color: ds.semantic.text.tertiary,
      textDecorationLine: 'underline' as const,
    },
  }) as const;
