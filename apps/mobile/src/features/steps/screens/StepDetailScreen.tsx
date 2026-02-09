import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { STEP_PROMPTS, type StepPrompt } from '@recovery/shared';
import { useStepWork, useSaveStepAnswer } from '../hooks/useStepWork';
import { useStepAnswerSave } from '../hooks/useStepAnswerSave';
import { useStepQuestionNavigation } from '../hooks/useStepQuestionNavigation';
import { useStepAnswersState } from '../hooks/useStepAnswersState';
import { StepLockedState } from '../components/StepLockedState';
import { StepGuidanceCard } from '../components/StepGuidanceCard';
import { StepDetailHeaderCard } from '../components/StepDetailHeaderCard';
import { StepQuestionCounter } from '../components/StepQuestionCounter';
import { StepDetailLoadingState } from '../components/StepDetailLoadingState';
import { StepDetailQuestionsList } from '../components/StepDetailQuestionsList';
import { StepDetailErrorState } from '../components/StepDetailErrorState';
import { buildQuestionIndexMap, buildStepListItems, type StepListItem } from '../utils/stepListItems';
import { buildAnsweredQuestionSet, getFirstUnansweredQuestion } from '../utils/stepAnswers';
import { useAuth } from '../../../contexts/AuthContext';
import { Toast, useTheme } from '../../../design-system';
import type { StepsStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList, 'StepDetail'>;

// Step list item types are defined in ../utils/stepListItems

type ListItem = StepListItem;

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

  // Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Get total question count
  const totalQuestions = stepData?.prompts.length ?? 0;

  const listItems = useMemo((): ListItem[] => buildStepListItems(stepData), [stepData]);

  const questionIndexMap = useMemo(() => buildQuestionIndexMap(listItems), [listItems]);

  const answeredQuestionNumbers = useMemo(() => buildAnsweredQuestionSet(questions), [questions]);

  // Find first unanswered question
  const firstUnansweredQuestion = useMemo(
    () => getFirstUnansweredQuestion(stepData, answeredQuestionNumbers),
    [stepData, answeredQuestionNumbers],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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

  const answeredCount = answeredQuestionNumbers.size;
  const hasUnanswered = answeredCount < totalQuestions;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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









