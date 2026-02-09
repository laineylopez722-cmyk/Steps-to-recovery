import type { ViewToken } from 'react-native';
import type { StepListItem, QuestionItem } from './stepListItems';

export function getFirstVisibleQuestionNumber(viewableItems: ViewToken[]): number | null {
  const questionItem = viewableItems.find((token) => {
    const item = token.item as StepListItem | undefined;
    return item?.type === 'question';
  });

  if (!questionItem) return null;

  const question = questionItem.item as QuestionItem;
  return question.questionNumber;
}
