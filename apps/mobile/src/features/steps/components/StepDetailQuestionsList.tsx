import React, { useCallback } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { StepSectionHeader } from './StepSectionHeader';
import { StepQuestionCard } from './StepQuestionCard';
import { StepPrivacyInfoCard } from './StepPrivacyInfoCard';
import { StepGuidanceCard } from './StepGuidanceCard';
import { stepListKeyExtractor } from '../utils/stepListConfig';
import type { StepListItem } from '../utils/stepListItems';

interface StepDetailQuestionsListProps {
  listRef: React.RefObject<FlatList<StepListItem> | null>;
  listItems: StepListItem[];
  answeredQuestionNumbers: Set<number>;
  savingQuestion: number | null;
  answers: Record<number, string>;
  totalQuestions: number;
  onAnswerChange: (questionNumber: number, text: string) => void;
  onSaveAnswer: (questionNumber: number) => void;
  onJumpToQuestion: (questionNumber: number) => void;
  onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: {
    itemVisiblePercentThreshold: number;
  };
  // Header data (scrolls with list)
  stepNumber: number;
  title: string;
  principle: string;
  description: string;
  answeredCount: number;
  progressPercent: number;
  hasUnanswered: boolean;
  firstUnansweredQuestion: number;
  onContinue: () => void;
  onReviewAnswers: () => void;
  showGuidance: boolean;
  onToggleGuidance: () => void;
  currentVisibleQuestion: number;
}

export function StepDetailQuestionsList({
  listRef,
  listItems,
  answeredQuestionNumbers,
  savingQuestion,
  answers,
  totalQuestions,
  onAnswerChange,
  onSaveAnswer,
  onJumpToQuestion,
  onViewableItemsChanged,
  viewabilityConfig,
  stepNumber,
  title,
  principle,
  description,
  answeredCount,
  progressPercent,
  hasUnanswered,
  firstUnansweredQuestion,
  onContinue,
  onReviewAnswers,
  showGuidance,
  onToggleGuidance,
  currentVisibleQuestion,
}: StepDetailQuestionsListProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<StepListItem>) => {
      if (item.type === 'section') {
        return (
          <StepSectionHeader
            title={item.title}
            questionRange={item.questionRange}
            sectionStart={item.sectionStart}
            onJumpToQuestion={onJumpToQuestion}
          />
        );
      }

      if (item.type === 'footer') {
        return <StepPrivacyInfoCard />;
      }

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
          onChangeAnswer={(text) => onAnswerChange(questionNumber, text)}
          onSave={() => onSaveAnswer(questionNumber)}
        />
      );
    },
    [
      answeredQuestionNumbers,
      answers,
      onAnswerChange,
      onJumpToQuestion,
      onSaveAnswer,
      savingQuestion,
      totalQuestions,
    ],
  );

  const safeTotal = Math.max(0, totalQuestions);

  const listHeader = (
    <View style={styles.listHeaderWrap}>
      {/* Compact step identity */}
      <View style={styles.compactHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{stepNumber}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={[theme.typography.h3, styles.stepTitle]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[theme.typography.caption, styles.metaText]}>{principle}</Text>
            <Text style={[theme.typography.caption, styles.metaText]}> • </Text>
            <Text style={[theme.typography.caption, styles.metaAccent]}>
              {answeredCount}/{safeTotal} done ({progressPercent}%)
            </Text>
          </View>
        </View>
        <Button
          title="Review"
          variant="outline"
          size="small"
          onPress={onReviewAnswers}
          accessibilityLabel="Review all answers"
        />
      </View>

      {/* Thin progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(0, Math.min(progressPercent, 100))}%` },
          ]}
        />
      </View>

      {/* Resume button (only when partially answered) */}
      {hasUnanswered && answeredCount > 0 && (
        <Pressable
          style={styles.resumeRow}
          onPress={onContinue}
          accessibilityLabel={`Continue at question ${firstUnansweredQuestion}`}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="play-circle-outline" size={16} color={ds.colors.accent} />
          <Text style={[theme.typography.caption, styles.resumeText]}>
            Resume at Q{firstUnansweredQuestion}
          </Text>
        </Pressable>
      )}

      {/* Scrollable jump chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {Array.from({ length: safeTotal }).map((_, index) => {
          const qNum = index + 1;
          const isCurrent = qNum === currentVisibleQuestion;
          const isAnswered = answeredQuestionNumbers.has(qNum);

          return (
            <Pressable
              key={qNum}
              onPress={() => onJumpToQuestion(qNum)}
              style={[
                styles.chip,
                isCurrent && styles.chipCurrent,
                !isCurrent && isAnswered && styles.chipAnswered,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Jump to question ${qNum}`}
            >
              <Text
                style={[
                  styles.chipText,
                  isCurrent && styles.chipTextCurrent,
                  !isCurrent && isAnswered && styles.chipTextAnswered,
                ]}
              >
                {qNum}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Guidance (collapsed by default) */}
      <StepGuidanceCard
        showGuidance={showGuidance}
        description={description}
        onToggle={onToggleGuidance}
      />
    </View>
  );

  return (
    <FlatList
      ref={listRef}
      data={listItems}
      renderItem={renderItem}
      keyExtractor={stepListKeyExtractor}
      ListHeaderComponent={listHeader}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      initialNumToRender={Platform.OS === 'android' ? 8 : 5}
      maxToRenderPerBatch={Platform.OS === 'android' ? 8 : 5}
      updateCellsBatchingPeriod={Platform.OS === 'android' ? 30 : 50}
      windowSize={Platform.OS === 'android' ? 7 : 5}
      removeClippedSubviews={Platform.OS !== 'web'}
      showsVerticalScrollIndicator
      maintainVisibleContentPosition={undefined}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }, 100);
      }}
    />
  );
}

const createStyles = (ds: DS) =>
  ({
    contentContainer: {
      paddingBottom: 32,
    },
    listHeaderWrap: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    // Compact header
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    stepBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: ds.colors.accent,
    },
    stepBadgeText: {
      fontSize: 16,
      fontWeight: '700',
      color: ds.semantic.text.onDark,
    },
    headerContent: {
      flex: 1,
    },
    stepTitle: {
      color: ds.colors.textPrimary,
      fontWeight: '700',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    metaText: {
      color: ds.colors.textTertiary,
    },
    metaAccent: {
      color: ds.colors.accent,
      fontWeight: '600',
    },
    // Progress
    progressTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: ds.colors.bgTertiary,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: ds.colors.accent,
    },
    // Resume
    resumeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: ds.colors.accentMuted,
      marginBottom: 8,
    },
    resumeText: {
      color: ds.colors.accent,
      fontWeight: '700',
    },
    // Chips
    chipScroll: {
      marginBottom: 8,
    },
    chipRow: {
      gap: 6,
    },
    chip: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      backgroundColor: ds.colors.bgSecondary,
    },
    chipCurrent: {
      backgroundColor: ds.colors.accent,
      borderColor: ds.colors.accent,
    },
    chipAnswered: {
      backgroundColor: ds.colors.successMuted,
      borderColor: ds.colors.success,
    },
    chipText: {
      ...ds.typography.micro,
      color: ds.colors.textTertiary,
      fontWeight: '600',
    },
    chipTextCurrent: {
      color: ds.semantic.text.onDark,
    },
    chipTextAnswered: {
      color: ds.colors.success,
    },
  }) as const;
