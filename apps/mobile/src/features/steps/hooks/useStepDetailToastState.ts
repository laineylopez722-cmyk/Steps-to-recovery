import type { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';

type Params = {
  questionFlow: ReturnType<typeof useStepDetailQuestionFlow>;
};

export function useStepDetailToastState({ questionFlow }: Params) {
  return {
    toastVisible: questionFlow.toastVisible,
    toastMessage: questionFlow.toastMessage,
    toastVariant: questionFlow.toastVariant,
    onDismissToast: questionFlow.dismissToast,
  };
}
