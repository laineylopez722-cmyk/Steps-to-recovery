/**
 * Weekly Recovery Report Generator
 * Auto-generates a weekly recovery summary.
 */

import { logger } from '../../../utils/logger';

export interface WeeklyReport {
  id: string;
  weekStarting: string;
  weekEnding: string;
  generatedAt: string;
  moodSummary: { average: number; trend: string; bestDay: string; worstDay: string };
  journalSummary: { entryCount: number; themes: string[] };
  checkInSummary: { completedDays: number; totalDays: number; streak: number };
  cravingSummary: { average: number; peak: number; trend: string };
  stepWorkSummary: { currentStep: number; entriesThisWeek: number };
  highlights: string[];
  encouragement: string;
}

export interface WeeklyReportData {
  moodRatings: Array<{ date: string; mood: number }>;
  cravingLevels: Array<{ date: string; level: number }>;
  journalEntryCount: number;
  journalThemes: string[];
  checkInDates: string[];
  currentStep: number;
  stepWorkEntries: number;
  sobrietyDays: number;
}

/**
 * Generate a weekly recovery report from raw data.
 */
export function generateWeeklyReport(data: WeeklyReportData): WeeklyReport {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Mood
  const moods = data.moodRatings;
  const moodAvg = moods.length > 0 ? moods.reduce((a, b) => a + b.mood, 0) / moods.length : 0;
  const bestMood = moods.length > 0 ? moods.reduce((a, b) => (b.mood > a.mood ? b : a)) : null;
  const worstMood = moods.length > 0 ? moods.reduce((a, b) => (b.mood < a.mood ? b : a)) : null;
  const moodTrend = computeTrend(moods.map((m) => m.mood));

  // Cravings
  const cravings = data.cravingLevels;
  const cravingAvg =
    cravings.length > 0 ? cravings.reduce((a, b) => a + b.level, 0) / cravings.length : 0;
  const cravingPeak = cravings.length > 0 ? Math.max(...cravings.map((c) => c.level)) : 0;
  const cravingTrend = computeTrend(cravings.map((c) => c.level));

  // Check-ins
  const uniqueCheckInDays = new Set(data.checkInDates.map((d) => d.split('T')[0]));
  const streak = computeStreak(data.checkInDates);

  // Highlights
  const highlights = generateHighlights(data, moodAvg, streak);
  const encouragement = generateEncouragement(data.sobrietyDays, moodTrend);

  const report: WeeklyReport = {
    id: `weekly-${weekAgo.toISOString().split('T')[0]}`,
    weekStarting: weekAgo.toISOString().split('T')[0] || '',
    weekEnding: now.toISOString().split('T')[0] || '',
    generatedAt: now.toISOString(),
    moodSummary: {
      average: Math.round(moodAvg * 10) / 10,
      trend: moodTrend,
      bestDay: bestMood?.date.split('T')[0] || 'N/A',
      worstDay: worstMood?.date.split('T')[0] || 'N/A',
    },
    journalSummary: {
      entryCount: data.journalEntryCount,
      themes: data.journalThemes.slice(0, 5),
    },
    checkInSummary: {
      completedDays: uniqueCheckInDays.size,
      totalDays: 7,
      streak,
    },
    cravingSummary: {
      average: Math.round(cravingAvg * 10) / 10,
      peak: cravingPeak,
      trend: cravingTrend,
    },
    stepWorkSummary: {
      currentStep: data.currentStep,
      entriesThisWeek: data.stepWorkEntries,
    },
    highlights,
    encouragement,
  };

  logger.debug('Weekly report generated', { sobrietyDays: data.sobrietyDays });
  return report;
}

function computeTrend(values: number[]): string {
  if (values.length < 2) return 'stable';
  const half = Math.floor(values.length / 2);
  const first = values.slice(0, half);
  const second = values.slice(half);
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
  const diff = avgSecond - avgFirst;
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates.map((d) => d.split('T')[0]))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let expected = today;

  for (const dateStr of sorted) {
    if (dateStr === expected) {
      streak++;
      const prev = new Date(expected + 'T12:00:00');
      prev.setDate(prev.getDate() - 1);
      expected = prev.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
}

function generateHighlights(data: WeeklyReportData, moodAvg: number, streak: number): string[] {
  const highlights: string[] = [];
  if (streak >= 7) highlights.push('🔥 Perfect check-in streak this week!');
  else if (streak >= 3) highlights.push(`📊 ${streak}-day check-in streak`);
  if (data.journalEntryCount >= 5)
    highlights.push(`✍️ ${data.journalEntryCount} journal entries — strong reflection practice`);
  if (data.stepWorkEntries > 0) highlights.push(`📖 Step ${data.currentStep} work in progress`);
  if (moodAvg >= 4) highlights.push('😊 Your mood has been great this week');
  return highlights.slice(0, 4);
}

function generateEncouragement(sobrietyDays: number, moodTrend: string): string {
  if (sobrietyDays < 7) return "Every day is a victory. You're building something incredible.";
  if (moodTrend === 'improving') return 'Your trajectory is positive — your hard work is showing.';
  if (moodTrend === 'declining')
    return "Tough weeks are part of the journey. Reach out to your support network — you don't have to do this alone.";
  return `${sobrietyDays} days of courage. One day at a time.`;
}
