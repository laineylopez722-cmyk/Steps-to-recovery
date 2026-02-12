import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text, TextArea, useTheme } from '../../../design-system';
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
    <Card variant="elevated" style={[styles.card, isAnswered && styles.cardAnswered]}>
      {/* Top row: number badge + status */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.numberBadge,
            isAnswered && { backgroundColor: ds.colors.success },
          ]}
        >
          {isAnswered ? (
            <MaterialCommunityIcons name="check" size={14} color={ds.semantic.text.onDark} />
          ) : (
            <Text style={styles.numberText}>{questionNumber}</Text>
          )}
        </View>

        <View style={[styles.statusDot, isAnswered && styles.statusDotAnswered]} />
        <Text style={[theme.typography.caption, styles.statusText]}>
          {isAnswered ? 'Saved' : `${questionNumber}/${totalQuestions}`}
        </Text>
      </View>

      {/* Prompt */}
      <Text style={[theme.typography.body, styles.prompt]}>{prompt}</Text>

      {/* Answer */}
      <TextArea
        label=""
        value={answer}
        onChangeText={onChangeAnswer}
        placeholder="Write honestly — this is your private space."
        containerStyle={styles.textArea}
        minHeight={140}
        maxLength={2000}
        showCharacterCount
        editable={!isSaving}
        accessibilityLabel={`Answer for question ${questionNumber} of ${totalQuestions}`}
        accessibilityHint={`Write your answer to: ${prompt}`}
      />

      <Button
        title={isSaving ? 'Saving...' : isAnswered ? 'Update' : 'Save'}
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
    card: {
      marginHorizontal: 16,
      marginBottom: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      backgroundColor: ds.semantic.surface.card,
    },
    cardAnswered: {
      borderColor: ds.colors.success,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    numberBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.colors.bgTertiary,
    },
    numberText: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      fontWeight: '700',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: ds.colors.textQuaternary,
      marginLeft: 'auto',
    },
    statusDotAnswered: {
      backgroundColor: ds.colors.success,
    },
    statusText: {
      color: ds.colors.textTertiary,
    },
    prompt: {
      color: ds.colors.textPrimary,
      fontWeight: '600',
      lineHeight: 22,
      marginBottom: 12,
    },
    textArea: {
      marginBottom: 12,
    },
  }) as const;
