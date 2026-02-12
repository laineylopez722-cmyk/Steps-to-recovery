import type { ComponentProps } from 'react';
import type { Toast } from '../../../design-system';
import type { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';

export type StepDetailToastProps = Pick<
  ComponentProps<typeof Toast>,
  'visible' | 'message' | 'variant' | 'onDismiss'
>;

type Params = {
  questionFlow: ReturnType<typeof useStepDetailQuestionFlow>;
};

export function useStepDetailToastState({ questionFlow }: Params): { toastProps: StepDetailToastProps } {
  return {
    toastProps: {
      visible: questionFlow.toastVisible,
      message: questionFlow.toastMessage,
      variant: questionFlow.toastVariant,
      onDismiss: questionFlow.dismissToast,
    },
  };
}
