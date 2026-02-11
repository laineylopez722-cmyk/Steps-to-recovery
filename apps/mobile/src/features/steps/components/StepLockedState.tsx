import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, useTheme } from '../../../design-system';

interface StepLockedStateProps {
  stepNumber: number;
  onBackToStepOne: () => void;
  onBackToSteps: () => void;
}

export function StepLockedState({
  stepNumber,
  onBackToStepOne,
  onBackToSteps,
}: StepLockedStateProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.lockedContainer}>
      <MaterialCommunityIcons name="lock" size={48} color={theme.colors.textSecondary} />
      <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 16 }]}>
        Step {stepNumber}
      </Text>
      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12 },
        ]}
      >
        This step is not yet available. Please check back later.
      </Text>
      <View style={{ marginTop: theme.spacing.lg, width: '100%' }}>
        <Button
          title="Back to Step 1"
          variant="primary"
          size="large"
          onPress={onBackToStepOne}
          accessibilityLabel="Back to Step 1"
          accessibilityHint="Opens Step 1 questions"
        />
      </View>
      <View style={{ marginTop: theme.spacing.sm, width: '100%' }}>
        <Button
          title="Back to Steps"
          variant="outline"
          size="large"
          onPress={onBackToSteps}
          accessibilityLabel="Back to steps overview"
          accessibilityHint="Returns to the steps list"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
