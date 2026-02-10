import { useStepDetailContentState } from './useStepDetailContentState';
import type { StepPrompt } from '@recovery/shared';

type Params = {
  stepData?: StepPrompt;
  isLocked: boolean;
  isLoading: boolean;
};

export function useStepDetailDisplayState({ stepData, isLocked, isLoading }: Params) {
  const contentState = useStepDetailContentState({
    isLocked,
    isLoading,
  });

  return {
    hasStepData: Boolean(stepData),
    contentState,
  };
}
