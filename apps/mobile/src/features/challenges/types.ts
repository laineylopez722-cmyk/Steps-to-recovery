/**
 * Challenge System Types
 *
 * Defines challenge templates, active challenge state,
 * and database row shapes for the streak/challenge feature.
 */

/** Supported challenge activity types */
export type ChallengeType = 'meeting' | 'journal' | 'checkin' | 'step' | 'gratitude';

/** Difficulty tiers for challenge templates */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/** Lifecycle status of an active challenge */
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'not_started';

/**
 * Immutable challenge definition — one of the pre-built challenges
 * users can choose to start.
 */
export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  duration: number;
  reward: string;
  difficulty: ChallengeDifficulty;
}

/**
 * A challenge the user has started, stored in SQLite.
 */
export interface ChallengeDb {
  id: string;
  template_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  current_progress: number;
  status: ChallengeStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Enriched challenge for UI rendering — merges DB row with template metadata.
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  duration: number;
  currentProgress: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  reward: string;
  difficulty: ChallengeDifficulty;
  templateId: string;
  completedAt: string | null;
  daysRemaining: number;
}

/**
 * Pre-built challenge templates.
 *
 * These are hardcoded constants — no DB or network required.
 */
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'tmpl_30_meetings',
    title: '30 Meetings in 30 Days',
    description: 'Attend a meeting every day for 30 days. A classic early-recovery commitment.',
    type: 'meeting',
    target: 30,
    duration: 30,
    reward: 'meeting_warrior',
    difficulty: 'hard',
  },
  {
    id: 'tmpl_7_journal',
    title: '7-Day Journal Streak',
    description: 'Write a journal entry every day for one week. Build the habit of reflection.',
    type: 'journal',
    target: 7,
    duration: 7,
    reward: 'journal_starter',
    difficulty: 'easy',
  },
  {
    id: 'tmpl_14_checkin',
    title: '14-Day Check-In Streak',
    description: 'Complete your daily check-in for two straight weeks.',
    type: 'checkin',
    target: 14,
    duration: 14,
    reward: 'checkin_champion',
    difficulty: 'medium',
  },
  {
    id: 'tmpl_7_gratitude',
    title: 'Daily Gratitude Week',
    description: 'Record three things you are grateful for every day this week.',
    type: 'gratitude',
    target: 7,
    duration: 7,
    reward: 'gratitude_guru',
    difficulty: 'easy',
  },
  {
    id: 'tmpl_step_sprint',
    title: 'Step Work Sprint',
    description: 'Answer 5 step-work questions in 7 days. Make real progress on your steps.',
    type: 'step',
    target: 5,
    duration: 7,
    reward: 'step_sprinter',
    difficulty: 'medium',
  },
  {
    id: 'tmpl_90_journal',
    title: '90-Day Journal Challenge',
    description: 'Journal every day for 90 days. A transformative commitment to self-awareness.',
    type: 'journal',
    target: 90,
    duration: 90,
    reward: 'journal_master',
    difficulty: 'hard',
  },
  {
    id: 'tmpl_30_morning',
    title: 'Morning Intention Month',
    description: 'Set a morning intention every day for 30 days. Start each day with purpose.',
    type: 'checkin',
    target: 30,
    duration: 30,
    reward: 'morning_master',
    difficulty: 'medium',
  },
];
