/**
 * JITAI Engine (Just-In-Time Adaptive Intervention)
 * Rule-based intervention system that provides timely support based on user context
 *
 * This is a privacy-first, local-only implementation that analyzes patterns
 * in the user's data to provide helpful nudges and interventions.
 */

import { scheduleJitaiNotification } from './notifications';
import type { JitaiTrigger, JitaiIntervention, JitaiContext, TriggerPriority } from './types';
import { logger } from '../utils/logger';
import { unknown } from 'zod/v4/mini';

/**
 * Define all intervention triggers
 */
export const JITAI_TRIGGERS: JitaiTrigger[] = [
  // Time-based triggers
  {
    id: 'morning-checkin',
    name: 'Morning Check-in Reminder',
    description: 'Remind user to do morning intention if not done by mid-morning',
    type: 'time',
    condition: (ctx) => {
      const hour = new Date().getHours();
      return hour >= 10 && hour < 12 && !ctx.hasSetIntentionToday;
    },
    priority: 'medium',
    cooldownHours: 24,
  },
  {
    id: 'evening-inventory',
    name: 'Evening Inventory Reminder',
    description: 'Remind user to do nightly inventory if not done by evening',
    type: 'time',
    condition: (ctx) => {
      const hour = new Date().getHours();
      return hour >= 20 && hour < 22 && !ctx.hasCompletedInventoryToday;
    },
    priority: 'medium',
    cooldownHours: 24,
  },

  // Pattern-based triggers
  {
    id: 'missed-checkins',
    name: 'Missed Check-ins',
    description: 'User has missed check-ins for multiple days',
    type: 'pattern',
    condition: (ctx) => ctx.daysSinceLastCheckin >= 2,
    priority: 'high',
    cooldownHours: 48,
  },
  {
    id: 'meeting-gap',
    name: 'Meeting Attendance Gap',
    description: "User hasn't logged a meeting in over a week",
    type: 'pattern',
    condition: (ctx) => ctx.daysSinceLastMeeting >= 7,
    priority: 'medium',
    cooldownHours: 72,
  },
  {
    id: 'sponsor-contact-gap',
    name: 'Sponsor Contact Gap',
    description: "User hasn't contacted sponsor in over a week",
    type: 'pattern',
    condition: (ctx) => ctx.daysSinceLastSponsorContact >= 7,
    priority: 'medium',
    cooldownHours: 72,
  },

  // Milestone-based triggers
  {
    id: 'approaching-milestone',
    name: 'Approaching Milestone',
    description: 'User is close to a significant clean time milestone',
    type: 'milestone',
    condition: (ctx) => {
      const milestones = [30, 60, 90, 180, 365];
      return milestones.some((m) => ctx.soberDays >= m - 3 && ctx.soberDays < m);
    },
    priority: 'low',
    cooldownHours: 168, // 1 week
  },
  {
    id: 'high-risk-day',
    name: 'High-Risk Day',
    description: 'User is on a historically high-risk day (weekends, holidays)',
    type: 'time',
    condition: (ctx) => {
      const day = new Date().getDay();
      const hour = new Date().getHours();
      // Friday evening, Saturday, or Sunday
      return (day === 5 && hour >= 17) || day === 6 || day === 0;
    },
    priority: 'medium',
    cooldownHours: 24,
  },

  // Early recovery triggers
  {
    id: 'early-recovery-support',
    name: 'Early Recovery Extra Support',
    description: 'User is in first 90 days and needs extra encouragement',
    type: 'pattern',
    condition: (ctx) => ctx.soberDays <= 90 && ctx.soberDays > 0,
    priority: 'medium',
    cooldownHours: 48,
  },
  {
    id: 'halt-check',
    name: 'HALT Check Reminder',
    description: 'Remind user to check HALT states when mood is low',
    type: 'pattern',
    condition: (ctx) => ctx.soberDays <= 4 && ctx.soberDays > 0,
    priority: 'medium',
    cooldownHours: 12,
  },
];

