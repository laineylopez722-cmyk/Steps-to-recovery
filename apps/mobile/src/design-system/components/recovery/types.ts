/**
 * Recovery Component Types
 * Shared types for all recovery-specific UI components
 */

export interface CleanTime {
  days: number;
  hours: number;
  minutes: number;
}

export interface StreakData {
  days: number;
  hours: number;
  minutes: number;
  lastResetDate: Date;
  nextMilestone: number;
}

export interface DailyActivity {
  date: Date;
  morningCompleted: boolean;
  eveningCompleted: boolean;
}

export type CheckInStatus = 'incomplete' | 'morning-only' | 'evening-only' | 'complete';

export interface CheckInData {
  morning?: {
    completed: boolean;
    time?: string;
    mood?: number;
    intention?: string;
  };
  evening?: {
    completed: boolean;
    time?: string;
    reflection?: string;
    cravingIntensity: number;
  };
}

export type MoodType = 'anxious' | 'sad' | 'neutral' | 'good' | 'great';

export interface MoodData {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: Date;
  mood: MoodType;
  tags: string[];
  hasCraving: boolean;
  cravingIntensity?: number;
  isSharedWithSponsor?: boolean;
  sponsorAvatar?: string;
}

export type StepStatus = 'completed' | 'current' | 'not-started';

export interface StepData {
  number: number;
  status: StepStatus;
  title: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: Date;
  color: string;
}

export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
  };
}

export interface AnimationConfig {
  duration?: number;
  easing?: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  reducedMotion?: boolean;
}

export interface TouchTargetProps {
  minWidth?: number;
  minHeight?: number;
}
