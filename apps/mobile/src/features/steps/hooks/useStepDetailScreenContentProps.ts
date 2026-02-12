import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';
import type { StepDetailToastProps } from './useStepDetailToastState';

type Params = {
  contentState: 'locked' | 'loading' | 'ready';
  backgroundColor: string;
  stepNumber: number;
  onBackToStepOne: () => void;
  onBackToSteps: () => void;
  toastProps: StepDetailToastProps;
  mainContentProps: StepDetailMainContentProps;
};

export function useStepDetailScreenContentProps({
  contentState,
  backgroundColor,
  stepNumber,
  onBackToStepOne,
  onBackToSteps,
  toastProps,
  mainContentProps,
}: Params) {
  return {
    state: contentState,
    backgroundColor,
    stepNumber,
    onBackToStepOne,
    onBackToSteps,
    toastProps,
    mainContentProps,
  };
}
