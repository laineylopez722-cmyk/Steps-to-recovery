import type { StepListItem } from './stepListItems';

const APPROX_ITEM_HEIGHT = 350;

export function stepListKeyExtractor(item: StepListItem): string {
  if (item.type === 'section') return `section-${item.title}`;
  if (item.type === 'footer') return 'footer';
  return `question-${item.questionNumber}`;
}

export function getStepListItemLayout(
  _data: ArrayLike<StepListItem> | null | undefined,
  index: number,
): { length: number; offset: number; index: number } {
  return {
    length: APPROX_ITEM_HEIGHT,
    offset: APPROX_ITEM_HEIGHT * index,
    index,
  };
}
