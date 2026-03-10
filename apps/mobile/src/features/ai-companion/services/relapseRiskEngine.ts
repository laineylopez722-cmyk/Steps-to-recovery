/**
 * Relapse Risk Prediction Engine
 *
 * Predicts relapse risk using local pattern analysis.
 * NO DATA LEAVES THE DEVICE — all computation is client-side.
 *
 * Unlike the reactive riskDetectionService (which reports activity gaps),
 * this engine produces a *predictive composite score* by analyzing:
 *  - Mood trend slope (are you declining?)
 *  - Craving intensity trend (are cravings getting worse?)
 *  - Check-in consistency (are you staying engaged?)
 *  - High-craving spikes (recent severe craving events)
 *  - Journal & step-work inactivity (protective factor drop-off)
 *
 * Score: 0–100 (higher = higher risk)
 * Levels: low (0–39), elevated (40–69), high (70–100)
 */

import { logger } from '../../../utils/logger';
import { decryptContent } from '../../../utils/encryption';
import type { StorageAdapter } from '../../../adapters/storage/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'elevated' | 'high';

export interface RelapseRiskResult {
  score: number; // 0–100
  level: RiskLevel;
  factors: string[]; // Human-readable contributing risk factors
  protectiveFactors: string[]; // What's going well
  recommendations: string[]; // Suggested next actions
  dataPoints: number; // How many data points were analysed
  computedAt: string; // ISO timestamp
}

interface CheckInRow {
  check_in_date: string;
  check_in_type: string;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
}

interface JournalRow {
  created_at: string;
}

interface StepWorkRow {
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.floor(diffMs / 86_400_000);
}

/**
 * Simple linear regression slope for a list of numbers.
 * Returns positive (increasing) or negative (decreasing) slope.
 */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0);
  const den = xs.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
  return den === 0 ? 0 : num / den;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Components (each returns 0–N risk points)
// ─────────────────────────────────────────────────────────────────────────────

interface DecryptedCheckIn {
  date: string;
  type: string;
  mood: number | null;
  craving: number | null;
}

async function decryptCheckIns(rows: CheckInRow[]): Promise<DecryptedCheckIn[]> {
  const results: DecryptedCheckIn[] = [];
  for (const row of rows) {
    try {
      const mood = row.encrypted_mood
        ? parseInt(await decryptContent(row.encrypted_mood), 10)
        : null;
      const craving = row.encrypted_craving
        ? parseInt(await decryptContent(row.encrypted_craving), 10)
        : null;
      results.push({
        date: row.check_in_date,
        type: row.check_in_type,
        mood: isNaN(mood!) ? null : mood,
        craving: isNaN(craving!) ? null : craving,
      });
    } catch {
      // Skip rows that fail decryption
    }
  }
  return results;
}

/** Missing check-ins → 0–20 pts */
function scoreCheckInConsistency(
  checkIns: DecryptedCheckIn[],
  windowDays: number,
): { points: number; factor: string | null; protective: string | null } {
  const uniqueDays = new Set(checkIns.map((c) => c.date));
  const consistency = Math.min(1, uniqueDays.size / windowDays);

  if (consistency >= 0.85) {
    return { points: 0, factor: null, protective: 'Strong check-in habit (85%+ days)' };
  }
  if (consistency >= 0.5) {
    return {
      points: 8,
      factor: `Missed check-ins on ${windowDays - uniqueDays.size} of ${windowDays} days`,
      protective: null,
    };
  }
  return {
    points: 20,
    factor: `Only checked in on ${uniqueDays.size} of the last ${windowDays} days`,
    protective: null,
  };
}

