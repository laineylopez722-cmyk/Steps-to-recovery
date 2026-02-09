import { useCallback, useEffect, useState } from 'react';
import type { StepWorkDecrypted } from '@recovery/shared';
import { buildInitialAnswers } from '../utils/stepAnswers';

interface UseStepAnswersStateResult {
  answers: Record<number, string>;
  handleAnswerChange: (questionNumber: number, text: string) => void;
}

export function useStepAnswersState(
  questions: StepWorkDecrypted[],
): UseStepAnswersStateResult {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(buildInitialAnswers(questions));
    }
  }, [questions]);

  const handleAnswerChange = useCallback((questionNumber: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionNumber]: text }));
  }, []);

  return {
    answers,
    handleAnswerChange,
  };
}
