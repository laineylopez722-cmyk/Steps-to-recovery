/**
 * Professional Referral Service
 * Suggests professional help when AI detects patterns indicating need.
 */

import { logger } from '../../../utils/logger';

export interface ProfessionalResource {
  id: string;
  name: string;
  type: 'hotline' | 'text_line' | 'online' | 'directory' | 'app';
  description: string;
  contact: string;
  available: string; // e.g., '24/7', 'Mon-Fri 9am-5pm'
  url?: string;
  specialties: string[];
}

// Curated resources — real, verified services
const CRISIS_RESOURCES: ProfessionalResource[] = [
  {
    id: 'suicide-lifeline',
    name: '988 Suicide & Crisis Lifeline',
    type: 'hotline',
    description: 'Free, confidential support for people in distress.',
    contact: '988',
    available: '24/7',
    url: 'https://988lifeline.org',
    specialties: ['crisis', 'suicide', 'emotional distress'],
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    type: 'text_line',
    description: 'Text HOME to 741741 for free crisis counseling.',
    contact: 'Text HOME to 741741',
    available: '24/7',
    url: 'https://www.crisistextline.org',
    specialties: ['crisis', 'anxiety', 'depression'],
  },
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    type: 'hotline',
    description: 'Free referrals and information for substance abuse treatment.',
    contact: '1-800-662-4357',
    available: '24/7, 365 days',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
    specialties: ['substance abuse', 'treatment referral', 'recovery'],
  },
  {
    id: 'aa-find',
    name: 'AA Meeting Finder',
    type: 'directory',
    description: 'Find local and online AA meetings.',
    contact: '',
    available: 'Always available',
    url: 'https://www.aa.org/find-aa',
    specialties: ['meetings', 'fellowship', 'recovery'],
  },
  {
    id: 'na-helpline',
    name: 'NA Helpline',
    type: 'hotline',
    description: 'Narcotics Anonymous helpline for information and support.',
    contact: '1-818-773-9999',
    available: '24/7',
    url: 'https://www.na.org',
    specialties: ['narcotics', 'meetings', 'recovery'],
  },
  {
    id: 'psychology-today',
    name: 'Psychology Today Therapist Finder',
    type: 'directory',
    description: 'Find addiction-specialized therapists near you.',
    contact: '',
    available: 'Always available',
    url: 'https://www.psychologytoday.com/us/therapists/addiction',
    specialties: ['therapy', 'counseling', 'addiction'],
  },
  {
    id: 'betterhelp',
    name: 'BetterHelp',
    type: 'online',
    description: 'Online therapy with licensed counselors. Financial aid available.',
    contact: '',
    available: 'Flexible scheduling',
    url: 'https://www.betterhelp.com',
    specialties: ['online therapy', 'addiction', 'mental health'],
  },
  {
    id: 'smart-recovery',
    name: 'SMART Recovery',
    type: 'directory',
    description: 'Science-based recovery support — alternative to 12-step.',
    contact: '',
    available: 'Online meetings available',
    url: 'https://www.smartrecovery.org',
    specialties: ['recovery', 'CBT-based', 'meetings'],
  },
];

/**
 * Get resources relevant to a specific need.
 */
export function getRelevantResources(needs: string[], limit: number = 4): ProfessionalResource[] {
  const needsLower = needs.map((n) => n.toLowerCase());

  const scored = CRISIS_RESOURCES.map((resource) => {
    let score = 0;
    for (const need of needsLower) {
      if (resource.specialties.some((s) => s.includes(need) || need.includes(s))) {
        score += 2;
      }
      if (resource.description.toLowerCase().includes(need)) {
        score += 1;
      }
    }
    return { resource, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);
  const results = sorted.slice(0, limit).map((s) => s.resource);

  logger.debug('Professional referral', { needs, resultCount: results.length });
  return results;
}

/**
 * Get all crisis hotlines (for immediate danger).
 */
export function getCrisisHotlines(): ProfessionalResource[] {
  return CRISIS_RESOURCES.filter((r) => r.type === 'hotline' || r.type === 'text_line');
}

/**
 * Generate a gentle suggestion message for professional help.
 */
export function generateReferralMessage(
  context: 'persistent_low_mood' | 'escalating_cravings' | 'crisis' | 'general',
): string {
  switch (context) {
    case 'crisis':
      return "You don't have to go through this alone. Please reach out to a crisis counselor — they're trained to help and are available 24/7.";
    case 'persistent_low_mood':
      return "I've noticed your mood has been lower for a while. That's really common in recovery, and a therapist who specializes in addiction can make a big difference. Would you like to see some options?";
    case 'escalating_cravings':
      return "Cravings can be really intense, and sometimes extra support helps. Have you considered connecting with a counselor who specializes in recovery? It's a sign of strength, not weakness.";
    default:
      return 'Professional support can be a powerful complement to your recovery program. Would you like to explore some options?';
  }
}
