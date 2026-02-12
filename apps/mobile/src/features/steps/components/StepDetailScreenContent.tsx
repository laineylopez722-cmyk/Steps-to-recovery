import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../../design-system';
import { StepDetailLoadingState } from './StepDetailLoadingState';
import { StepLockedState } from './StepLockedState';
import { StepDetailMainContent } from './StepDetailMainContent';
import type { StepDetailScreenContentModel } from '../hooks/useStepDetailContentPayload';

interface StepDetailScreenContentProps {
  content: StepDetailScreenContentModel;
}

export function StepDetailScreenContent({ content }: StepDetailScreenContentProps): React.ReactElement {
  if (content.state === 'loading') {
    return <StepDetailLoadingState />;
  }

  if (content.state === 'locked') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: content.backgroundColor }]} edges={['bottom']}>
        <StepLockedState
          stepNumber={content.stepNumber}
          onBackToStepOne={content.onBackToStepOne}
          onBackToSteps={content.onBackToSteps}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: content.backgroundColor }]} edges={['bottom']}>
      <Toast {...content.toastProps} />

      <StepDetailMainContent {...content.mainContentProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
