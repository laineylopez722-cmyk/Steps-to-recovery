/**
 * Craving Tracker Hook
 *
 * Tracks cravings with time-based analysis and intervention suggestions.
 * Provides insights on craving patterns (time of day, triggers, duration).
 *
 * **Features**:
 * - Log cravings with intensity, triggers, and location
 * - Track craving duration ("riding the wave")
 * - Pattern analysis (peak times, common triggers)
 * - JITAI-ready context for adaptive interventions
 *
 * @example
 * ```ts
 * const {
 *   activeCraving,
 *   startCraving,
 *   endCraving,
 *   cravingHistory,
 *   patterns,
 * } = useCravingTracker();
 *
 * // User reports craving
 * startCraving({ intensity: 7, trigger: 'stress' });
 *
 * // Later, craving passes
 * endCraving({ didUse: false, copingStrategy: 'called sponsor' });
 * ```
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { encryptContent, decryptContent } from '../utils/encryption';
import { addToSyncQueue } from '../services/syncService';
import { generateUUID } from '../utils/uuid';
import { logger } from '../utils/logger';

type CravingTrigger =
  | 'stress'
  | 'boredom'
  | 'anger'
  | 'loneliness'
  | 'celebration'
  | 'social_pressure'
  | 'environmental'
  | 'physical_pain'
  | 'habit'
  | 'other';

type CopingStrategy =
  | 'called_sponsor'
  | 'called_support'
  | 'meeting'
  | 'breathing'
  | 'distraction'
  | 'exercise'
  | 'journaling'
  | 'prayer_meditation'
  | 'played_tape_forward'
  | 'other';

interface CravingEntry {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  intensity: number; // 1-10
  trigger: CravingTrigger | null;
  location: string | null;
  notes: string | null;
  did_use: boolean | null;
  coping_strategy: CopingStrategy | null;
  duration_seconds: number | null;
}

interface ActiveCraving {
  id: string;
  startedAt: Date;
  intensity: number;
  trigger: CravingTrigger | null;
  elapsedSeconds: number;
}

interface CravingPatterns {
  /** Most common time of day (hour) */
  peakHour: number | null;
  /** Most common trigger */
  topTrigger: CravingTrigger | null;
  /** Average craving duration in minutes */
  avgDurationMinutes: number;
  /** Most effective coping strategy */
  topCopingStrategy: CopingStrategy | null;
  /** Success rate (cravings that didn't lead to use) */
  successRate: number;
  /** Total cravings logged */
  totalCravings: number;
  /** Cravings this week */
  cravingsThisWeek: number;
}

interface StartCravingParams {
  intensity: number;
  trigger?: CravingTrigger;
  location?: string;
  notes?: string;
}

interface EndCravingParams {
  didUse: boolean;
  copingStrategy?: CopingStrategy;
  notes?: string;
}

interface CravingTrackerState {
  /** Currently active craving (if any) */
  activeCraving: ActiveCraving | null;
  /** Recent craving history (last 30 days) */
  cravingHistory: CravingEntry[];
  /** Analyzed patterns */
  patterns: CravingPatterns;
  /** Loading state */
  isLoading: boolean;
}

interface CravingTrackerActions {
  /** Start tracking a craving */
  startCraving: (params: StartCravingParams) => Promise<void>;
  /** End the active craving */
  endCraving: (params: EndCravingParams) => Promise<void>;
  /** Cancel active craving (false alarm) */
  cancelCraving: () => void;
  /** Refresh history from database */
  refresh: () => Promise<void>;
}

const TRIGGER_LABELS: Record<CravingTrigger, string> = {
  stress: 'Stress',
  boredom: 'Boredom',
  anger: 'Anger',
  loneliness: 'Loneliness',
  celebration: 'Celebration',
  social_pressure: 'Social Pressure',
  environmental: 'Environmental Cue',
  physical_pain: 'Physical Pain',
  habit: 'Habit/Routine',
  other: 'Other',
};

const COPING_LABELS: Record<CopingStrategy, string> = {
  called_sponsor: 'Called Sponsor',
  called_support: 'Called Support Person',
  meeting: 'Went to Meeting',
  breathing: 'Breathing Exercise',
  distraction: 'Healthy Distraction',
  exercise: 'Exercise',
  journaling: 'Journaling',
  prayer_meditation: 'Prayer/Meditation',
  played_tape_forward: 'Played Tape Forward',
  other: 'Other',
};

