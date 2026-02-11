/**
 * Emotional State Tracking
 * Tracks emotional trajectory across conversations and detects patterns.
 */

import { logger } from '../../../utils/logger';
import { secureStorage } from '../../../adapters/secureStorage';

const EMOTIONAL_HISTORY_KEY = 'ai_emotional_history';
const MAX_HISTORY = 200;

export interface EmotionalState {
  timestamp: string;
  mood: number; // 1-5
  energy: number; // 1-5
  anxiety: number; // 0-10
  dominantEmotion: string;
  conversationId?: string;
}

export interface EmotionalPattern {
  type: 'time_of_day' | 'day_of_week' | 'trend';
  description: string;
  confidence: number;
}

const EMOTION_KEYWORDS: Record<string, { mood: number; anxiety: number }> = {
  grateful: { mood: 5, anxiety: 1 },
  hopeful: { mood: 4, anxiety: 2 },
  happy: { mood: 5, anxiety: 1 },
  calm: { mood: 4, anxiety: 1 },
  anxious: { mood: 2, anxiety: 8 },
  scared: { mood: 2, anxiety: 9 },
  angry: { mood: 2, anxiety: 6 },
  sad: { mood: 2, anxiety: 4 },
  depressed: { mood: 1, anxiety: 5 },
  frustrated: { mood: 2, anxiety: 6 },
  lonely: { mood: 2, anxiety: 5 },
  overwhelmed: { mood: 1, anxiety: 9 },
  proud: { mood: 5, anxiety: 1 },
  ashamed: { mood: 1, anxiety: 7 },
  triggered: { mood: 2, anxiety: 8 },
  craving: { mood: 2, anxiety: 8 },
  tempted: { mood: 2, anxiety: 7 },
  strong: { mood: 4, anxiety: 2 },
  peaceful: { mood: 5, anxiety: 0 },
  struggling: { mood: 2, anxiety: 7 },
};

/**
 * Detect emotional state from a message.
 */
export function detectEmotionalState(message: string, conversationId?: string): EmotionalState {
  const lower = message.toLowerCase();
  let totalMood = 0;
  let totalAnxiety = 0;
  let matchCount = 0;
  let dominantEmotion = 'neutral';
  let highestWeight = 0;

  for (const [emotion, values] of Object.entries(EMOTION_KEYWORDS)) {
    if (lower.includes(emotion)) {
      totalMood += values.mood;
      totalAnxiety += values.anxiety;
      matchCount++;
      if (matchCount === 1 || values.anxiety > highestWeight) {
        dominantEmotion = emotion;
        highestWeight = values.anxiety;
      }
    }
  }

  const mood = matchCount > 0 ? Math.round(totalMood / matchCount) : 3;
  const anxiety = matchCount > 0 ? Math.round(totalAnxiety / matchCount) : 3;

  return {
    timestamp: new Date().toISOString(),
    mood: Math.max(1, Math.min(5, mood)),
    energy: 3, // Default — could be enhanced with more keywords
    anxiety: Math.max(0, Math.min(10, anxiety)),
    dominantEmotion,
    conversationId,
  };
}

/**
 * Track and persist an emotional state.
 */
export async function trackEmotionalState(state: EmotionalState): Promise<void> {
  try {
    const history = await loadHistory();
    history.push(state);
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }
    await secureStorage.setItemAsync(EMOTIONAL_HISTORY_KEY, JSON.stringify(history));
    logger.debug('Emotional state tracked', { mood: state.mood, emotion: state.dominantEmotion });
  } catch (error) {
    logger.error('Failed to track emotional state', error);
  }
}

/**
 * Analyze emotional patterns over time.
 */
export async function getEmotionalPatterns(): Promise<EmotionalPattern[]> {
  const history = await loadHistory();
  if (history.length < 5) return [];

  const patterns: EmotionalPattern[] = [];

  // Day-of-week pattern
  const dayBuckets: Record<number, number[]> = {};
  for (const entry of history) {
    const day = new Date(entry.timestamp).getDay();
    if (!dayBuckets[day]) dayBuckets[day] = [];
    dayBuckets[day].push(entry.mood);
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let worstDay = -1;
  let worstAvg = 6;
  for (const [day, moods] of Object.entries(dayBuckets)) {
    if (moods.length >= 2) {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      if (avg < worstAvg) {
        worstAvg = avg;
        worstDay = Number(day);
      }
    }
  }

  if (worstDay >= 0 && worstAvg < 3) {
    patterns.push({
      type: 'day_of_week',
      description: `Your mood tends to dip on ${dayNames[worstDay]}s. Consider planning extra support.`,
      confidence: Math.min(0.9, (dayBuckets[worstDay]?.length || 0) / 5),
    });
  }

  // Overall trend (last 14 entries)
  if (history.length >= 10) {
    const recent = history.slice(-14);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b.mood, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b.mood, 0) / secondHalf.length;
    const diff = avgSecond - avgFirst;

    if (Math.abs(diff) > 0.5) {
      patterns.push({
        type: 'trend',
        description:
          diff > 0
            ? 'Your mood has been improving recently. Your recovery work is paying off!'
            : "Your mood has been lower recently. That's okay — consider reaching out to your support network.",
        confidence: Math.min(0.85, Math.abs(diff) / 2),
      });
    }
  }

  return patterns;
}

async function loadHistory(): Promise<EmotionalState[]> {
  try {
    const raw = await secureStorage.getItemAsync(EMOTIONAL_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmotionalState[];
  } catch {
    return [];
  }
}
