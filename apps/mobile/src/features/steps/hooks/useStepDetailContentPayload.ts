import { useStepDetailToastState } from './useStepDetailToastState';
import type { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';

type Params = {
  contentState: 'locked' | 'loading' | 'ready';
  backgroundColor: string;
  stepNumber: number;
  onBackToStepOne: () => void;
  onBackToSteps: () => void;
  mainContentProps: StepDetailMainContentProps;
  questionFlow: ReturnType<typeof useStepDetailQuestionFlow>;
};

export function useStepDetailContentPayload({
  contentState,
  backgroundColor,
  stepNumber,
  onBackToStepOne,
  onBackToSteps,
  mainContentProps,
  questionFlow,
}: Params) {
  const { toastProps } = useStepDetailToastState({
    questionFlow,
  });

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
