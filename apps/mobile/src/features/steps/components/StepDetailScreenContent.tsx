import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../../design-system';
import { StepDetailLoadingState } from './StepDetailLoadingState';
import { StepLockedState } from './StepLockedState';
import { StepDetailMainContent } from './StepDetailMainContent';
import type { StepDetailToastProps } from '../hooks/useStepDetailToastState';

type StepDetailContentState = 'locked' | 'loading' | 'ready';

type StepDetailMainContentProps = React.ComponentProps<typeof StepDetailMainContent>;

interface StepDetailScreenContentProps {
  state: StepDetailContentState;
  backgroundColor: string;
  stepNumber: number;
  onBackToStepOne: () => void;
  onBackToSteps: () => void;
  toastProps: StepDetailToastProps;
  mainContentProps: StepDetailMainContentProps;
}

export function StepDetailScreenContent({
  state,
  backgroundColor,
  stepNumber,
  onBackToStepOne,
  onBackToSteps,
  toastProps,
  mainContentProps,
}: StepDetailScreenContentProps): React.ReactElement {
  if (state === 'loading') {
    return <StepDetailLoadingState />;
  }

  if (state === 'locked') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
        <StepLockedState
          stepNumber={stepNumber}
          onBackToStepOne={onBackToStepOne}
          onBackToSteps={onBackToSteps}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <Toast {...toastProps} />

      <StepDetailMainContent {...mainContentProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
