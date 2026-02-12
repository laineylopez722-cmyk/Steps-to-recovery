import { useStepDetailContentContext } from './useStepDetailContentContext';
import { useStepDetailContentPayload } from './useStepDetailContentPayload';
import { useStepDetailContentState } from './useStepDetailContentState';
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

  const contentState = useStepDetailContentState({
    isLocked,
    isLoading,
  });
  const hasStepData = Boolean(stepData);

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
