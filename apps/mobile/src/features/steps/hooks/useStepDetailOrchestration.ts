import { useStepScreenAnimation } from './useStepScreenAnimation';
import { useStepDetailMainContentModel } from './useStepDetailMainContentModel';
import { useStepDetailInteractions } from './useStepDetailInteractions';
import { useStepDetailFlowContext } from './useStepDetailFlowContext';
import { useStepDetailScreenContentProps } from './useStepDetailScreenContentProps';
import { useStepDetailDisplayState } from './useStepDetailDisplayState';

export function useStepDetailOrchestration() {
  const {
    navigation,
    stepNumber,
    backgroundColor,
    stepData,
    isLocked,
    isLoading,
    questionFlow,
  } = useStepDetailFlowContext();

  const { fadeAnim, slideAnim } = useStepScreenAnimation();

  const { toastVisible, toastMessage, toastVariant, dismissToast, scrollToFirstUnanswered } =
    questionFlow;

  const {
    handleReviewAnswers,
    handleBackToStepOne,
    handleBackToSteps,
    showGuidance,
    handleToggleGuidance,
  } = useStepDetailInteractions({
    navigation,
    stepNumber,
  });

  const mainContentProps = useStepDetailMainContentModel({
    animation: {
      fadeAnim,
      slideAnim,
    },
    step: {
      stepNumber,
      stepData,
    },
    interactions: {
      showGuidance,
      onToggleGuidance: handleToggleGuidance,
      onContinue: scrollToFirstUnanswered,
      onReviewAnswers: handleReviewAnswers,
    },
    questionFlow,
  });

  const { hasStepData, contentState } = useStepDetailDisplayState({
    stepData,
    isLocked,
    isLoading,
  });

  const content = useStepDetailScreenContentProps({
    contentState,
    backgroundColor,
    stepNumber,
    onBackToStepOne: handleBackToStepOne,
    onBackToSteps: handleBackToSteps,
    toastVisible,
    toastMessage,
    toastVariant,
    onDismissToast: dismissToast,
    mainContentProps,
  });

  return {
    hasStepData,
    content,
  };
}
