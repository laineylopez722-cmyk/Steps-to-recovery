/**
 * Step Questions Data Module
 *
 * Provides a flat, indexed view of all 12-step questions for features
 * that need per-question metadata (search, analytics, progress tracking).
 *
 * The canonical question bank lives in @recovery/shared (stepPrompts.ts).
 * This module transforms that data into a convenient lookup structure.
 *
 * @module features/steps/data/stepQuestions
 */

import { STEP_PROMPTS, type StepPrompt, type StepSection } from '@recovery/shared';

export interface StepQuestion {
  /** Unique ID: "step-{stepNumber}-q-{questionNumber}" */
  id: string;
  /** Step number (1-12) */
  stepNumber: number;
  /** Question number within the step (1-based) */
  questionNumber: number;
  /** The question/prompt text */
  text: string;
  /** Optional help text derived from section context */
  helpText?: string;
  /** Section category this question belongs to */
  category?: string;
}

/**
 * Build a flat list of StepQuestion objects from a StepPrompt.
 * Preserves section/category information when available.
 */
function buildQuestionsFromStep(stepPrompt: StepPrompt): StepQuestion[] {
  const questions: StepQuestion[] = [];

  if (stepPrompt.sections && stepPrompt.sections.length > 0) {
    let questionNumber = 0;
    stepPrompt.sections.forEach((section: StepSection) => {
      section.prompts.forEach((prompt: string) => {
        questionNumber++;
        questions.push({
          id: `step-${stepPrompt.step}-q-${questionNumber}`,
          stepNumber: stepPrompt.step,
          questionNumber,
          text: prompt,
          category: section.title,
        });
      });
    });
  } else {
    stepPrompt.prompts.forEach((prompt: string, index: number) => {
      const questionNumber = index + 1;
      questions.push({
        id: `step-${stepPrompt.step}-q-${questionNumber}`,
        stepNumber: stepPrompt.step,
        questionNumber,
        text: prompt,
      });
    });
  }

  return questions;
}

/**
 * All step questions indexed by step number (1-12).
 * Each step contains 25-80 questions organized with category metadata.
 */
export const STEP_QUESTIONS: Record<number, StepQuestion[]> = Object.fromEntries(
  STEP_PROMPTS.map((stepPrompt) => [stepPrompt.step, buildQuestionsFromStep(stepPrompt)]),
);

/**
 * Step metadata for display (title, principle, description).
 */
export interface StepMeta {
  stepNumber: number;
  title: string;
  principle: string;
  description: string;
  totalQuestions: number;
  categories: string[];
}

/**
 * Metadata for all 12 steps, derived from the shared step prompts.
 */
export const STEP_META: Record<number, StepMeta> = Object.fromEntries(
  STEP_PROMPTS.map((stepPrompt) => {
    const categories = stepPrompt.sections
      ? stepPrompt.sections.map((s: StepSection) => s.title)
      : [];
    return [
      stepPrompt.step,
      {
        stepNumber: stepPrompt.step,
        title: stepPrompt.title,
        principle: stepPrompt.principle,
        description: stepPrompt.description,
        totalQuestions: stepPrompt.prompts.length,
        categories,
      },
    ];
  }),
);

/**
 * Get questions for a specific step.
 *
 * @param stepNumber - Step number (1-12)
 * @returns Array of StepQuestion objects, or empty array if step not found
 */
export function getStepQuestions(stepNumber: number): StepQuestion[] {
  return STEP_QUESTIONS[stepNumber] ?? [];
}

/**
 * Get questions for a specific category within a step.
 *
 * @param stepNumber - Step number (1-12)
 * @param category - Section/category title
 * @returns Filtered array of StepQuestion objects
 */
export function getStepQuestionsByCategory(stepNumber: number, category: string): StepQuestion[] {
  return getStepQuestions(stepNumber).filter((q) => q.category === category);
}

/**
 * Get the total number of questions across all 12 steps.
 */
export function getTotalQuestionCount(): number {
  return Object.values(STEP_QUESTIONS).reduce((sum, questions) => sum + questions.length, 0);
}
