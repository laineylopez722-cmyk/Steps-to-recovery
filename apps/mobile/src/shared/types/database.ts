/**
 * Database model types for SQLite and Supabase schemas
 * All sensitive fields are encrypted (prefixed with encrypted_)
 */

export type SyncStatus = 'pending' | 'synced' | 'error';

export interface UserProfile {
  id: string;
  encrypted_email: string;
  sobriety_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  encrypted_title: string | null;
  encrypted_body: string;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  encrypted_tags: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  supabase_id: string | null;
}

export type CheckInType = 'morning' | 'evening';

export interface DailyCheckIn {
  id: string;
  user_id: string;
  check_in_type: CheckInType;
  check_in_date: string;
  encrypted_intention: string | null;
  encrypted_reflection: string | null;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  created_at: string;
  sync_status: SyncStatus;
}

export interface StepWork {
  id: string;
  user_id: string;
  step_number: number;
  question_number: number;
  encrypted_answer: string | null;
  is_complete: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  supabase_id: string | null;
}

export type AchievementType = 'milestone' | 'streak' | 'step_completion';

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  achievement_type: AchievementType;
  earned_at: string;
  is_viewed: number;
}

export type SyncOperation = 'insert' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: SyncOperation;
  created_at: string;
  retry_count: number;
  last_error: string | null;
}

export interface DbTimeCapsule {
  id: string;
  title: string;
  content: string;
  unlock_date: string;
  is_unlocked: number;
  unlocked_at: string | null;
  created_at: string;
}
