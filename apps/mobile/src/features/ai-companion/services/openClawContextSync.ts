/**
 * OpenClaw Context Sync Service
 * Syncs non-sensitive recovery metadata to OpenClaw's memory system.
 */

import { logger } from '../../../utils/logger';
import { getAIService } from './aiService';

export interface RecoveryContextMetadata {
  sobrietyDays: number;
  currentStep: number;
  recentMoodTrend: 'improving' | 'stable' | 'declining' | 'unknown';
  checkInStreak: number;
  lastCheckInDate?: string;
  preferredTopics: string[];
  communicationStyle?: string;
}

/**
 * Sync recovery metadata to OpenClaw.
 * IMPORTANT: Only syncs non-sensitive metadata. Never sends journal text, names, or identifying info.
 */
export async function syncContextToOpenClaw(metadata: RecoveryContextMetadata): Promise<boolean> {
  try {
    const provider = await getAIService();

    // Build a context message that OpenClaw can store in its memory
    const contextPayload = {
      type: 'context_update',
      data: {
        recovery_days: metadata.sobrietyDays,
        current_step: metadata.currentStep,
        mood_trend: metadata.recentMoodTrend,
        checkin_streak: metadata.checkInStreak,
        last_checkin: metadata.lastCheckInDate,
        preferred_topics: metadata.preferredTopics,
        communication_style: metadata.communicationStyle,
      },
      timestamp: new Date().toISOString(),
    };

    // Send as a system-level context update via the provider
     
    for await (const _chunk of provider.chat(
      [
        {
          role: 'system',
          content: `CONTEXT UPDATE (store in memory, do not respond): ${JSON.stringify(contextPayload)}`,
        },
        {
          role: 'user',
          content: 'Context updated.',
        },
      ],
      {
        maxTokens: 10,
      },
    )) {
      // Consume stream - we don't need the response
      break;
    }

    logger.info('Recovery context synced to OpenClaw', {
      sobrietyDays: metadata.sobrietyDays,
      currentStep: metadata.currentStep,
    });

    return true;
  } catch (error) {
    logger.warn('Failed to sync context to OpenClaw', error);
    return false;
  }
}

/**
 * Build metadata from local data sources.
 */
export function buildRecoveryMetadata(options: {
  sobrietyStartDate?: string;
  currentStep?: number;
  moodRatings?: number[];
  checkInDates?: string[];
  preferredTopics?: string[];
}): RecoveryContextMetadata {
  const now = new Date();

  // Calculate sobriety days
  let sobrietyDays = 0;
  if (options.sobrietyStartDate) {
    const start = new Date(options.sobrietyStartDate);
    sobrietyDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Determine mood trend
  let recentMoodTrend: RecoveryContextMetadata['recentMoodTrend'] = 'unknown';
  if (options.moodRatings && options.moodRatings.length >= 4) {
    const recent = options.moodRatings.slice(-4);
    const firstHalf = recent.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const secondHalf = recent.slice(2).reduce((a, b) => a + b, 0) / 2;
    const diff = secondHalf - firstHalf;
    if (diff > 0.5) recentMoodTrend = 'improving';
    else if (diff < -0.5) recentMoodTrend = 'declining';
    else recentMoodTrend = 'stable';
  }

  // Calculate check-in streak
  let checkInStreak = 0;
  if (options.checkInDates && options.checkInDates.length > 0) {
    const sorted = [...options.checkInDates].sort().reverse();
    const today = now.toISOString().split('T')[0];
    let expectedDate = today;

    for (const date of sorted) {
      const dateStr = date.split('T')[0];
      if (dateStr === expectedDate) {
        checkInStreak++;
        const prev = new Date(expectedDate + 'T00:00:00');
        prev.setDate(prev.getDate() - 1);
        expectedDate = prev.toISOString().split('T')[0];
      } else {
        break;
      }
    }
  }

  return {
    sobrietyDays,
    currentStep: options.currentStep || 1,
    recentMoodTrend,
    checkInStreak,
    lastCheckInDate: options.checkInDates?.[options.checkInDates.length - 1],
    preferredTopics: options.preferredTopics || [],
  };
}
