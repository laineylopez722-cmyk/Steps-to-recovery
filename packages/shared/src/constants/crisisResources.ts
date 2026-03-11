/**
 * Crisis Resources by Region
 *
 * Emergency hotlines and support services for recovery organized by region.
 * Provides critical support resources for users in crisis situations.
 *
 * **Important**: These resources are for emergency and crisis situations.
 * Always call emergency services (911, 000, etc.) for life-threatening emergencies.
 *
 * @module constants/crisisResources
 */

import { CrisisRegion } from '../types';

/**
 * Crisis hotline information
 */
export interface CrisisHotline {
  /** Unique identifier for the hotline */
  readonly id: string;
  /** Display name of the service */
  readonly name: string;
  /** Phone number to call */
  readonly phone: string;
  /** Description of the service */
  readonly description: string;
  /** Availability information (e.g., "24/7", "9am-5pm") */
  readonly available: string;
  /** Color code for UI display */
  readonly color: string;
  /** True if this is an emergency service */
  readonly isEmergency?: boolean;
}

/**
 * Quick access crisis resource
 */
export interface CrisisResource {
  /** Unique identifier */
  readonly id: string;
  /** Display title */
  readonly title: string;
  /** Subtitle with phone number */
  readonly subtitle: string;
  /** Phone number (formatted for dialing) */
  readonly phone: string;
  /** Tailwind CSS color class */
  readonly color: string;
  /** Emoji icon */
  readonly emoji: string;
  /** True if this is an emergency service */
  readonly isEmergency?: boolean;
}

/**
 * Regional crisis resource configuration
 */
export interface RegionConfig {
  /** Region code */
  readonly code: CrisisRegion;
  /** Region name */
  readonly name: string;
  /** Emergency services number (911, 000, 999, etc.) */
  readonly emergencyNumber: string;
  /** List of available hotlines */
  readonly hotlines: readonly CrisisHotline[];
  /** Quick access resources for emergency screen */
  readonly quickResources: readonly CrisisResource[];
}

/**
 * Australia crisis resources
 */
const AUSTRALIA: RegionConfig = {
  code: 'AU',
  name: 'Australia',
  emergencyNumber: '000',
  hotlines: [
    {
      id: 'emergency-au',
      name: 'Emergency Services',
      phone: '000',
      description: 'Life-threatening emergency - Police, Fire, Ambulance',
      available: '24/7',
      color: '#ef4444',
      isEmergency: true,
    },
    {
      id: 'lifeline-au',
      name: 'Lifeline Australia',
      phone: '13 11 14',
      description: 'Free, confidential 24/7 crisis support and suicide prevention',
      available: '24/7',
      color: '#3b82f6',
    },
    {
      id: 'suicide-callback-au',
      name: 'Suicide Call Back Service',
      phone: '1300 659 467',
      description: 'Free professional 24/7 telephone and online counselling',
      available: '24/7',
      color: '#dc2626',
    },
    {
      id: 'beyond-blue-au',
      name: 'Beyond Blue',
      phone: '1300 22 4636',
      description: 'Mental health support and information',
      available: '24/7',
      color: '#22c55e',
    },
    {
      id: 'directline-au',
      name: 'DirectLine',
      phone: '1800 888 236',
      description: 'Alcohol and drug counselling and support',
      available: '24/7',
      color: '#6366f1',
    },
    {
      id: 'aa-au',
      name: 'Alcoholics Anonymous',
      phone: '1300 222 222',
      description: 'AA Australia - Find meetings and support',
      available: '24/7',
      color: '#8b5cf6',
    },
    {
      id: 'na-au',
      name: 'Narcotics Anonymous',
      phone: '1800 652 820',
      description: 'NA Australia - Find meetings and support',
      available: '24/7',
      color: '#a855f7',
    },
  ],
  quickResources: [
    {
      id: 'lifeline-quick-au',
      title: 'Lifeline',
      subtitle: '13 11 14 - 24/7 Crisis Support',
      phone: '131114',
      color: 'bg-red-600',
      emoji: '📞',
    },
    {
      id: 'suicide-quick-au',
      title: 'Suicide Call Back Service',
      subtitle: '1300 659 467 - 24/7 Support',
      phone: '1300659467',
      color: 'bg-orange-600',
      emoji: '💬',
    },
    {
      id: 'emergency-quick-au',
      title: 'Emergency Services',
      subtitle: '000 - Life-threatening emergency',
      phone: '000',
      color: 'bg-blue-600',
      emoji: '🆘',
      isEmergency: true,
    },
  ],
};

