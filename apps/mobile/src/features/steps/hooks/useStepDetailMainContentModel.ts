import { useStepDetailMainContentProps } from './useStepDetailMainContentProps';
import { type useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import type { StepPrompt } from '@recovery/shared';
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

export function useStepDetailMainContentModel({
  animation,
  step,
  interactions,
  questionFlow,
}: Params) {
  return useStepDetailMainContentProps({
    animation: {
      fadeAnim: animation.fadeAnim,
      slideAnim: animation.slideAnim,
    },
    step: {
      stepNumber: step.stepNumber,
      stepData: step.stepData,
    },
    progress: {
      totalQuestions: questionFlow.totalQuestions,
      answeredCount: questionFlow.answeredCount,
      progressPercent: questionFlow.progressPercent,
      hasUnanswered: questionFlow.hasUnanswered,
      firstUnansweredQuestion: questionFlow.firstUnansweredQuestion,
    },
    guidance: {
      showGuidance: interactions.showGuidance,
      onToggleGuidance: interactions.onToggleGuidance,
    },
    headerActions: {
      onContinue: interactions.onContinue,
      onReviewAnswers: interactions.onReviewAnswers,
    },
    questionNavigation: {
      currentVisibleQuestion: questionFlow.currentVisibleQuestion,
      onJumpToQuestion: questionFlow.scrollToQuestion,
      onViewableItemsChanged: questionFlow.onViewableItemsChanged,
      viewabilityConfig: questionFlow.viewabilityConfig,
    },
    questionList: {
      listRef: questionFlow.flatListRef,
      listItems: questionFlow.listItems,
      answeredQuestionNumbers: questionFlow.answeredQuestionNumbers,
      savingQuestion: questionFlow.savingQuestion,
      answers: questionFlow.answers,
      onAnswerChange: questionFlow.handleAnswerChange,
      onSaveAnswer: questionFlow.handleSaveAnswer,
    },
  });
}
