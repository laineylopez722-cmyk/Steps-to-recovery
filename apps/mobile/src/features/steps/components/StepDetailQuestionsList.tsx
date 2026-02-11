import React, { useCallback } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';
import { StepSectionHeader } from './StepSectionHeader';
import { StepQuestionCard } from './StepQuestionCard';
import { StepPrivacyInfoCard } from './StepPrivacyInfoCard';
import { getStepListItemLayout, stepListKeyExtractor } from '../utils/stepListConfig';
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
}: StepDetailQuestionsListProps): React.ReactElement {
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

  return (
    <FlatList
      ref={listRef}
      data={listItems}
      renderItem={renderItem}
      keyExtractor={stepListKeyExtractor}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={getStepListItemLayout}
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

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
});