/**
 * United States crisis resources
 */
const UNITED_STATES: RegionConfig = {
  code: 'US',
  name: 'United States',
  emergencyNumber: '911',
  hotlines: [
    {
      id: 'emergency-us',
      name: 'Emergency Services',
      phone: '911',
      description: 'Life-threatening emergency - Police, Fire, Ambulance',
      available: '24/7',
      color: '#ef4444',
      isEmergency: true,
    },
    {
      id: 'suicide-prevention-us',
      name: '988 Suicide & Crisis Lifeline',
      phone: '988',
      description: 'Free, confidential 24/7 crisis support and suicide prevention',
      available: '24/7',
      color: '#3b82f6',
    },
    {
      id: 'crisis-text-us',
      name: 'Crisis Text Line',
      phone: '741741',
      description: 'Text HOME to 741741 for free crisis counseling',
      available: '24/7',
      color: '#22c55e',
    },
    {
      id: 'samhsa-us',
      name: 'SAMHSA National Helpline',
      phone: '1-800-662-4357',
      description: 'Free, confidential treatment referral and information',
      available: '24/7',
      color: '#6366f1',
    },
    {
      id: 'aa-us',
      name: 'Alcoholics Anonymous',
      phone: '1-800-839-1686',
      description: 'AA General Service - Find meetings and support',
      available: '24/7',
      color: '#8b5cf6',
    },
    {
      id: 'na-us',
      name: 'Narcotics Anonymous',
      phone: '1-877-669-1669',
      description: 'NA Helpline - Find meetings and support',
      available: '24/7',
      color: '#a855f7',
    },
  ],
  quickResources: [
    {
      id: '988-quick-us',
      title: '988 Lifeline',
      subtitle: '988 - 24/7 Crisis Support',
      phone: '988',
      color: 'bg-red-600',
      emoji: '📞',
    },
    {
      id: 'samhsa-quick-us',
      title: 'SAMHSA Helpline',
      subtitle: '1-800-662-4357 - Treatment Help',
      phone: '18006624357',
      color: 'bg-orange-600',
      emoji: '💬',
    },
    {
      id: 'emergency-quick-us',
      title: 'Emergency Services',
      subtitle: '911 - Life-threatening emergency',
      phone: '911',
      color: 'bg-blue-600',
      emoji: '🆘',
      isEmergency: true,
    },
  ],
};

/**
 * United Kingdom crisis resources
 */
