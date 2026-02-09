import type { StepPrompt, StepSection } from '@recovery/shared';

export interface QuestionItem {
  type: 'question';
  questionNumber: number;
  prompt: string;
  sectionTitle?: string;
}

export interface SectionHeaderItem {
  type: 'section';
  title: string;
  questionRange: string;
  sectionStart: number;
}

export interface FooterItem {
  type: 'footer';
}

export type StepListItem = QuestionItem | SectionHeaderItem | FooterItem;

export function buildQuestionIndexMap(items: StepListItem[]): Map<number, number> {
  const map = new Map<number, number>();

  items.forEach((item, index) => {
    if (item.type === 'question') {
      map.set(item.questionNumber, index);
    }
  });

  return map;
}

export function buildStepListItems(stepData?: StepPrompt): StepListItem[] {
  if (!stepData) return [];

  const items: StepListItem[] = [];

  if (stepData.sections && stepData.sections.length > 0) {
    let questionIndex = 0;
    stepData.sections.forEach((section: StepSection) => {
      const sectionStart = questionIndex + 1;
      const sectionEnd = questionIndex + section.prompts.length;

      items.push({
        type: 'section',
        title: section.title,
        questionRange: `Questions ${sectionStart}-${sectionEnd}`,
        sectionStart,
      });

      section.prompts.forEach((prompt: string) => {
        questionIndex++;
        items.push({
          type: 'question',
          questionNumber: questionIndex,
          prompt,
          sectionTitle: section.title,
        });
      });
    });
  } else {
    stepData.prompts.forEach((prompt: string, index: number) => {
      items.push({
        type: 'question',
        questionNumber: index + 1,
        prompt,
      });
    });
  }

  items.push({ type: 'footer' });
  return items;
}
