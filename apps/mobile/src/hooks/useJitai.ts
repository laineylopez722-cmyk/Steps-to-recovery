/**
 * JITAI Hook
 * Integrates JITAI engine with app state for adaptive interventions
 */

import { useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useSobriety } from './useSobriety';
import { useCheckin } from './useCheckin';
import {
  useContactStore,
  useMeetingStore,
  useRhythmStore,
  useStepWorkStore,
} from '@recovery/shared';
import {
  runJitaiEvaluation,
  resetCooldowns,
  getCooldownStatus,
} from '@recovery/shared/jitai/engine';
import type { JitaiContext } from '@recovery/shared/jitai/types';
import type { MeetingLog } from '@recovery/shared';
import { logger } from '../utils/logger';

// Minimum interval between evaluations (5 minutes)
const MIN_EVALUATION_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Hook for JITAI adaptive interventions
 */
export function useJitai() {
  const lastEvaluationRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Get app state from various stores
  const { soberDays } = useSobriety();
  const {
    todayCheckin,
    averageMood,
    averageCraving,
    moodTrend,
    cravingTrend,
    history: checkinHistory,
  } = useCheckin();
  const { sponsor } = useContactStore();
  const meetings = useMeetingStore((state) => state.meetings ?? []);
  const { todayIntention, todayInventory } = useRhythmStore();
  const stepProgress = useStepWorkStore((state) => state.progress ?? []);

  /**
   * Build JITAI context from current app state
   */
  const buildContext = useCallback((): JitaiContext => {
    const now = new Date();

    // Calculate days since last check-in
    let daysSinceLastCheckin = 0;
    if (checkinHistory.length > 0) {
      const lastCheckin = new Date(checkinHistory[0].createdAt);
      daysSinceLastCheckin = Math.floor(
        (now.getTime() - lastCheckin.getTime()) / (24 * 60 * 60 * 1000),
      );
    }

    // Calculate days since last meeting
    let daysSinceLastMeeting = 999;
    if (meetings.length > 0) {
      const lastMeeting = new Date(meetings[0].attendedAt);
      daysSinceLastMeeting = Math.floor(
        (now.getTime() - lastMeeting.getTime()) / (24 * 60 * 60 * 1000),
      );
    }

    // Calculate meetings this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const meetingsThisWeek = meetings.filter(
      (log: MeetingLog) => new Date(log.attendedAt) >= oneWeekAgo,
    ).length;

    // Calculate days since last sponsor contact
    let daysSinceLastSponsorContact = 999;
    if (sponsor?.lastContactedAt) {
      daysSinceLastSponsorContact = Math.floor(
        (now.getTime() - new Date(sponsor.lastContactedAt).getTime()) / (24 * 60 * 60 * 1000),
      );
    }

    // Get current step
    const currentStep =
      stepProgress.find((p) => p.questionsAnswered < p.totalQuestions)?.stepNumber || 1;

    // Calculate days since last step work
    const daysSinceLastStepWork = 999;
    // This would need step work history tracking

    // Map mood/craving trends
    // Note: For cravings, 'positive' means declining (good), 'negative' means rising (bad)
    const mapMoodTrend = (trend: string): 'rising' | 'stable' | 'declining' => {
      if (trend === 'positive') return 'rising';
      if (trend === 'negative') return 'declining';
      return 'stable';
    };

    const mapCravingTrend = (trend: string): 'rising' | 'stable' | 'declining' => {
      // Invert: 'positive' trend means declining cravings (good), 'negative' means rising (bad)
      if (trend === 'positive') return 'declining';
      if (trend === 'negative') return 'rising';
      return 'stable';
    };

    return {
      currentHour: now.getHours(),
      currentDayOfWeek: now.getDay(),
      soberDays,
      hasSetIntentionToday: !!todayIntention,
      hasCompletedInventoryToday: !!todayInventory,
      daysSinceLastCheckin,
      lastMoodReported: todayCheckin?.mood ?? null,
      lastCravingReported: todayCheckin?.cravingLevel ?? null,
      moodTrend: mapMoodTrend(moodTrend),
      cravingTrend: mapCravingTrend(cravingTrend),
      averageMood7Days: averageMood || 5,
      averageCraving7Days: averageCraving || 3,
      daysSinceLastMeeting,
      meetingsThisWeek,
      hasSponsor: !!sponsor,
      daysSinceLastSponsorContact,
      currentStep,
      daysSinceLastStepWork,
    };
  }, [
    soberDays,
    todayCheckin,
    averageMood,
    averageCraving,
    moodTrend,
    cravingTrend,
    checkinHistory,
    sponsor,
    meetings,
    todayIntention,
    todayInventory,
    stepProgress,
  ]);

  /**
   * Run JITAI evaluation if enough time has passed
   */
  const evaluate = useCallback(async () => {
    const now = Date.now();

    // Check minimum interval
    if (now - lastEvaluationRef.current < MIN_EVALUATION_INTERVAL_MS) {
      return;
    }

    lastEvaluationRef.current = now;

    try {
      const context = buildContext();
      await runJitaiEvaluation(context);
    } catch (error) {
      logger.error('JITAI evaluation failed', error);
    }
  }, [buildContext]);

  /**
   * Force evaluation (bypass interval check)
   */
  const forceEvaluate = useCallback(async () => {
    lastEvaluationRef.current = 0;
    await evaluate();
  }, [evaluate]);

  // Run evaluation on app state changes (foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        evaluate();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [evaluate]);

  // Run initial evaluation on mount
  useEffect(() => {
    // Delay initial evaluation to allow stores to load
    const timer = setTimeout(() => {
      evaluate();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Run evaluation periodically while app is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        evaluate();
      }
    }, MIN_EVALUATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [evaluate]);

  return {
    evaluate,
    forceEvaluate,
    resetCooldowns,
    getCooldownStatus,
    buildContext,
  };
}
