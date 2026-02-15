import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text, TextArea } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type { StepListItem } from '../utils/stepListItems';

export interface StepSingleQuestionViewProps {
  // Step meta
  stepNumber: number;
  title: string;
  principle: string;
  description: string;
  // Progress
  totalQuestions: number;
  answeredCount: number;
  progressPercent: number;
  // Current question (initial)
  currentVisibleQuestion: number;
  answeredQuestionNumbers: Set<number>;
  answers: Record<number, string>;
  savingQuestion: number | null;
  // Actions
  onAnswerChange: (questionNumber: number, text: string) => void;
  onSaveAnswer: (questionNumber: number) => void;
  onJumpToQuestion: (questionNumber: number) => void;
  onReviewAnswers: () => void;
  // Guidance
  showGuidance: boolean;
  onToggleGuidance: () => void;
  // Question data
  listItems: StepListItem[];
}

// Simple plain-language hints for each question to help users understand what's being asked
function getQuestionHint(prompt: string): string | null {
  const lower = prompt.toLowerCase();

  if (lower.includes('powerlessness mean to you'))
    return 'In your own words, describe what it feels like to not be able to stop.';
  if (lower.includes("couldn't control"))
    return 'Think about a specific moment when you knew something was wrong.';
  if (lower.includes('promised yourself'))
    return "A time you said 'never again' but it happened anyway.";
  if (lower.includes('control or limit'))
    return 'Any rules you set for yourself — and how they went.';
  if (lower.includes('rules did you make'))
    return 'Things like "only on weekends" or "just one" — did they work?';
  if (lower.includes('mental obsession'))
    return 'The thoughts that run through your head right before you use.';
  if (lower.includes('rational decisions'))
    return 'How has your thinking changed because of addiction?';
  if (lower.includes('things while using'))
    return 'Things you did that the sober you would never have done.';
  if (lower.includes('willpower alone'))
    return 'What proves that wanting to stop isn\'t enough?';
  if (lower.includes('denial'))
    return 'Ways you told yourself (or others) it wasn\'t that bad.';
  if (lower.includes('physical health'))
    return 'Any health problems caused or made worse by using.';
  if (lower.includes('withdrawal'))
    return 'What happens to your body when you stop or can\'t get it.';
  if (lower.includes('physical risks'))
    return 'Dangerous situations you put yourself in.';
  if (lower.includes('sleep') || lower.includes('appetite') || lower.includes('energy'))
    return 'Basic daily functioning — how has it been affected?';
  if (lower.includes('medical') || lower.includes('dental'))
    return 'Health care you put off or avoided because of using.';
  if (lower.includes('accidents') || lower.includes('injuries') || lower.includes('hospital'))
    return 'Physical harm that resulted from your addiction.';
  if (lower.includes('spouse') || lower.includes('partner'))
    return 'How your closest relationship has been impacted.';
  if (lower.includes('children'))
    return 'The effect on your kids, if you have any.';

  // Generic fallback — don't show a hint if we can't add value
  return null;
}

