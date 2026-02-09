import React, { useState } from 'react';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { STEP_PROMPTS, type StepPrompt } from '@recovery/shared';
import { useStepWork, useSaveStepAnswer } from '../hooks/useStepWork';
import { useStepAnswerSave } from '../hooks/useStepAnswerSave';
import { useStepQuestionNavigation } from '../hooks/useStepQuestionNavigation';
import { useStepAnswersState } from '../hooks/useStepAnswersState';
import { useStepScreenAnimation } from '../hooks/useStepScreenAnimation';
import { useStepDetailDerivedState } from '../hooks/useStepDetailDerivedState';
import { StepDetailErrorState } from '../components/StepDetailErrorState';
import { StepDetailScreenContent } from '../components/StepDetailScreenContent';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../design-system';
import type { StepsStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList, 'StepDetail'>;

export function StepDetailScreen(): React.ReactElement {
  const route = useRoute<RouteProp<StepsStackParamList, 'StepDetail'>>();
  const navigation = useNavigation<NavigationProp>();
  const { stepNumber, initialQuestion } = route.params;
  const { user } = useAuth();
  const userId = user?.id || '';
  const theme = useTheme();

  const stepData = STEP_PROMPTS.find((s: StepPrompt) => s.step === stepNumber);
  const { questions, isLoading } = useStepWork(userId, stepNumber);
  const { saveAnswer } = useSaveStepAnswer(userId);
  const isLocked = stepNumber > 1;

  const [showGuidance, setShowGuidance] = useState(false);

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

  if (!stepData) {
    return <StepDetailErrorState />;
  }

  const contentState = isLocked ? 'locked' : isLoading ? 'loading' : 'ready';

  return (
    <StepDetailScreenContent
      state={contentState}
      backgroundColor={theme.colors.background}
      stepNumber={stepNumber}
      onBackToStepOne={() => navigation.navigate('StepDetail', { stepNumber: 1 })}
      onBackToSteps={() => navigation.navigate('StepsOverview')}
      toastVisible={toastVisible}
      toastMessage={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={dismissToast}
      mainContentProps={{
        fadeAnim,
        slideAnim,
        stepNumber,
        title: stepData.title,
        principle: stepData.principle,
        description: stepData.description,
        totalQuestions,
        answeredCount,
        progressPercent,
        hasUnanswered,
        firstUnansweredQuestion,
        onContinue: scrollToFirstUnanswered,
        onReviewAnswers: () => navigation.navigate('StepReview', { stepNumber }),
        showGuidance,
        onToggleGuidance: () => setShowGuidance((prev) => !prev),
        currentVisibleQuestion,
        listRef: flatListRef,
        listItems,
        answeredQuestionNumbers,
        savingQuestion,
        answers,
        onAnswerChange: handleAnswerChange,
        onSaveAnswer: handleSaveAnswer,
        onJumpToQuestion: scrollToQuestion,
        onViewableItemsChanged,
        viewabilityConfig,
      }}
    />
  );
}


