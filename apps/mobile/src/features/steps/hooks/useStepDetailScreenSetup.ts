import { useCurrentUserId } from './useCurrentUserId';
import { useScreenBackgroundColor } from './useScreenBackgroundColor';
import { useStepDetailData } from './useStepDetailData';
import { useStepDetailNavigation } from './useStepDetailNavigation';
import { useStepDetailRouteParams } from './useStepDetailRouteParams';

type StepDetailDataParams = {
  userId: string;
  stepNumber: number;
};

export function useStepDetailScreenSetup() {
  const navigation = useStepDetailNavigation();
  const { stepNumber, initialQuestion } = useStepDetailRouteParams();
  const userId = useCurrentUserId();
  const backgroundColor = useScreenBackgroundColor();

  const stepDetailDataParams: StepDetailDataParams = {
    userId,
    stepNumber,
  };

  const { stepData, isLocked, questions, isLoading, saveAnswer } = useStepDetailData(
    stepDetailDataParams
  );

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
