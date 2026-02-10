import { useStepScreenAnimation } from './useStepScreenAnimation';
import { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import { useStepDetailMainContentProps } from './useStepDetailMainContentProps';
import { useStepDetailInteractions } from './useStepDetailInteractions';
import { useStepDetailContentState } from './useStepDetailContentState';
import { useStepDetailScreenSetup } from './useStepDetailScreenSetup';

export function useStepDetailOrchestration() {
  const {
    navigation,
    stepNumber,
    initialQuestion,
    backgroundColor,
    stepData,
    isLocked,
    questions,
    isLoading,
    saveAnswer,
  } = useStepDetailScreenSetup();

  const { fadeAnim, slideAnim } = useStepScreenAnimation();

  const {
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
  } = useStepDetailQuestionFlow({
    stepData,
    questions,
    stepNumber,
    initialQuestion,
    saveAnswer,
  });

  const {
    handleReviewAnswers,
    handleBackToStepOne,
    handleBackToSteps,
    showGuidance,
    handleToggleGuidance,
  } = useStepDetailInteractions({
    navigation,
    stepNumber,
  });

  const mainContentProps = useStepDetailMainContentProps({
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
      onToggleGuidance: handleToggleGuidance,
    },
    headerActions: {
      onContinue: scrollToFirstUnanswered,
      onReviewAnswers: handleReviewAnswers,
    },
    questionNavigation: {
      currentVisibleQuestion,
      onJumpToQuestion: scrollToQuestion,
      onViewableItemsChanged,
      viewabilityConfig,
    },
    questionList: {
      listRef: flatListRef,
      listItems,
      answeredQuestionNumbers,
      savingQuestion,
      answers,
      onAnswerChange: handleAnswerChange,
      onSaveAnswer: handleSaveAnswer,
    },
  });

  const contentState = useStepDetailContentState({
    isLocked,
    isLoading,
  });

  return {
    hasStepData: Boolean(stepData),
    content: {
      state: contentState,
      backgroundColor,
      stepNumber,
      onBackToStepOne: handleBackToStepOne,
      onBackToSteps: handleBackToSteps,
      toastVisible,
      toastMessage,
      toastVariant,
      onDismissToast: dismissToast,
      mainContentProps,
    },
  };
}
