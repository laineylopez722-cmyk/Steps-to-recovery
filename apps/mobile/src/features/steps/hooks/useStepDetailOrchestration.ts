import { useStepDetailFlowContext } from './useStepDetailFlowContext';
import { useStepDetailContentContext } from './useStepDetailContentContext';
import { useStepDetailDisplayState } from './useStepDetailDisplayState';
import { useStepDetailContentPayload } from './useStepDetailContentPayload';

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

  const content = useStepDetailContentPayload({
    contentState,
    backgroundColor,
    stepNumber,
    onBackToStepOne: handleBackToStepOne,
    onBackToSteps: handleBackToSteps,
    mainContentProps,
    questionFlow,
  });

  return {
    hasStepData,
    content,
  };
}
