import React from 'react';
import { useStepAnswerSave } from '../hooks/useStepAnswerSave';
import { useStepQuestionNavigation } from '../hooks/useStepQuestionNavigation';
import { useStepAnswersState } from '../hooks/useStepAnswersState';
import { useStepScreenAnimation } from '../hooks/useStepScreenAnimation';
import { useStepDetailDerivedState } from '../hooks/useStepDetailDerivedState';
import { useStepDetailMainContentProps } from '../hooks/useStepDetailMainContentProps';
import { useStepDetailNavigationActions } from '../hooks/useStepDetailNavigationActions';
import { useStepGuidanceToggle } from '../hooks/useStepGuidanceToggle';
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

  const { handleReviewAnswers, handleBackToStepOne, handleBackToSteps } =
    useStepDetailNavigationActions({
      navigation,
      stepNumber,
    });
  const { showGuidance, handleToggleGuidance } = useStepGuidanceToggle();

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


