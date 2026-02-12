import React from 'react';
import { type FlatList, type ViewToken } from 'react-native';
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

export function StepDetailMainSections(props: StepDetailMainSectionsProps): React.ReactElement {
  return (
    <StepDetailQuestionsList
      listRef={props.listRef}
      listItems={props.listItems}
      answeredQuestionNumbers={props.answeredQuestionNumbers}
      savingQuestion={props.savingQuestion}
      answers={props.answers}
      totalQuestions={props.totalQuestions}
      onAnswerChange={props.onAnswerChange}
      onSaveAnswer={props.onSaveAnswer}
      onJumpToQuestion={props.onJumpToQuestion}
      onViewableItemsChanged={props.onViewableItemsChanged}
      viewabilityConfig={props.viewabilityConfig}
      stepNumber={props.stepNumber}
      title={props.title}
      principle={props.principle}
      description={props.description}
      answeredCount={props.answeredCount}
      progressPercent={props.progressPercent}
      hasUnanswered={props.hasUnanswered}
      firstUnansweredQuestion={props.firstUnansweredQuestion}
      onContinue={props.onContinue}
      onReviewAnswers={props.onReviewAnswers}
      showGuidance={props.showGuidance}
      onToggleGuidance={props.onToggleGuidance}
      currentVisibleQuestion={props.currentVisibleQuestion}
    />
  );
}
