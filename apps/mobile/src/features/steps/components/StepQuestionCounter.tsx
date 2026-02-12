import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface StepQuestionCounterProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestionNumbers: Set<number>;
  onJumpToQuestion: (questionNumber: number) => void;
}

export function StepQuestionCounter({
  currentQuestion,
  totalQuestions,
  answeredQuestionNumbers,
  onJumpToQuestion,
}: StepQuestionCounterProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const safeTotal = Math.max(0, totalQuestions);
  const answeredCount = answeredQuestionNumbers.size;
  const progressPercent = safeTotal > 0 ? Math.round((answeredCount / safeTotal) * 100) : 0;

  return (
    <View style={styles.questionCounter}>
      <View style={styles.headerRow}>
        <Text style={[theme.typography.label, { color: ds.colors.textSecondary }]}>
          Question {currentQuestion} of {safeTotal}
        </Text>
        <Text style={[theme.typography.caption, { color: ds.colors.accent, fontWeight: '600' }]}>
          {progressPercent}% complete
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {Array.from({ length: safeTotal }).map((_, index) => {
          const questionNumber = index + 1;
          const isCurrent = questionNumber === currentQuestion;
          const isAnswered = answeredQuestionNumbers.has(questionNumber);

          return (
            <Pressable
              key={questionNumber}
              onPress={() => onJumpToQuestion(questionNumber)}
              style={[
                styles.questionChip,
                isCurrent && styles.questionChipCurrent,
                !isCurrent && isAnswered && styles.questionChipAnswered,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Jump to question ${questionNumber}`}
              accessibilityHint={
                isCurrent
                  ? 'Current question'
                  : isAnswered
                    ? 'Answered question'
                    : 'Unanswered question'
              }
            >
              <Text
                style={[
                  styles.questionChipText,
                  isCurrent && styles.questionChipTextCurrent,
                  !isCurrent && isAnswered && styles.questionChipTextAnswered,
                ]}
              >
                {questionNumber}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    questionCounter: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: ds.semantic.surface.card,
      borderColor: ds.colors.borderSubtle,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: ds.colors.bgTertiary,
      overflow: 'hidden',
      marginBottom: 10,
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: ds.colors.accent,
    },
    chipRow: {
      gap: 8,
      paddingRight: 8,
    },
    questionChip: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      backgroundColor: ds.colors.bgSecondary,
    },
    questionChipCurrent: {
      backgroundColor: ds.colors.accent,
      borderColor: ds.colors.accent,
    },
    questionChipAnswered: {
      backgroundColor: ds.colors.successMuted,
      borderColor: ds.colors.success,
    },
    questionChipText: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      fontWeight: '600',
    },
    questionChipTextCurrent: {
      color: ds.semantic.text.onDark,
    },
    questionChipTextAnswered: {
      color: ds.colors.success,
    },
  }) as const;
