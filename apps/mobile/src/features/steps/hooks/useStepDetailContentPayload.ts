import { useStepDetailToastState } from './useStepDetailToastState';
import type { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';
import type { StepDetailToastProps } from './useStepDetailToastState';

type BaseContent = {
  backgroundColor: string;
};

type LoadingContent = BaseContent & {
  state: 'loading';
};

type LockedContent = BaseContent & {
  state: 'locked';
  stepNumber: number;
  onBackToStepOne: () => void;
  onBackToSteps: () => void;
};

type ReadyContent = BaseContent & {
  state: 'ready';
  toastProps: StepDetailToastProps;
  mainContentProps: StepDetailMainContentProps;
};

export type StepDetailScreenContentModel = LoadingContent | LockedContent | ReadyContent;

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
}: Params): StepDetailScreenContentModel {
  const { toastProps } = useStepDetailToastState({
    questionFlow,
  });

  if (contentState === 'loading') {
    return {
      state: 'loading',
      backgroundColor,
    };
  }

  if (contentState === 'locked') {
    return {
      state: 'locked',
      backgroundColor,
      stepNumber,
      onBackToStepOne,
      onBackToSteps,
    };
  }

  return {
    state: 'ready',
    backgroundColor,
    toastProps,
    mainContentProps,
  };
}
