import { useStepScreenAnimation } from './useStepScreenAnimation';
import { useStepDetailMainContentModel } from './useStepDetailMainContentModel';
import { useStepDetailInteractions } from './useStepDetailInteractions';
import { useStepDetailFlowContext } from './useStepDetailFlowContext';
import { useStepDetailScreenContentProps } from './useStepDetailScreenContentProps';
import { useStepDetailDisplayState } from './useStepDetailDisplayState';

export function useStepDetailOrchestration() {
  const {
    navigation,
    stepNumber,
    backgroundColor,
    stepData,
    isLocked,
    isLoading,
    questionFlow,
  } = useStepDetailFlowContext();

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
  } = questionFlow;

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
