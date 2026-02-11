/**
 * Grounding Exercise Screen
 * 5-4-3-2-1 sensory grounding technique with step-by-step guidance.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface GroundingStep {
  count: number;
  sense: string;
  emoji: string;
  prompt: string;
  placeholder: string;
}

const STEPS: GroundingStep[] = [
  {
    count: 5,
    sense: 'See',
    emoji: '👀',
    prompt: 'Name 5 things you can see right now',
    placeholder: 'e.g., my phone, a lamp, the ceiling...',
  },
  {
    count: 4,
    sense: 'Touch',
    emoji: '✋',
    prompt: 'Name 4 things you can touch or feel',
    placeholder: 'e.g., the chair, my clothes, cool air...',
  },
  {
    count: 3,
    sense: 'Hear',
    emoji: '👂',
    prompt: 'Name 3 things you can hear',
    placeholder: 'e.g., traffic, my breathing, a fan...',
  },
  {
    count: 2,
    sense: 'Smell',
    emoji: '👃',
    prompt: 'Name 2 things you can smell',
    placeholder: 'e.g., coffee, fresh air...',
  },
  {
    count: 1,
    sense: 'Taste',
    emoji: '👅',
    prompt: 'Name 1 thing you can taste',
    placeholder: 'e.g., mint, water...',
  },
];

export function GroundingExerciseScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ''));
  const [completed, setCompleted] = useState(false);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const progress = (currentStep + 1) / STEPS.length;

  const handleNext = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isLast) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCompleted(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLast]);

  const handleBack = useCallback((): void => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const updateAnswer = useCallback(
    (text: string): void => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentStep] = text;
        return next;
      });
    },
    [currentStep],
  );

  if (!step && !completed) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={26} color={ds.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>5-4-3-2-1 Grounding</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress bar */}
        {!completed && (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]}
            />
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {completed ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.completedSection}>
              <Text style={styles.completedEmoji}>🌿</Text>
              <Text style={styles.completedTitle}>You're grounded</Text>
              <Text style={styles.completedBody}>
                You brought yourself back to the present moment. That takes real strength. You can
                use this exercise anytime cravings or anxiety feel overwhelming.
              </Text>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.doneBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View
              key={currentStep}
              entering={FadeInDown.duration(300)}
              style={styles.stepSection}
            >
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
              <Text style={styles.stepCount}>{step.count}</Text>
              <Text style={styles.stepPrompt}>{step.prompt}</Text>

              <TextInput
                value={answers[currentStep]}
                onChangeText={updateAnswer}
                placeholder={step.placeholder}
                placeholderTextColor={ds.colors.textQuaternary}
                style={styles.input}
                multiline
                autoFocus
                accessibilityLabel={step.prompt}
              />

              <View style={styles.navRow}>
                {currentStep > 0 && (
                  <Pressable
                    onPress={handleBack}
                    style={({ pressed }) => [styles.backNavBtn, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Previous step"
                  >
                    <Text style={styles.backNavText}>Back</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleNext}
                  disabled={!answers[currentStep]?.trim()}
                  style={({ pressed }) => [
                    styles.nextBtn,
                    !answers[currentStep]?.trim() && styles.nextBtnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isLast ? 'Complete exercise' : 'Next step'}
                  accessibilityState={{ disabled: !answers[currentStep]?.trim() }}
                >
                  <Text style={styles.nextBtnText}>{isLast ? 'Complete' : 'Next'}</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: { flex: 1, backgroundColor: ds.colors.bgPrimary },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
    },
    backBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    headerTitle: {
      ...ds.typography.body,
      fontWeight: '600' as const,
      color: ds.colors.textPrimary,
    },
    headerSpacer: { width: 44 },

    progressTrack: {
      height: 4,
      backgroundColor: ds.colors.bgTertiary,
      marginHorizontal: ds.space[4],
      borderRadius: 2,
      overflow: 'hidden' as const,
    },
    progressFill: {
      height: '100%' as const,
      backgroundColor: ds.colors.accent,
      borderRadius: 2,
    },

    scroll: { flex: 1 },
    content: { paddingHorizontal: ds.space[5], paddingTop: ds.space[8] },

    stepSection: { alignItems: 'center' as const },
    stepEmoji: { fontSize: 56, marginBottom: ds.space[3] },
    stepCount: {
      ...ds.typography.h1,
      color: ds.colors.accent,
      fontSize: 64,
      marginBottom: ds.space[2],
    },
    stepPrompt: {
      ...ds.typography.h3,
      color: ds.colors.textPrimary,
      textAlign: 'center' as const,
      marginBottom: ds.space[6],
    },

    input: {
      width: '100%' as const,
      minHeight: 100,
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      textAlignVertical: 'top' as const,
      marginBottom: ds.space[5],
    },

    navRow: { flexDirection: 'row' as const, gap: ds.space[3], justifyContent: 'center' as const },
    backNavBtn: {
      paddingHorizontal: ds.space[6],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.full,
      backgroundColor: ds.colors.bgTertiary,
    },
    backNavText: { ...ds.typography.body, color: ds.colors.textSecondary },
    nextBtn: {
      paddingHorizontal: ds.space[8],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.full,
      backgroundColor: ds.colors.accent,
    },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { ...ds.typography.body, fontWeight: '600' as const, color: ds.colors.text },
    btnPressed: { opacity: 0.8 },

    completedSection: { alignItems: 'center' as const, paddingTop: ds.space[6] },
    completedEmoji: { fontSize: 64, marginBottom: ds.space[4] },
    completedTitle: {
      ...ds.typography.h1,
      color: ds.colors.textPrimary,
      marginBottom: ds.space[3],
    },
    completedBody: {
      ...ds.typography.body,
      color: ds.colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 24,
      marginBottom: ds.space[8],
    },
    doneBtn: {
      backgroundColor: ds.colors.accent,
      paddingHorizontal: ds.space[10],
      paddingVertical: ds.space[4],
      borderRadius: ds.radius.full,
    },
    doneBtnText: { ...ds.typography.body, fontWeight: '600' as const, color: ds.colors.text },
  }) as const;
