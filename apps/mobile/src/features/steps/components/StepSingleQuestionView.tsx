import React, { useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text, TextArea, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { StepGuidanceCard } from './StepGuidanceCard';
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
  showGuidance,
  onToggleGuidance,
  listItems,
}: StepSingleQuestionViewProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const scrollRef = useRef<ScrollView>(null);

  // Find current question data from listItems
  const questionItems = listItems.filter((item): item is Extract<StepListItem, { type: 'question' }> => item.type === 'question');
  const currentQ = questionItems.find((q) => q.questionNumber === currentVisibleQuestion);
  const currentAnswer = answers[currentVisibleQuestion] || '';
  const isAnswered = answeredQuestionNumbers.has(currentVisibleQuestion);
  const isSaving = savingQuestion === currentVisibleQuestion;

  const hasPrev = currentVisibleQuestion > 1;
  const hasNext = currentVisibleQuestion < totalQuestions;

  // Scroll to top when question changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentVisibleQuestion]);

  // Fade animation on question change
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

  const safeTotal = Math.max(1, totalQuestions);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Sticky top bar: progress + navigation */}
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <Text style={[theme.typography.caption, styles.stepLabel]}>
            Step {stepNumber}
          </Text>
          <Text style={[theme.typography.caption, styles.progressLabel]}>
            {answeredCount}/{safeTotal} answered
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

        {/* Question position dots — scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dotRow}
        >
          {Array.from({ length: safeTotal }).map((_, i) => {
            const qNum = i + 1;
            const isCurrent = qNum === currentVisibleQuestion;
            const qAnswered = answeredQuestionNumbers.has(qNum);
            return (
              <Pressable
                key={qNum}
                onPress={() => onJumpToQuestion(qNum)}
                style={[
                  styles.dot,
                  isCurrent && styles.dotCurrent,
                  !isCurrent && qAnswered && styles.dotAnswered,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Go to question ${qNum}`}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable content area */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question number + nav */}
          <View style={styles.questionNav}>
            <Pressable
              onPress={goPrev}
              disabled={!hasPrev}
              style={[styles.navArrow, !hasPrev && styles.navArrowDisabled]}
              accessibilityLabel="Previous question"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={hasPrev ? ds.colors.textPrimary : ds.colors.textQuaternary}
              />
            </Pressable>

            <View style={styles.questionCenter}>
              <Text style={[theme.typography.caption, styles.questionLabel]}>
                QUESTION
              </Text>
              <Text style={[theme.typography.h1, styles.questionNumber]}>
                {currentVisibleQuestion}
              </Text>
              <Text style={[theme.typography.caption, styles.questionOf]}>
                of {safeTotal}
              </Text>
            </View>

            <Pressable
              onPress={goNext}
              disabled={!hasNext}
              style={[styles.navArrow, !hasNext && styles.navArrowDisabled]}
              accessibilityLabel="Next question"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={hasNext ? ds.colors.textPrimary : ds.colors.textQuaternary}
              />
            </Pressable>
          </View>

          {/* Prompt */}
          {currentQ && (
            <Text style={[theme.typography.h3, styles.prompt]}>
              {currentQ.prompt}
            </Text>
          )}

          {/* Guidance (collapsible) */}
          <StepGuidanceCard
            showGuidance={showGuidance}
            description={description}
            onToggle={onToggleGuidance}
          />

          {/* Answer area */}
          <Card variant="elevated" style={styles.answerCard}>
            <TextArea
              label=""
              value={currentAnswer}
              onChangeText={(text) => onAnswerChange(currentVisibleQuestion, text)}
              placeholder="Take your time. Write honestly."
              containerStyle={styles.textArea}
              minHeight={180}
              maxLength={2000}
              showCharacterCount
              editable={!isSaving}
              accessibilityLabel={`Answer for question ${currentVisibleQuestion}`}
            />

            <Button
              title={isSaving ? 'Saving...' : isAnswered ? 'Update' : 'Save'}
              onPress={() => onSaveAnswer(currentVisibleQuestion)}
              disabled={!currentAnswer.trim() || isSaving}
              loading={isSaving}
              variant="primary"
              fullWidth
              accessibilityLabel={isSaving ? 'Saving' : isAnswered ? 'Update answer' : 'Save answer'}
            />
          </Card>

          {/* Bottom actions */}
          <View style={styles.bottomActions}>
            {hasNext && (
              <Button
                title={isAnswered ? 'Next Question →' : 'Skip →'}
                onPress={goNext}
                variant="outline"
                fullWidth
                accessibilityLabel={isAnswered ? 'Go to next question' : 'Skip to next question'}
              />
            )}

            {!hasNext && (
              <Button
                title="Review All Answers"
                onPress={onReviewAnswers}
                variant="secondary"
                fullWidth
                accessibilityLabel="Review all answers"
              />
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (ds: DS) =>
  ({
    root: {
      flex: 1,
    },
    // Top bar
    topBar: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.borderSubtle,
    },
    topBarRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    stepLabel: {
      color: ds.colors.textTertiary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    progressLabel: {
      color: ds.colors.accent,
      fontWeight: '700',
    },
    progressTrack: {
      height: 3,
      borderRadius: 999,
      backgroundColor: ds.colors.bgTertiary,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: ds.colors.accent,
    },
    dotRow: {
      gap: 4,
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: ds.colors.bgTertiary,
    },
    dotCurrent: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: ds.colors.accent,
    },
    dotAnswered: {
      backgroundColor: ds.colors.success,
    },
    // Scroll area
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 40,
    },
    // Question nav
    questionNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    navArrow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.colors.bgSecondary,
    },
    navArrowDisabled: {
      opacity: 0.3,
    },
    questionCenter: {
      flex: 1,
      alignItems: 'center',
    },
    questionLabel: {
      color: ds.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    questionNumber: {
      color: ds.colors.accent,
      fontWeight: '700',
    },
    questionOf: {
      color: ds.colors.textTertiary,
      marginTop: 2,
    },
    // Prompt
    prompt: {
      color: ds.colors.textPrimary,
      fontWeight: '700',
      lineHeight: 28,
      textAlign: 'center',
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    // Answer
    answerCard: {
      marginTop: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
    },
    textArea: {
      marginBottom: 12,
    },
    // Bottom
    bottomActions: {
      marginTop: 14,
      gap: 10,
    },
  }) as const;
