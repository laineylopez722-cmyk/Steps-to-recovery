import React from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type FlatList,
  type ViewToken,
} from 'react-native';
import { StepGuidanceCard } from './StepGuidanceCard';
import { StepDetailHeaderCard } from './StepDetailHeaderCard';
import { StepQuestionCounter } from './StepQuestionCounter';
import { StepDetailQuestionsList } from './StepDetailQuestionsList';
import type { StepListItem } from '../utils/stepListItems';

export interface StepDetailMainContentProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  stepNumber: number;
  title: string;
  principle: string;
  description: string;
  totalQuestions: number;
  answeredCount: number;
  progressPercent: number;
  hasUnanswered: boolean;
  firstUnansweredQuestion: number;
  onContinue: () => void;
  onReviewAnswers: () => void;
  showGuidance: boolean;
  onToggleGuidance: () => void;
  currentVisibleQuestion: number;
  listRef: React.RefObject<FlatList<StepListItem> | null>;
  listItems: StepListItem[];
  answeredQuestionNumbers: Set<number>;
  savingQuestion: number | null;
  answers: Record<number, string>;
  onAnswerChange: (questionNumber: number, text: string) => void;
  onSaveAnswer: (questionNumber: number) => void;
  onJumpToQuestion: (questionNumber: number) => void;
  onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: {
    itemVisiblePercentThreshold: number;
  };
}

export function StepDetailMainContent({
  fadeAnim,
  slideAnim,
  stepNumber,
  title,
  principle,
  description,
  totalQuestions,
  answeredCount,
  progressPercent,
  hasUnanswered,
  firstUnansweredQuestion,
  onContinue,
  onReviewAnswers,
  showGuidance,
  onToggleGuidance,
  currentVisibleQuestion,
  listRef,
  listItems,
  answeredQuestionNumbers,
  savingQuestion,
  answers,
  onAnswerChange,
  onSaveAnswer,
  onJumpToQuestion,
  onViewableItemsChanged,
  viewabilityConfig,
}: StepDetailMainContentProps): React.ReactElement {
  return (
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
        <StepDetailHeaderCard
          stepNumber={stepNumber}
          title={title}
          principle={principle}
          totalQuestions={totalQuestions}
          answeredCount={answeredCount}
          progressPercent={progressPercent}
          showContinue={hasUnanswered && answeredCount > 0}
          firstUnansweredQuestion={firstUnansweredQuestion}
          onContinue={onContinue}
          onReviewAnswers={onReviewAnswers}
        />

        <StepGuidanceCard
          showGuidance={showGuidance}
          description={description}
          onToggle={onToggleGuidance}
        />

        <StepQuestionCounter
          currentQuestion={currentVisibleQuestion}
          totalQuestions={totalQuestions}
        />

        <StepDetailQuestionsList
          listRef={listRef}
          listItems={listItems}
          answeredQuestionNumbers={answeredQuestionNumbers}
          savingQuestion={savingQuestion}
          answers={answers}
          totalQuestions={totalQuestions}
          onAnswerChange={onAnswerChange}
          onSaveAnswer={onSaveAnswer}
          onJumpToQuestion={onJumpToQuestion}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
});
