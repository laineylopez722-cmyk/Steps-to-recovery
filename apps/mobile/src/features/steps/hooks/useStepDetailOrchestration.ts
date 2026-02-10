import { useStepDetailFlowContext } from './useStepDetailFlowContext';
import { useStepDetailContentContext } from './useStepDetailContentContext';
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

  const { toastVisible, toastMessage, toastVariant, dismissToast } = questionFlow;

  const { handleBackToStepOne, handleBackToSteps, mainContentProps } =
    useStepDetailContentContext({
      navigation,
      stepNumber,
      stepData,
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
