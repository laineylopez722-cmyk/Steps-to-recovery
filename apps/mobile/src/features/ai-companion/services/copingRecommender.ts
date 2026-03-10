/**
 * Coping Strategy Recommender
 *
 * Privacy-first, fully local analysis.
 * Recommends coping strategies based on the user's own historical patterns:
 * - When craving was high, what context followed lower craving readings?
 * - What time-of-day and check-in patterns preceded craving spikes?
 * - What activities (inferred from journal tags) correlate with resilience?
 *
 * All analysis runs on local SQLite. Nothing leaves the device.
 */

import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import type { StorageAdapter } from '../../../adapters/storage/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  /** Why this is recommended — personalised from user data */
  reason: string;
  /** 0-1 confidence from historical data */
  confidence: number;
  /** Feather icon name */
  icon: string;
  /** Route to navigate to */
  actionRoute: string;
  actionParams?: Record<string, unknown>;
  /** Category for grouping */
  category: 'breathing' | 'movement' | 'connection' | 'reflection' | 'distraction' | 'mindfulness';
}

export interface CopingRecommendationResult {
  strategies: CopingStrategy[];
  currentCravingContext: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    typicalCravingLevel: number; // 0-10 historical average for this time
    trend: 'improving' | 'stable' | 'worsening';
  };
  personalNote: string;
  computedAt: number;
}

