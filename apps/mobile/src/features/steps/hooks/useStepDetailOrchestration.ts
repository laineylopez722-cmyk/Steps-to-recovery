import { useStepScreenAnimation } from './useStepScreenAnimation';
import { useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import { useStepDetailMainContentModel } from './useStepDetailMainContentModel';
import { useStepDetailInteractions } from './useStepDetailInteractions';
import { useStepDetailScreenSetup } from './useStepDetailScreenSetup';
import { useStepDetailScreenContentProps } from './useStepDetailScreenContentProps';
import { useStepDetailDisplayState } from './useStepDetailDisplayState';

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

  const mainContentProps = useStepDetailMainContentModel({
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
    onToggleGuidance: handleToggleGuidance,
    onContinue: scrollToFirstUnanswered,
    onReviewAnswers: handleReviewAnswers,
    currentVisibleQuestion,
    onJumpToQuestion: scrollToQuestion,
    onViewableItemsChanged,
    viewabilityConfig,
    listRef: flatListRef,
    listItems,
    answeredQuestionNumbers,
    savingQuestion,
    answers,
    onAnswerChange: handleAnswerChange,
    onSaveAnswer: handleSaveAnswer,
  });

  const { hasStepData, contentState } = useStepDetailDisplayState({
    stepData,
    isLocked,
    isLoading,
  });

  const content = useStepDetailScreenContentProps({
    contentState,
    backgroundColor,
    stepNumber,
    onBackToStepOne: handleBackToStepOne,
    onBackToSteps: handleBackToSteps,
    toastVisible,
    toastMessage,
    toastVariant,
    onDismissToast: dismissToast,
    mainContentProps,
  });

  return {
    hasStepData,
    content,
  };
}
