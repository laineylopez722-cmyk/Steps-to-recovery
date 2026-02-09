import { useMemo } from 'react';
import type { StepPrompt, StepWorkDecrypted } from '@recovery/shared';
import { buildQuestionIndexMap, buildStepListItems, type StepListItem } from '../utils/stepListItems';
import { buildAnsweredQuestionSet, getFirstUnansweredQuestion } from '../utils/stepAnswers';

interface UseStepDetailDerivedStateParams {
  stepData?: StepPrompt;
  questions: StepWorkDecrypted[];
}

interface UseStepDetailDerivedStateResult {
  totalQuestions: number;
  listItems: StepListItem[];
  questionIndexMap: Map<number, number>;
  answeredQuestionNumbers: Set<number>;
  firstUnansweredQuestion: number;
  answeredCount: number;
  hasUnanswered: boolean;
  progressPercent: number;
}

export function useStepDetailDerivedState({
  stepData,
  questions,
}: UseStepDetailDerivedStateParams): UseStepDetailDerivedStateResult {
  const totalQuestions = stepData?.prompts.length ?? 0;

  const listItems = useMemo(() => buildStepListItems(stepData), [stepData]);
  const questionIndexMap = useMemo(() => buildQuestionIndexMap(listItems), [listItems]);
  const answeredQuestionNumbers = useMemo(() => buildAnsweredQuestionSet(questions), [questions]);

  const firstUnansweredQuestion = useMemo(
    () => getFirstUnansweredQuestion(stepData, answeredQuestionNumbers),
    [stepData, answeredQuestionNumbers],
  );

  const answeredCount = answeredQuestionNumbers.size;
  const hasUnanswered = answeredCount < totalQuestions;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    listItems,
    questionIndexMap,
    answeredQuestionNumbers,
    firstUnansweredQuestion,
    answeredCount,
    hasUnanswered,
    progressPercent,
  };
}
