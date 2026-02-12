import { useCurrentUserId } from './useCurrentUserId';
import { useScreenBackgroundColor } from './useScreenBackgroundColor';
import { useStepDetailMeta } from './useStepDetailMeta';
import { useStepDetailNavigation } from './useStepDetailNavigation';
import { useStepDetailRouteParams } from './useStepDetailRouteParams';
import { useSaveStepAnswer, useStepWork } from './useStepWork';

export function useStepDetailScreenSetup() {
  const navigation = useStepDetailNavigation();
  const { stepNumber, initialQuestion } = useStepDetailRouteParams();
  const userId = useCurrentUserId();
  const backgroundColor = useScreenBackgroundColor();

  // Inlined from useStepDetailData
  const { stepData, isLocked } = useStepDetailMeta(stepNumber);
  const { questions, isLoading } = useStepWork(userId, stepNumber);
  const { saveAnswer } = useSaveStepAnswer(userId);

  return {
    navigation,
    stepNumber,
    initialQuestion,
    backgroundColor,
    stepData,
    isLocked,
    questions,
    isLoading,
    saveAnswer,
  };
}
