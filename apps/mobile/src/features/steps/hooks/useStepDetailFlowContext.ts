import { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import { useStepDetailScreenSetup } from './useStepDetailScreenSetup';

export function useStepDetailFlowContext() {
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

  return {
    navigation,
    stepNumber,
    backgroundColor,
    stepData,
    isLocked,
    isLoading,
    questionFlow,
  };
}
