import type { ComponentProps } from 'react';
import type { Toast } from '../../../design-system';
import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';
import { useStepScreenAnimation } from './useStepScreenAnimation';
import { useStepDetailNavigationActions } from './useStepDetailNavigationActions';
import { useStepGuidanceToggle } from './useStepGuidanceToggle';
import { useStepDetailMainContentProps } from './useStepDetailMainContentProps';
import { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import { useStepDetailScreenSetup } from './useStepDetailScreenSetup';

// --- Types previously in useStepDetailToastState / useStepDetailContentPayload ---

export type StepDetailToastProps = Pick<
  ComponentProps<typeof Toast>,
  'visible' | 'message' | 'variant' | 'onDismiss'
>;

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

// --- Render model ---

export function useStepDetailRenderModel() {
  const {
    navigation,
    stepNumber,
    initialQuestion,
    backgroundColor,
    stepData,
    isLocked,
    questions,
    isLoading,
    saveAnswer,
  } = useStepDetailScreenSetup();

  const questionFlow = useStepDetailQuestionFlow({
    stepData,
    questions,
    stepNumber,
    initialQuestion,
    saveAnswer,
  });

  // Inlined from useStepDetailContentContext
  const { fadeAnim, slideAnim } = useStepScreenAnimation();

  const { handleReviewAnswers, handleBackToStepOne, handleBackToSteps } =
    useStepDetailNavigationActions({ navigation, stepNumber });

  const { showGuidance, handleToggleGuidance } = useStepGuidanceToggle();

  const mainContentProps = useStepDetailMainContentProps({
    animation: { fadeAnim, slideAnim },
    step: { stepNumber, stepData },
    interactions: {
      showGuidance,
      onToggleGuidance: handleToggleGuidance,
      onContinue: questionFlow.scrollToFirstUnanswered,
      onReviewAnswers: handleReviewAnswers,
    },
    questionFlow,
  });

  const contentState = isLocked ? 'locked' : isLoading ? 'loading' : 'ready';
  const hasStepData = Boolean(stepData);

  // Build discriminated content payload
  let content: StepDetailScreenContentModel;

  if (contentState === 'loading') {
    content = { state: 'loading', backgroundColor };
  } else if (contentState === 'locked') {
    content = {
      state: 'locked',
      backgroundColor,
      stepNumber,
      onBackToStepOne: handleBackToStepOne,
      onBackToSteps: handleBackToSteps,
    };
  } else {
    content = {
      state: 'ready',
      backgroundColor,
      toastProps: {
        visible: questionFlow.toastVisible,
        message: questionFlow.toastMessage,
        variant: questionFlow.toastVariant,
        onDismiss: questionFlow.dismissToast,
      },
      mainContentProps,
    };
  }

  return {
    hasStepData,
    content,
  };
}
