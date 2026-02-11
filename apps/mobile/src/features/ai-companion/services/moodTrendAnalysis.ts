/**
 * Mood Trend Analysis
 * Analyzes mood data and generates insight cards.
 */

import { logger } from '../../../utils/logger';

export interface MoodTrendCard {
  id: string;
  title: string;
  body: string;
  emoji: string;
  trend: 'improving' | 'stable' | 'declining' | 'mixed';
  period: '7d' | '30d' | '90d';
}

export interface MoodDataPoint {
  date: string;
  mood: number; // 1-5
  craving?: number; // 0-10
}

/**
 * Analyze mood trends across time windows and generate insight cards.
 */
export function analyzeMoodTrends(data: MoodDataPoint[]): MoodTrendCard[] {
  if (data.length < 3) return [];

  const cards: MoodTrendCard[] = [];
  const now = new Date();

  // 7-day analysis
  const week = filterByDays(data, now, 7);
  if (week.length >= 3) {
    const card = analyzeWindow(week, '7d');
    if (card) cards.push(card);
  }

  // 30-day analysis
  const month = filterByDays(data, now, 30);
  if (month.length >= 7) {
    const card = analyzeWindow(month, '30d');
    if (card) cards.push(card);
  }

  // 90-day analysis
  const quarter = filterByDays(data, now, 90);
  if (quarter.length >= 14) {
    const card = analyzeWindow(quarter, '90d');
    if (card) cards.push(card);
  }

  // Craving trend
  const cravingCard = analyzeCravings(data);
  if (cravingCard) cards.push(cravingCard);

  logger.debug('Mood trend analysis', { cardCount: cards.length, dataPoints: data.length });
  return cards;
}

function filterByDays(data: MoodDataPoint[], now: Date, days: number): MoodDataPoint[] {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

function analyzeWindow(
  data: MoodDataPoint[],
  period: MoodTrendCard['period'],
): MoodTrendCard | null {
  const moods = data.map((d) => d.mood);
  const avg = moods.reduce((a, b) => a + b, 0) / moods.length;

  const halfLen = Math.floor(moods.length / 2);
  const firstHalf = moods.slice(0, halfLen);
  const secondHalf = moods.slice(halfLen);
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = avgSecond - avgFirst;

  let trend: MoodTrendCard['trend'];
  let emoji: string;
  let body: string;

  const periodLabel =
    period === '7d' ? 'This week' : period === '30d' ? 'This month' : 'This quarter';

  if (diff > 0.4) {
    trend = 'improving';
    emoji = '📈';
    body = `${periodLabel}, your mood has been improving. Average: ${avg.toFixed(1)}/5. Keep doing what's working!`;
  } else if (diff < -0.4) {
    trend = 'declining';
    emoji = '📉';
    body = `${periodLabel}, your mood has dipped a bit (avg ${avg.toFixed(1)}/5). That's okay — consider reaching out to your support network.`;
  } else {
    trend = 'stable';
    emoji = '➡️';
    body = `${periodLabel}, your mood has been steady at ${avg.toFixed(1)}/5. Stability is strength in recovery.`;
  }

  return {
    id: `mood-${period}`,
    title: `${periodLabel}'s Mood`,
    body,
    emoji,
    trend,
    period,
  };
}

function analyzeCravings(data: MoodDataPoint[]): MoodTrendCard | null {
  const withCravings = data.filter((d) => d.craving !== undefined && d.craving !== null);
  if (withCravings.length < 3) return null;

  const recent = withCravings.slice(-7);
  const avgCraving = recent.reduce((a, d) => a + (d.craving || 0), 0) / recent.length;

  if (avgCraving <= 2) {
    return {
      id: 'craving-low',
      title: 'Cravings Under Control',
      body: `Your average craving level is ${avgCraving.toFixed(1)}/10. Your coping strategies are working.`,
      emoji: '🛡️',
      trend: 'improving',
      period: '7d',
    };
  }

  if (avgCraving >= 6) {
    return {
      id: 'craving-high',
      title: 'Elevated Cravings',
      body: `Your cravings have been higher lately (${avgCraving.toFixed(1)}/10). This is normal — consider talking to your sponsor or trying a grounding exercise.`,
      emoji: '⚡',
      trend: 'declining',
      period: '7d',
    };
  }

  return null;
}
