/**
 * GroundingExercise - 5-4-3-2-1 Guided Grounding
 *
 * Interactive, step-by-step grounding exercise that guides users
 * through the 5-4-3-2-1 senses technique during crisis moments.
 *
 * WCAG AAA compliant with large touch targets (≥48dp).
 */

import React, { useState, useCallback, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { spacing, radius } from '../../../design-system/tokens/modern';
import { Text } from '../../../design-system/components/Text';
import { logger } from '../../../utils/logger';

interface GroundingStep {
  count: number;
  sense: string;
  prompt: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const GROUNDING_STEPS: GroundingStep[] = [
  {
    count: 5,
    sense: 'See',
    prompt: 'Look around and name 5 things you can see right now.',
    icon: 'visibility',
  },
  {
    count: 4,
    sense: 'Touch',
    prompt: 'Notice 4 things you can physically feel. The ground beneath you, fabric, air...',
    icon: 'touch-app',
  },
  {
    count: 3,
    sense: 'Hear',
    prompt: 'Listen carefully for 3 sounds around you. Near and far.',
    icon: 'hearing',
  },
  {
    count: 2,
    sense: 'Smell',
    prompt: 'Identify 2 things you can smell. Fresh air, coffee, anything nearby.',
    icon: 'air',
  },
  {
    count: 1,
    sense: 'Taste',
    prompt: 'Notice 1 thing you can taste. Your last drink, toothpaste, or just your breath.',
    icon: 'restaurant',
  },
];

interface GroundingExerciseProps {
  /** Called when all 5 steps are completed */
  onComplete?: () => void;
}

export function GroundingExercise({ onComplete }: GroundingExerciseProps): ReactElement {
  const styles = useThemedStyles(createStyles);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const triggerHaptic = useCallback(async (): Promise<void> => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // Haptics not available
    }
  }, []);

  const handleNext = useCallback(async (): Promise<void> => {
    await triggerHaptic();

    if (currentStep < GROUNDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCompleted(true);
      logger.info('Grounding exercise completed');
      onComplete?.();
    }
  }, [currentStep, triggerHaptic, onComplete]);

  const handleRestart = useCallback((): void => {
    setCurrentStep(0);
    setCompleted(false);
  }, []);

  if (completed) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <View style={styles.completeContainer}>
          <MaterialIcons
            name="check-circle"
            size={48}
            color={styles.successColor.color}
          />
          <Text style={styles.completeTitle}>
            You did it
          </Text>
          <Text style={styles.completeSubtitle}>
            You're grounded in the present moment. The crisis will pass.
          </Text>
          <Pressable
            onPress={handleRestart}
            style={styles.restartButton}
            accessibilityLabel="Restart grounding exercise"
            accessibilityRole="button"
          >
            <Text style={styles.restartText}>Do it again</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  const step = GROUNDING_STEPS[currentStep];

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text
        style={styles.title}
        accessibilityRole="header"
      >
        5-4-3-2-1 Grounding
      </Text>
      <Text style={styles.description}>
        Use your senses to anchor yourself in the present
      </Text>

      {/* Progress indicators */}
      <View
        style={styles.progressRow}
        accessibilityLabel={`Step ${currentStep + 1} of 5`}
        accessibilityRole="progressbar"
      >
        {GROUNDING_STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Current step */}
      <Animated.View
        key={currentStep}
        entering={FadeInDown.duration(300)}
        style={styles.stepCard}
      >
        <View style={styles.stepBadge}>
          <MaterialIcons
            name={step.icon}
            size={32}
            color={styles.badgeIconColor.color}
          />
        </View>
        <Text style={styles.stepCount}>{step.count}</Text>
        <Text style={styles.stepSense}>
          things you can {step.sense.toLowerCase()}
        </Text>
        <Text style={styles.stepPrompt}>{step.prompt}</Text>
      </Animated.View>

      {/* Next/Done button */}
      <Pressable
        onPress={() => void handleNext()}
        style={styles.nextButton}
        accessibilityLabel={
          currentStep < GROUNDING_STEPS.length - 1
            ? `I found ${step.count}. Next sense.`
            : `I found ${step.count}. Finish exercise.`
        }
        accessibilityRole="button"
        accessibilityHint="Move to the next grounding step"
      >
        <Text style={styles.nextButtonText}>
          {currentStep < GROUNDING_STEPS.length - 1
            ? `I found ${step.count} ✓`
            : 'Done ✓'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      paddingVertical: spacing[4],
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: spacing[1],
    },
    description: {
      fontSize: 15,
      color: ds.semantic.text.tertiary,
      textAlign: 'center' as const,
      marginBottom: spacing[3],
    },
    progressRow: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: spacing[1],
      marginBottom: spacing[4],
    },
    progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: ds.colors.borderSubtle ?? 'rgba(255,255,255,0.15)',
    },
    progressDotActive: {
      backgroundColor: ds.semantic.emergency?.calm ?? '#6B9B8D',
    },
    stepCard: {
      alignItems: 'center' as const,
      backgroundColor: ds.semantic.surface.card,
      borderRadius: radius.lg,
      padding: spacing[4],
      marginBottom: spacing[4],
    },
    stepBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ds.semantic.emergency?.calmMuted ?? 'rgba(100, 160, 140, 0.15)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: spacing[3],
    },
    badgeIconColor: {
      color: ds.semantic.emergency?.calm ?? '#6B9B8D',
    },
    stepCount: {
      fontSize: 48,
      fontWeight: '700' as const,
      color: ds.semantic.emergency?.calm ?? '#6B9B8D',
      marginBottom: spacing[1],
    },
    stepSense: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
      marginBottom: spacing[2],
      textAlign: 'center' as const,
    },
    stepPrompt: {
      fontSize: 15,
      color: ds.semantic.text.secondary ?? ds.semantic.text.tertiary,
      textAlign: 'center' as const,
      lineHeight: 22,
    },
    nextButton: {
      backgroundColor: ds.semantic.emergency?.calm ?? '#6B9B8D',
      borderRadius: radius.lg,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[4],
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 48,
    },
    nextButtonText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    // Completion state
    completeContainer: {
      alignItems: 'center' as const,
      padding: spacing[4],
    },
    successColor: {
      color: '#30D158',
    },
    completeTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: ds.semantic.text.primary,
      marginTop: spacing[3],
      marginBottom: spacing[2],
      textAlign: 'center' as const,
    },
    completeSubtitle: {
      fontSize: 15,
      color: ds.semantic.text.tertiary,
      textAlign: 'center' as const,
      lineHeight: 22,
      marginBottom: spacing[4],
    },
    restartButton: {
      borderRadius: radius.full,
      paddingVertical: spacing[1.5],
      paddingHorizontal: spacing[3],
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    restartText: {
      fontSize: 15,
      color: ds.semantic.text.tertiary,
      textDecorationLine: 'underline' as const,
    },
  }) as const;
