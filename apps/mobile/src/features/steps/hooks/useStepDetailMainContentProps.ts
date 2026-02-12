import { useMemo } from 'react';
import type { StepPrompt } from '@recovery/shared';
import { type useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';

type Params = {
  animation: {
    fadeAnim: StepDetailMainContentProps['fadeAnim'];
    slideAnim: StepDetailMainContentProps['slideAnim'];
  };
  step: {
    stepNumber: number;
    stepData?: StepPrompt;
  };
  interactions: {
    showGuidance: boolean;
    onToggleGuidance: () => void;
    onContinue: () => void;
    onReviewAnswers: () => void;
  };
  questionFlow: ReturnType<typeof useStepDetailQuestionFlow>;
};

export function useStepDetailMainContentProps({
  animation,
  step,
  interactions,
  questionFlow,
}: Params): StepDetailMainContentProps {
  return useMemo(
    () => ({
      fadeAnim: animation.fadeAnim,
      slideAnim: animation.slideAnim,
      stepNumber: step.stepNumber,
      title: step.stepData?.title ?? '',
      principle: step.stepData?.principle ?? '',
      description: step.stepData?.description ?? '',
      totalQuestions: questionFlow.totalQuestions,
      answeredCount: questionFlow.answeredCount,
      progressPercent: questionFlow.progressPercent,
      hasUnanswered: questionFlow.hasUnanswered,
      firstUnansweredQuestion: questionFlow.firstUnansweredQuestion,
      onContinue: interactions.onContinue,
      onReviewAnswers: interactions.onReviewAnswers,
      showGuidance: interactions.showGuidance,
      onToggleGuidance: interactions.onToggleGuidance,
      currentVisibleQuestion: questionFlow.currentVisibleQuestion,
      listRef: questionFlow.flatListRef,
      listItems: questionFlow.listItems,
      answeredQuestionNumbers: questionFlow.answeredQuestionNumbers,
      savingQuestion: questionFlow.savingQuestion,
      answers: questionFlow.answers,
      onAnswerChange: questionFlow.handleAnswerChange,
      onSaveAnswer: questionFlow.handleSaveAnswer,
      onJumpToQuestion: questionFlow.scrollToQuestion,
      onViewableItemsChanged: questionFlow.onViewableItemsChanged,
      viewabilityConfig: questionFlow.viewabilityConfig,
    }),
    [
      animation.fadeAnim,
      animation.slideAnim,
      step.stepNumber,
      step.stepData,
      interactions.onContinue,
      interactions.onReviewAnswers,
      interactions.showGuidance,
      interactions.onToggleGuidance,
      questionFlow.totalQuestions,
      questionFlow.answeredCount,
      questionFlow.progressPercent,
      questionFlow.hasUnanswered,
      questionFlow.firstUnansweredQuestion,
      questionFlow.currentVisibleQuestion,
      questionFlow.flatListRef,
      questionFlow.listItems,
      questionFlow.answeredQuestionNumbers,
      questionFlow.savingQuestion,
      questionFlow.answers,
      questionFlow.handleAnswerChange,
      questionFlow.handleSaveAnswer,
      questionFlow.scrollToQuestion,
      questionFlow.onViewableItemsChanged,
      questionFlow.viewabilityConfig,
    ],
  );
}
