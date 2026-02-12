import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Text, TextArea, useTheme } from '../../../design-system';
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
  // Current question
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

// Map step numbers to key theme tags
const STEP_THEMES: Record<number, string[]> = {
  1: ['powerlessness', 'honesty', 'surrender', 'acceptance'],
  2: ['hope', 'faith', 'open-mindedness', 'willingness'],
  3: ['decision', 'trust', 'letting go', 'courage'],
  4: ['self-examination', 'honesty', 'courage', 'thoroughness'],
  5: ['admission', 'vulnerability', 'trust', 'integrity'],
  6: ['willingness', 'readiness', 'awareness', 'humility'],
  7: ['humility', 'surrender', 'asking', 'acceptance'],
  8: ['accountability', 'willingness', 'forgiveness', 'listing'],
  9: ['amends', 'responsibility', 'courage', 'healing'],
  10: ['inventory', 'promptness', 'growth', 'awareness'],
  11: ['prayer', 'meditation', 'connection', 'guidance'],
  12: ['service', 'awakening', 'carrying the message', 'practice'],
};

export function StepSingleQuestionView({
  stepNumber,
  title,
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
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  // Find current question data
  const questionItems = useMemo(
    () => listItems.filter((item): item is Extract<StepListItem, { type: 'question' }> => item.type === 'question'),
    [listItems],
  );
  const currentQ = questionItems.find((q) => q.questionNumber === currentVisibleQuestion);
  const currentAnswer = answers[currentVisibleQuestion] || '';
  const isAnswered = answeredQuestionNumbers.has(currentVisibleQuestion);
  const isSaving = savingQuestion === currentVisibleQuestion;

  const hasPrev = currentVisibleQuestion > 1;
  const hasNext = currentVisibleQuestion < totalQuestions;

  const themes = STEP_THEMES[stepNumber] ?? [];

  // Scroll to top on question change
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentVisibleQuestion]);

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentVisibleQuestion, fadeAnim]);

  const goPrev = useCallback(() => {
    if (hasPrev) onJumpToQuestion(currentVisibleQuestion - 1);
  }, [hasPrev, currentVisibleQuestion, onJumpToQuestion]);

  const goNext = useCallback(() => {
    if (hasNext) onJumpToQuestion(currentVisibleQuestion + 1);
  }, [hasNext, currentVisibleQuestion, onJumpToQuestion]);

  // Auto-save on question change (save current answer if dirty)
  const prevQuestionRef = useRef(currentVisibleQuestion);
  useEffect(() => {
    const prev = prevQuestionRef.current;
    if (prev !== currentVisibleQuestion && answers[prev]?.trim()) {
      onSaveAnswer(prev);
    }
    prevQuestionRef.current = currentVisibleQuestion;
  }, [currentVisibleQuestion, answers, onSaveAnswer]);

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
        {/* Step header */}
        <View style={styles.stepHeader}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color={ds.colors.textSecondary} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={[theme.typography.h2, styles.stepTitle]}>
              Step {stepNumber}
            </Text>
            <Text style={[theme.typography.body, styles.stepDescription]} numberOfLines={3}>
              {description}
            </Text>
          </View>
        </View>

        {/* Key Themes */}
        {themes.length > 0 && (
          <View style={styles.themesCard}>
            <Text style={[theme.typography.label, styles.themesLabel]}>Key Themes</Text>
            <View style={styles.themeTags}>
              {themes.map((t) => (
                <View key={t} style={styles.themeTag}>
                  <Text style={styles.themeTagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={[theme.typography.body, styles.progressLeft]}>
              Question {currentVisibleQuestion} of {safeTotal}
            </Text>
            <Text style={[theme.typography.caption, styles.progressRight]}>
              {answeredCount} answered • {progressPercent}% complete
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
          {currentQ?.sectionTitle && (
            <Text style={[theme.typography.caption, styles.sectionLabel]}>
              {currentQ.sectionTitle.toUpperCase()}
            </Text>
          )}

          {/* Prompt */}
          {currentQ && (
            <Text style={[theme.typography.h3, styles.prompt]}>
              {currentQ.prompt}
            </Text>
          )}

          {/* Answer input */}
          <TextArea
            label=""
            value={currentAnswer}
            onChangeText={(text) => onAnswerChange(currentVisibleQuestion, text)}
            placeholder="Write your answer..."
            containerStyle={styles.textArea}
            minHeight={160}
            maxLength={2000}
            showCharacterCount
            editable={!isSaving}
            accessibilityLabel={`Answer for question ${currentVisibleQuestion}`}
          />

          <Text style={[theme.typography.caption, styles.autoSaveHint]}>
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

    // Step header
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: ds.space[4],
      gap: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ds.colors.bgSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    headerTextWrap: {
      flex: 1,
    },
    stepTitle: {
      color: ds.colors.textPrimary,
      fontWeight: '700',
      marginBottom: 4,
    },
    stepDescription: {
      color: ds.colors.textSecondary,
      lineHeight: 22,
    },

    // Themes
    themesCard: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      padding: 14,
      marginBottom: ds.space[4],
    },
    themesLabel: {
      color: ds.colors.textPrimary,
      fontWeight: '700',
      marginBottom: 10,
    },
    themeTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    themeTag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: ds.colors.accentMuted,
      borderWidth: 1,
      borderColor: ds.colors.accent,
    },
    themeTagText: {
      ...ds.typography.caption,
      color: ds.colors.accent,
      fontWeight: '600',
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
      marginBottom: 16,
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