export function StepSingleQuestionView({
  stepNumber: _stepNumber,
  description,
  totalQuestions,
  answeredCount,
  progressPercent,
  currentVisibleQuestion,
  answeredQuestionNumbers,
  answers,
  savingQuestion,
  onAnswerChange,
  onSaveAnswer,
  onJumpToQuestion,
  onReviewAnswers,
  listItems,
}: StepSingleQuestionViewProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const scrollRef = useRef<ScrollView>(null);

  // Own current question state — initialized from prop but self-managed
  const [currentQ, setCurrentQ] = useState(currentVisibleQuestion);

  // Find question data
  const questionItems = useMemo(
    () => listItems.filter((item): item is Extract<StepListItem, { type: 'question' }> => item.type === 'question'),
    [listItems],
  );
  const question = questionItems.find((q) => q.questionNumber === currentQ);
  const currentAnswer = answers[currentQ] || '';
  const isAnswered = answeredQuestionNumbers.has(currentQ);
  const isSaving = savingQuestion === currentQ;

  const hasPrev = currentQ > 1;
  const hasNext = currentQ < totalQuestions;

  const hint = question ? getQuestionHint(question.prompt) : null;

  // Scroll to top on question change
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentQ]);

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentQ, fadeAnim]);

  // Auto-save previous answer when navigating away
  const prevQRef = useRef(currentQ);
  useEffect(() => {
    const prev = prevQRef.current;
    if (prev !== currentQ && answers[prev]?.trim()) {
      onSaveAnswer(prev);
    }
    prevQRef.current = currentQ;
  }, [currentQ, answers, onSaveAnswer]);

  const goPrev = useCallback(() => {
    if (hasPrev) {
      const next = currentQ - 1;
      setCurrentQ(next);
      onJumpToQuestion(next);
    }
  }, [hasPrev, currentQ, onJumpToQuestion]);

  const goNext = useCallback(() => {
    if (hasNext) {
      const next = currentQ + 1;
      setCurrentQ(next);
      onJumpToQuestion(next);
    }
  }, [hasNext, currentQ, onJumpToQuestion]);

  const safeTotal = Math.max(1, totalQuestions);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step description (no back button — nav bar handles that) */}
        <Text style={[ds.semantic.typography.body, styles.stepDescription]} numberOfLines={3}>
          {description}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={[ds.semantic.typography.body, styles.progressLeft]}>
              Question {currentQ} of {safeTotal}
            </Text>
            <Text style={[ds.semantic.typography.sectionLabel, styles.progressRight]}>
              {answeredCount} answered • {progressPercent}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(0, Math.min(progressPercent, 100))}%` },
              ]}
            />
          </View>
        </View>

        {/* Question card */}
        <Animated.View style={[styles.questionArea, { opacity: fadeAnim }]}>
          {/* Section label */}
          {question?.sectionTitle && (
            <Text style={[ds.semantic.typography.sectionLabel, styles.sectionLabel]}>
              {question.sectionTitle.toUpperCase()}
            </Text>
          )}

          {/* Prompt */}
          {question && (
            <Text style={[ds.typography.h3, styles.prompt]}>
              {question.prompt}
            </Text>
          )}

          {/* Plain-language hint */}
          {hint && (
            <View style={styles.hintRow}>
              <Feather name="info" size={14} color={ds.colors.textTertiary} />
              <Text style={[ds.semantic.typography.sectionLabel, styles.hintText]}>{hint}</Text>
            </View>
          )}

          {/* Answer input */}
          <TextArea
            label=""
            value={currentAnswer}
            onChangeText={(text) => onAnswerChange(currentQ, text)}
            placeholder="Write your answer..."
            containerStyle={styles.textArea}
            minHeight={160}
            maxLength={2000}
            showCharacterCount
            editable={!isSaving}
            accessibilityLabel={`Answer for question ${currentQ}`}
          />

          <Text style={[ds.semantic.typography.sectionLabel, styles.autoSaveHint]}>
            {isSaving ? 'Saving...' : isAnswered ? '✓ Saved' : 'Auto-saves when you move to next question'}
          </Text>
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <Pressable
            onPress={goPrev}
            disabled={!hasPrev}
            style={[styles.navButton, !hasPrev && styles.navButtonDisabled]}
            accessibilityLabel="Previous question"
            accessibilityRole="button"
          >
            <Feather name="chevron-left" size={20} color={hasPrev ? ds.colors.textPrimary : ds.colors.textQuaternary} />
            <Text style={[styles.navText, !hasPrev && styles.navTextDisabled]}>Prev</Text>
          </Pressable>

          <Pressable
            onPress={hasNext ? goNext : onReviewAnswers}
            style={styles.navButtonPrimary}
            accessibilityLabel={hasNext ? 'Next question' : 'Review all answers'}
            accessibilityRole="button"
          >
            <Text style={styles.navTextPrimary}>
              {hasNext ? 'Next' : 'Review'}
            </Text>
            <Feather name={hasNext ? 'chevron-right' : 'check-circle'} size={20} color={ds.semantic.text.onDark} />
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (ds: DS) =>
  ({
    root: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingTop: ds.space[3],
      paddingBottom: 40,
    },

    // Step description
    stepDescription: {
      color: ds.colors.textSecondary,
      lineHeight: 22,
      marginBottom: ds.space[4],
    },

    // Progress
    progressSection: {
      marginBottom: ds.space[4],
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLeft: {
      color: ds.colors.textPrimary,
      fontWeight: '700',
    },
    progressRight: {
      color: ds.colors.textTertiary,
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: ds.colors.bgTertiary,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: ds.colors.accent,
    },

    // Question
    questionArea: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      padding: 16,
      marginBottom: ds.space[4],
    },
    sectionLabel: {
      color: ds.colors.accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    prompt: {
      color: ds.colors.textPrimary,
      fontWeight: '700',
      lineHeight: 28,
      marginBottom: 12,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.md,
      padding: 10,
      marginBottom: 14,
    },
    hintText: {
      color: ds.colors.textSecondary,
      flex: 1,
      lineHeight: 18,
    },
    textArea: {
      marginBottom: 8,
    },
    autoSaveHint: {
      color: ds.colors.textTertiary,
      textAlign: 'center',
    },

    // Navigation
    navRow: {
      flexDirection: 'row',
      gap: 12,
    },
    navButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: ds.radius.lg,
      backgroundColor: ds.colors.bgSecondary,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
    },
    navButtonDisabled: {
      opacity: 0.3,
    },
    navText: {
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      fontWeight: '600',
    },
    navTextDisabled: {
      color: ds.colors.textQuaternary,
    },
    navButtonPrimary: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: ds.radius.lg,
      backgroundColor: ds.colors.accent,
    },
    navTextPrimary: {
      ...ds.typography.body,
      color: ds.semantic.text.onDark,
      fontWeight: '700',
    },
  }) as const;
