import { useStepDetailMainContentProps } from './useStepDetailMainContentProps';
import type { StepPrompt } from '@recovery/shared';
import type { StepDetailMainContentProps } from '../components/StepDetailMainContent';

type Params = {
  fadeAnim: StepDetailMainContentProps['fadeAnim'];
  slideAnim: StepDetailMainContentProps['slideAnim'];
  stepNumber: number;
  stepData?: StepPrompt;
  totalQuestions: number;
  answeredCount: number;
  progressPercent: number;
  hasUnanswered: boolean;
  firstUnansweredQuestion: number;
  showGuidance: boolean;
  onToggleGuidance: () => void;
  onContinue: () => void;
  onReviewAnswers: () => void;
  currentVisibleQuestion: number;
  onJumpToQuestion: (questionNumber: number) => void;
  onViewableItemsChanged: StepDetailMainContentProps['onViewableItemsChanged'];
  viewabilityConfig: StepDetailMainContentProps['viewabilityConfig'];
  listRef: StepDetailMainContentProps['listRef'];
  listItems: StepDetailMainContentProps['listItems'];
  answeredQuestionNumbers: Set<number>;
  savingQuestion: number | null;
  answers: Record<number, string>;
  onAnswerChange: (questionNumber: number, text: string) => void;
  onSaveAnswer: (questionNumber: number) => Promise<void>;
};

export function useStepDetailMainContentModel({
  fadeAnim,
  slideAnim,
  stepNumber,
  stepData,
  totalQuestions,
  answeredCount,
  progressPercent,
  hasUnanswered,
  firstUnansweredQuestion,
  showGuidance,
  onToggleGuidance,
  onContinue,
  onReviewAnswers,
  currentVisibleQuestion,
  onJumpToQuestion,
  onViewableItemsChanged,
  viewabilityConfig,
  listRef,
  listItems,
  answeredQuestionNumbers,
  savingQuestion,
  answers,
  onAnswerChange,
  onSaveAnswer,
}: Params) {
  return useStepDetailMainContentProps({
    animation: {
      fadeAnim,
      slideAnim,
    },
    step: {
      stepNumber,
      stepData,
    },
    progress: {
      totalQuestions,
      answeredCount,
      progressPercent,
      hasUnanswered,
      firstUnansweredQuestion,
    },
    guidance: {
      showGuidance,
      onToggleGuidance,
    },
    headerActions: {
      onContinue,
      onReviewAnswers,
    },
    questionNavigation: {
      currentVisibleQuestion,
      onJumpToQuestion,
      onViewableItemsChanged,
      viewabilityConfig,
    },
    questionList: {
      listRef,
      listItems,
      answeredQuestionNumbers,
      savingQuestion,
      answers,
      onAnswerChange,
      onSaveAnswer,
    },
  });
}