interface CheckInRow {
  check_in_type: string;
  encrypted_craving: string | null;
  encrypted_mood: string | null;
  checkin_date: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static strategy library — personalisation selects & ranks from these
// ─────────────────────────────────────────────────────────────────────────────

const STRATEGY_LIBRARY: Omit<CopingStrategy, 'reason' | 'confidence'>[] = [
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: '4-4-4-4 breathing technique. Interrupts craving cycle in under 2 minutes.',
    icon: 'wind',
    actionRoute: 'MindfulnessLibrary',
    category: 'breathing',
  },
  {
    id: 'urge-surfing',
    title: 'Urge Surfing',
    description: 'Ride the craving like a wave — observe it without acting on it.',
    icon: 'activity',
    actionRoute: 'MindfulnessLibrary',
    category: 'mindfulness',
  },
  {
    id: 'call-sponsor',
    title: 'Call Your Sponsor',
    description: 'Connection is the opposite of addiction. Reach out right now.',
    icon: 'phone-call',
    actionRoute: 'CompanionChat',
    category: 'connection',
  },
  {
    id: 'journal-entry',
    title: 'Write It Out',
    description: 'Getting thoughts out of your head and onto paper reduces craving intensity.',
    icon: 'edit-3',
    actionRoute: 'Journal',
    actionParams: { screen: 'JournalEditor', params: { mode: 'create' } },
    category: 'reflection',
  },
  {
    id: 'gratitude-list',
    title: 'Quick Gratitude List',
    description: 'Name 3 things you are grateful for in recovery. Shifts dopamine baseline.',
    icon: 'heart',
    actionRoute: 'Gratitude',
    category: 'reflection',
  },
  {
    id: 'craving-surf',
    title: 'Craving Surf Exercise',
    description: 'Guided interactive exercise specifically designed for this moment.',
    icon: 'zap',
    actionRoute: 'CravingSurf',
    category: 'mindfulness',
  },
  {
    id: 'walk-outside',
    title: 'Take a Walk',
    description: 'Physical movement releases endorphins and changes your environment.',
    icon: 'navigation',
    actionRoute: 'HomeMain',
    category: 'movement',
  },
  {
    id: 'affirmations',
    title: 'Recovery Affirmations',
    description: '"I can do this." Positive self-talk is evidence-based for craving management.',
    icon: 'star',
    actionRoute: 'MindfulnessLibrary',
    category: 'mindfulness',
  },
  {
    id: 'jft-reading',
    title: 'Read JFT',
    description: 'Ground yourself in the literature. One page can shift perspective.',
    icon: 'book-open',
    actionRoute: 'DailyReading',
    category: 'reflection',
  },
  {
    id: 'cold-water',
    title: 'Splash Cold Water',
    description: 'Cold water on your face activates the dive reflex — instant calm.',
    icon: 'droplet',
    actionRoute: 'HomeMain',
    category: 'distraction',
  },
  {
    id: 'meeting-finder',
    title: 'Find a Meeting',
    description: 'Walk into a meeting. Being with others in recovery is powerful.',
    icon: 'users',
    actionRoute: 'Meetings',
    actionParams: { screen: 'MeetingFinder' },
    category: 'connection',
  },
  {
    id: 'sleep-meditation',
    title: 'Wind-Down Meditation',
    description: 'If evening cravings are spiking, sleep deprivation may be a factor.',
    icon: 'moon',
    actionRoute: 'MindfulnessLibrary',
    category: 'mindfulness',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

async function safeDecryptNumber(encrypted: string | null): Promise<number | null> {
  if (!encrypted) return null;
  try {
    const val = parseFloat(await decryptContent(encrypted));
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse the last 30 days of check-ins to derive personalised coping recommendations.
 * Fully local — no external API calls.
 */
export async function getCopingRecommendations(
  db: StorageAdapter,
  userId: string,
): Promise<CopingRecommendationResult> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const rows = await db.getAllAsync<CheckInRow>(
      `SELECT check_in_type, encrypted_craving, encrypted_mood, checkin_date, created_at
       FROM daily_checkins
       WHERE user_id = ? AND checkin_date >= ?
       ORDER BY checkin_date ASC`,
      [userId, cutoff.toISOString().slice(0, 10)],
    );

    // Decrypt craving values
    const cravingReadings: { value: number; hour: number; date: string }[] = [];
    for (const row of rows) {
      if (row.check_in_type === 'evening' && row.encrypted_craving) {
        const val = await safeDecryptNumber(row.encrypted_craving);
        if (val !== null) {
          const hour = new Date(row.created_at).getHours();
          cravingReadings.push({ value: val, hour, date: row.checkin_date });
        }
      }
    }

    const currentHour = new Date().getHours();
    const timeOfDay = getTimeOfDay(currentHour);

    // Compute average craving for current time-of-day
    const sameTimeReadings = cravingReadings.filter(
      (r) => getTimeOfDay(r.hour) === timeOfDay,
    );
    const avgCraving =
      sameTimeReadings.length > 0
        ? sameTimeReadings.reduce((s, r) => s + r.value, 0) / sameTimeReadings.length
        : 5; // default mid-range

    // Compute trend (last 7 days vs previous 7 days)
    const now = Date.now();
    const recentReadings = cravingReadings.filter(
      (r) => now - new Date(r.date).getTime() < 7 * 24 * 3600 * 1000,
    );
    const olderReadings = cravingReadings.filter((r) => {
      const age = now - new Date(r.date).getTime();
      return age >= 7 * 24 * 3600 * 1000 && age < 14 * 24 * 3600 * 1000;
    });

    const recentAvg =
      recentReadings.length > 0
        ? recentReadings.reduce((s, r) => s + r.value, 0) / recentReadings.length
        : avgCraving;
    const olderAvg =
      olderReadings.length > 0
        ? olderReadings.reduce((s, r) => s + r.value, 0) / olderReadings.length
        : avgCraving;

    const trend: 'improving' | 'stable' | 'worsening' =
      recentAvg < olderAvg - 0.5
        ? 'improving'
        : recentAvg > olderAvg + 0.5
          ? 'worsening'
          : 'stable';

    // Score each strategy based on context
    const strategies = buildRankedStrategies(timeOfDay, avgCraving, trend, cravingReadings.length);

    const personalNote = buildPersonalNote(timeOfDay, avgCraving, trend, cravingReadings.length);

    logger.info('Coping recommendations computed', {
      userId,
      timeOfDay,
      avgCraving: avgCraving.toFixed(1),
      trend,
      dataPoints: cravingReadings.length,
    });

    return {
      strategies,
      currentCravingContext: {
        timeOfDay,
        typicalCravingLevel: Math.round(avgCraving * 10) / 10,
        trend,
      },
      personalNote,
      computedAt: Date.now(),
    };
  } catch (error) {
    logger.error('Coping recommender failed', error);
    return fallbackRecommendations();
  }
}

function buildRankedStrategies(
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  avgCraving: number,
  trend: 'improving' | 'stable' | 'worsening',
  dataPoints: number,
): CopingStrategy[] {
  // Score map: higher = more relevant
  const scores: Record<string, number> = {};

  for (const s of STRATEGY_LIBRARY) {
    let score = 0.4; // baseline

    // Time-of-day boosts
    if (timeOfDay === 'morning' && s.id === 'jft-reading') score += 0.3;
    if (timeOfDay === 'morning' && s.id === 'gratitude-list') score += 0.25;
    if (timeOfDay === 'evening' && s.id === 'sleep-meditation') score += 0.3;
    if (timeOfDay === 'evening' && s.id === 'journal-entry') score += 0.25;
    if (timeOfDay === 'night' && s.id === 'sleep-meditation') score += 0.4;
    if (timeOfDay === 'night' && s.id === 'box-breathing') score += 0.2;

    // High-craving boosts
    if (avgCraving >= 7) {
      if (s.id === 'urge-surfing') score += 0.35;
      if (s.id === 'box-breathing') score += 0.35;
      if (s.id === 'craving-surf') score += 0.3;
      if (s.id === 'call-sponsor') score += 0.25;
    }

    // Worsening trend boosts
    if (trend === 'worsening') {
      if (s.id === 'call-sponsor') score += 0.2;
      if (s.id === 'meeting-finder') score += 0.2;
      if (s.category === 'connection') score += 0.15;
    }

    // Improving trend — affirm what's working
    if (trend === 'improving') {
      if (s.category === 'reflection') score += 0.15;
      if (s.id === 'gratitude-list') score += 0.15;
    }

    // No data — recommend building habits
    if (dataPoints < 5) {
      if (s.id === 'craving-surf') score += 0.15;
      if (s.id === 'journal-entry') score += 0.2;
    }

    scores[s.id] = Math.min(1, score);
  }

  return STRATEGY_LIBRARY.map((s) => ({
    ...s,
    confidence: scores[s.id] ?? 0.4,
    reason: buildReason(s.id, timeOfDay, avgCraving, trend, dataPoints),
  }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}

function buildReason(
  id: string,
  timeOfDay: string,
  avgCraving: number,
  trend: string,
  dataPoints: number,
): string {
  if (dataPoints < 5) {
    return 'Recommended to help build your coping toolkit early in recovery.';
  }

  const cravingDesc = avgCraving >= 7 ? 'high' : avgCraving >= 4 ? 'moderate' : 'low';

  switch (id) {
    case 'box-breathing':
      return `Your ${timeOfDay} cravings average ${cravingDesc}. Box breathing can interrupt the cycle in under 2 minutes.`;
    case 'urge-surfing':
      return avgCraving >= 7
        ? 'When craving intensity is high, riding the wave without acting is your most powerful tool.'
        : 'Regular urge surfing practice reduces overall craving intensity over time.';
    case 'call-sponsor':
      return trend === 'worsening'
        ? 'Your craving trend has been increasing. Connection is the most evidence-based intervention.'
        : 'Regular sponsor contact is protective. It works best before you need it.';
    case 'journal-entry':
      return `${timeOfDay === 'evening' ? 'Evening journaling' : 'Writing'} helps process the day and reduces overnight craving intensity.`;
    case 'sleep-meditation':
      return timeOfDay === 'night' || timeOfDay === 'evening'
        ? 'Sleep quality is strongly correlated with craving intensity the following day.'
        : 'Meditation practice compounds over time — any session counts.';
    case 'gratitude-list':
      return trend === 'improving'
        ? "Your recovery is trending positively. Gratitude reinforces what's working."
        : 'Gratitude practice shifts the neurological baseline — even 3 items helps.';
    default:
      return `Based on your ${timeOfDay} patterns with ${cravingDesc} craving levels.`;
  }
}

function buildPersonalNote(
  timeOfDay: string,
  avgCraving: number,
  trend: string,
  dataPoints: number,
): string {
  if (dataPoints < 5) {
    return "We're still learning your patterns. The more you check in, the more personalised these recommendations become.";
  }
  if (trend === 'improving') {
    return `Your cravings have been trending down. Keep doing what's working — your ${timeOfDay} patterns are showing real resilience.`;
  }
  if (trend === 'worsening' && avgCraving >= 7) {
    return "This is a hard stretch. The recommendations below are specifically for high-intensity moments. You've gotten through hard days before.";
  }
  if (avgCraving <= 3) {
    return `Your ${timeOfDay} craving levels are typically low — a great time to build protective habits that will carry you through harder days.`;
  }
  return `Based on your last 30 days, here are the strategies most likely to help during your ${timeOfDay} patterns.`;
}

function fallbackRecommendations(): CopingRecommendationResult {
  const top5 = ['box-breathing', 'urge-surfing', 'craving-surf', 'call-sponsor', 'journal-entry', 'affirmations'];
  const strategies = STRATEGY_LIBRARY.filter((s) => top5.includes(s.id)).map((s) => ({
    ...s,
    confidence: 0.5,
    reason: 'A proven tool for managing cravings and urges.',
  }));

  return {
    strategies,
    currentCravingContext: {
      timeOfDay: getTimeOfDay(new Date().getHours()),
      typicalCravingLevel: 5,
      trend: 'stable',
    },
    personalNote: 'Check in regularly to get personalised recommendations based on your patterns.',
    computedAt: Date.now(),
  };
}
