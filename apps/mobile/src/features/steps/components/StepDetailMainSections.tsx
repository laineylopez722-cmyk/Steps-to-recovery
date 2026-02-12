import React from 'react';
import { type FlatList, type ViewToken } from 'react-native';
import { StepSingleQuestionView } from './StepSingleQuestionView';
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
    <StepSingleQuestionView
      stepNumber={props.stepNumber}
      title={props.title}
      principle={props.principle}
      description={props.description}
      totalQuestions={props.totalQuestions}
      answeredCount={props.answeredCount}
      progressPercent={props.progressPercent}
      currentVisibleQuestion={props.currentVisibleQuestion}
      answeredQuestionNumbers={props.answeredQuestionNumbers}
      answers={props.answers}
      savingQuestion={props.savingQuestion}
      onAnswerChange={props.onAnswerChange}
      onSaveAnswer={props.onSaveAnswer}
      onJumpToQuestion={props.onJumpToQuestion}
      onReviewAnswers={props.onReviewAnswers}
      showGuidance={props.showGuidance}
      onToggleGuidance={props.onToggleGuidance}
      listItems={props.listItems}
    />
  );
}
