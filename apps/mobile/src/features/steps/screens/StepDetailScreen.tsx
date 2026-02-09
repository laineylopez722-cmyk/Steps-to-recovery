import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Animated,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { STEP_PROMPTS, type StepPrompt } from '@recovery/shared';
import { useStepWork, useSaveStepAnswer } from '../hooks/useStepWork';
import { useStepAnswerSave } from '../hooks/useStepAnswerSave';
import { useStepQuestionNavigation } from '../hooks/useStepQuestionNavigation';
import { StepSectionHeader } from '../components/StepSectionHeader';
import { StepQuestionCard } from '../components/StepQuestionCard';
import { StepLockedState } from '../components/StepLockedState';
import { StepGuidanceCard } from '../components/StepGuidanceCard';
import { StepDetailHeaderCard } from '../components/StepDetailHeaderCard';
import { StepQuestionCounter } from '../components/StepQuestionCounter';
import { StepPrivacyInfoCard } from '../components/StepPrivacyInfoCard';
import {
  buildQuestionIndexMap,
  buildStepListItems,
  type StepListItem,
} from '../utils/stepListItems';
import { getFirstVisibleQuestionNumber } from '../utils/stepViewability';
import { getStepListItemLayout, stepListKeyExtractor } from '../utils/stepListConfig';
import {
  buildAnsweredQuestionSet,
  buildInitialAnswers,
  getFirstUnansweredQuestion,
} from '../utils/stepAnswers';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme, Card, Toast, Text, Skeleton } from '../../../design-system';
import { ds } from '../../../design-system/tokens/ds';
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

  const [answers, setAnswers] = useState<Record<number, string>>({});
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

  // Initialize answers from database
  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(buildInitialAnswers(questions));
    }
  }, [questions]);

  const handleAnswerChange = useCallback((questionNumber: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionNumber]: text }));
  }, []);

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

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => {
      if (item.type === 'section') {
        return (
          <StepSectionHeader
            title={item.title}
            questionRange={item.questionRange}
            sectionStart={item.sectionStart}
            onJumpToQuestion={scrollToQuestion}
          />
        );
      }

      if (item.type === 'footer') {
        return <StepPrivacyInfoCard />;
      }

      // Question item
      const questionNumber = item.questionNumber;
      const isAnswered = answeredQuestionNumbers.has(questionNumber);
      const isSaving = savingQuestion === questionNumber;

      return (
        <StepQuestionCard
          questionNumber={questionNumber}
          prompt={item.prompt}
          answer={answers[questionNumber] || ''}
          totalQuestions={totalQuestions}
          isAnswered={Boolean(isAnswered)}
          isSaving={isSaving}
          onChangeAnswer={(text) => handleAnswerChange(questionNumber, text)}
          onSave={() => handleSaveAnswer(questionNumber)}
        />
      );
    },
    [answeredQuestionNumbers, savingQuestion, answers, handleAnswerChange, handleSaveAnswer, totalQuestions],
  );

  const keyExtractor = stepListKeyExtractor;
  const getItemLayout = getStepListItemLayout;

  if (!stepData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={theme.colors.danger} />
          <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 16 }]}>
            Step not found
          </Text>
        </View>
      </SafeAreaView>
    );
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
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.loadingSkeletonContainer}>
          {/* Header skeleton */}
          <Card variant="elevated" style={styles.headerCard}>
            <View style={styles.header}>
              <Skeleton width={50} height={50} borderRadius={25} />
              <View style={[styles.headerContent, { gap: 8 }]}>
                <Skeleton width="80%" height={20} />
                <Skeleton width="50%" height={14} />
              </View>
            </View>
            <View style={styles.progressSection}>
              <Skeleton width="100%" height={8} borderRadius={4} />
            </View>
          </Card>

          {/* Description skeleton */}
          <Card
            variant="outlined"
            style={[styles.descriptionCard, { borderColor: ds.colors.borderSubtle }]}
          >
            <Skeleton width="40%" height={12} />
            <View style={{ height: 8 }} />
            <Skeleton width="100%" height={14} />
            <View style={{ height: 4 }} />
            <Skeleton width="90%" height={14} />
          </Card>

          {/* Question cards skeleton */}
          <View style={{ padding: 16, gap: 16 }}>
            <Skeleton width="100%" height={100} borderRadius={8} />
            <Skeleton width="100%" height={100} borderRadius={8} />
          </View>
        </View>
      </SafeAreaView>
    );
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
          <FlatList
            ref={flatListRef}
            data={listItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={getItemLayout}
            // Performance optimizations for Android
            initialNumToRender={Platform.OS === 'android' ? 8 : 5}
            maxToRenderPerBatch={Platform.OS === 'android' ? 8 : 5}
            updateCellsBatchingPeriod={Platform.OS === 'android' ? 30 : 50}
            windowSize={Platform.OS === 'android' ? 7 : 5}
            removeClippedSubviews={Platform.OS !== 'web'}
            showsVerticalScrollIndicator={true}
            // Reduce memory usage on Android
            maintainVisibleContentPosition={undefined}
            onScrollToIndexFailed={(info) => {
              // Fallback for scroll failure
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: true,
                });
              }, 100);
            }}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSkeletonContainer: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  progressSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },

  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },

  contentContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
});






