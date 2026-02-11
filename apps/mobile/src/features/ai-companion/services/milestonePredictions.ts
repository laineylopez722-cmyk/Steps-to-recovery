/**
 * Milestone Predictions Service
 * Predict upcoming milestones based on engagement patterns.
 */

import { logger } from '../../../utils/logger';

export interface MilestonePrediction {
  type: 'sobriety' | 'step' | 'journal-streak' | 'check-in-streak';
  title: string;
  description: string;
  emoji: string;
  predictedDate?: string;
  daysAway?: number;
  confidence: number; // 0-1
}

const SOBRIETY_MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365, 730, 1095];

/**
 * Generate milestone predictions.
 */
export function predictMilestones(context: {
  sobrietyDays: number;
  currentStep: number;
  journalStreak: number;
  checkInStreak: number;
  avgEntriesPerWeek: number;
}): MilestonePrediction[] {
  const predictions: MilestonePrediction[] = [];

  // Next sobriety milestone
  const nextSobriety = SOBRIETY_MILESTONES.find((m) => m > context.sobrietyDays);
  if (nextSobriety) {
    const daysAway = nextSobriety - context.sobrietyDays;
    const predictedDate = new Date(Date.now() + daysAway * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    predictions.push({
      type: 'sobriety',
      title: `${formatMilestoneDays(nextSobriety)} Clean`,
      description:
        daysAway <= 3
          ? `Just ${daysAway} day${daysAway === 1 ? '' : 's'} away! You're almost there!`
          : `${daysAway} days to go. One day at a time.`,
      emoji: getMilestoneEmoji(nextSobriety),
      predictedDate,
      daysAway,
      confidence: 1.0,
    });
  }

  // Step completion prediction
  if (context.currentStep < 12 && context.currentStep > 0) {
    predictions.push({
      type: 'step',
      title: `Complete Step ${context.currentStep}`,
      description: `You're working on Step ${context.currentStep}. Keep going at your own pace.`,
      emoji: '📖',
      confidence: 0.7,
    });
  }

  // Journal streak predictions
  if (context.journalStreak > 0) {
    const streakMilestones = [7, 14, 30, 60, 90];
    const nextStreak = streakMilestones.find((m) => m > context.journalStreak);
    if (nextStreak) {
      predictions.push({
        type: 'journal-streak',
        title: `${nextStreak}-Day Journal Streak`,
        description: `You're at ${context.journalStreak} days. ${nextStreak - context.journalStreak} more to go!`,
        emoji: '✍️',
        daysAway: nextStreak - context.journalStreak,
        confidence: context.avgEntriesPerWeek >= 5 ? 0.8 : 0.5,
      });
    }
  }

  // Check-in streak
  if (context.checkInStreak > 0) {
    const streakMilestones = [7, 14, 30, 60];
    const nextStreak = streakMilestones.find((m) => m > context.checkInStreak);
    if (nextStreak) {
      predictions.push({
        type: 'check-in-streak',
        title: `${nextStreak}-Day Check-In Streak`,
        description: `${nextStreak - context.checkInStreak} more days of checking in!`,
        emoji: '📊',
        daysAway: nextStreak - context.checkInStreak,
        confidence: 0.6,
      });
    }
  }

  logger.debug('Milestone predictions generated', { count: predictions.length });
  return predictions;
}

function formatMilestoneDays(days: number): string {
  if (days >= 365) return `${Math.floor(days / 365)} Year${days >= 730 ? 's' : ''}`;
  if (days >= 30) return `${Math.floor(days / 30)} Month${days >= 60 ? 's' : ''}`;
  return `${days} Day${days > 1 ? 's' : ''}`;
}

function getMilestoneEmoji(days: number): string {
  if (days >= 365) return '🏆';
  if (days >= 180) return '🌟';
  if (days >= 90) return '💎';
  if (days >= 30) return '🎉';
  if (days >= 14) return '⭐';
  if (days >= 7) return '🎯';
  return '🌱';
}
