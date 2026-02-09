import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { STEP_PROMPTS, type StepPrompt } from '@recovery/shared';
import { useStepWork, useSaveStepAnswer } from '../hooks/useStepWork';
import { useStepAnswerSave } from '../hooks/useStepAnswerSave';
import { useStepQuestionNavigation } from '../hooks/useStepQuestionNavigation';
import { useStepAnswersState } from '../hooks/useStepAnswersState';
import { useStepScreenAnimation } from '../hooks/useStepScreenAnimation';
import { useStepDetailDerivedState } from '../hooks/useStepDetailDerivedState';
import { StepLockedState } from '../components/StepLockedState';
import { StepGuidanceCard } from '../components/StepGuidanceCard';
import { StepDetailHeaderCard } from '../components/StepDetailHeaderCard';
import { StepQuestionCounter } from '../components/StepQuestionCounter';
import { StepDetailLoadingState } from '../components/StepDetailLoadingState';
import { StepDetailQuestionsList } from '../components/StepDetailQuestionsList';
import { StepDetailErrorState } from '../components/StepDetailErrorState';
import { useAuth } from '../../../contexts/AuthContext';
import { Toast, useTheme } from '../../../design-system';
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

  // list rendering handled by StepDetailQuestionsList

  if (!stepData) {
    return <StepDetailErrorState />;
  }

  if (isLocked) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <StepLockedState
          stepNumber={stepNumber}
          onBackToStepOne={() => navigation.navigate('StepDetail', { stepNumber: 1 })}
          onBackToSteps={() => navigation.navigate('StepsOverview')}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <StepDetailLoadingState />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={dismissToast}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <StepDetailHeaderCard
            stepNumber={stepNumber}
            title={stepData.title}
            principle={stepData.principle}
            totalQuestions={totalQuestions}
            answeredCount={answeredCount}
            progressPercent={progressPercent}
            showContinue={hasUnanswered && answeredCount > 0}
            firstUnansweredQuestion={firstUnansweredQuestion}
            onContinue={scrollToFirstUnanswered}
            onReviewAnswers={() => navigation.navigate('StepReview', { stepNumber })}
          />

          {/* Guidance */}
          <StepGuidanceCard
            showGuidance={showGuidance}
            description={stepData.description}
            onToggle={() => setShowGuidance((prev) => !prev)}
          />

          {/* Question Counter */}
          <StepQuestionCounter
            currentQuestion={currentVisibleQuestion}
            totalQuestions={totalQuestions}
          />

          {/* Questions List */}
          <StepDetailQuestionsList
            listRef={flatListRef}
            listItems={listItems}
            answeredQuestionNumbers={answeredQuestionNumbers}
            savingQuestion={savingQuestion}
            answers={answers}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
            onSaveAnswer={handleSaveAnswer}
            onJumpToQuestion={scrollToQuestion}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },

});