/** Declining mood trend → 0–25 pts */
function scoreMoodTrend(checkIns: DecryptedCheckIn[]): {
  points: number;
  factor: string | null;
  protective: string | null;
} {
  const moods = checkIns.filter((c) => c.mood !== null).map((c) => c.mood as number);
  if (moods.length < 3) {
    return { points: 0, factor: null, protective: null };
  }

  const slope = linearSlope(moods);
  const recentAvg = moods.slice(-3).reduce((a, b) => a + b, 0) / 3;

  if (slope < -0.3 && recentAvg < 2.5) {
    return {
      points: 25,
      factor: `Mood declining rapidly — recent average ${recentAvg.toFixed(1)}/5`,
      protective: null,
    };
  }
  if (slope < -0.15) {
    return {
      points: 15,
      factor: 'Mood trending downward over the past 2 weeks',
      protective: null,
    };
  }
  if (slope > 0.1) {
    return {
      points: 0,
      factor: null,
      protective: 'Mood improving — keep it up',
    };
  }
  return { points: 5, factor: null, protective: 'Mood stable' };
}

/** Rising craving trend → 0–25 pts */
function scoreCravingTrend(checkIns: DecryptedCheckIn[]): {
  points: number;
  factor: string | null;
  protective: string | null;
} {
  const cravings = checkIns.filter((c) => c.craving !== null).map((c) => c.craving as number);
  if (cravings.length < 3) {
    return { points: 0, factor: null, protective: null };
  }

  const slope = linearSlope(cravings);
  const recentMax = Math.max(...cravings.slice(-3));
  const recentAvg = cravings.slice(-3).reduce((a, b) => a + b, 0) / 3;

  if (slope > 0.5 && recentMax >= 8) {
    return {
      points: 25,
      factor: `Cravings escalating — recent peak ${recentMax}/10`,
      protective: null,
    };
  }
  if (slope > 0.3 || recentAvg > 6) {
    return {
      points: 15,
      factor: `Elevated craving intensity (avg ${recentAvg.toFixed(1)}/10 this week)`,
      protective: null,
    };
  }
  if (slope < -0.2) {
    return {
      points: 0,
      factor: null,
      protective: `Cravings decreasing (down ${Math.abs(slope * 7).toFixed(1)} pts/week)`,
    };
  }
  return { points: 5, factor: null, protective: null };
}

/** Recent high-craving spikes → 0–20 pts */
function scoreHighCravingSpikes(checkIns: DecryptedCheckIn[]): {
  points: number;
  factor: string | null;
} {
  const recent3Days = checkIns
    .filter((c) => daysSince(c.date) <= 3 && c.craving !== null)
    .map((c) => c.craving as number);

  const spikeCount = recent3Days.filter((c) => c >= 7).length;
  if (spikeCount >= 2) {
    return {
      points: 20,
      factor: `${spikeCount} high-intensity craving events in the last 3 days`,
    };
  }
  if (spikeCount === 1) {
    return { points: 10, factor: 'High-intensity craving event in the last 3 days' };
  }
  return { points: 0, factor: null };
}

/** Journal inactivity → 0–15 pts */
function scoreJournalActivity(lastJournalDate: string | null): {
  points: number;
  factor: string | null;
  protective: string | null;
} {
  if (!lastJournalDate) {
    return { points: 10, factor: 'No journal entries found', protective: null };
  }
  const days = daysSince(lastJournalDate);
  if (days >= 7) {
    return { points: 15, factor: `No journal entry in ${days} days`, protective: null };
  }
  if (days >= 3) {
    return { points: 8, factor: `Journal inactive for ${days} days`, protective: null };
  }
  return { points: 0, factor: null, protective: 'Active journaling habit' };
}

