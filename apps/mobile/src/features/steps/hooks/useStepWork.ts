import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addToSyncQueue } from '../../../services/syncService';
import { STEP_PROMPTS, type StepWork, type StepWorkDecrypted } from '@recovery/shared';

/**
 * Decrypt step work from database format to UI format
 */
async function decryptStepWork(stepWork: StepWork): Promise<StepWorkDecrypted> {
  const answer = stepWork.encrypted_answer ? await decryptContent(stepWork.encrypted_answer) : null;

  return {
    id: stepWork.id,
    user_id: stepWork.user_id,
    step_number: stepWork.step_number,
    question_number: stepWork.question_number,
    answer,
    is_complete: stepWork.is_complete === 1,
    completed_at: stepWork.completed_at,
    created_at: stepWork.created_at,
    updated_at: stepWork.updated_at,
    sync_status: stepWork.sync_status,
    supabase_id: stepWork.supabase_id ?? null,
  };
}

/**
 * Hook to get all step work for a specific step
 */
export function useStepWork(
  userId: string,
  stepNumber: number,
): {
  questions: StepWorkDecrypted[];
  progress: number;
  isLoading: boolean;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error } = useQuery({
    queryKey: ['step_work', userId, stepNumber],
    queryFn: async () => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }
      try {
        const result = await db.getAllAsync<StepWork>(
          'SELECT * FROM step_work WHERE user_id = ? AND step_number = ? ORDER BY question_number ASC',
          [userId, stepNumber],
        );

        const decrypted = await Promise.all(result.map(decryptStepWork));
        const completed = decrypted.filter((q) => q.is_complete).length;
        const total = decrypted.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        return { questions: decrypted, progress };
      } catch (err) {
        logger.error('Failed to fetch step work', err);
        throw err;
      }
    },
    enabled: isReady && !!db,
  });

  return {
    questions: data?.questions || [],
    progress: data?.progress || 0,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook to save answer to a step question
 */
export function useSaveStepAnswer(userId: string): {
  saveAnswer: (
    stepNumber: number,
    questionNumber: number,
    answer: string,
    isComplete: boolean,
  ) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      stepNumber,
      questionNumber,
      answer,
      isComplete,
    }: {
      stepNumber: number;
      questionNumber: number;
      answer: string;
      isComplete: boolean;
    }) => {
      if (!db) throw new Error('Database not initialized');

      try {
        const encrypted_answer = await encryptContent(answer);
        const now = new Date().toISOString();

        // Check if answer already exists
        const existing = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM step_work WHERE user_id = ? AND step_number = ? AND question_number = ?',
          [userId, stepNumber, questionNumber],
        );

        if (existing) {
          // Update existing answer
          await db.runAsync(
            'UPDATE step_work SET encrypted_answer = ?, is_complete = ?, completed_at = ?, updated_at = ?, sync_status = ? WHERE user_id = ? AND step_number = ? AND question_number = ?',
            [
              encrypted_answer,
              isComplete ? 1 : 0,
              isComplete ? now : null,
              now,
              'pending',
              userId,
              stepNumber,
              questionNumber,
            ],
          );

          // Add to sync queue for cloud backup
          await addToSyncQueue(db, 'step_work', existing.id, 'update');
        } else {
          // Create new answer
          const id = generateId('step');
          await db.runAsync(
            'INSERT INTO step_work (id, user_id, step_number, question_number, encrypted_answer, is_complete, completed_at, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              id,
              userId,
              stepNumber,
              questionNumber,
              encrypted_answer,
              isComplete ? 1 : 0,
              isComplete ? now : null,
              now,
              now,
              'pending',
            ],
          );

          // Add to sync queue for cloud backup
          await addToSyncQueue(db, 'step_work', id, 'insert');
        }

        logger.info('Step answer saved', { stepNumber, questionNumber });
      } catch (err) {
        logger.error('Failed to save step answer', err);
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['step_work', userId, variables.stepNumber] });
    },
  });

  return {
    saveAnswer: (stepNumber, questionNumber, answer, isComplete) =>
      mutation.mutateAsync({ stepNumber, questionNumber, answer, isComplete }),
    isPending: mutation.isPending,
  };
}

/**
 * Hook to get overall step progress
 */
export function useStepProgress(userId: string): {
  stepsCompleted: number[];
  currentStep: number;
  overallProgress: number;
  stepDetails: Array<{ stepNumber: number; answered: number; total: number; percent: number }>;
  isLoading: boolean;
} {
  const { db } = useDatabase();

  const { data, isLoading } = useQuery({
    queryKey: ['step_progress', userId],
    queryFn: async () => {
      if (!db) return { stepsCompleted: [], currentStep: 1, overallProgress: 0, stepDetails: [] };

      try {
        const result = await db.getAllAsync<{ step_number: number; answered: number }>(
          `SELECT
            step_number,
            SUM(CASE WHEN is_complete = 1 THEN 1 ELSE 0 END) as answered
           FROM step_work
           WHERE user_id = ?
           GROUP BY step_number`,
          [userId],
        );

        const answeredMap = new Map<number, number>(
          result.map((row) => [row.step_number, row.answered || 0]),
        );

        const stepDetails = STEP_PROMPTS.map((step) => {
          const answered = answeredMap.get(step.step) ?? 0;
          const total = step.prompts.length;
          const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
          return {
            stepNumber: step.step,
            answered,
            total,
            percent,
          };
        });

        const stepsCompleted = stepDetails
          .filter((detail) => detail.total > 0 && detail.answered >= detail.total)
          .map((detail) => detail.stepNumber);

        const currentStep =
          stepDetails.find((detail) => detail.answered < detail.total)?.stepNumber ?? 1;
        const overallProgress = (stepsCompleted.length / 12) * 100;

        return { stepsCompleted, currentStep, overallProgress, stepDetails };
      } catch (err) {
        logger.error('Failed to calculate step progress', err);
        return { stepsCompleted: [], currentStep: 1, overallProgress: 0, stepDetails: [] };
      }
    },
    enabled: !!db,
  });

  return {
    stepsCompleted: data?.stepsCompleted ?? [],
    currentStep: data?.currentStep ?? 1,
    overallProgress: data?.overallProgress ?? 0,
    stepDetails: data?.stepDetails ?? [],
    isLoading,
  };
}
