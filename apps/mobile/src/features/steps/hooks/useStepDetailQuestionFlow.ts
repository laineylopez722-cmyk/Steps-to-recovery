import { useStepAnswerSave } from './useStepAnswerSave';
import { useStepAnswersState } from './useStepAnswersState';
import { useStepDetailDerivedState } from './useStepDetailDerivedState';
import { useStepQuestionNavigation } from './useStepQuestionNavigation';
import type { StepPrompt, StepWorkDecrypted } from '@recovery/shared';

type Params = {
  stepData: StepPrompt | undefined;
  questions: StepWorkDecrypted[];
  stepNumber: number;
  initialQuestion?: number;
  saveAnswer: (
    stepNumber: number,
    questionNumber: number,
    answer: string,
    isComplete: boolean,
  ) => Promise<void>;
};

export function useStepDetailQuestionFlow({
  stepData,
  questions,
  stepNumber,
  initialQuestion,
  saveAnswer,
}: Params) {
  const {
    totalQuestions,
    listItems,
    questionIndexMap,
    answeredQuestionNumbers,
    firstUnansweredQuestion,
    answeredCount,
    hasUnanswered,
    progressPercent,
  } = useStepDetailDerivedState({
    stepData,
    questions,
  });

  const { answers, handleAnswerChange } = useStepAnswersState(questions);

  const {
    savingQuestion,
    toastVisible,
    toastMessage,
    toastVariant,
    dismissToast,
    handleSaveAnswer,
  } = useStepAnswerSave({
    answers,
    stepNumber,
    saveAnswer,
  });

  const {
    flatListRef,
    currentVisibleQuestion,
    scrollToQuestion,
    scrollToFirstUnanswered,
    onViewableItemsChanged,
    viewabilityConfig,
  } = useStepQuestionNavigation({
    hasStepData: Boolean(stepData),
    initialQuestion,
    firstUnansweredQuestion,
    questionIndexMap,
  });

  return {
    totalQuestions,
    listItems,
    answeredQuestionNumbers,
    firstUnansweredQuestion,
    answeredCount,
    hasUnanswered,
    progressPercent,
    answers,
    handleAnswerChange,
    savingQuestion,
    toastVisible,
    toastMessage,
    toastVariant,
    dismissToast,
    handleSaveAnswer,
    flatListRef,
    currentVisibleQuestion,
    scrollToQuestion,
    scrollToFirstUnanswered,
    onViewableItemsChanged,
    viewabilityConfig,
  };
}
