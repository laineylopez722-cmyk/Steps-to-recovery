/**
 * CBT Thought Record Screen
 * Cognitive Behavioral Therapy thought record with 7 guided steps.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface CBTStep {
  id: string;
  title: string;
  emoji: string;
  prompt: string;
  placeholder: string;
  type: 'text' | 'slider';
}

const CBT_STEPS: CBTStep[] = [
  {
    id: 'situation',
    title: 'Situation',
    emoji: '📍',
    prompt: 'What happened? Where were you? Who was involved?',
    placeholder: 'Describe the situation...',
    type: 'text',
  },
  {
    id: 'thought',
    title: 'Automatic Thought',
    emoji: '💭',
    prompt: 'What went through your mind?',
    placeholder: 'What were you thinking?',
    type: 'text',
  },
  {
    id: 'emotion',
    title: 'Emotion',
    emoji: '❤️',
    prompt: 'How intense was the emotion? (1 = mild, 10 = overwhelming)',
    placeholder: '',
    type: 'slider',
  },
  {
    id: 'evidence_for',
    title: 'Evidence For',
    emoji: '✅',
    prompt: 'What evidence supports this thought?',
    placeholder: 'What facts back it up?',
    type: 'text',
  },
  {
    id: 'evidence_against',
    title: 'Evidence Against',
    emoji: '❌',
    prompt: 'What evidence contradicts this thought?',
    placeholder: 'What tells a different story?',
    type: 'text',
  },
  {
    id: 'balanced',
    title: 'Balanced Thought',
    emoji: '⚖️',
    prompt: "What's a more balanced way to see this?",
    placeholder: 'A more realistic perspective...',
    type: 'text',
  },
  {
    id: 'new_emotion',
    title: 'New Emotion',
    emoji: '🌱',
    prompt: 'How intense is the emotion now? (1 = mild, 10 = overwhelming)',
    placeholder: '',
    type: 'slider',
  },
];

export function CBTThoughtRecordScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [completed, setCompleted] = useState(false);

  const step = CBT_STEPS[currentStep];
  const isLast = currentStep === CBT_STEPS.length - 1;
  const progress = (currentStep + 1) / CBT_STEPS.length;

  const updateAnswer = useCallback(
    (value: string | number): void => {
      if (!step) return;
      setAnswers((prev) => ({ ...prev, [step.id]: value }));
    },
    [step],
  );

  const canProceed = step
    ? step.type === 'slider' ||
      (typeof answers[step.id] === 'string' && (answers[step.id] as string).trim().length > 0)
    : false;

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

  if (!step && !completed) return <View style={styles.container} />;

  const emotionBefore = (answers['emotion'] as number) || 5;
  const emotionAfter = (answers['new_emotion'] as number) || 5;
  const improvement = emotionBefore - emotionAfter;

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
          <Text style={styles.headerTitle}>Thought Record</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress */}
        {!completed && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {completed ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.completedSection}>
              <Text style={styles.completedEmoji}>⚖️</Text>
              <Text style={styles.completedTitle}>Thought Record Complete</Text>
              {improvement > 0 ? (
                <Text style={styles.completedBody}>
                  Your emotional intensity dropped from {emotionBefore} to {emotionAfter}.
                  Challenging your thoughts is a powerful skill — you just practiced it.
                </Text>
              ) : (
                <Text style={styles.completedBody}>
                  Even when emotions don't shift immediately, the practice of examining thoughts
                  builds awareness over time. You showed real courage doing this.
                </Text>
              )}
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
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepPrompt}>{step.prompt}</Text>
              <Text style={styles.stepCounter}>
                Step {currentStep + 1} of {CBT_STEPS.length}
              </Text>

              {step.type === 'text' ? (
                <TextInput
                  value={(answers[step.id] as string) || ''}
                  onChangeText={updateAnswer}
                  placeholder={step.placeholder}
                  placeholderTextColor={ds.colors.textQuaternary}
                  style={styles.input}
                  multiline
                  autoFocus
                  accessibilityLabel={step.prompt}
                />
              ) : (
                <View style={styles.sliderSection}>
                  <Text style={styles.sliderValue}>{(answers[step.id] as number) || 5}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={(answers[step.id] as number) || 5}
                    onValueChange={updateAnswer}
                    minimumTrackTintColor={ds.colors.accent}
                    maximumTrackTintColor={ds.colors.bgTertiary}
                    thumbTintColor={ds.colors.accent}
                    accessibilityLabel={`Emotion intensity, current value ${(answers[step.id] as number) || 5}`}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Mild</Text>
                    <Text style={styles.sliderLabel}>Overwhelming</Text>
                  </View>
                </View>
              )}

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
                  disabled={!canProceed}
                  style={({ pressed }) => [
                    styles.nextBtn,
                    !canProceed && styles.nextBtnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isLast ? 'Complete' : 'Next step'}
                  accessibilityState={{ disabled: !canProceed }}
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
    progressFill: { height: '100%' as const, backgroundColor: ds.colors.accent, borderRadius: 2 },

    scroll: { flex: 1 },
    content: { paddingHorizontal: ds.space[5], paddingTop: ds.space[6] },

    stepSection: { alignItems: 'center' as const },
    stepEmoji: { fontSize: 48, marginBottom: ds.space[3] },
    stepTitle: { ...ds.typography.h2, color: ds.colors.textPrimary, marginBottom: ds.space[2] },
    stepPrompt: {
      ...ds.typography.body,
      color: ds.colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: ds.space[2],
      lineHeight: 22,
    },
    stepCounter: {
      ...ds.typography.micro,
      color: ds.colors.textQuaternary,
      marginBottom: ds.space[5],
    },

    input: {
      width: '100%' as const,
      minHeight: 120,
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

    sliderSection: {
      width: '100%' as const,
      paddingHorizontal: ds.space[4],
      marginBottom: ds.space[5],
    },
    sliderValue: {
      ...ds.typography.h1,
      color: ds.colors.accent,
      textAlign: 'center' as const,
      marginBottom: ds.space[3],
      fontSize: 48,
    },
    slider: { width: '100%' as const, height: 40 },
    sliderLabels: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: ds.space[1],
    },
    sliderLabel: { ...ds.typography.micro, color: ds.colors.textQuaternary },

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
      ...ds.typography.h2,
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
