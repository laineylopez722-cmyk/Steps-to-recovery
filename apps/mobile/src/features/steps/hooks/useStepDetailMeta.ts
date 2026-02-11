import { STEP_PROMPTS, type StepPrompt } from '@recovery/shared';
import { useStepProgress } from './useStepWork';
import { useCurrentUserId } from './useCurrentUserId';

const UNLOCK_THRESHOLD = 50;

export function useStepDetailMeta(stepNumber: number): {
  stepData: StepPrompt | undefined;
  isLocked: boolean;
} {
  const userId = useCurrentUserId();
  const { stepDetails } = useStepProgress(userId);
  const stepData = STEP_PROMPTS.find((s: StepPrompt) => s.step === stepNumber);

  let isLocked = false;
  if (stepNumber > 1) {
    const prevDetail = stepDetails.find((d) => d.stepNumber === stepNumber - 1);
    const prevPercent = prevDetail?.percent ?? 0;
    isLocked = prevPercent < UNLOCK_THRESHOLD;
  }

  return {
    stepData,
    isLocked,
  };
}