/**
 * Get intervention message for a trigger
 */
export function getInterventionForTrigger(
  trigger: JitaiTrigger,
  ctx: JitaiContext,
): JitaiIntervention {
  const interventions: Record<string, JitaiIntervention> = {
    'morning-checkin': {
      triggerId: trigger.id,
      title: '🌅 Set Your Intention',
      message: "Good morning! Take a moment to set your intention for today. What's your focus?",
      action: { type: 'navigate', screen: '/(tabs)' },
      category: 'encouragement',
    },
    'evening-inventory': {
      triggerId: trigger.id,
      title: '🌙 Nightly Reflection',
      message: 'How was your day? Take a few minutes to reflect and complete your tiny inventory.',
      action: { type: 'navigate', screen: '/(tabs)' },
      category: 'encouragement',
    },
    'missed-checkins': {
      triggerId: trigger.id,
      title: '💭 We Miss You',
      message: `It's been ${ctx.daysSinceLastCheckin} days since your last check-in. How are you doing? We're here for you.`,
      action: { type: 'navigate', screen: '/checkin' },
      category: 'connection',
    },
    'declining-mood': {
      triggerId: trigger.id,
      title: "💙 We Notice You're Struggling",
      message:
        'Your mood has been lower lately. Would you like to talk to someone or try a coping tool?',
      action: { type: 'navigate', screen: '/(tabs)/emergency' },
      category: 'support',
    },
    'rising-cravings': {
      triggerId: trigger.id,
      title: '⚠️ Craving Support',
      message:
        'We noticed your cravings have been higher. Remember, cravings pass. Would you like some tools to help?',
      action: { type: 'navigate', screen: '/coping' },
      category: 'crisis',
    },
    'meeting-gap': {
      triggerId: trigger.id,
      title: '🤝 Meeting Reminder',
      message: `It's been ${ctx.daysSinceLastMeeting} days since your last meeting. Meeting makers make it!`,
      action: { type: 'navigate', screen: '/meetings' },
      category: 'connection',
    },
    'sponsor-contact-gap': {
      triggerId: trigger.id,
      title: '📞 Call Your Sponsor',
      message:
        "It's been a while since you connected with your sponsor. A quick call can make a big difference.",
      action: { type: 'navigate', screen: '/contacts' },
      category: 'connection',
    },
    'approaching-milestone': {
      triggerId: trigger.id,
      title: '🎉 Milestone Approaching!',
      message: `You're almost at ${getNextMilestone(ctx.soberDays)} days clean! Keep going, you're doing amazing!`,
      action: { type: 'navigate', screen: '/achievements' },
      category: 'celebration',
    },
    'high-risk-day': {
      triggerId: trigger.id,
      title: '💪 Weekend Check-in',
      message:
        'Weekends can be challenging. Do you have a plan? Remember your tools and support network.',
      action: { type: 'navigate', screen: '/scenarios' },
      category: 'support',
    },
    'early-recovery-support': {
      triggerId: trigger.id,
      title: '🌱 Early Recovery Support',
      message: getEarlyRecoveryMessage(ctx.soberDays),
      action: { type: 'navigate', screen: '/(tabs)' },
      category: 'encouragement',
    },
    'halt-check': {
      triggerId: trigger.id,
      title: '🔍 HALT Check',
      message:
        "When you're feeling low, check: Are you Hungry, Angry, Lonely, or Tired? Address the basics first.",
      action: { type: 'navigate', screen: '/coping' },
      category: 'support',
    },
  };

  return (
    interventions[trigger.id] || {
      triggerId: trigger.id,
      title: '💙 Recovery Check-in',
      message: 'Just checking in. How are you doing today?',
      action: { type: 'navigate', screen: '/(tabs)' },
      category: 'encouragement',
    }
  );
}

/**
 * Get next milestone (days) for messaging
 */
