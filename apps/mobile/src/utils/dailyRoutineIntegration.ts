/**
 * Daily Routine Integration
 * Connects daily check-ins with daily readings for enhanced daily routine flow
 *
 * This module provides functions to integrate the daily readings feature
 * with the existing check-in system, creating a cohesive daily practice.
 */

import { logger } from '../utils/logger';
import type { DailyReading, DailyReadingReflection } from '../types';

// Define DailyCheckin interface locally since it's not exported from types
interface DailyCheckin {
  id: string;
  user_id: string;
  encrypted_mood?: string;
  encrypted_craving?: string;
  created_at: string;
}

export interface DailyRoutineData {
  date: string;
  hasCheckedIn: boolean;
  hasReflected: boolean;
  checkin?: DailyCheckin;
  reading?: DailyReading;
  reflection?: DailyReadingReflection;
  routineScore: number; // 0-100 based on completion
}

// Maximum possible routine score
const MAX_ROUTINE_SCORE = 100;

/**
 * Calculate routine completion score
 * Gives a score out of 100 based on daily activities completed
 */
export function calculateRoutineScore(data: Partial<DailyRoutineData>): number {
  let score = 0;

  // Check-in completion (50 points)
  if (data.hasCheckedIn) {
    score += 50;
  }

  // Reading reflection completion (50 points)
  if (data.hasReflected) {
    score += 50;
  }

  return Math.min(score, MAX_ROUTINE_SCORE);
}

/**
 * Get suggested daily routine flow
 * Returns recommendations based on what the user has/hasn't completed
 */
export function getDailyRoutineGuidance(data: DailyRoutineData): {
  message: string;
  nextAction: 'checkin' | 'reading' | 'reflection' | 'complete';
  encouragement: string;
} {
  const { hasCheckedIn, hasReflected, routineScore } = data;

  if (!hasCheckedIn && !hasReflected) {
    return {
      message: "Good morning! Let's start your day with intention.",
      nextAction: 'checkin',
      encouragement:
        'Taking time for your daily check-in helps set a positive tone for the day ahead.',
    };
  }

  if (hasCheckedIn && !hasReflected) {
    return {
      message: "Great check-in! Now let's explore today's reading.",
      nextAction: 'reading',
      encouragement:
        "Today's reading has insights that might resonate with where you are right now.",
    };
  }

  if (!hasCheckedIn && hasReflected) {
    return {
      message: 'Wonderful reflection! A quick check-in would complete your routine.',
      nextAction: 'checkin',
      encouragement: 'Pairing reflection with check-in creates a more complete daily practice.',
    };
  }

  return {
    message: "Excellent! You've completed your daily routine.",
    nextAction: 'complete',
    encouragement: `Your routine score today is ${routineScore}/100. You're building a strong foundation for recovery.`,
  };
}

/**
 * Generate personalized reading suggestions based on check-in data
 */
export function getReadingSuggestions(checkin: DailyCheckin | null): {
  focusAreas: string[];
  reflectionPrompts: string[];
} {
  const focusAreas: string[] = [];
  const reflectionPrompts: string[] = [];

  if (!checkin) {
    return {
      focusAreas: ['mindfulness', 'self-compassion', 'daily intention'],
      reflectionPrompts: [
        'What am I most grateful for today?',
        'How can I show kindness to myself today?',
        'What positive intention do I want to set?',
      ],
    };
  }

  // Analyze mood from check-in
  if (checkin.encrypted_mood) {
    // Would decrypt and analyze mood here
    focusAreas.push('emotional awareness', 'mood balance');
    reflectionPrompts.push('How did I handle my emotions today?');
  }

  // Analyze cravings from check-in
  if (checkin.encrypted_craving) {
    focusAreas.push('craving management', 'healthy coping');
    reflectionPrompts.push('What healthy alternatives did I choose today?');
  }

  // Add general reflection prompts
  reflectionPrompts.push(
    'What did I learn about myself today?',
    'How did I practice self-care today?',
    'What am I looking forward to tomorrow?',
  );

  return { focusAreas, reflectionPrompts };
}

/**
 * Create integrated daily summary
 * Combines check-in and reading data into a cohesive daily summary
 */
export function createDailySummary(data: DailyRoutineData): {
  title: string;
  summary: string;
  insights: string[];
  celebrateMessage?: string;
} {
  const { hasCheckedIn, hasReflected, routineScore } = data;

  const insights: string[] = [];
  let title = 'Daily Summary';
  let summary = "Here's how your day unfolded:";

  if (routineScore === 100) {
    title = 'Complete Day! 🌟';
    summary = "You completed your full daily routine today. That's something to celebrate!";
    insights.push('Consistency in daily practices builds lasting positive change.');
  } else if (routineScore >= 50) {
    title = 'Good Progress 📈';
    summary = 'You made meaningful progress in your daily routine today.';
  } else {
    title = 'Every Step Counts 💙';
    summary = 'Remember, recovery is about progress, not perfection.';
    insights.push('Even small steps forward are valuable and worth acknowledging.');
  }

  // Add specific insights based on activities completed
  if (hasCheckedIn) {
    insights.push('Taking time to check in with yourself shows self-awareness and care.');
  }

  if (hasReflected) {
    insights.push('Your reflection today contributes to deeper self-understanding.');
  }

  // Generate celebration message for complete routines
  const celebrateMessage =
    routineScore === 100
      ? "You've built another day of positive habits. Each day like this strengthens your foundation for lasting recovery."
      : undefined;

  return {
    title,
    summary,
    insights,
    celebrateMessage,
  };
}

/**
 * Track routine consistency over time
 */
export function calculateRoutineStreak(routineHistory: DailyRoutineData[]): {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
} {
  const sortedHistory = routineHistory.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Calculate current streak (working backwards from today)
  let currentStreak = 0;
  for (const day of sortedHistory) {
    if (day.routineScore >= 50) {
      // At least 50% completion
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of sortedHistory.reverse()) {
    if (day.routineScore >= 50) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate completion rate
  const totalDays = routineHistory.length;
  const completedDays = routineHistory.filter((day) => day.routineScore >= 50).length;
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  return {
    currentStreak,
    longestStreak,
    completionRate: Math.round(completionRate),
  };
}

/**
 * Get motivational message based on routine performance
 */
export function getMotivationalMessage(streak: number, completionRate: number): string {
  if (streak >= 30) {
    return "Incredible! You've built a solid routine that's become part of who you are. This consistency is transforming your life.";
  }

  if (streak >= 7) {
    return "You're building momentum! A week of consistent daily practices shows real commitment to your growth.";
  }

  if (streak >= 3) {
    return 'Great start! Three days in a row is the beginning of a powerful new habit.';
  }

  if (completionRate >= 70) {
    return "You're doing well overall! Even with some ups and downs, you're showing up for yourself consistently.";
  }

  if (completionRate >= 40) {
    return "Keep going! You're making progress, and each day you practice these routines, you're investing in your wellbeing.";
  }

  return 'Every journey begins with a single step. Today is a perfect day to recommit to the daily practices that support your recovery.';
}

/**
 * Log routine integration events for analytics
 */
export function logRoutineEvent(event: {
  type: 'routine_completed' | 'guidance_viewed' | 'streak_achieved';
  data: Record<string, unknown>;
}): void {
  logger.info('Daily routine event', {
    event: event.type,
    ...event.data,
    timestamp: new Date().toISOString(),
  });
}
