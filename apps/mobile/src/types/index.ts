/**
 * Global Type Definitions
 * Shared interfaces used across all mobile app features.
 */

export type RegularMeetingType = 'in_person' | 'online' | 'hybrid';

export interface DailyReading {
  id: string;
  date: string;
  title: string;
  content: string;
  source: string;
  reflection_prompt: string;
  reflectionPrompt?: string;
  external_url?: string;
}

export interface DailyReadingReflection {
  id: string;
  reading_id: string;
  readingDate: string; // Format: 'MM-DD'
  user_id: string;
  encrypted_reflection: string;
  reflection: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'in_progress' | 'unlocked';
  current: number;
  target: number;
  unlockedAt?: string | null;
  icon?: string;
}

export interface MeetingWithDetails {
  id: string;
  name?: string;
  meeting_name?: string;
  meeting_type?: string | null;
  meeting_address?: string | null;
  location_name?: string | null;
  distance?: number | null;
  start_time?: string | null;
  startTime?: string | null;
  type?: string | null;
  day?: string | null;
  notes?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface RegularMeeting {
  id: string;
  user_id: string;
  meeting_id: string;
  name: string;
  location: string;
  day_of_week: number;
  dayOfWeek: number; // Alias for backwards compatibility
  time: string;
  type: RegularMeetingType;
  is_active: boolean;
  isHomeGroup?: boolean;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  encrypted_notes?: string;
  notes?: string;
  created_at: string;
}

export interface SobrietyMilestone {
  id: string;
  user_id: string;
  days: number;
  achieved_at: string;
  celebrated: boolean;
}

export interface SponsorInfo {
  id: string;
  name: string;
  phone: string;
  notes?: string;
}
