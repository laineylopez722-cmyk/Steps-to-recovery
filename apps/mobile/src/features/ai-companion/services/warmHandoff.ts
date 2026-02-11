/**
 * Warm Handoff Service
 * Drafts a message to the user's sponsor when crisis is detected.
 * User controls whether to send — never sends automatically.
 */

import { logger } from '../../../utils/logger';

export interface HandoffDraft {
  recipientName: string;
  recipientPhone?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
}

/**
 * Generate a draft message to the user's sponsor
 */
export function draftSponsorMessage(
  sponsorName: string,
  userName: string,
  severity: 'low' | 'medium' | 'high',
  context?: string,
): HandoffDraft {
  let message: string;

  switch (severity) {
    case 'high':
      message = `Hey ${sponsorName}, it's ${userName}. I'm having a really hard time right now and could use some support. Can you talk?`;
      break;
    case 'medium':
      message = `Hey ${sponsorName}, it's ${userName}. I'm struggling today and wanted to reach out. Are you available to chat?`;
      break;
    default:
      message = `Hey ${sponsorName}, it's ${userName}. Just wanted to check in. Do you have a few minutes?`;
  }

  logger.info('Sponsor handoff draft created', { severity });

  return {
    recipientName: sponsorName,
    message,
    severity,
    createdAt: new Date(),
  };
}

/**
 * Format message for SMS sharing
 */
export function formatForSMS(draft: HandoffDraft, phone?: string): string {
  // sms: URI for cross-platform SMS
  const body = encodeURIComponent(draft.message);
  if (phone) {
    return `sms:${phone}?body=${body}`;
  }
  return `sms:?body=${body}`;
}

/**
 * Generate meeting suggestion text
 */
export function suggestMeeting(severity: 'low' | 'medium' | 'high'): string {
  if (severity === 'high') {
    return 'Consider going to a meeting right now, even an online one. You can find online meetings at aa-intergroup.org or na.org.';
  }
  if (severity === 'medium') {
    return 'Going to a meeting today could help. Check your schedule for the next available one.';
  }
  return 'Staying connected helps. When is your next meeting?';
}
