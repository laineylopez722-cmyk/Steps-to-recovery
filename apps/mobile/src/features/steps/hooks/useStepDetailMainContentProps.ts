import { useMemo } from 'react';
import type { StepPrompt } from '@recovery/shared';
import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';

interface UseStepDetailMainContentPropsParams {
  animation: Pick<StepDetailMainContentProps, 'fadeAnim' | 'slideAnim'>;
  step: {
    stepNumber: number;
    stepData?: StepPrompt;
  };
  progress: Pick<
    StepDetailMainContentProps,
    | 'totalQuestions'
    | 'answeredCount'
    | 'progressPercent'
    | 'hasUnanswered'
    | 'firstUnansweredQuestion'
  >;
  guidance: Pick<StepDetailMainContentProps, 'showGuidance' | 'onToggleGuidance'>;
  headerActions: Pick<StepDetailMainContentProps, 'onContinue' | 'onReviewAnswers'>;
  questionNavigation: Pick<
    StepDetailMainContentProps,
    'currentVisibleQuestion' | 'onJumpToQuestion' | 'onViewableItemsChanged' | 'viewabilityConfig'
  >;
  questionList: Pick<
    StepDetailMainContentProps,
    | 'listRef'
    | 'listItems'
    | 'answeredQuestionNumbers'
    | 'savingQuestion'
    | 'answers'
    | 'onAnswerChange'
    | 'onSaveAnswer'
  >;
}

export function useStepDetailMainContentProps({
  animation,
  step,
  progress,
  guidance,
  headerActions,
  questionNavigation,
  questionList,
}: UseStepDetailMainContentPropsParams): StepDetailMainContentProps {
  return useMemo(
    () => ({
      fadeAnim: animation.fadeAnim,
      slideAnim: animation.slideAnim,
      stepNumber: step.stepNumber,
      title: step.stepData?.title ?? '',
      principle: step.stepData?.principle ?? '',
      description: step.stepData?.description ?? '',
      totalQuestions: progress.totalQuestions,
      answeredCount: progress.answeredCount,
      progressPercent: progress.progressPercent,
      hasUnanswered: progress.hasUnanswered,
      firstUnansweredQuestion: progress.firstUnansweredQuestion,
      onContinue: headerActions.onContinue,
      onReviewAnswers: headerActions.onReviewAnswers,
      showGuidance: guidance.showGuidance,
      onToggleGuidance: guidance.onToggleGuidance,
      currentVisibleQuestion: questionNavigation.currentVisibleQuestion,
      listRef: questionList.listRef,
      listItems: questionList.listItems,
      answeredQuestionNumbers: questionList.answeredQuestionNumbers,
      savingQuestion: questionList.savingQuestion,
      answers: questionList.answers,
      onAnswerChange: questionList.onAnswerChange,
      onSaveAnswer: questionList.onSaveAnswer,
      onJumpToQuestion: questionNavigation.onJumpToQuestion,
      onViewableItemsChanged: questionNavigation.onViewableItemsChanged,
      viewabilityConfig: questionNavigation.viewabilityConfig,
    }),
    [
      animation.fadeAnim,
      animation.slideAnim,
      step.stepNumber,
      step.stepData,
      progress.totalQuestions,
      progress.answeredCount,
      progress.progressPercent,
      progress.hasUnanswered,
      progress.firstUnansweredQuestion,
      headerActions.onContinue,
      headerActions.onReviewAnswers,
      guidance.showGuidance,
      guidance.onToggleGuidance,
      questionNavigation.currentVisibleQuestion,
      questionNavigation.onJumpToQuestion,
      questionNavigation.onViewableItemsChanged,
      questionNavigation.viewabilityConfig,
      questionList.listRef,
      questionList.listItems,
      questionList.answeredQuestionNumbers,
      questionList.savingQuestion,
      questionList.answers,
      questionList.onAnswerChange,
      questionList.onSaveAnswer,
    ],
  );
}
