/**
 * Step Work Store
 * Progressive step work tracking with individual answers
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';
import { STEP_PROMPTS } from '../constants/stepPrompts';
import type { StepProgress, StepAnswer, DbStepProgress, DbStepAnswer, StepStatus } from '../types';

interface StepWorkState {
  progress: StepProgress[];
  answers: StepAnswer[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProgress: () => Promise<void>;
  loadAnswersForStep: (stepNumber: number) => Promise<void>;
  saveAnswer: (stepNumber: number, questionIndex: number, answer: string) => Promise<void>;
  updateStepStatus: (stepNumber: number, status: StepStatus) => Promise<void>;
  markStepDiscussed: (stepNumber: number) => Promise<void>;
  getStepProgress: (stepNumber: number) => StepProgress | undefined;
  getAnswer: (stepNumber: number, questionIndex: number) => StepAnswer | undefined;
  getDecryptedAnswer: (stepNumber: number, questionIndex: number) => Promise<string | null>;
  initializeStepProgress: () => Promise<void>;
  updateProgressFromAnswers: (stepNumber: number) => Promise<void>;
}

export const useStepWorkStore = create<StepWorkState>((set, get) => ({
  progress: [],
  answers: [],
  isLoading: false,
  error: null,

  /**
   * Initialize step progress for all 12 steps
   */
  initializeStepProgress: async () => {
    const db = await getDatabase();
    const now = new Date().toISOString();

    for (const step of STEP_PROMPTS) {
      const existing = await db.getFirstAsync<DbStepProgress>(
        'SELECT * FROM step_progress WHERE step_number = ?',
        [step.step],
      );

      if (!existing) {
        const id = uuidv4();
        // Step 1 is always available, others start locked
        const status: StepStatus = step.step === 1 ? 'available' : 'locked';

        await db.runAsync(
          `INSERT INTO step_progress (
            id, step_number, questions_answered, total_questions,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, step.step, 0, step.prompts.length, status, now, now],
        );
      }
    }

    // Reload progress after initialization
    await get().loadProgress();
  },

  /**
   * Load all step progress from database
   */
  loadProgress: async () => {
    set({ isLoading: true, error: null });

    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbStepProgress>(
        'SELECT * FROM step_progress ORDER BY step_number',
      );

      const progress: StepProgress[] = rows.map((row) => ({
        id: row.id,
        stepNumber: row.step_number,
        questionsAnswered: row.questions_answered,
        totalQuestions: row.total_questions,
        status: row.status as StepStatus,
        startedAt: row.started_at ? new Date(row.started_at) : undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        discussedAt: row.discussed_at ? new Date(row.discussed_at) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      // If no progress exists, initialize
      if (progress.length === 0) {
        await get().initializeStepProgress();
        return;
      }

      set({ progress, isLoading: false });
    } catch (error) {
      console.error('Failed to load step progress:', error);
      set({ error: 'Failed to load step progress', isLoading: false });
    }
  },

  /**
   * Load answers for a specific step
   */
  loadAnswersForStep: async (stepNumber: number) => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbStepAnswer>(
        'SELECT * FROM step_answers WHERE step_number = ? ORDER BY question_index',
        [stepNumber],
      );

      const stepAnswers: StepAnswer[] = rows.map((row) => ({
        id: row.id,
        stepNumber: row.step_number,
        questionIndex: row.question_index,
        answer: row.answer,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      // Merge with existing answers from other steps
      set((state) => ({
        answers: [...state.answers.filter((a) => a.stepNumber !== stepNumber), ...stepAnswers],
      }));
    } catch (error) {
      console.error('Failed to load step answers:', error);
    }
  },

  /**
   * Save or update an answer for a step question
   */
  saveAnswer: async (stepNumber: number, questionIndex: number, answer: string) => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const encryptedAnswer = await encryptContent(answer);

    try {
      // Check if answer already exists
      const existing = await db.getFirstAsync<DbStepAnswer>(
        'SELECT * FROM step_answers WHERE step_number = ? AND question_index = ?',
        [stepNumber, questionIndex],
      );

      if (existing) {
        // Update existing answer
        await db.runAsync('UPDATE step_answers SET answer = ?, updated_at = ? WHERE id = ?', [
          encryptedAnswer,
          now,
          existing.id,
        ]);

        set((state) => ({
          answers: state.answers.map((a) =>
            a.id === existing.id ? { ...a, answer: encryptedAnswer, updatedAt: new Date(now) } : a,
          ),
        }));
      } else {
        // Create new answer
        const id = uuidv4();
        await db.runAsync(
          `INSERT INTO step_answers (
            id, step_number, question_index, answer, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, stepNumber, questionIndex, encryptedAnswer, now, now],
        );

        const newAnswer: StepAnswer = {
          id,
          stepNumber,
          questionIndex,
          answer: encryptedAnswer,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        };

        set((state) => ({ answers: [...state.answers, newAnswer] }));
      }

      // Update step progress
      await get().updateProgressFromAnswers(stepNumber);
    } catch (error) {
      console.error('Failed to save step answer:', error);
      throw error;
    }
  },

  /**
   * Update step status manually
   */
  updateStepStatus: async (stepNumber: number, status: StepStatus) => {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const updates: Record<string, string | null> = {
      status,
      updated_at: now,
    };

    if (status === 'started' || status === 'in_progress') {
      // Check if started_at is already set
      const existing = await db.getFirstAsync<DbStepProgress>(
        'SELECT started_at FROM step_progress WHERE step_number = ?',
        [stepNumber],
      );
      if (!existing?.started_at) {
        updates.started_at = now;
      }
    }

    if (status === 'completed') {
      updates.completed_at = now;

      // Unlock next step
      if (stepNumber < 12) {
        await db.runAsync(
          `UPDATE step_progress SET status = 'available', updated_at = ? 
           WHERE step_number = ? AND status = 'locked'`,
          [now, stepNumber + 1],
        );
      }
    }

    const setClauses = Object.entries(updates)
      .map(([key]) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), stepNumber];

    await db.runAsync(`UPDATE step_progress SET ${setClauses} WHERE step_number = ?`, values);

    // Reload progress
    await get().loadProgress();
  },

  /**
   * Mark step as discussed with sponsor
   */
  markStepDiscussed: async (stepNumber: number) => {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE step_progress SET status = 'discussed', discussed_at = ?, updated_at = ? 
       WHERE step_number = ?`,
      [now, now, stepNumber],
    );

    // Reload progress
    await get().loadProgress();
  },

  /**
   * Get progress for a specific step
   */
  getStepProgress: (stepNumber: number) => {
    return get().progress.find((p) => p.stepNumber === stepNumber);
  },

  /**
   * Get answer for a specific question
   */
  getAnswer: (stepNumber: number, questionIndex: number) => {
    return get().answers.find(
      (a) => a.stepNumber === stepNumber && a.questionIndex === questionIndex,
    );
  },

  /**
   * Get decrypted answer for a specific question
   */
  getDecryptedAnswer: async (stepNumber: number, questionIndex: number) => {
    const answer = get().getAnswer(stepNumber, questionIndex);
    if (!answer) return null;

    try {
      return await decryptContent(answer.answer);
    } catch (error) {
      console.error('Failed to decrypt answer:', error);
      return null;
    }
  },

  /**
   * Internal: Update progress based on answered questions
   */
  updateProgressFromAnswers: async (stepNumber: number) => {
    const db = await getDatabase();
    const now = new Date().toISOString();

    // Count answered questions
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM step_answers WHERE step_number = ?',
      [stepNumber],
    );
    const answeredCount = result?.count || 0;

    // Get total questions
    const step = STEP_PROMPTS.find((s) => s.step === stepNumber);
    const totalQuestions = step?.prompts.length || 0;

    // Determine new status
    let newStatus: StepStatus;
    const progress = get().getStepProgress(stepNumber);
    const currentStatus = progress?.status || 'locked';

    if (answeredCount === 0) {
      newStatus = currentStatus === 'locked' ? 'locked' : 'available';
    } else if (answeredCount < totalQuestions * 0.5) {
      newStatus = 'started';
    } else if (answeredCount < totalQuestions) {
      newStatus = 'in_progress';
    } else {
      newStatus = currentStatus === 'discussed' ? 'discussed' : 'completed';
    }

    // Update progress
    await db.runAsync(
      `UPDATE step_progress SET 
        questions_answered = ?, status = ?, updated_at = ?
        ${newStatus === 'started' && currentStatus !== 'started' ? ", started_at = '" + now + "'" : ''}
        ${newStatus === 'completed' && currentStatus !== 'completed' && currentStatus !== 'discussed' ? ", completed_at = '" + now + "'" : ''}
       WHERE step_number = ?`,
      [answeredCount, newStatus, now, stepNumber],
    );

    // Unlock next step if completed
    if (newStatus === 'completed' && stepNumber < 12) {
      await db.runAsync(
        `UPDATE step_progress SET status = 'available', updated_at = ? 
         WHERE step_number = ? AND status = 'locked'`,
        [now, stepNumber + 1],
      );
    }

    // Reload progress
    await get().loadProgress();
  },
}));
