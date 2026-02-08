import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Divider, Text, TextArea, useTheme } from '../../../design-system';

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

export function StepQuestionCard({
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

  return (
    <Card variant="elevated" style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View
          style={[
            styles.questionNumber,
            isAnswered
              ? { backgroundColor: theme.colors.primary }
              : {
                  backgroundColor: theme.colors.surface,
                  borderWidth: 2,
                  borderColor: theme.colors.border,
                },
          ]}
        >
          {isAnswered ? (
            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          ) : (
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, fontWeight: '600' },
              ]}
            >
              {questionNumber}
            </Text>
          )}
        </View>
        <Text style={[theme.typography.h3, { color: theme.colors.text, flex: 1, lineHeight: 24 }]}> 
          {prompt}
        </Text>
      </View>

      <Divider style={styles.questionDivider} />

      <TextArea
        label=""
        value={answer}
        onChangeText={onChangeAnswer}
        placeholder="Take your time to reflect and write your answer here. Remember, this is a private space for your personal growth."
        containerStyle={styles.answerTextArea}
        minHeight={150}
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
        accessibilityLabel={isSaving ? 'Saving answer' : isAnswered ? 'Update answer' : 'Save answer'}
        accessibilityRole="button"
        accessibilityHint="Save your answer to this step question"
        accessibilityState={{ disabled: !answer.trim() || isSaving }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  questionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  questionDivider: {
    marginBottom: 16,
  },
  answerTextArea: {
    marginBottom: 16,
  },
});
