import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type Params = {
  contentState: 'locked' | 'loading' | 'ready';
  backgroundColor: string;
  stepNumber: number;
  onBackToStepOne: () => void;
  onBackToSteps: () => void;
  toastVisible: boolean;
  toastMessage: string;
  toastVariant: ToastVariant;
  onDismissToast: () => void;
  mainContentProps: StepDetailMainContentProps;
};

export function useStepDetailScreenContentProps({
  contentState,
  backgroundColor,
  stepNumber,
  onBackToStepOne,
  onBackToSteps,
  toastVisible,
  toastMessage,
  toastVariant,
  onDismissToast,
  mainContentProps,
}: Params) {
  return {
    state: contentState,
    backgroundColor,
    stepNumber,
    onBackToStepOne,
    onBackToSteps,
    toastVisible,
    toastMessage,
    toastVariant,
    onDismissToast,
    mainContentProps,
  };
}
