/**
 * Craving Surfing Guide Hook
 *
 * State machine managing the multi-phase urge surfing flow:
 * rate-initial → breathing → distraction → rate-final → complete
 *
 * Handles 4-7-8 breathing timer, session persistence (encrypted), and sync queue.
 */

import { useState, useRef, useCallback } from 'react';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { encryptContent } from '../../../utils/encryption';
import { addToSyncQueue } from '../../../services/syncService';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import type { CravingSurfPhase, CravingSurfSession } from '../types';

/** 4-7-8 breathing pattern durations in ms */
const INHALE_MS = 4000;
const HOLD_MS = 7000;
const EXHALE_MS = 8000;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS;
const TOTAL_CYCLES = 3;
const TOTAL_BREATHING_MS = CYCLE_MS * TOTAL_CYCLES;

export type BreathStep = 'inhale' | 'hold' | 'exhale';

export interface BreathingState {
  step: BreathStep;
  cycle: number;
  totalCycles: number;
  elapsedMs: number;
  totalMs: number;
}

export interface UseCravingSurfReturn {
  session: CravingSurfSession | null;
  phase: CravingSurfPhase;
  breathingState: BreathingState | null;
  isBreathing: boolean;
  reductionPercent: number | null;
  startSession: (initialRating: number) => void;
  startBreathing: () => void;
  selectDistraction: (distractionId: string) => void;
  submitFinalRating: (finalRating: number) => Promise<void>;
  reset: () => void;
}

export function useCravingSurf(): UseCravingSurfReturn {
  const { db } = useDatabase();
  const { user } = useAuth();
  const userId = user?.id || '';

  const [phase, setPhase] = useState<CravingSurfPhase>('rate-initial');
  const [session, setSession] = useState<CravingSurfSession | null>(null);
  const [breathingState, setBreathingState] = useState<BreathingState | null>(null);
  const [isBreathing, setIsBreathing] = useState(false);
  const [reductionPercent, setReductionPercent] = useState<number | null>(null);

  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathStartRef = useRef<number>(0);

  const clearBreathTimer = useCallback((): void => {
    if (breathTimerRef.current) {
      clearInterval(breathTimerRef.current);
      breathTimerRef.current = null;
    }
  }, []);

  const startSession = useCallback(
    (initialRating: number): void => {
      const newSession: CravingSurfSession = {
        id: generateId('crave'),
        userId,
        initialRating,
        finalRating: null,
        phase: 'breathing',
        startedAt: new Date().toISOString(),
        completedAt: null,
        distractionUsed: null,
      };
      setSession(newSession);
      setPhase('breathing');
      logger.info('Craving surf session started', { sessionId: newSession.id, initialRating });
    },
    [userId],
  );

  const startBreathing = useCallback((): void => {
    setIsBreathing(true);
    breathStartRef.current = Date.now();

    setBreathingState({
      step: 'inhale',
      cycle: 1,
      totalCycles: TOTAL_CYCLES,
      elapsedMs: 0,
      totalMs: TOTAL_BREATHING_MS,
    });

    breathTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - breathStartRef.current;

      if (elapsed >= TOTAL_BREATHING_MS) {
        clearBreathTimer();
        setIsBreathing(false);
        setBreathingState(null);
        setPhase('distraction');
        setSession((prev) => (prev ? { ...prev, phase: 'distraction' } : null));
        logger.info('Breathing exercise complete');
        return;
      }

      const cycleElapsed = elapsed % CYCLE_MS;
      const currentCycle = Math.floor(elapsed / CYCLE_MS) + 1;

      let step: BreathStep;
      if (cycleElapsed < INHALE_MS) {
        step = 'inhale';
      } else if (cycleElapsed < INHALE_MS + HOLD_MS) {
        step = 'hold';
      } else {
        step = 'exhale';
      }

      setBreathingState({
        step,
        cycle: currentCycle,
        totalCycles: TOTAL_CYCLES,
        elapsedMs: elapsed,
        totalMs: TOTAL_BREATHING_MS,
      });
    }, 250);
  }, [clearBreathTimer]);

  const selectDistraction = useCallback((distractionId: string): void => {
    setSession((prev) => (prev ? { ...prev, distractionUsed: distractionId, phase: 'rate-final' } : null));
    setPhase('rate-final');
    logger.info('Distraction selected', { distractionId });
  }, []);

  const submitFinalRating = useCallback(
    async (finalRating: number): Promise<void> => {
      if (!session || !db) {
        logger.warn('Cannot submit final rating: missing session or db');
        return;
      }

      const completedAt = new Date().toISOString();
      const completedSession: CravingSurfSession = {
        ...session,
        finalRating,
        phase: 'complete',
        completedAt,
      };

      setSession(completedSession);
      setPhase('complete');

      const reduction =
        session.initialRating > 0
          ? Math.round(((session.initialRating - finalRating) / session.initialRating) * 100)
          : 0;
      setReductionPercent(reduction);

      try {
        const encryptedInitial = await encryptContent(String(session.initialRating));
        const encryptedFinal = await encryptContent(String(finalRating));
        const encryptedDistraction = completedSession.distractionUsed
          ? await encryptContent(completedSession.distractionUsed)
          : null;

        await db.runAsync(
          `INSERT INTO craving_surf_sessions
            (id, user_id, encrypted_initial_rating, encrypted_final_rating, encrypted_distraction_used, started_at, completed_at, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            completedSession.id,
            userId,
            encryptedInitial,
            encryptedFinal,
            encryptedDistraction,
            completedSession.startedAt,
            completedAt,
            completedAt,
            completedAt,
          ],
        );

        await addToSyncQueue(db, 'craving_surf_sessions', completedSession.id, 'insert');
        logger.info('Craving surf session saved', {
          sessionId: completedSession.id,
          reduction,
        });
      } catch (error) {
        logger.error('Failed to save craving surf session', error);
      }
    },
    [session, db, userId],
  );

  const reset = useCallback((): void => {
    clearBreathTimer();
    setPhase('rate-initial');
    setSession(null);
    setBreathingState(null);
    setIsBreathing(false);
    setReductionPercent(null);
  }, [clearBreathTimer]);

  return {
    session,
    phase,
    breathingState,
    isBreathing,
    reductionPercent,
    startSession,
    startBreathing,
    selectDistraction,
    submitFinalRating,
    reset,
  };
}
