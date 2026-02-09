import { STEP_PROMPTS, type StepPrompt } from '@recovery/shared';

export function useStepDetailMeta(stepNumber: number) {
  const stepData = STEP_PROMPTS.find((s: StepPrompt) => s.step === stepNumber);
  const isLocked = stepNumber > 1;

  return {
    stepData,
    isLocked,
  };
}
