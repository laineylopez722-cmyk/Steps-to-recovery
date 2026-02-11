/**
 * Craving Surfing Guide Types
 *
 * Types and constants for the CBT-based urge surfing tool.
 */

export type CravingSurfPhase =
  | 'rate-initial'
  | 'breathing'
  | 'distraction'
  | 'rate-final'
  | 'complete';

export interface CravingSurfSession {
  id: string;
  userId: string;
  initialRating: number;
  finalRating: number | null;
  phase: CravingSurfPhase;
  startedAt: string;
  completedAt: string | null;
  distractionUsed: string | null;
}

export interface DistractionTechnique {
  id: string;
  title: string;
  description: string;
  icon: string;
  durationMinutes: number;
}

export const DISTRACTION_TECHNIQUES: DistractionTechnique[] = [
  {
    id: 'call-someone',
    title: 'Call Someone',
    description: 'Call your sponsor, a friend, or a helpline',
    icon: 'phone',
    durationMinutes: 5,
  },
  {
    id: 'walk',
    title: 'Take a Walk',
    description: 'Step outside for fresh air and movement',
    icon: 'walk',
    durationMinutes: 10,
  },
  {
    id: 'cold-water',
    title: 'Cold Water',
    description: 'Splash cold water on your face or hold ice',
    icon: 'water',
    durationMinutes: 2,
  },
  {
    id: 'music',
    title: 'Listen to Music',
    description: 'Put on a song that lifts your mood',
    icon: 'music',
    durationMinutes: 5,
  },
  {
    id: 'journal',
    title: 'Write It Out',
    description: 'Journal about what you are feeling',
    icon: 'pencil',
    durationMinutes: 10,
  },
  {
    id: 'prayer',
    title: 'Pray or Meditate',
    description: 'Connect with your higher power',
    icon: 'hands-pray',
    durationMinutes: 5,
  },
  {
    id: 'meeting',
    title: 'Find a Meeting',
    description: 'Look for a nearby or online meeting',
    icon: 'account-group',
    durationMinutes: 60,
  },
  {
    id: 'exercise',
    title: 'Physical Exercise',
    description: 'Do pushups, jumping jacks, or stretching',
    icon: 'dumbbell',
    durationMinutes: 15,
  },
];
