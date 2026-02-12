import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Divider, Text, TextArea, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface StepQuestionCardProps {
  questionNumber: number;
  prompt: string;
  answer: string;
  totalQuestions: number;
  isAnswered: boolean;
  isSaving: boolean;
  onChangeAnswer: (text: string) => void;
  onSave: () => void;
}

export const StepQuestionCard = React.memo(function StepQuestionCard({
  questionNumber,
  prompt,
  answer,
  totalQuestions,
  isAnswered,
  isSaving,
  onChangeAnswer,
  onSave,
}: StepQuestionCardProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  return (
    <Card variant="elevated" style={[styles.questionCard, isAnswered && styles.questionCardAnswered]}>
      <View style={styles.questionHeaderMeta}>
        <View style={styles.questionMetaLeft}>
          <Text style={[theme.typography.caption, styles.questionMetaText]}>
            Question {questionNumber} of {totalQuestions}
          </Text>
        </View>

        <View style={[styles.statePill, isAnswered && styles.statePillAnswered]}>
          <MaterialCommunityIcons
            name={isAnswered ? 'check-circle' : 'circle-outline'}
            size={14}
            color={isAnswered ? ds.colors.success : ds.colors.textTertiary}
          />
          <Text style={[styles.statePillText, isAnswered && styles.statePillTextAnswered]}>
            {isAnswered ? 'Saved' : 'Draft'}
          </Text>
        </View>
      </View>

      <View style={styles.questionHeader}>
        <View
          style={[
            styles.questionNumber,
            isAnswered
              ? { backgroundColor: ds.colors.success }
              : {
                  backgroundColor: ds.colors.bgSecondary,
                  borderWidth: 2,
                  borderColor: ds.colors.borderSubtle,
                },
          ]}
        >
          {isAnswered ? (
            <MaterialCommunityIcons name="check" size={18} color={ds.semantic.text.onDark} />
          ) : (
            <Text
              style={[theme.typography.bodySmall, { color: ds.colors.textTertiary, fontWeight: '700' }]}
            >
              {questionNumber}
            </Text>
          )}
        </View>

        <Text style={[theme.typography.h3, styles.promptText]}>{prompt}</Text>
      </View>

      <Divider style={styles.questionDivider} />

      <TextArea
        label=""
        value={answer}
        onChangeText={onChangeAnswer}
        placeholder="Write honestly. You can save now and come back later."
        containerStyle={styles.answerTextArea}
        minHeight={170}
        maxLength={2000}
        showCharacterCount
        editable={!isSaving}
        accessibilityLabel={`Answer for question ${questionNumber} of ${totalQuestions}`}
        accessibilityHint={`Write your answer to: ${prompt}`}
      />

      <Button
        title={isSaving ? 'Saving...' : isAnswered ? 'Update Answer' : 'Save Answer'}
        onPress={onSave}
        disabled={!answer.trim() || isSaving}
        loading={isSaving}
        variant="primary"
        fullWidth
        accessibilityLabel={
          isSaving ? 'Saving answer' : isAnswered ? 'Update answer' : 'Save answer'
        }
        accessibilityRole="button"
        accessibilityHint="Save your answer to this step question"
        accessibilityState={{ disabled: !answer.trim() || isSaving }}
      />
    </Card>
  );
});
StepQuestionCard.displayName = 'StepQuestionCard';

const createStyles = (ds: DS) =>
  ({
    questionCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      backgroundColor: ds.semantic.surface.card,
    },
    questionCardAnswered: {
      borderColor: ds.colors.success,
    },
    questionHeaderMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    questionMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    questionMetaText: {
      color: ds.colors.textTertiary,
    },
    statePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: ds.colors.bgSecondary,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
    },
    statePillAnswered: {
      backgroundColor: ds.colors.successMuted,
      borderColor: ds.colors.success,
    },
    statePillText: {
      ...ds.typography.micro,
      color: ds.colors.textTertiary,
      fontWeight: '700',
    },
    statePillTextAnswered: {
      color: ds.colors.success,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    questionNumber: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    promptText: {
      color: ds.colors.textPrimary,
      flex: 1,
      lineHeight: 24,
      fontWeight: '700',
    },
    questionDivider: {
      marginBottom: 14,
    },
    answerTextArea: {
      marginBottom: 14,
    },
  }) as const;