/** Step work inactivity → 0–15 pts */
function scoreStepWorkActivity(lastStepDate: string | null): {
  points: number;
  factor: string | null;
  protective: string | null;
} {
  if (!lastStepDate) {
    return { points: 0, factor: null, protective: null }; // Not penalized if never started
  }
  const days = daysSince(lastStepDate);
  if (days >= 14) {
    return { points: 15, factor: `Step work paused for ${days} days`, protective: null };
  }
  if (days >= 7) {
    return { points: 8, factor: `No step work in ${days} days`, protective: null };
  }
  return { points: 0, factor: null, protective: 'Consistent step work progress' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

function buildRecommendations(level: RiskLevel, factors: string[]): string[] {
  const recommendations: string[] = [];

  if (level === 'high') {
    recommendations.push('Reach out to your sponsor or a trusted person today');
    recommendations.push('Open the Emergency Toolkit if you feel unsafe');
  }

  if (factors.some((f) => f.toLowerCase().includes('craving'))) {
    recommendations.push('Try a 5-minute craving surf session');
  }

  if (factors.some((f) => f.toLowerCase().includes('mood'))) {
    recommendations.push('Complete your evening reflection to track what happened');
  }

  if (factors.some((f) => f.toLowerCase().includes('journal'))) {
    recommendations.push('Write even a single sentence in your journal today');
  }

  if (factors.some((f) => f.toLowerCase().includes('check-in'))) {
    recommendations.push('Do your morning check-in to re-engage your routine');
  }

  if (level === 'elevated' && recommendations.length === 0) {
    recommendations.push("Read today's JFT and reflect for 5 minutes");
  }

  return recommendations.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate relapse risk score from local SQLite data.
 * All decryption happens on-device.
 */
export async function calculateRelapseRisk(
  db: StorageAdapter,
  userId: string,
): Promise<RelapseRiskResult> {
  const windowDays = 14;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - windowDays);
  const startDateStr = startDate.toISOString().split('T')[0];

  try {
    // Fetch check-ins for the window
    const checkInRows = await db.getAllAsync<CheckInRow>(
      `SELECT check_in_date, check_in_type, encrypted_mood, encrypted_craving
       FROM daily_checkins
       WHERE user_id = ? AND check_in_date >= ?
       ORDER BY check_in_date ASC`,
      [userId, startDateStr],
    );

    // Fetch last journal entry date
    const journalRows = await db.getAllAsync<JournalRow>(
      `SELECT created_at FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    // Fetch last step work date
    const stepRows = await db.getAllAsync<StepWorkRow>(
      `SELECT updated_at FROM step_work WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
      [userId],
    );

    const checkIns = await decryptCheckIns(checkInRows);
    const lastJournalDate = journalRows[0]?.created_at ?? null;
    const lastStepDate = stepRows[0]?.updated_at ?? null;

    // Calculate score components
    const consistencyResult = scoreCheckInConsistency(checkIns, windowDays);
    const moodResult = scoreMoodTrend(checkIns);
    const cravingTrendResult = scoreCravingTrend(checkIns);
    const spikesResult = scoreHighCravingSpikes(checkIns);
    const journalResult = scoreJournalActivity(lastJournalDate);
    const stepResult = scoreStepWorkActivity(lastStepDate);

    const rawScore =
      consistencyResult.points +
      moodResult.points +
      cravingTrendResult.points +
      spikesResult.points +
      journalResult.points +
      stepResult.points;

    const score = clamp(rawScore, 0, 100);

    const level: RiskLevel = score >= 70 ? 'high' : score >= 40 ? 'elevated' : 'low';

    const factors = [
      consistencyResult.factor,
      moodResult.factor,
      cravingTrendResult.factor,
      spikesResult.factor,
      journalResult.factor,
      stepResult.factor,
    ].filter((f): f is string => f !== null);

    const protectiveFactors = [
      consistencyResult.protective,
      moodResult.protective,
      cravingTrendResult.protective,
      journalResult.protective,
      stepResult.protective,
    ].filter((f): f is string => f !== null);

    const recommendations = buildRecommendations(level, factors);

    const dataPoints = checkIns.length;

    logger.debug('Relapse risk calculated', { userId, score, level, dataPoints });

    return {
      score,
      level,
      factors,
      protectiveFactors,
      recommendations,
      dataPoints,
      computedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Relapse risk calculation failed', error);
    // Return safe default on error
    return {
      score: 0,
      level: 'low',
      factors: [],
      protectiveFactors: [],
      recommendations: [],
      dataPoints: 0,
      computedAt: new Date().toISOString(),
    };
  }
}
