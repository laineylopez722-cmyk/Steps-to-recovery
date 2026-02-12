import React from 'react';
import { type FlatList, type ViewToken } from 'react-native';
import { StepGuidanceCard } from './StepGuidanceCard';
import { StepDetailHeaderCard } from './StepDetailHeaderCard';
import { StepQuestionCounter } from './StepQuestionCounter';
import { StepDetailQuestionsList } from './StepDetailQuestionsList';
import type { StepListItem } from '../utils/stepListItems';

export interface StepDetailMainSectionsProps {
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
  answeredQuestionNumbers: Set<number>;
  listRef: React.RefObject<FlatList<StepListItem> | null>;
  listItems: StepListItem[];
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

export function StepDetailMainSections({
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
}: StepDetailMainSectionsProps): React.ReactElement {
  return (
    <>
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

      <StepQuestionCounter
        currentQuestion={currentVisibleQuestion}
        totalQuestions={totalQuestions}
        answeredQuestionNumbers={answeredQuestionNumbers}
        onJumpToQuestion={onJumpToQuestion}
      />

      <StepGuidanceCard
        showGuidance={showGuidance}
        description={description}
        onToggle={onToggleGuidance}
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
    </>
  );
}
