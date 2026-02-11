/**
 * Post-Crisis Follow-Up Service
 * Schedules follow-up check-ins after crisis events.
 */

import { logger } from '../../../utils/logger';

export interface FollowUpSchedule {
  id: string;
  crisisTimestamp: Date;
  severity: 'low' | 'medium' | 'high';
  followUps: FollowUp[];
}

export interface FollowUp {
  delayMinutes: number;
  message: string;
  sent: boolean;
  sentAt?: Date;
}

/**
 * Create a follow-up schedule after a crisis event
 */
export function createFollowUpSchedule(severity: 'low' | 'medium' | 'high'): FollowUpSchedule {
  const followUps: FollowUp[] = [];

  switch (severity) {
    case 'high':
      followUps.push(
        {
          delayMinutes: 30,
          message: 'Hey, just checking in. How are you doing? Are you safe?',
          sent: false,
        },
        {
          delayMinutes: 120,
          message: 'Thinking of you. Have you been able to reach your sponsor or go to a meeting?',
          sent: false,
        },
        {
          delayMinutes: 480,
          message:
            "How's the rest of your day going? Remember, you made it through that tough moment.",
          sent: false,
        },
        {
          delayMinutes: 1440,
          message:
            "Good morning. Yesterday was hard, but you're still here. That takes real strength. How are you feeling today?",
          sent: false,
        },
      );
      break;

    case 'medium':
      followUps.push(
        {
          delayMinutes: 60,
          message: 'Checking in — how are things going since we last talked?',
          sent: false,
        },
        {
          delayMinutes: 360,
          message:
            "Hope you're doing okay. Remember your coping strategies are always here if you need them.",
          sent: false,
        },
      );
      break;

    case 'low':
      followUps.push({
        delayMinutes: 180,
        message: 'Hey, just wanted to check in. How are you feeling now?',
        sent: false,
      });
      break;
  }

  const schedule: FollowUpSchedule = {
    id: `fu_${Date.now()}`,
    crisisTimestamp: new Date(),
    severity,
    followUps,
  };

  logger.info('Follow-up schedule created', { severity, count: followUps.length });
  return schedule;
}

/**
 * Get the next pending follow-up that is due
 */
export function getNextDueFollowUp(schedule: FollowUpSchedule): FollowUp | null {
  const now = Date.now();
  const crisisTime = schedule.crisisTimestamp.getTime();

  for (const followUp of schedule.followUps) {
    if (followUp.sent) continue;
    const dueTime = crisisTime + followUp.delayMinutes * 60 * 1000;
    if (now >= dueTime) {
      return followUp;
    }
  }
  return null;
}

/**
 * Mark a follow-up as sent
 */
export function markFollowUpSent(followUp: FollowUp): void {
  followUp.sent = true;
  followUp.sentAt = new Date();
}