const UNITED_KINGDOM: RegionConfig = {
  code: 'UK',
  name: 'United Kingdom',
  emergencyNumber: '999',
  hotlines: [
    {
      id: 'emergency-uk',
      name: 'Emergency Services',
      phone: '999',
      description: 'Life-threatening emergency - Police, Fire, Ambulance',
      available: '24/7',
      color: '#ef4444',
      isEmergency: true,
    },
    {
      id: 'samaritans-uk',
      name: 'Samaritans',
      phone: '116 123',
      description: "Free emotional support 24/7, whatever you're going through",
      available: '24/7',
      color: '#3b82f6',
    },
    {
      id: 'mind-uk',
      name: 'Mind Infoline',
      phone: '0300 123 3393',
      description: 'Mental health information and support',
      available: '9am-6pm Mon-Fri',
      color: '#22c55e',
    },
    {
      id: 'frank-uk',
      name: 'FRANK',
      phone: '0300 123 6600',
      description: 'Free, confidential drugs advice and information',
      available: '24/7',
      color: '#6366f1',
    },
    {
      id: 'aa-uk',
      name: 'Alcoholics Anonymous',
      phone: '0800 9177 650',
      description: 'AA Great Britain - Find meetings and support',
      available: '24/7',
      color: '#8b5cf6',
    },
    {
      id: 'na-uk',
      name: 'Narcotics Anonymous',
      phone: '0300 999 1212',
      description: 'NA UK - Find meetings and support',
      available: '24/7',
      color: '#a855f7',
    },
  ],
  quickResources: [
    {
      id: 'samaritans-quick-uk',
      title: 'Samaritans',
      subtitle: '116 123 - 24/7 Support',
      phone: '116123',
      color: 'bg-red-600',
      emoji: '📞',
    },
    {
      id: 'frank-quick-uk',
      title: 'FRANK',
      subtitle: '0300 123 6600 - Drug Help',
      phone: '03001236600',
      color: 'bg-orange-600',
      emoji: '💬',
    },
    {
      id: 'emergency-quick-uk',
      title: 'Emergency Services',
      subtitle: '999 - Life-threatening emergency',
      phone: '999',
      color: 'bg-blue-600',
      emoji: '🆘',
      isEmergency: true,
    },
  ],
};

/**
 * Canada crisis resources
 */
const CANADA: RegionConfig = {
  code: 'CA',
  name: 'Canada',
  emergencyNumber: '911',
  hotlines: [
    {
      id: 'emergency-ca',
      name: 'Emergency Services',
      phone: '911',
      description: 'Life-threatening emergency - Police, Fire, Ambulance',
      available: '24/7',
      color: '#ef4444',
      isEmergency: true,
    },
    {
      id: 'suicide-prevention-ca',
      name: '988 Suicide Crisis Helpline',
      phone: '988',
      description: 'Free, confidential 24/7 suicide prevention support',
      available: '24/7',
      color: '#3b82f6',
    },
    {
      id: 'crisis-text-ca',
      name: 'Crisis Text Line',
      phone: '686868',
      description: 'Text CONNECT to 686868 for crisis support',
      available: '24/7',
      color: '#22c55e',
    },
    {
      id: 'connex-ca',
      name: 'ConnexOntario',
      phone: '1-866-531-2600',
      description: 'Mental health and addiction services information',
      available: '24/7',
      color: '#6366f1',
    },
    {
      id: 'aa-ca',
      name: 'Alcoholics Anonymous',
      phone: '1-888-223-8822',
      description: 'AA Intergroup - Find meetings and support',
      available: '24/7',
      color: '#8b5cf6',
    },
    {
      id: 'na-ca',
      name: 'Narcotics Anonymous',
      phone: '1-888-340-7627',
      description: 'NA Canada - Find meetings and support',
      available: '24/7',
      color: '#a855f7',
    },
  ],
  quickResources: [
    {
      id: '988-quick-ca',
      title: '988 Helpline',
      subtitle: '988 - 24/7 Crisis Support',
      phone: '988',
      color: 'bg-red-600',
      emoji: '📞',
    },
    {
      id: 'text-quick-ca',
      title: 'Crisis Text Line',
      subtitle: 'Text CONNECT to 686868',
      phone: '686868',
      color: 'bg-orange-600',
      emoji: '💬',
    },
    {
      id: 'emergency-quick-ca',
      title: 'Emergency Services',
      subtitle: '911 - Life-threatening emergency',
      phone: '911',
      color: 'bg-blue-600',
      emoji: '🆘',
      isEmergency: true,
    },
  ],
};

/**
 * New Zealand crisis resources
 */
