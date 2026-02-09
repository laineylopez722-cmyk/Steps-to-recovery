import { useMemo } from 'react';
import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';

export function useStepDetailMainContentProps(
  params: StepDetailMainContentProps,
): StepDetailMainContentProps {
  return useMemo(
    () => ({ ...params }),
    [
      params.fadeAnim,
      params.slideAnim,
      params.stepNumber,
      params.title,
      params.principle,
      params.description,
      params.totalQuestions,
      params.answeredCount,
      params.progressPercent,
      params.hasUnanswered,
      params.firstUnansweredQuestion,
      params.onContinue,
      params.onReviewAnswers,
      params.showGuidance,
      params.onToggleGuidance,
      params.currentVisibleQuestion,
      params.listRef,
      params.listItems,
      params.answeredQuestionNumbers,
      params.savingQuestion,
      params.answers,
      params.onAnswerChange,
      params.onSaveAnswer,
      params.onJumpToQuestion,
      params.onViewableItemsChanged,
      params.viewabilityConfig,
    ],
  );
}
