/**
 * Progress Feature Types
 *
 * Shared types for the progress dashboard and commitment calendar.
 */

export type ActivityLevel = 'none' | 'low' | 'medium' | 'high' | 'excellent';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  checkInCompleted: boolean;
  journalWritten: boolean;
  meetingAttended: boolean;
  stepWorkDone: boolean;
  gratitudeCompleted: boolean;
  activityLevel: ActivityLevel;
  activityCount: number; // 0-5
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-11
  days: DayActivity[];
}

// Craving Pattern Analysis Types

export interface CravingDataPoint {
  date: string;
  time: string; // HH:MM
  intensity: number; // 0-10
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
}

export interface CravingPattern {
  peakHour: number;
  peakDay: string;
  averageIntensity: number;
  highRiskTimes: string[]; // e.g., ["Friday 6PM-9PM", "Sunday morning"]
  trend: 'decreasing' | 'stable' | 'increasing';
  weeklyChange: number; // percentage
  insights: string[];
}

export interface CravingHeatmapData {
  hourOfDay: number;
  dayOfWeek: number;
  averageIntensity: number;
  count: number;
}

export interface CravingSurfSummary {
  totalSessions: number;
  averageReduction: number;
  successRate: number; // percentage where final < initial
  mostEffectiveTechnique: string | null;
}