const NEW_ZEALAND: RegionConfig = {
  code: 'NZ',
  name: 'New Zealand',
  emergencyNumber: '111',
  hotlines: [
    {
      id: 'emergency-nz',
      name: 'Emergency Services',
      phone: '111',
      description: 'Life-threatening emergency - Police, Fire, Ambulance',
      available: '24/7',
      color: '#ef4444',
      isEmergency: true,
    },
    {
      id: 'lifeline-nz',
      name: 'Lifeline',
      phone: '0800 543 354',
      description: 'Free counselling and support',
      available: '24/7',
      color: '#3b82f6',
    },
    {
      id: 'suicide-crisis-nz',
      name: 'Suicide Crisis Helpline',
      phone: '0508 828 865',
      description: 'Free crisis support if you or someone is in danger',
      available: '24/7',
      color: '#dc2626',
    },
    {
      id: 'alcohol-drug-nz',
      name: 'Alcohol Drug Helpline',
      phone: '0800 787 797',
      description: 'Free, confidential support for alcohol and drug issues',
      available: '24/7',
      color: '#6366f1',
    },
    {
      id: 'aa-nz',
      name: 'Alcoholics Anonymous',
      phone: '0800 229 6757',
      description: 'AA New Zealand - Find meetings and support',
      available: '24/7',
      color: '#8b5cf6',
    },
    {
      id: 'na-nz',
      name: 'Narcotics Anonymous',
      phone: '0800 628 632',
      description: 'NA New Zealand - Find meetings and support',
      available: '24/7',
      color: '#a855f7',
    },
  ],
  quickResources: [
    {
      id: 'lifeline-quick-nz',
      title: 'Lifeline',
      subtitle: '0800 543 354 - 24/7 Support',
      phone: '0800543354',
      color: 'bg-red-600',
      emoji: '📞',
    },
    {
      id: 'alcohol-quick-nz',
      title: 'Alcohol Drug Helpline',
      subtitle: '0800 787 797 - 24/7 Help',
      phone: '0800787797',
      color: 'bg-orange-600',
      emoji: '💬',
    },
    {
      id: 'emergency-quick-nz',
      title: 'Emergency Services',
      subtitle: '111 - Life-threatening emergency',
      phone: '111',
      color: 'bg-blue-600',
      emoji: '🆘',
      isEmergency: true,
    },
  ],
};

/**
 * Ireland crisis resources
 */
const IRELAND: RegionConfig = {
  code: 'IE',
  name: 'Ireland',
  emergencyNumber: '999',
  hotlines: [
    {
      id: 'emergency-ie',
      name: 'Emergency Services',
      phone: '999',
      description: 'Life-threatening emergency - Police, Fire, Ambulance',
      available: '24/7',
      color: '#ef4444',
      isEmergency: true,
    },
    {
      id: 'samaritans-ie',
      name: 'Samaritans Ireland',
      phone: '116 123',
      description: 'Free emotional support 24/7',
      available: '24/7',
      color: '#3b82f6',
    },
    {
      id: 'pieta-ie',
      name: 'Pieta House',
      phone: '1800 247 247',
      description: 'Free crisis intervention and suicide prevention',
      available: '24/7',
      color: '#dc2626',
    },
    {
      id: 'drugs-ie',
      name: 'Drugs Helpline',
      phone: '1800 459 459',
      description: 'Free, confidential drugs advice and information',
      available: '24/7',
      color: '#6366f1',
    },
    {
      id: 'aa-ie',
      name: 'Alcoholics Anonymous',
      phone: '01 842 0700',
      description: 'AA Ireland - Find meetings and support',
      available: '24/7',
      color: '#8b5cf6',
    },
    {
      id: 'na-ie',
      name: 'Narcotics Anonymous',
      phone: '01 672 8000',
      description: 'NA Ireland - Find meetings and support',
      available: '24/7',
      color: '#a855f7',
    },
  ],
  quickResources: [
    {
      id: 'samaritans-quick-ie',
      title: 'Samaritans',
      subtitle: '116 123 - 24/7 Support',
      phone: '116123',
      color: 'bg-red-600',
      emoji: '📞',
    },
    {
      id: 'pieta-quick-ie',
      title: 'Pieta House',
      subtitle: '1800 247 247 - Crisis Help',
      phone: '1800247247',
      color: 'bg-orange-600',
      emoji: '💬',
    },
    {
      id: 'emergency-quick-ie',
      title: 'Emergency Services',
      subtitle: '999 - Life-threatening emergency',
      phone: '999',
      color: 'bg-blue-600',
      emoji: '🆘',
      isEmergency: true,
    },
  ],
};

