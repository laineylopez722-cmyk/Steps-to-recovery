import type { StepPrompt, StepWorkDecrypted } from '@recovery/shared';

export function buildInitialAnswers(questions: StepWorkDecrypted[]): Record<number, string> {
  return questions.reduce<Record<number, string>>((acc, question) => {
    if (question.answer) {
      acc[question.question_number] = question.answer;
    }
    return acc;
  }, {});
}

export function getFirstUnansweredQuestion(
  stepData: StepPrompt | undefined,
  answeredQuestionNumbers: Set<number>,
): number {
  if (!stepData) return 1;

  for (let i = 1; i <= stepData.prompts.length; i += 1) {
    if (!answeredQuestionNumbers.has(i)) {
      return i;
    }
  }

  return stepData.prompts.length;
}
