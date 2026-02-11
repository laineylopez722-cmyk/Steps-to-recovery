/**
 * Recovery Strength Score Service
 * Composite metric from check-in consistency, journal frequency,
 * step work progress, mood stability, and craving management.
 */

import { logger } from '../../../utils/logger';

export interface RecoveryMetrics {
  checkInConsistency: number; // 0-1 (percentage of days with check-ins, last 14 days)
  journalFrequency: number; // 0-1 (entries per week / 7)
  stepWorkProgress: number; // 0-1 (completed steps / 12)
  moodStability: number; // 0-1 (inverse of mood variance)
  cravingManagement: number; // 0-1 (inverse of avg craving / 10)
}

export interface RecoveryStrengthResult {
  score: number; // 0-100
  grade: string; // 'Building', 'Growing', 'Strengthening', 'Thriving'
  emoji: string;
  metrics: RecoveryMetrics;
  insights: string[];
}

const WEIGHTS: Record<keyof RecoveryMetrics, number> = {
  checkInConsistency: 0.25,
  journalFrequency: 0.2,
  stepWorkProgress: 0.25,
  moodStability: 0.15,
  cravingManagement: 0.15,
};

/**
 * Calculate composite recovery strength score.
 */
export function calculateRecoveryStrength(metrics: RecoveryMetrics): RecoveryStrengthResult {
  const rawScore =
    metrics.checkInConsistency * WEIGHTS.checkInConsistency +
    metrics.journalFrequency * WEIGHTS.journalFrequency +
    metrics.stepWorkProgress * WEIGHTS.stepWorkProgress +
    metrics.moodStability * WEIGHTS.moodStability +
    metrics.cravingManagement * WEIGHTS.cravingManagement;

  const score = Math.round(Math.min(100, Math.max(0, rawScore * 100)));

  const { grade, emoji } = getGrade(score);
  const insights = generateInsights(metrics, score);

  logger.debug('Recovery strength calculated', { score, grade });

  return { score, grade, emoji, metrics, insights };
}

function getGrade(score: number): { grade: string; emoji: string } {
  if (score >= 80) return { grade: 'Thriving', emoji: '🌟' };
  if (score >= 60) return { grade: 'Strengthening', emoji: '💪' };
  if (score >= 40) return { grade: 'Growing', emoji: '🌱' };
  return { grade: 'Building', emoji: '🧱' };
}

function generateInsights(metrics: RecoveryMetrics, _score: number): string[] {
  const insights: string[] = [];

  if (metrics.checkInConsistency >= 0.85) {
    insights.push('Your check-in consistency is excellent — keep it up!');
  } else if (metrics.checkInConsistency < 0.4) {
    insights.push('Try checking in daily — even a quick mood rating helps.');
  }

  if (metrics.journalFrequency >= 0.7) {
    insights.push('Your journaling practice is strong. Writing helps process emotions.');
  } else if (metrics.journalFrequency < 0.3) {
    insights.push('Journaling 2-3 times a week can strengthen your recovery.');
  }

  if (metrics.stepWorkProgress > 0 && metrics.stepWorkProgress < 1) {
    const stepsCompleted = Math.round(metrics.stepWorkProgress * 12);
    insights.push(`You've worked through ${stepsCompleted} of 12 steps. Keep going!`);
  }

  if (metrics.moodStability >= 0.7) {
    insights.push('Your mood has been more stable recently — a sign of growth.');
  }

  if (metrics.cravingManagement >= 0.7) {
    insights.push('Your craving management is improving. Your strategies are working.');
  } else if (metrics.cravingManagement < 0.3) {
    insights.push('Cravings are tough. Consider exploring new coping strategies.');
  }

  return insights.slice(0, 3);
}

/**
 * Calculate check-in consistency from dates.
 */
export function calculateCheckInConsistency(
  checkInDates: string[],
  windowDays: number = 14,
): number {
  if (checkInDates.length === 0) return 0;

  const now = new Date();
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const uniqueDays = new Set(
    checkInDates.filter((d) => new Date(d) >= cutoff).map((d) => d.split('T')[0]),
  );

  return Math.min(1, uniqueDays.size / windowDays);
}

/**
 * Calculate mood stability from ratings.
 */
export function calculateMoodStability(moodRatings: number[]): number {
  if (moodRatings.length < 2) return 0.5;

  const mean = moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length;
  const variance =
    moodRatings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / moodRatings.length;

  // Max variance for 1-5 scale is ~4, normalize and invert
  const normalizedVariance = variance / 4;
  return Math.max(0, Math.min(1, 1 - normalizedVariance));
}

/**
 * Calculate craving management from intensity values.
 */
export function calculateCravingManagement(cravingLevels: number[]): number {
  if (cravingLevels.length === 0) return 0.5;

  const avg = cravingLevels.reduce((a, b) => a + b, 0) / cravingLevels.length;
  return Math.max(0, Math.min(1, 1 - avg / 10));
}
