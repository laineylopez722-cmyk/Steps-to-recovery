/**
 * Core TypeScript Types for 12-Step Recovery Companion
 * All sensitive content fields are encrypted at rest
 */

// Encrypted string type (Base64 encoded encrypted content)
export type EncryptedString = string;

// Program types supported
export type ProgramType = '12-step-aa' | '12-step-na' | 'smart' | 'custom';

// Journal entry types
export type JournalType =
  | 'freeform'
  | 'step-work'
  | 'meeting-reflection'
  | 'daily-checkin'
  | 'voice';

// Milestone types
export type MilestoneType = 'time-based' | 'step-completion' | 'personal' | 'meeting';

// Meeting types
export type MeetingType = 'in-person' | 'online';

// Theme modes
export type ThemeMode = 'light' | 'dark' | 'system';

// Crisis resource regions
export type CrisisRegion = 'AU' | 'US' | 'UK' | 'CA' | 'NZ' | 'IE' | 'global';

/**
 * Core user profile for recovery tracking
 */
export interface SobrietyProfile {
  id: string;
  sobrietyDate: Date;
  programType: ProgramType;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Journal entry with encrypted content
 */
export interface JournalEntry {
  id: string;
  type: JournalType;
  content: EncryptedString; // Always encrypted at rest
  moodBefore?: number; // 1-10
  moodAfter?: number; // 1-10
  cravingLevel?: number; // 0-10
  emotionTags: string[];
  stepNumber?: number; // 1-12 if step-work type
  meetingId?: string; // if meeting-reflection type
  audioUri?: string; // if voice type - path to audio file
  audioDuration?: number; // duration in seconds
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Time-based and custom milestones
 */
export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description?: string;
  reflection?: EncryptedString;
  achievedAt: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// Connection modes for meetings
export type MeetingConnectionMode = 'got_number' | 'conversation' | 'made_plans' | 'sponsor_chat';

/**
 * Meeting attendance log
 */
export interface MeetingLog {
  id: string;
  name?: string;
  location?: string;
  type: MeetingType;
  moodBefore: number;
  moodAfter: number;
  keyTakeaways: EncryptedString;
  topicTags: string[];
  attendedAt: Date;
  createdAt: Date;
  // Enhanced fields (Phase 2)
  whatILearned?: EncryptedString;
  quoteHeard?: EncryptedString;
  connectionsMode?: MeetingConnectionMode[];
  connectionNotes?: EncryptedString;
  didShare: boolean;
  shareReflection?: EncryptedString;
  regularMeetingId?: string; // Link to regular meeting
}

/**
 * Daily check-in record (one per day)
 */
export interface DailyCheckin {
  id: string;
  date: Date; // Date only, one per day
  mood: number; // 1-10
  cravingLevel: number; // 0-10
  gratitude?: EncryptedString;
  isCheckedIn: boolean;
  createdAt: Date;
}

/**
 * Emotion tag for categorizing feelings
 */
export interface EmotionTag {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
  createdAt: Date;
}

/**
 * App settings and preferences
 */
export interface AppSettings {
  id: string;
  checkInTime: string; // HH:mm format
  autoLockMinutes: number;
  biometricEnabled: boolean;
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  crisisRegion: CrisisRegion; // Region for crisis hotlines
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Relapse record for "progress not perfection" tracking
 */
export interface RelapseRecord {
  id: string;
  date: Date;
  whatHappened?: EncryptedString;
  whatLearned?: EncryptedString;
  plan?: EncryptedString; // Recovery plan for moving forward
  previousSoberDays: number;
  createdAt: Date;
}

/**
 * Time Capsule - letters to future self
 */
export interface TimeCapsule {
  id: string;
  title: string;
  content: EncryptedString;
  unlockDate: Date;
  isUnlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
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

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLocked: boolean;
  lastActiveAt: Date | null;
}

/**
 * Database row types (for SQLite)
 */
export interface DbSobrietyProfile {
  id: string;
  sobriety_date: string;
  program_type: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbJournalEntry {
  id: string;
  type: string;
  content: string;
  mood_before: number | null;
  mood_after: number | null;
  craving_level: number | null;
  emotion_tags: string;
  step_number: number | null;
  meeting_id: string | null;
  audio_uri: string | null;
  audio_duration: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbDailyCheckin {
  id: string;
  date: string;
  mood: number;
  craving_level: number;
  gratitude: string | null;
  is_checked_in: number;
  created_at: string;
}

export interface DbMilestone {
  id: string;
  type: string;
  title: string;
  description: string | null;
  reflection: string | null;
  achieved_at: string;
  metadata: string;
  created_at: string;
}

export interface DbMeetingLog {
  id: string;
  name: string | null;
  location: string | null;
  type: string;
  mood_before: number;
  mood_after: number;
  key_takeaways: string;
  topic_tags: string;
  attended_at: string;
  created_at: string;
  // Enhanced fields (Phase 2)
  what_i_learned: string | null;
  quote_heard: string | null;
  connections_mode: string | null; // JSON array
  connection_notes: string | null;
  did_share: number;
  share_reflection: string | null;
  regular_meeting_id: string | null;
}

export interface DbEmotionTag {
  id: string;
  name: string;
  color: string;
  is_custom: number;
  created_at: string;
}

export interface DbAppSettings {
  id: string;
  check_in_time: string;
  auto_lock_minutes: number;
  biometric_enabled: number;
  theme_mode: string;
  notifications_enabled: number;
  crisis_region: string;
  created_at: string;
  updated_at: string;
}

// Vault item types
export type VaultItemType = 'letter' | 'photo' | 'audio' | 'reason' | 'quote';

/**
 * Personal Motivation Vault item
 * Extra protected content for motivation during difficult times
 */
export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  content: EncryptedString; // Text content or file path
  mediaUri?: string; // For photos/audio
  isFavorite: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbVaultItem {
  id: string;
  type: string;
  title: string;
  content: string;
  media_uri: string | null;
  is_favorite: number;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Trigger Scenario types
export type ScenarioCategory = 'social' | 'emotional' | 'environmental' | 'physical';

/**
 * Trigger scenario with coping options
 */
export interface TriggerScenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  description: string;
  options: ScenarioOption[];
  bestOptionIndex: number; // Index of the recommended option
}

export interface ScenarioOption {
  text: string;
  isHealthy: boolean;
  outcome: string;
  copingTip?: string;
}

/**
 * User's completed scenario practice
 */
export interface ScenarioPractice {
  id: string;
  scenarioId: string;
  selectedOptionIndex: number;
  reflection?: EncryptedString;
  completedAt: Date;
}

export interface DbScenarioPractice {
  id: string;
  scenario_id: string;
  selected_option_index: number;
  reflection: string | null;
  completed_at: string;
}

// ============================================
// V2 Types - Recovery Companion Enhancement
// ============================================

// Recovery contact roles
export type ContactRole = 'sponsor' | 'sponsee' | 'home_group' | 'fellowship' | 'emergency';

/**
 * Recovery contacts for fellowship network
 */
export interface RecoveryContact {
  id: string;
  name: string;
  phone: string;
  role: ContactRole;
  notes?: EncryptedString;
  lastContactedAt?: Date;
  createdAt: Date;
}

export interface DbRecoveryContact {
  id: string;
  name: string;
  phone: string;
  role: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
}

// Regular meeting types
export type RegularMeetingType = 'in-person' | 'online' | 'hybrid';

/**
 * Regular meetings (recurring schedule)
 */
export interface RegularMeeting {
  id: string;
  name: string;
  location?: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  time: string; // HH:mm format
  type: RegularMeetingType;
  isHomeGroup: boolean;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  notes?: EncryptedString;
  createdAt: Date;
}

export interface DbRegularMeeting {
  id: string;
  name: string;
  location: string | null;
  day_of_week: number;
  time: string;
  type: string;
  is_home_group: number;
  reminder_enabled: number;
  reminder_minutes_before: number;
  notes: string | null;
  created_at: string;
}

// Achievement system types
export type AchievementCategory =
  | 'keytags'
  | 'step_work'
  | 'fellowship'
  | 'service'
  | 'daily_practice';

export type AchievementStatus = 'locked' | 'available' | 'in_progress' | 'unlocked';

export type AchievementUnlockType = 'self_check' | 'automatic' | 'progressive' | 'count' | 'streak';

/**
 * Achievement definitions and progress
 */
export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string;
  unlockType: AchievementUnlockType;
  target?: number;
  current?: number;
  status: AchievementStatus;
  unlockedAt?: Date;
  requiresDaysClean?: number;
  requiresAchievements?: string[];
  reflection?: EncryptedString;
}

export interface DbAchievement {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  unlock_type: string;
  target: number | null;
  current: number | null;
  status: string;
  unlocked_at: string | null;
  requires_days_clean: number | null;
  requires_achievements: string | null;
  reflection: string | null;
}

/**
 * Daily reading entry
 */
export interface DailyReading {
  id: string;
  date: string; // MM-DD format
  title: string;
  content: string;
  reflectionPrompt: string;
  source: 'jft' | 'daily_reflections' | 'custom';
}

/**
 * Daily reading reflection (user's response)
 */
export interface DailyReadingReflection {
  id: string;
  readingDate: string; // MM-DD format
  reflection: EncryptedString;
  createdAt: Date;
}

export interface DbDailyReadingReflection {
  id: string;
  reading_date: string;
  reflection: string;
  created_at: string;
}

// Fourth step inventory types
export type FourthStepType = 'resentment' | 'fear' | 'sex_conduct';

/**
 * Fourth Step inventory entry
 */
export interface FourthStepEntry {
  id: string;
  type: FourthStepType;
  who: EncryptedString;
  cause: EncryptedString;
  affects: string[]; // Self-esteem, Security, Ambitions, Personal Relations, Sex Relations
  myPart: EncryptedString;
  createdAt: Date;
}

export interface DbFourthStepEntry {
  id: string;
  type: string;
  who: string;
  cause: string;
  affects: string; // JSON array
  my_part: string;
  created_at: string;
}

// Amends types
export type AmendsType = 'direct' | 'indirect' | 'living';
export type AmendsStatus = 'not_willing' | 'willing' | 'planned' | 'in_progress' | 'made';

/**
 * Eighth/Ninth Step amends entry
 */
export interface AmendsEntry {
  id: string;
  person: EncryptedString;
  harm: EncryptedString;
  amendsType: AmendsType;
  status: AmendsStatus;
  notes?: EncryptedString;
  madeAt?: Date;
  createdAt: Date;
}

export interface DbAmendsEntry {
  id: string;
  person: string;
  harm: string;
  amends_type: string;
  status: string;
  notes: string | null;
  made_at: string | null;
  created_at: string;
}

/**
 * Phone call log for fellowship connection tracking
 */
export interface PhoneCallLog {
  id: string;
  contactId: string;
  contactName: string;
  duration?: number; // minutes
  notes?: EncryptedString;
  calledAt: Date;
}

export interface DbPhoneCallLog {
  id: string;
  contact_id: string;
  contact_name: string;
  duration: number | null;
  notes: string | null;
  called_at: string;
}

/**
 * Gratitude list entry
 */
export interface GratitudeEntry {
  id: string;
  date: Date;
  items: EncryptedString; // JSON array of gratitude items
  createdAt: Date;
}

export interface DbGratitudeEntry {
  id: string;
  date: string;
  items: string;
  created_at: string;
}

/**
 * Tenth Step nightly review
 */
export interface TenthStepReview {
  id: string;
  date: Date;
  wasResentful?: EncryptedString;
  wasSelfish?: EncryptedString;
  wasDishonest?: EncryptedString;
  wasAfraid?: EncryptedString;
  oweApology?: EncryptedString;
  couldDoBetter?: EncryptedString;
  gratefulFor?: EncryptedString;
  createdAt: Date;
}

export interface DbTenthStepReview {
  id: string;
  date: string;
  was_resentful: string | null;
  was_selfish: string | null;
  was_dishonest: string | null;
  was_afraid: string | null;
  owe_apology: string | null;
  could_do_better: string | null;
  grateful_for: string | null;
  created_at: string;
}

/**
 * Literature reading progress
 */
export interface LiteratureProgress {
  id: string;
  bookId: string;
  chapterId: string;
  isCompleted: boolean;
  notes?: EncryptedString;
  completedAt?: Date;
  createdAt: Date;
}

export interface DbLiteratureProgress {
  id: string;
  book_id: string;
  chapter_id: string;
  is_completed: number;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

// Step progress types
export type StepStatus =
  | 'locked'
  | 'available'
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'discussed';

/**
 * Step work progress tracking
 */
export interface StepProgress {
  id: string;
  stepNumber: number;
  questionsAnswered: number;
  totalQuestions: number;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  discussedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbStepProgress {
  id: string;
  step_number: number;
  questions_answered: number;
  total_questions: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  discussed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Step work answer
 */
export interface StepAnswer {
  id: string;
  stepNumber: number;
  questionIndex: number;
  answer: EncryptedString;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbStepAnswer {
  id: string;
  step_number: number;
  question_index: number;
  answer: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Database Types - Re-exports from src/types
// ============================================
// These are the snake_case types used by the mobile app's database layer
// They have encrypted_* fields and string timestamps

export type {
  // Database types with snake_case fields
  JournalEntry as JournalEntryDb,
  DailyCheckIn,
  StepWork,
  UserProfile,
  Achievement as AchievementDb,
  SyncQueueItem,
  // Type aliases
  SyncStatus,
  CheckInType,
  SyncOperation,
  AchievementType,
} from './database';

// Decrypted models for UI use
export type {
  JournalEntryDecrypted,
  DailyCheckInDecrypted,
  StepWorkDecrypted,
  MilestoneDefinition,
  Streak,
} from './models';

// For backward compatibility - Milestone with days, icon, key
export type { MilestoneDefinition as MilestoneUI } from './models';
