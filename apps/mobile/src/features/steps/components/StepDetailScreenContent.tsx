import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../../design-system';
import { StepDetailLoadingState } from './StepDetailLoadingState';
import { StepLockedState } from './StepLockedState';
import { StepDetailMainContent } from './StepDetailMainContent';

type StepDetailContentState = 'locked' | 'loading' | 'ready';

type StepDetailMainContentProps = React.ComponentProps<typeof StepDetailMainContent>;
type ToastVariant = React.ComponentProps<typeof Toast>['variant'];

interface StepDetailScreenContentProps {
  state: StepDetailContentState;
  backgroundColor: string;
  stepNumber: number;
  onBackToStepOne: () => void;
  onBackToSteps: () => void;
  toastVisible: boolean;
  toastMessage: string;
  toastVariant: ToastVariant;
  onDismissToast: () => void;
  mainContentProps: StepDetailMainContentProps;
}

export function StepDetailScreenContent({
  state,
  backgroundColor,
  stepNumber,
  onBackToStepOne,
  onBackToSteps,
  toastVisible,
  toastMessage,
  toastVariant,
  onDismissToast,
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
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={onDismissToast}
      />

      <StepDetailMainContent {...mainContentProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
