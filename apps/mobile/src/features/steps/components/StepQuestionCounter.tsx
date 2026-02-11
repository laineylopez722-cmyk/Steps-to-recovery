import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';

interface StepQuestionCounterProps {
  currentQuestion: number;
  totalQuestions: number;
}

export function StepQuestionCounter({
  currentQuestion,
  totalQuestions,
}: StepQuestionCounterProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.questionCounter}>
      <Text style={[theme.typography.label, { color: theme.colors.textSecondary }]}>
        Question {currentQuestion} of {totalQuestions}
      </Text>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    questionCounter: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      backgroundColor: ds.colors.bgSecondary,
      borderColor: ds.colors.borderSubtle,
    },
  }) as const;
