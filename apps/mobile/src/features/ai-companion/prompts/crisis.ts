/**
 * Crisis Detection and Response
 */

import type { CrisisSignal } from '../types';

// Keywords that trigger crisis detection
export const CRISIS_KEYWORDS = {
  high: [
    'kill myself',
    'end my life',
    'want to die',
    'suicide',
    'suicidal',
    'overdose',
    'hurt myself',
    'self harm',
    'cut myself',
    "don't want to be here",
    'better off dead',
    'no reason to live',
    'end it all',
    "can't go on",
    'everyone would be better off',
    'no way out',
    'ready to go',
  ],
  medium: [
    'relapsed',
    'using again',
    'drank',
    'used',
    "can't do this anymore",
    'giving up',
    'no point',
    "what's the point",
    'falling apart',
    'about to use',
    'going to drink',
    'going to use',
    'picked up',
    'broke my sobriety',
    'lost my clean time',
    'threw it all away',
    'hate myself',
    'hopeless',
  ],
  low: [
    'really struggling',
    'might relapse',
    'close to using',
    'losing hope',
    "don't know if I can",
    'slipping',
    'urges are bad',
    'craving hard',
    'thinking about using',
    'thinking about drinking',
    'tempted',
    'triggered',
    'on the edge',
    'barely holding on',
    'white knuckling',
  ],
};

export interface CrisisDetectionResult {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  matchedKeywords: string[];
  suggestedAction: 'monitor' | 'intervene' | 'emergency';
}

export function detectCrisis(message: string): CrisisDetectionResult {
  const lowerMessage = message.toLowerCase();
  const matched: { severity: 'low' | 'medium' | 'high'; keywords: string[] }[] = [];

  for (const [severity, keywords] of Object.entries(CRISIS_KEYWORDS)) {
    const found = keywords.filter((k) => lowerMessage.includes(k));
    if (found.length > 0) {
      matched.push({
        severity: severity as 'low' | 'medium' | 'high',
        keywords: found,
      });
    }
  }

  if (matched.length === 0) {
    return {
      detected: false,
      severity: 'low',
      matchedKeywords: [],
      suggestedAction: 'monitor',
    };
  }

  // Return highest severity found
  const highest =
    matched.find((m) => m.severity === 'high') ||
    matched.find((m) => m.severity === 'medium') ||
    matched[0];

  return {
    detected: true,
    severity: highest.severity,
    matchedKeywords: highest.keywords,
    suggestedAction:
      highest.severity === 'high'
        ? 'emergency'
        : highest.severity === 'medium'
          ? 'intervene'
          : 'monitor',
  };
}

// Convert to CrisisSignal type for API compatibility
export function toCrisisSignal(result: CrisisDetectionResult): CrisisSignal {
  return {
    detected: result.detected,
    severity: result.severity,
    keywords: result.matchedKeywords,
    suggestedAction: result.suggestedAction,
  };
}

export const CRISIS_RESPONSE_TEMPLATE = `I hear you. What you're feeling is real, and I'm not going anywhere.

{acknowledgment}

Right now, the most important thing is making sure you're safe. 

Can we do one thing together? {immediate_action}

Your sponsor {sponsor_name} is there for moments like this. Would it help to call them?

{additional_resources}

I'm here. Whatever you need.`;

export const CRISIS_RESOURCES = {
  suicide: {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    text: 'Text HOME to 741741',
    description: 'Free, confidential support 24/7',
  },
  samhsa: {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    description: 'Free, confidential, 24/7, 365-day-a-year treatment referral and information',
  },
  aa: {
    name: 'AA Hotline',
    url: 'https://www.aa.org/find-aa',
    description: 'Find a local AA meeting or hotline',
  },
  na: {
    name: 'NA Helpline',
    phone: '1-818-773-9999',
    url: 'https://www.na.org/meetingsearch/',
    description: 'Find NA meetings and resources',
  },
};

export function buildCrisisResponse(params: {
  acknowledgment: string;
  immediateAction: string;
  sponsorName?: string;
  additionalResources?: string;
}): string {
  let response = CRISIS_RESPONSE_TEMPLATE;

  response = response.replace('{acknowledgment}', params.acknowledgment);
  response = response.replace('{immediate_action}', params.immediateAction);
  response = response.replace('{sponsor_name}', params.sponsorName || 'Your sponsor');
  response = response.replace('{additional_resources}', params.additionalResources || '');

  return response.trim();
}
