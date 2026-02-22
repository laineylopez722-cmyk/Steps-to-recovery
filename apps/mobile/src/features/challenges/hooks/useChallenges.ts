/**
 * useChallenges Hook
 *
 * React Query hook for managing challenge lifecycle:
 * - List active / completed / available challenges
 * - Start and abandon challenges
 * - Auto-calculate progress from related tables
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import type { ChallengeDb, Challenge, ChallengeTemplate } from '../types';
import { CHALLENGE_TEMPLATES } from '../types';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
const challengeKeys = {
  all: ['challenges'] as const,
  byUser: (userId: string) => [...challengeKeys.all, userId] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function enrichChallenge(row: ChallengeDb): Challenge {
  const tmpl = CHALLENGE_TEMPLATES.find((t) => t.id === row.template_id);
  return {
    id: row.id,
    templateId: row.template_id,
    title: tmpl?.title ?? 'Unknown Challenge',
    description: tmpl?.description ?? '',
    type: tmpl?.type ?? 'journal',
    target: tmpl?.target ?? 0,
    duration: tmpl?.duration ?? 0,
    currentProgress: row.current_progress,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as Challenge['status'],
    reward: tmpl?.reward ?? '',
    difficulty: tmpl?.difficulty ?? 'easy',
    completedAt: row.completed_at,
    daysRemaining: daysRemaining(row.end_date),
  };
}

// ---------------------------------------------------------------------------
// Hook: useChallenges
// ---------------------------------------------------------------------------

export function useChallenges(userId: string): {
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  availableTemplates: ChallengeTemplate[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: challengeKeys.byUser(userId),
    queryFn: async () => {
      if (!db || !isReady) throw new Error('Database not ready');

      const rows = await db.getAllAsync<ChallengeDb>(
        'SELECT * FROM active_challenges WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
      );

      // Calculate live progress for each active challenge
      const enriched: Challenge[] = [];
      for (const row of rows) {
        const challenge = enrichChallenge(row);

        if (row.status === 'active') {
          const progress = await calculateProgress(db, userId, row.template_id, row.start_date);

          challenge.currentProgress = progress;

          // Auto-complete if target reached
          const tmpl = CHALLENGE_TEMPLATES.find((t) => t.id === row.template_id);
          if (tmpl && progress >= tmpl.target) {
            const now = new Date().toISOString();
            await db.runAsync(
              'UPDATE active_challenges SET current_progress = ?, status = ?, completed_at = ?, updated_at = ? WHERE id = ?',
              [progress, 'completed', now, now, row.id],
            );
            challenge.status = 'completed';
            challenge.completedAt = now;
          } else if (challenge.daysRemaining === 0 && progress < (tmpl?.target ?? 0)) {
            // Time expired — mark as failed
            const now = new Date().toISOString();
            await db.runAsync(
              'UPDATE active_challenges SET current_progress = ?, status = ?, updated_at = ? WHERE id = ?',
              [progress, 'failed', now, row.id],
            );
            challenge.status = 'failed';
          } else {
            // Persist latest progress snapshot
            await db.runAsync(
              'UPDATE active_challenges SET current_progress = ?, updated_at = ? WHERE id = ?',
              [progress, new Date().toISOString(), row.id],
            );
          }
        }

        enriched.push(challenge);
      }

      return enriched;
    },
    enabled: isReady && !!db,
    staleTime: 2 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const challenges = data ?? [];
  const activeChallenges = challenges.filter((c) => c.status === 'active');
  const completedChallenges = challenges.filter((c) => c.status === 'completed');

  // Templates that don't have an active instance
  const activeTemplateIds = new Set(
    challenges.filter((c) => c.status === 'active').map((c) => c.templateId),
  );
  const availableTemplates = CHALLENGE_TEMPLATES.filter((t) => !activeTemplateIds.has(t.id));

  return {
    activeChallenges,
    completedChallenges,
    availableTemplates,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

// ---------------------------------------------------------------------------
// Hook: useStartChallenge
// ---------------------------------------------------------------------------

export function useStartChallenge(userId: string): {
  startChallenge: (template: ChallengeTemplate) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, ChallengeTemplate>({
    mutationKey: ['startChallenge', userId],
    mutationFn: async (template) => {
      if (!db) throw new Error('Database not initialized');

      const id = generateId('challenge');
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + template.duration);

      await db.runAsync(
        `INSERT INTO active_challenges
          (id, template_id, user_id, start_date, end_date, current_progress, status, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 'active', NULL, ?, ?)`,
        [
          id,
          template.id,
          userId,
          now.toISOString(),
          endDate.toISOString(),
          now.toISOString(),
          now.toISOString(),
        ],
      );

      logger.info('Challenge started', { id, templateId: template.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.byUser(userId) });
    },
    onError: (err) => {
      logger.error('Failed to start challenge', err);
    },
  });

  return {
    startChallenge: (template) => mutation.mutateAsync(template),
    isPending: mutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Hook: useAbandonChallenge
// ---------------------------------------------------------------------------

export function useAbandonChallenge(userId: string): {
  abandonChallenge: (challengeId: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationKey: ['abandonChallenge', userId],
    mutationFn: async (challengeId) => {
      if (!db) throw new Error('Database not initialized');

      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE active_challenges SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?',
        ['failed', now, challengeId, userId],
      );

      logger.info('Challenge abandoned', { challengeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.byUser(userId) });
    },
    onError: (err) => {
      logger.error('Failed to abandon challenge', err);
    },
  });

  return {
    abandonChallenge: (id) => mutation.mutateAsync(id),
    isPending: mutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Progress calculators — query relevant tables per challenge type
// ---------------------------------------------------------------------------

async function calculateProgress(
  db: NonNullable<ReturnType<typeof useDatabase>['db']>,
  userId: string,
  templateId: string,
  startDate: string,
): Promise<number> {
  const tmpl = CHALLENGE_TEMPLATES.find((t) => t.id === templateId);
  if (!tmpl) return 0;

  switch (tmpl.type) {
    case 'journal':
      return countJournalEntries(db, userId, startDate);
    case 'checkin':
      return countCheckIns(db, userId, startDate, templateId);
    case 'step':
      return countStepWork(db, userId, startDate);
    case 'gratitude':
      return countGratitudeEntries(db, userId, startDate);
    case 'meeting':
      return countFavoriteMeetings(db, userId, startDate);
    default:
      return 0;
  }
}

async function countJournalEntries(
  db: NonNullable<ReturnType<typeof useDatabase>['db']>,
  userId: string,
  since: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(DISTINCT date(created_at)) as cnt FROM journal_entries WHERE user_id = ? AND created_at >= ?',
    [userId, since],
  );
  return result?.cnt ?? 0;
}

async function countCheckIns(
  db: NonNullable<ReturnType<typeof useDatabase>['db']>,
  userId: string,
  since: string,
  templateId: string,
): Promise<number> {
  // Morning Intention Month only counts morning check-ins
  const typeFilter = templateId === 'tmpl_30_morning' ? " AND check_in_type = 'morning'" : '';
  const result = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(DISTINCT check_in_date) as cnt FROM daily_checkins WHERE user_id = ? AND created_at >= ?${typeFilter}`,
    [userId, since],
  );
  return result?.cnt ?? 0;
}

async function countStepWork(
  db: NonNullable<ReturnType<typeof useDatabase>['db']>,
  userId: string,
  since: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM step_work WHERE user_id = ? AND is_complete = 1 AND created_at >= ?',
    [userId, since],
  );
  return result?.cnt ?? 0;
}

async function countGratitudeEntries(
  db: NonNullable<ReturnType<typeof useDatabase>['db']>,
  userId: string,
  since: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(DISTINCT entry_date) as cnt FROM gratitude_entries WHERE user_id = ? AND created_at >= ?',
    [userId, since],
  );
  return result?.cnt ?? 0;
}

async function countFavoriteMeetings(
  db: NonNullable<ReturnType<typeof useDatabase>['db']>,
  userId: string,
  since: string,
): Promise<number> {
  // Meetings attended ≈ favorite meetings added since challenge start
  const result = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM favorite_meetings WHERE user_id = ? AND created_at >= ?',
    [userId, since],
  );
  return result?.cnt ?? 0;
}

export { challengeKeys };
