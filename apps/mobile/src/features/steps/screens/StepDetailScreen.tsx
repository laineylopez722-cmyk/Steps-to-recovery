import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Pressable,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { STEP_PROMPTS, type StepPrompt } from '@recovery/shared';
import { useStepWork, useSaveStepAnswer } from '../hooks/useStepWork';
import { StepSectionHeader } from '../components/StepSectionHeader';
import { StepQuestionCard } from '../components/StepQuestionCard';
import { StepLockedState } from '../components/StepLockedState';
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
import {
  useTheme,
  Card,
  Button,
  ProgressBar,
  Badge,
  Toast,
  Text,
  Skeleton,
} from '../../../design-system';
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
  const [savingQuestion, setSavingQuestion] = useState<number | null>(null);
  const [currentVisibleQuestion, setCurrentVisibleQuestion] = useState(1);
  const [showGuidance, setShowGuidance] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'info' | 'warning'>(
    'success',
  );

  // Refs
  const flatListRef = useRef<FlatList<ListItem>>(null);
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

  const handleSaveAnswer = useCallback(
    async (questionNumber: number) => {
      if (savingQuestion === questionNumber) return;

      const answer = answers[questionNumber];
      const normalizedAnswer = answer?.trim();
      if (!normalizedAnswer) return;

      setSavingQuestion(questionNumber);
      try {
        await saveAnswer(stepNumber, questionNumber, normalizedAnswer, true);

        // Success feedback
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setToastMessage('Answer saved successfully');
        setToastVariant('success');
        setShowToast(true);
      } catch (_error) {
        setToastMessage('Failed to save answer. Please try again.');
        setToastVariant('error');
        setShowToast(true);
      } finally {
        setSavingQuestion(null);
      }
    },
    [answers, saveAnswer, savingQuestion, stepNumber],
  );

  const scrollToQuestion = useCallback(
    (questionNumber: number) => {
      if (!flatListRef.current || !stepData) return;

      const targetIndex = questionIndexMap.get(questionNumber);

      if (targetIndex !== undefined) {
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0,
        });

        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [questionIndexMap, stepData],
  );

  // Scroll to first unanswered question
  const scrollToFirstUnanswered = useCallback(() => {
    scrollToQuestion(firstUnansweredQuestion);
  }, [firstUnansweredQuestion, scrollToQuestion]);

  // Track visible question for counter
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstVisibleQuestionNumber = getFirstVisibleQuestionNumber(viewableItems);
    if (firstVisibleQuestionNumber !== null) {
      setCurrentVisibleQuestion(firstVisibleQuestionNumber);
    }
  }, []);

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    [],
  );

  useEffect(() => {
    if (!initialQuestion || !stepData) return;

    const timer = setTimeout(() => {
      scrollToQuestion(initialQuestion);
    }, 350);

    return () => clearTimeout(timer);
  }, [initialQuestion, scrollToQuestion, stepData]);

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
        return (
          <Card variant="outlined" style={[styles.infoCard, { borderColor: ds.colors.borderSubtle }]}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons
                name="lock"
                size={24}
                color={ds.colors.accent}
                accessible={false}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginLeft: 12, flex: 1, lineHeight: 18 },
                ]}
              >
                Your answers are encrypted and stored securely on your device. Only you can read
                them. Your progress is private and safe.
              </Text>
            </View>
          </Card>
        );
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
        visible={showToast}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setShowToast(false)}
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
          <Card variant="elevated" style={styles.headerCard}>
            <View style={styles.header}>
              <View style={[styles.stepBadge, { backgroundColor: ds.colors.accent }]}>
                <Text style={styles.stepBadgeText}>{stepNumber}</Text>
              </View>
              <View style={styles.headerContent}>
                <Text
                  style={[theme.typography.h2, { color: theme.colors.text, fontWeight: '600' }]}
                >
                  Step {stepNumber}: {stepData.title}
                </Text>
                <View style={styles.badgeRow}>
                  <Badge variant="primary" size="medium" style={styles.principleBadge}>
                    {stepData.principle}
                  </Badge>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginLeft: 8 },
                    ]}
                  >
                    {totalQuestions} questions
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[theme.typography.label, { color: theme.colors.textSecondary }]}>
                  Your Progress ({answeredCount}/{totalQuestions})
                </Text>
                <Text
                  style={[theme.typography.h3, { color: ds.colors.accent, fontWeight: '600' }]}
                >
                  {progressPercent}%
                </Text>
              </View>
              <ProgressBar progress={progressPercent / 100} style={styles.progressBar} />
            </View>

            {/* Continue Button */}
            {hasUnanswered && answeredCount > 0 && (
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: ds.colors.accentMuted }]}
                onPress={scrollToFirstUnanswered}
                accessibilityLabel={`Continue at question ${firstUnansweredQuestion}`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={20}
                  color={ds.colors.accent}
                />
                <Text
                  style={[
                    theme.typography.body,
                    { color: ds.colors.accent, marginLeft: 8, fontWeight: '600' },
                  ]}
                >
                  Continue at Question {firstUnansweredQuestion}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ marginTop: theme.spacing.sm }}>
              <Button
                title="Review answers"
                variant="secondary"
                size="small"
                onPress={() => navigation.navigate('StepReview', { stepNumber })}
                accessibilityLabel="Review all answers"
                accessibilityHint="Opens the step review screen"
              />
            </View>
          </Card>

          {/* Guidance */}
          <Card
            variant="outlined"
            style={[styles.descriptionCard, { borderColor: ds.colors.borderSubtle }]}
          >
            <Pressable
              onPress={() => setShowGuidance((prev) => !prev)}
              style={styles.guidanceToggle}
              accessibilityRole="button"
              accessibilityLabel={showGuidance ? 'Hide step guidance' : 'Show step guidance'}
            >
              <View style={styles.descriptionHeader}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={20}
                  color={ds.colors.accent}
                />
                <Text
                  style={[theme.typography.label, { color: ds.colors.accent, marginLeft: 8 }]}
                >
                  STEP GUIDANCE
                </Text>
              </View>
              <MaterialCommunityIcons
                name={showGuidance ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            {showGuidance && (
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.text, lineHeight: 24, fontStyle: 'italic' },
                ]}
              >
                "{stepData.description}"
              </Text>
            )}
          </Card>

          {/* Question Counter */}
          <View style={[styles.questionCounter, { backgroundColor: ds.colors.bgSecondary, borderColor: ds.colors.borderSubtle }]}>
            <Text style={[theme.typography.label, { color: theme.colors.textSecondary }]}>
              Question {currentVisibleQuestion} of {totalQuestions}
            </Text>
          </View>

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
  stepBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepBadgeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ds.semantic.text.onDark,
  },
  headerContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  principleBadge: {
    alignSelf: 'flex-start',
  },
  progressSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  questionCounter: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
  },
  sectionHeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  questionDivider: {
    marginBottom: 16,
  },
  answerTextArea: {
    marginBottom: 16,
  },
  infoCard: {
    marginTop: 8,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});


