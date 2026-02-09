type StepDetailContentState = 'locked' | 'loading' | 'ready';

type Params = {
  isLocked: boolean;
  isLoading: boolean;
};

export function useStepDetailContentState({ isLocked, isLoading }: Params): StepDetailContentState {
  if (isLocked) {
    return 'locked';
  }

  if (isLoading) {
    return 'loading';
  }

  return 'ready';
}
