import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { STEP_PROMPTS, type StepPrompt, type StepSection } from '@recovery/shared/constants';
import { useStepWork, useSaveStepAnswer } from '../hooks/useStepWork';
import { useAuth } from '../../../contexts/AuthContext';
import {
  useTheme,
  Card,
  Button,
  TextArea,
  ProgressBar,
  Badge,
  Toast,
  Divider,
  Text,
  Skeleton,
  CardSkeleton,
} from '../../../design-system';
import type { StepsStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList>;

interface QuestionItem {
  type: 'question';
  questionNumber: number;
  prompt: string;
  sectionTitle?: string;
}

interface SectionHeaderItem {
  type: 'section';
  title: string;
  questionRange: string;
}

interface FooterItem {
  type: 'footer';
}

type ListItem = QuestionItem | SectionHeaderItem | FooterItem;

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

  // Find first unanswered question
  const firstUnansweredQuestion = useMemo(() => {
    if (!stepData) return 1;
    for (let i = 0; i < stepData.prompts.length; i++) {
      const questionNumber = i + 1;
      const answered = questions.find((q) => q.question_number === questionNumber && q.is_complete);
      if (!answered) {
        return questionNumber;
      }
    }
    return stepData.prompts.length; // All answered, go to last
  }, [stepData, questions]);

  // Build list items with section headers
  const listItems = useMemo((): ListItem[] => {
    if (!stepData) return [];

    const items: ListItem[] = [];

    if (stepData.sections && stepData.sections.length > 0) {
      // Build items with section headers
      let questionIndex = 0;
      stepData.sections.forEach((section: StepSection) => {
        const sectionStart = questionIndex + 1;
        const sectionEnd = questionIndex + section.prompts.length;

        // Add section header
        items.push({
          type: 'section',
          title: section.title,
          questionRange: `Questions ${sectionStart}-${sectionEnd}`,
        });

        // Add questions for this section
        section.prompts.forEach((prompt: string) => {
          questionIndex++;
          items.push({
            type: 'question',
            questionNumber: questionIndex,
            prompt,
            sectionTitle: section.title,
          });
        });
      });
    } else {
      // No sections, just add all prompts
      stepData.prompts.forEach((prompt: string, index: number) => {
        items.push({
          type: 'question',
          questionNumber: index + 1,
          prompt,
        });
      });
    }

    // Add footer
    items.push({ type: 'footer' });

    return items;
  }, [stepData]);

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
      const initialAnswers: Record<number, string> = {};
      questions.forEach((q) => {
        if (q.answer) {
          initialAnswers[q.question_number] = q.answer;
        }
      });
      setAnswers(initialAnswers);
    }
  }, [questions]);

  const handleSaveAnswer = useCallback(
    async (questionNumber: number) => {
      const answer = answers[questionNumber];
      if (!answer?.trim()) return;

      setSavingQuestion(questionNumber);
      try {
        await saveAnswer(stepNumber, questionNumber, answer, true);

        // Success feedback
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setToastMessage('Answer saved successfully');
        setToastVariant('success');
        setShowToast(true);
      } catch (error) {
        setToastMessage('Failed to save answer. Please try again.');
        setToastVariant('error');
        setShowToast(true);
      } finally {
        setSavingQuestion(null);
      }
    },
    [answers, saveAnswer, stepNumber],
  );

  const scrollToQuestion = useCallback(
    (questionNumber: number) => {
      if (!flatListRef.current || !stepData) return;

      const targetIndex = listItems.findIndex(
        (item) => item.type === 'question' && item.questionNumber === questionNumber,
      );

      if (targetIndex !== -1) {
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
    [listItems, stepData],
  );

  // Scroll to first unanswered question
  const scrollToFirstUnanswered = useCallback(() => {
    scrollToQuestion(firstUnansweredQuestion);
  }, [firstUnansweredQuestion, scrollToQuestion]);

  // Track visible question for counter
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const questionItems = viewableItems.filter((item) => item.item?.type === 'question');
      if (questionItems.length > 0) {
        const firstVisible = questionItems[0].item as QuestionItem;
        setCurrentVisibleQuestion(firstVisible.questionNumber);
      }
    },
    [],
  );

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
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.primary + '10' }]}>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={20}
              color={theme.colors.primary}
            />
            <View style={styles.sectionHeaderContent}>
              <Text
                style={[theme.typography.h3, { color: theme.colors.primary, fontWeight: '600' }]}
              >
                {item.title}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {item.questionRange}
              </Text>
            </View>
          </View>
        );
      }

      if (item.type === 'footer') {
        return (
          <Card variant="outlined" style={[styles.infoCard, { borderColor: theme.colors.success }]}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons name="lock" size={24} color={theme.colors.success} />
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
      const isAnswered = questions.find(
        (q) => q.question_number === questionNumber && q.is_complete,
      );
      const isSaving = savingQuestion === questionNumber;

      return (
        <Card variant="elevated" style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View
              style={[
                styles.questionNumber,
                isAnswered
                  ? { backgroundColor: theme.colors.success }
                  : {
                      backgroundColor: theme.colors.surface,
                      borderWidth: 2,
                      borderColor: theme.colors.border,
                    },
              ]}
            >
              {isAnswered ? (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.textSecondary, fontWeight: '600' },
                  ]}
                >
                  {questionNumber}
                </Text>
              )}
            </View>
            <Text
              style={[theme.typography.h3, { color: theme.colors.text, flex: 1, lineHeight: 24 }]}
            >
              {item.prompt}
            </Text>
          </View>

          <Divider style={styles.questionDivider} />

          <TextArea
            label=""
            value={answers[questionNumber] || ''}
            onChangeText={(text) => setAnswers((prev) => ({ ...prev, [questionNumber]: text }))}
            placeholder="Take your time to reflect and write your answer here. Remember, this is a private space for your personal growth."
            containerStyle={styles.answerTextArea}
            minHeight={150}
            maxLength={2000}
            showCharacterCount
            editable={!isSaving}
            accessibilityLabel={`Answer for question ${questionNumber} of ${totalQuestions}`}
          />

          <Button
            title={isSaving ? 'Saving...' : isAnswered ? 'Update Answer' : 'Save Answer'}
            onPress={() => handleSaveAnswer(questionNumber)}
            disabled={!answers[questionNumber]?.trim() || isSaving}
            loading={isSaving}
            variant="primary"
            fullWidth
          />
        </Card>
      );
    },
    [questions, savingQuestion, answers, theme, handleSaveAnswer, totalQuestions],
  );

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.type === 'section') return `section-${item.title}`;
    if (item.type === 'footer') return 'footer';
    return `question-${item.questionNumber}`;
  }, []);

  const getItemLayout = useCallback(
    (data: ArrayLike<ListItem> | null | undefined, index: number) => ({
      length: 350, // Approximate height
      offset: 350 * index,
      index,
    }),
    [],
  );

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
        <View style={styles.lockedContainer}>
          <MaterialCommunityIcons name="lock" size={48} color={theme.colors.textSecondary} />
          <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 16 }]}>
            Step {stepNumber} is coming soon
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12 },
            ]}
          >
            We're building the full Step {stepNumber} experience next. For now, keep focusing on
            Step 1.
          </Text>
          <View style={{ marginTop: theme.spacing.lg, width: '100%' }}>
            <Button
              title="Back to Step 1"
              variant="primary"
              size="large"
              onPress={() => navigation.navigate('StepDetail', { stepNumber: 1 })}
              accessibilityLabel="Back to Step 1"
              accessibilityHint="Opens Step 1 questions"
            />
          </View>
          <View style={{ marginTop: theme.spacing.sm, width: '100%' }}>
            <Button
              title="Back to Steps"
              variant="outline"
              size="large"
              onPress={() => navigation.navigate('StepsOverview')}
              accessibilityLabel="Back to steps overview"
              accessibilityHint="Returns to the steps list"
            />
          </View>
        </View>
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
              <Skeleton variant="avatar" avatarSize={50} />
              <View style={[styles.headerContent, { gap: 8 }]}>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="50%" height={14} />
              </View>
            </View>
            <View style={styles.progressSection}>
              <Skeleton variant="text" width="100%" height={8} borderRadius={4} />
            </View>
          </Card>

          {/* Description skeleton */}
          <Card
            variant="outlined"
            style={[styles.descriptionCard, { borderColor: theme.colors.border }]}
          >
            <Skeleton variant="text" width="40%" height={12} />
            <View style={{ height: 8 }} />
            <Skeleton variant="text" width="100%" height={14} />
            <View style={{ height: 4 }} />
            <Skeleton variant="text" width="90%" height={14} />
          </Card>

          {/* Question cards skeleton */}
          <View style={{ padding: 16, gap: 16 }}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const answeredCount = questions.filter((q) => q.is_complete).length;
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
              <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary }]}>
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
                  style={[theme.typography.h3, { color: theme.colors.primary, fontWeight: '600' }]}
                >
                  {progressPercent}%
                </Text>
              </View>
              <ProgressBar progress={progressPercent / 100} style={styles.progressBar} />
            </View>

            {/* Continue Button */}
            {hasUnanswered && answeredCount > 0 && (
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: theme.colors.primary + '15' }]}
                onPress={scrollToFirstUnanswered}
                accessibilityLabel={`Continue at question ${firstUnansweredQuestion}`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.primary, marginLeft: 8, fontWeight: '600' },
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

          {/* Description */}
          <Card
            variant="outlined"
            style={[styles.descriptionCard, { borderColor: theme.colors.primary }]}
          >
            <View style={styles.descriptionHeader}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text
                style={[theme.typography.label, { color: theme.colors.primary, marginLeft: 8 }]}
              >
                STEP GUIDANCE
              </Text>
            </View>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text, lineHeight: 24, fontStyle: 'italic' },
              ]}
            >
              "{stepData.description}"
            </Text>
          </Card>

          {/* Question Counter */}
          <View style={[styles.questionCounter, { backgroundColor: theme.colors.surface }]}>
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
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#FFFFFF',
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
    borderTopColor: 'rgba(0,0,0,0.05)',
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
    borderRadius: 8,
    marginTop: 12,
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionCounter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
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
    borderRadius: 8,
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
