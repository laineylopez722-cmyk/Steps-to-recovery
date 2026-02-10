import React from 'react';
import { useStepScreenAnimation } from '../hooks/useStepScreenAnimation';
import { useStepDetailQuestionFlow } from '../hooks/useStepDetailQuestionFlow';
import { useStepDetailMainContentProps } from '../hooks/useStepDetailMainContentProps';
import { useStepDetailInteractions } from '../hooks/useStepDetailInteractions';
import { useStepDetailContentState } from '../hooks/useStepDetailContentState';
import { useStepDetailScreenSetup } from '../hooks/useStepDetailScreenSetup';
import { StepDetailErrorState } from '../components/StepDetailErrorState';
import { StepDetailScreenContent } from '../components/StepDetailScreenContent';

export function StepDetailScreen(): React.ReactElement {
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

  if (!stepData) {
    return <StepDetailErrorState />;
  }

  const contentState = useStepDetailContentState({
    isLocked,
    isLoading,
  });

  return (
    <StepDetailScreenContent
      state={contentState}
      backgroundColor={backgroundColor}
      stepNumber={stepNumber}
      onBackToStepOne={handleBackToStepOne}
      onBackToSteps={handleBackToSteps}
      toastVisible={toastVisible}
      toastMessage={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={dismissToast}
      mainContentProps={mainContentProps}
    />
  );
}