function getNextMilestone(currentDays: number): number {
  const milestones = [30, 60, 90, 180, 365, 730, 1095];
  return milestones.find((m) => m > currentDays) ?? currentDays + 730;
}

/**
 * Get encouraging message for early recovery
 */
function getEarlyRecoveryMessage(soberDays: number): string {
  if (soberDays <= 7) {
    return `Day ${soberDays}! The first week is the hardest. You're doing incredible work. One day at a time.`;
  } else if (soberDays <= 30) {
    return `${soberDays} days! You're building new habits every day. Keep reaching out and going to meetings.`;
  } else if (soberDays <= 60) {
    return `${soberDays} days! You're past the first month. The fog is lifting. Keep working your program.`;
  } else {
    return `${soberDays} days! You're approaching 90 days. This is when real change takes root. Keep going!`;
  }
} 

/**
 * Track last trigger times to enforce cooldowns
 */
const triggerCooldowns: Map<string, Date> = new Map();

/**
 * Check if a trigger is on cooldown
 */
function isOnCooldown(trigger: JitaiTrigger): boolean {
  const lastTriggered = triggerCooldowns.get(trigger.id);
  if (!lastTriggered) return false;

  const cooldownMs = trigger.cooldownHours * 60 * 60 * 1000;
  return Date.now() - lastTriggered.getTime() < cooldownMs;
}

/**
 * Mark a trigger as fired
 */
function markTriggered(triggerId: string): void {
  triggerCooldowns.set(triggerId, new Date());
}

/**
 * Evaluate all triggers and return interventions that should fire
 */
export function evaluateTriggers(context: JitaiContext): JitaiIntervention[] {
  const interventions: JitaiIntervention[] = [];

  for (const trigger of JITAI_TRIGGERS) {
    // Skip if on cooldown
    if (isOnCooldown(trigger)) continue;

    // Check condition
    try {
      if (trigger.condition(context)) {
        const intervention = getInterventionForTrigger(trigger, context);
        interventions.push(intervention);
        markTriggered(trigger.id);
      }
    } catch (error) {
      logger.error(`Error evaluating trigger ${trigger.id}`, error);
    }
  }

  // Sort by priority
  const priorityOrder: Record<TriggerPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  interventions.sort((a, b) => {
    const triggerA = JITAI_TRIGGERS.find((t) => t.id === a.triggerId);
    const triggerB = JITAI_TRIGGERS.find((t) => t.id === b.triggerId);
    const priorityA: TriggerPriority = triggerA?.priority || 'low';
    const priorityB: TriggerPriority = triggerB?.priority || 'low';
    return priorityOrder[priorityA] - priorityOrder[priorityB];
  });

  // Return only the highest priority intervention to avoid overwhelming user
  return interventions.slice(0, 1);
}

/**
 * Run JITAI evaluation and schedule notifications
 */
export async function runJitaiEvaluation(context: JitaiContext): Promise<void> {
  const interventions = evaluateTriggers(context);

  for (const intervention of interventions) {
    await scheduleJitaiNotification(intervention);
  }
}

/**
 * Reset cooldowns (for testing or after significant events)
 */
export function resetCooldowns(): void {
  triggerCooldowns.clear();
}

/**
 * Get current cooldown status (for debugging)
 */
export function getCooldownStatus(): Record<
  string,
  { lastTriggered: Date; remainingHours: number }
> {
  const status: Record<string, { lastTriggered: Date; remainingHours: number }> = {};

  for (const trigger of JITAI_TRIGGERS) {
    const lastTriggered = triggerCooldowns.get(trigger.id);
    if (lastTriggered) {
      const elapsedMs = Date.now() - lastTriggered.getTime();
      const cooldownMs = trigger.cooldownHours * 60 * 60 * 1000;
      const remainingMs = Math.max(0, cooldownMs - elapsedMs);

      status[trigger.id] = {
        lastTriggered,
        remainingHours: Math.round((remainingMs / (60 * 60 * 1000)) * 10) / 10,
      };
    }
  }

  return status;
}
