/**
 * Shared local record types used by the sync service.
 */

interface LocalSyncRecord {
  id: string;
  user_id: string;
  sync_status: string;
  supabase_id: string | null;
}

interface LocalCreatedRecord extends LocalSyncRecord {
  created_at: string;
}

interface LocalTimestampedRecord extends LocalCreatedRecord {
  updated_at: string;
}

export interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  supabase_id: string | null;
  retry_count: number;
  last_error: string | null;
}

export interface LocalJournalEntry extends LocalTimestampedRecord {
  encrypted_title: string | null;
  encrypted_body: string;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  encrypted_tags: string | null;
  /** Added in migration v20 — may be absent on older schema versions */
  encrypted_audio: string | null;
}

export interface LocalStepWork extends LocalTimestampedRecord {
  step_number: number;
  question_number: number;
  encrypted_answer: string | null;
  is_complete: number;
  completed_at: string | null;
}

export interface LocalDailyCheckIn extends LocalTimestampedRecord {
  check_in_type: 'morning' | 'evening';
  check_in_date: string;
  encrypted_intention: string | null;
  encrypted_reflection: string | null;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  encrypted_gratitude: string | null;
}

export interface LocalFavoriteMeeting extends LocalCreatedRecord {
  meeting_id: string;
  encrypted_notes: string | null;
  notification_enabled: number;
}

export interface LocalReadingReflection extends LocalTimestampedRecord {
  reading_id: string;
  reading_date: string;
  encrypted_reflection: string;
  word_count: number;
}

export interface LocalWeeklyReport extends LocalCreatedRecord {
  week_start: string;
  week_end: string;
  report_json: string;
}

export interface LocalSponsorConnection extends LocalTimestampedRecord {
  role: 'sponsee' | 'sponsor';
  status: 'pending' | 'connected';
  invite_code: string;
  display_name: string | null;
  own_public_key: string;
  peer_public_key: string | null;
  shared_key: string | null;
  pending_private_key: string | null;
}

export interface LocalSponsorSharedEntry extends LocalTimestampedRecord {
  connection_id: string;
  direction: 'outgoing' | 'incoming' | 'comment';
  journal_entry_id: string | null;
  payload: string;
}

export interface LocalAchievement extends LocalSyncRecord {
  achievement_key: string;
  achievement_type: string;
  earned_at: string;
  is_viewed: number;
}

export interface LocalAIMemory extends LocalTimestampedRecord {
  type: string;
  encrypted_content: string;
  confidence: number;
  encrypted_context: string | null;
  source_conversation_id: string | null;
}