export function useCravingTracker(): CravingTrackerState & CravingTrackerActions {
  const { db, isReady } = useDatabase();
  const { user } = useAuth();

  const [activeCraving, setActiveCraving] = useState<ActiveCraving | null>(null);
  const [cravingHistory, setCravingHistory] = useState<CravingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update elapsed time for active craving
  useEffect(() => {
    if (!activeCraving) {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
      return;
    }

    elapsedIntervalRef.current = setInterval(() => {
      setActiveCraving((prev) => {
        if (!prev) return null;
        const elapsed = Math.floor((Date.now() - prev.startedAt.getTime()) / 1000);
        return { ...prev, elapsedSeconds: elapsed };
      });
    }, 1000);

    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
    };
  }, [activeCraving?.id]);

  // Calculate patterns from history
  const patterns = useMemo((): CravingPatterns => {
    if (cravingHistory.length === 0) {
      return {
        peakHour: null,
        topTrigger: null,
        avgDurationMinutes: 0,
        topCopingStrategy: null,
        successRate: 0,
        totalCravings: 0,
        cravingsThisWeek: 0,
      };
    }

    // Hour distribution
    const hourCounts: Record<number, number> = {};
    cravingHistory.forEach((c) => {
      const hour = new Date(c.started_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

    // Trigger distribution
    const triggerCounts: Record<string, number> = {};
    cravingHistory.forEach((c) => {
      if (c.trigger) {
        triggerCounts[c.trigger] = (triggerCounts[c.trigger] || 0) + 1;
      }
    });
    const topTrigger = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as
      | CravingTrigger
      | undefined;

    // Average duration
    const durationsMinutes = cravingHistory
      .filter((c) => c.duration_seconds !== null)
      .map((c) => (c.duration_seconds ?? 0) / 60);
    const avgDurationMinutes =
      durationsMinutes.length > 0 ? durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length : 0;

    // Top coping strategy
    const copingCounts: Record<string, number> = {};
    cravingHistory.forEach((c) => {
      if (c.coping_strategy && c.did_use === false) {
        copingCounts[c.coping_strategy] = (copingCounts[c.coping_strategy] || 0) + 1;
      }
    });
    const topCopingStrategy = Object.entries(copingCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as
      | CopingStrategy
      | undefined;

    // Success rate
    const completedCravings = cravingHistory.filter((c) => c.did_use !== null);
    const successfulCravings = completedCravings.filter((c) => c.did_use === false);
    const successRate = completedCravings.length > 0 ? (successfulCravings.length / completedCravings.length) * 100 : 0;

    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cravingsThisWeek = cravingHistory.filter((c) => new Date(c.started_at) >= weekAgo).length;

    return {
      peakHour: peakHour ? parseInt(peakHour, 10) : null,
      topTrigger: topTrigger || null,
      avgDurationMinutes: Math.round(avgDurationMinutes * 10) / 10,
      topCopingStrategy: topCopingStrategy || null,
      successRate: Math.round(successRate),
      totalCravings: cravingHistory.length,
      cravingsThisWeek,
    };
  }, [cravingHistory]);

  // Load craving history
  const loadHistory = useCallback(async (): Promise<void> => {
    if (!db || !isReady || !user) return;

    setIsLoading(true);

    try {
      // Get cravings from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const rows = await db.getAllAsync<{
        id: string;
        user_id: string;
        started_at: string;
        ended_at: string | null;
        encrypted_data: string;
        did_use: number | null;
        duration_seconds: number | null;
      }>(
        `SELECT * FROM cravings
         WHERE user_id = ? AND started_at >= ?
         ORDER BY started_at DESC`,
        [user.id, thirtyDaysAgo.toISOString()],
      );

      // Decrypt entries
      const decrypted: CravingEntry[] = await Promise.all(
        rows.map(async (row) => {
          try {
            const data = JSON.parse(await decryptContent(row.encrypted_data)) as {
              intensity: number;
              trigger: CravingTrigger | null;
              location: string | null;
              notes: string | null;
              coping_strategy: CopingStrategy | null;
            };
            return {
              id: row.id,
              user_id: row.user_id,
              started_at: row.started_at,
              ended_at: row.ended_at,
              intensity: data.intensity,
              trigger: data.trigger,
              location: data.location,
              notes: data.notes,
              did_use: row.did_use === null ? null : row.did_use === 1,
              coping_strategy: data.coping_strategy,
              duration_seconds: row.duration_seconds,
            };
          } catch {
            // Skip corrupted entries
            return null;
          }
        }),
      );

      setCravingHistory(decrypted.filter((d): d is CravingEntry => d !== null));

      // Check for active craving (started but not ended)
      const active = rows.find((r) => r.ended_at === null);
      if (active) {
        const data = JSON.parse(await decryptContent(active.encrypted_data)) as {
          intensity: number;
          trigger: CravingTrigger | null;
        };
        const startedAt = new Date(active.started_at);
        setActiveCraving({
          id: active.id,
          startedAt,
          intensity: data.intensity,
          trigger: data.trigger,
          elapsedSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
        });
      }
    } catch (error) {
      logger.error('Failed to load craving history', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, isReady, user]);

  // Initial load
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const startCraving = useCallback(
    async (params: StartCravingParams): Promise<void> => {
      if (!db || !user) return;

      const id = generateUUID();
      const now = new Date();

      const data = {
        intensity: params.intensity,
        trigger: params.trigger || null,
        location: params.location || null,
        notes: params.notes || null,
        coping_strategy: null,
      };

      const encryptedData = await encryptContent(JSON.stringify(data));

      await db.runAsync(
        `INSERT INTO cravings (id, user_id, started_at, ended_at, encrypted_data, did_use, duration_seconds)
         VALUES (?, ?, ?, NULL, ?, NULL, NULL)`,
        [id, user.id, now.toISOString(), encryptedData],
      );

      await addToSyncQueue(db, 'cravings', id, 'insert');

      setActiveCraving({
        id,
        startedAt: now,
        intensity: params.intensity,
        trigger: params.trigger || null,
        elapsedSeconds: 0,
      });

      logger.info('Craving started', { intensity: params.intensity, trigger: params.trigger });
    },
    [db, user],
  );

  const endCraving = useCallback(
    async (params: EndCravingParams): Promise<void> => {
      if (!db || !user || !activeCraving) return;

      const now = new Date();
      const durationSeconds = Math.floor((now.getTime() - activeCraving.startedAt.getTime()) / 1000);

      // Re-fetch current data to preserve fields
      const row = await db.getFirstAsync<{ encrypted_data: string }>(
        'SELECT encrypted_data FROM cravings WHERE id = ?',
        [activeCraving.id],
      );

      if (!row) {
        logger.error('Active craving not found in database');
        setActiveCraving(null);
        return;
      }

      const currentData = JSON.parse(await decryptContent(row.encrypted_data)) as {
        intensity: number;
        trigger: CravingTrigger | null;
        location: string | null;
        notes: string | null;
        coping_strategy: CopingStrategy | null;
      };

      const updatedData = {
        ...currentData,
        coping_strategy: params.copingStrategy || null,
        notes: params.notes || currentData.notes,
      };

      const encryptedData = await encryptContent(JSON.stringify(updatedData));

      await db.runAsync(
        `UPDATE cravings
         SET ended_at = ?, encrypted_data = ?, did_use = ?, duration_seconds = ?
         WHERE id = ?`,
        [now.toISOString(), encryptedData, params.didUse ? 1 : 0, durationSeconds, activeCraving.id],
      );

      await addToSyncQueue(db, 'cravings', activeCraving.id, 'update');

      setActiveCraving(null);
      await loadHistory();

      logger.info('Craving ended', {
        durationSeconds,
        didUse: params.didUse,
        copingStrategy: params.copingStrategy,
      });
    },
    [db, user, activeCraving, loadHistory],
  );

  const cancelCraving = useCallback(() => {
    if (!db || !activeCraving) return;

    // Delete the started craving
    void (async () => {
      try {
        await db.runAsync('DELETE FROM cravings WHERE id = ?', [activeCraving.id]);
        setActiveCraving(null);
        logger.info('Craving cancelled');
      } catch (error) {
        logger.error('Failed to cancel craving', error);
      }
    })();
  }, [db, activeCraving]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadHistory();
  }, [loadHistory]);

  return {
    activeCraving,
    cravingHistory,
    patterns,
    isLoading,
    startCraving,
    endCraving,
    cancelCraving,
    refresh,
  };
}

export { TRIGGER_LABELS, COPING_LABELS };
export type { CravingTrigger, CopingStrategy, CravingEntry, ActiveCraving, CravingPatterns };