/**
 * Global / International fallback
 */
const GLOBAL: RegionConfig = {
  code: 'global',
  name: 'Global / International',
  emergencyNumber: '112',
  hotlines: UNITED_STATES.hotlines,
  quickResources: UNITED_STATES.quickResources,
};

/**
 * All supported regions
 */
export const CRISIS_REGIONS: Record<CrisisRegion, RegionConfig> = {
  AU: AUSTRALIA,
  US: UNITED_STATES,
  UK: UNITED_KINGDOM,
  CA: CANADA,
  NZ: NEW_ZEALAND,
  IE: IRELAND,
  global: GLOBAL,
};

/**
 * Get crisis resources for a specific region
 *
 * @param region - Region code (AU, US, UK, CA, NZ, IE, or 'global')
 * @returns Region configuration with hotlines and resources
 * @example
 * ```ts
 * const usResources = getCrisisResources('US');
 * const emergencyNumber = usResources.emergencyNumber; // "911"
 * ```
 */
export function getCrisisResources(region: CrisisRegion): RegionConfig {
  return CRISIS_REGIONS[region] || CRISIS_REGIONS.US; // Default to US
}

/**
 * Get all available regions
 *
 * @returns Array of region codes and names
 * @example
 * ```ts
 * const regions = getAvailableRegions();
 * // [{ code: 'US', name: 'United States' }, ...]
 * ```
 */
export function getAvailableRegions(): readonly { code: CrisisRegion; name: string }[] {
  return Object.values(CRISIS_REGIONS).map(({ code, name }) => ({ code, name }));
}

/**
 * Get emergency number for a region
 *
 * @param region - Region code
 * @returns Emergency services phone number (defaults to "911" if region not found)
 * @example
 * ```ts
 * const emergency = getEmergencyNumber('AU'); // "000"
 * const emergency = getEmergencyNumber('US'); // "911"
 * ```
 */
export function getEmergencyNumber(region: CrisisRegion): string {
  return CRISIS_REGIONS[region]?.emergencyNumber || '911';
}

/**
 * Check if a region code is valid
 *
 * @param region - Region code to validate
 * @returns True if region exists in CRISIS_REGIONS
 */
export function isValidRegion(region: string): region is CrisisRegion {
  return region in CRISIS_REGIONS;
}

/**
 * Coping strategies (universal)
 */
export const COPING_STRATEGIES = [
  {
    title: 'Call Your Sponsor',
    description: 'Reach out to your sponsor or a trusted person in recovery',
    icon: '📞',
  },
  {
    title: 'Attend a Meeting',
    description: 'Find an in-person or online meeting right now',
    icon: '👥',
  },
  {
    title: 'HALT Check',
    description: 'Are you Hungry, Angry, Lonely, or Tired?',
    icon: '🛑',
  },
  {
    title: 'Play the Tape Forward',
    description: 'Think through where using would lead',
    icon: '⏩',
  },
  {
    title: 'Change Your Environment',
    description: 'Leave the situation. Go somewhere safe.',
    icon: '🚶',
  },
  {
    title: 'Breathe',
    description: 'Try the breathing exercises in this app',
    icon: '🧘',
  },
];

/**
 * Default region (can be overridden by user preference)
 */
export const DEFAULT_REGION: CrisisRegion = 'US';
