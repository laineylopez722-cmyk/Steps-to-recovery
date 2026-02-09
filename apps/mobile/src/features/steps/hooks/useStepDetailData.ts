import { useSaveStepAnswer, useStepWork } from './useStepWork';
import { useStepDetailMeta } from './useStepDetailMeta';

type Params = {
  userId: string;
  stepNumber: number;
};

export function useStepDetailData({ userId, stepNumber }: Params) {
  const { stepData, isLocked } = useStepDetailMeta(stepNumber);
  const { questions, isLoading } = useStepWork(userId, stepNumber);
  const { saveAnswer } = useSaveStepAnswer(userId);

  return {
    stepData,
    isLocked,
    questions,
    isLoading,
    saveAnswer,
  };
}
