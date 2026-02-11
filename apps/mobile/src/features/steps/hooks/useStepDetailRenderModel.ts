import { useStepDetailContentContext } from './useStepDetailContentContext';
import { useStepDetailContentPayload } from './useStepDetailContentPayload';
import { useStepDetailDisplayState } from './useStepDetailDisplayState';
import { useStepDetailFlowContext } from './useStepDetailFlowContext';

export function useStepDetailRenderModel() {
  const { navigation, stepNumber, backgroundColor, stepData, isLocked, isLoading, questionFlow } =
    useStepDetailFlowContext();

  const { handleBackToStepOne, handleBackToSteps, mainContentProps } = useStepDetailContentContext({
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
