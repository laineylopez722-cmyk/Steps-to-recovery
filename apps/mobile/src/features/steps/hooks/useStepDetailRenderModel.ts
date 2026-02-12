import { useStepDetailContentContext } from './useStepDetailContentContext';
import { useStepDetailContentPayload } from './useStepDetailContentPayload';
import { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import { useStepDetailScreenSetup } from './useStepDetailScreenSetup';

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

  const { handleBackToStepOne, handleBackToSteps, mainContentProps } = useStepDetailContentContext({
    navigation,
    stepNumber,
    stepData,
    questionFlow,
  });

  const contentState = isLocked ? 'locked' : isLoading ? 'loading' : 'ready';
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
