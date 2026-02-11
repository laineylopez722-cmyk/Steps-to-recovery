/**
 * Context Builder
 * Assembles personalized context for AI from user's data.
 */

import type { AIContext } from '../types';

export interface ContextData {
  sobrietyDate: string | null;
  currentStep: number | null;
  memorySummary: string;
  recentMoods: number[];
  recentCravings: number[];
  sponsorName: string | null;
  triggers: string[];
  copingStrategies: string[];
  recentVictories: string[];
  homeGroup?: string;
  programType?: 'AA' | 'NA' | 'both' | 'other';
}

export function buildContextString(data: ContextData): string {
  const parts: string[] = [];

  // Sobriety
  if (data.sobrietyDate) {
    const days = Math.floor(
      (Date.now() - new Date(data.sobrietyDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);

    let sobrietyString = `Sobriety: ${days} days`;
    if (years > 0) {
      sobrietyString += ` (${years} year${years > 1 ? 's' : ''}`;
      if (months > 0) sobrietyString += `, ${months} month${months > 1 ? 's' : ''}`;
      sobrietyString += ')';
    } else if (months > 0) {
      sobrietyString += ` (${months} month${months > 1 ? 's' : ''})`;
    }
    parts.push(sobrietyString);
  }

  // Program type
  if (data.programType) {
    parts.push(`Program: ${data.programType}`);
  }

  // Current step
  if (data.currentStep) {
    parts.push(`Currently working Step ${data.currentStep}`);
  }

  // Sponsor
  if (data.sponsorName) {
    parts.push(`Sponsor: ${data.sponsorName}`);
  }

  // Home group
  if (data.homeGroup) {
    parts.push(`Home group: ${data.homeGroup}`);
  }

  // Triggers
  if (data.triggers.length > 0) {
    parts.push(`Known triggers: ${data.triggers.join(', ')}`);
  }

  // Coping strategies
  if (data.copingStrategies.length > 0) {
    parts.push(`What helps: ${data.copingStrategies.join(', ')}`);
  }

  // Recent victories
  if (data.recentVictories.length > 0) {
    parts.push(`Recent wins: ${data.recentVictories.join('; ')}`);
  }

  // Memory summary
  if (data.memorySummary) {
    parts.push(`\nWhat I know about them:\n${data.memorySummary}`);
  }

  // Recent mood/craving patterns
  if (data.recentMoods.length > 0) {
    const avgMood = data.recentMoods.reduce((a, b) => a + b, 0) / data.recentMoods.length;
    const trend = getMoodTrend(data.recentMoods);
    parts.push(`Recent mood: ${avgMood.toFixed(1)}/5 (${trend})`);
  }

  if (data.recentCravings.length > 0) {
    const avgCraving = data.recentCravings.reduce((a, b) => a + b, 0) / data.recentCravings.length;
    const trend = getCravingTrend(data.recentCravings);
    parts.push(`Recent craving level: ${avgCraving.toFixed(1)}/10 (${trend})`);
  }

  return parts.join('\n');
}

function getMoodTrend(moods: number[]): string {
  if (moods.length < 2) return 'stable';
  const recent = moods.slice(-3);
  const earlier = moods.slice(0, -3);
  if (earlier.length === 0) return 'stable';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

  const diff = recentAvg - earlierAvg;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

function getCravingTrend(cravings: number[]): string {
  if (cravings.length < 2) return 'stable';
  const recent = cravings.slice(-3);
  const earlier = cravings.slice(0, -3);
  if (earlier.length === 0) return 'stable';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

  const diff = recentAvg - earlierAvg;
  if (diff > 1) return 'increasing - watch closely';
  if (diff < -1) return 'decreasing';
  return 'stable';
}

// Full context assembly - call this from useAIChat
export async function assembleFullContext(
  userId: string,
  getMemorySummary: () => Promise<string>,
  getUserData: () => Promise<Partial<ContextData>>,
): Promise<string> {
  const [memorySummary, userData] = await Promise.all([getMemorySummary(), getUserData()]);

  return buildContextString({
    sobrietyDate: userData.sobrietyDate || null,
    currentStep: userData.currentStep || null,
    memorySummary,
    recentMoods: userData.recentMoods || [],
    recentCravings: userData.recentCravings || [],
    sponsorName: userData.sponsorName || null,
    triggers: userData.triggers || [],
    copingStrategies: userData.copingStrategies || [],
    recentVictories: userData.recentVictories || [],
    homeGroup: userData.homeGroup,
    programType: userData.programType,
  });
}

// Convert to AIContext type for API use
export function toAIContext(contextString: string, data: Partial<ContextData>): AIContext {
  const sobrietyDays = data.sobrietyDate
    ? Math.floor((Date.now() - new Date(data.sobrietyDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const recentMood =
    data.recentMoods && data.recentMoods.length > 0
      ? data.recentMoods[data.recentMoods.length - 1]
      : null;

  const recentCraving =
    data.recentCravings && data.recentCravings.length > 0
      ? data.recentCravings[data.recentCravings.length - 1]
      : null;

  return {
    sobrietyDays,
    currentStep: data.currentStep || null,
    memorySummary: contextString,
    recentMood,
    recentCravingLevel: recentCraving,
    sponsorName: data.sponsorName || null,
    conversationType: 'general',
  };
}
