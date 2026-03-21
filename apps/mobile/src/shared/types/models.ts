/**
 * Decrypted model types for application use
 * These are the types used in UI after decryption
 */

export interface JournalEntryDecrypted {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  mood: number | null;
  craving: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'error';
  supabase_id: string | null;
}

export interface DailyCheckInDecrypted {
  id: string;
  user_id: string;
  check_in_type: 'morning' | 'evening';
  check_in_date: string;
  intention: string | null;
  reflection: string | null;
  mood: number | null;
  craving: number | null;
  created_at: string;
  sync_status: 'pending' | 'synced' | 'error';
}

export interface StepWorkDecrypted {
  id: string;
  user_id: string;
  step_number: number;
  question_number: number;
  answer: string | null;
  is_complete: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'error';
  supabase_id?: string | null;
}

export interface MilestoneDefinition {
  key: string;
  days: number;
  title: string;
  description: string;
  icon: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
}

export interface TimeCapsule {
  id: string;
  title: string;
  content: string;
  unlockDate: Date;
  isUnlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
}
