/**
 * JITAI Type Definitions
 */

/**
 * Context data for JITAI evaluation
 */
export interface JitaiContext {
  // Time context
  currentHour: number;
  currentDayOfWeek: number; // 0 = Sunday

  // Sobriety context
  soberDays: number;

  // Check-in context
  hasSetIntentionToday: boolean;
  hasCompletedInventoryToday: boolean;
  daysSinceLastCheckin: number;
  lastMoodReported: number | null;
  lastCravingReported: number | null;

  // Mood/craving trends
  moodTrend: 'rising' | 'stable' | 'declining';
  cravingTrend: 'rising' | 'stable' | 'declining';
  averageMood7Days: number;
  averageCraving7Days: number;

  // Meeting context
  daysSinceLastMeeting: number;
  meetingsThisWeek: number;

  // Support network context
  hasSponsor: boolean;
  daysSinceLastSponsorContact: number;

  // Step work context
  currentStep: number;
  daysSinceLastStepWork: number;
}

/**
 * Trigger priority levels
 */
export type TriggerPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Trigger types
 */
export type TriggerType = 'time' | 'pattern' | 'milestone' | 'event';

/**
 * Intervention categories
 */
export type InterventionCategory =
  | 'encouragement'
  | 'support'
  | 'connection'
  | 'crisis'
  | 'celebration';

/**
 * JITAI Trigger definition
 */
export interface JitaiTrigger {
  id: string;
  name: string;
  description: string;
  type: TriggerType;
  condition: (context: JitaiContext) => boolean;
  priority: TriggerPriority;
  cooldownHours: number;
}

/**
 * JITAI Intervention
 */
export interface JitaiIntervention {
  triggerId: string;
  title: string;
  message: string;
  action: JitaiAction;
  category: InterventionCategory;
}

/**
 * Action to take when intervention is tapped
 */
export type JitaiAction =
  | { type: 'navigate'; screen: string }
  | { type: 'call'; contactId: string }
  | { type: 'tool'; toolId: string }
  | { type: 'dismiss' };
