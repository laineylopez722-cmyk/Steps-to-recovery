/**
 * Content Safety Filter
 * Filters AI responses to prevent harmful content.
 */

import { logger } from '../../../utils/logger';

export type SafetyLevel = 'strict' | 'moderate' | 'relaxed';

export interface SafetyFilterResult {
  safe: boolean;
  filteredContent: string;
  warnings: string[];
  blocked: boolean;
  blockReason?: string;
}

interface FilterRule {
  pattern: RegExp;
  severity: 'block' | 'warn' | 'replace';
  category: string;
  replacement?: string;
}

const FILTER_RULES: FilterRule[] = [
  // Block: substance suggestions
  {
    pattern: /\b(you should|try|consider)\b.{0,30}\b(drink|use|take|smoke|inject)\b/i,
    severity: 'block',
    category: 'substance_suggestion',
  },
  // Block: shaming language
  {
    pattern: /\b(you('re| are) (weak|pathetic|worthless|hopeless|a failure))\b/i,
    severity: 'block',
    category: 'shame',
  },
  // Warn: medical advice
  {
    pattern:
      /\b(you (should|need to|must) (stop|start|change|increase|decrease) (your )?(medication|dose|prescription|meds))\b/i,
    severity: 'warn',
    category: 'medical_advice',
  },
  // Replace: isolation encouragement
  {
    pattern: /\b(you don'?t need (anyone|people|others|them|meetings|a sponsor))\b/i,
    severity: 'replace',
    category: 'isolation',
    replacement: 'Building a support network is an important part of recovery.',
  },
  // Warn: minimizing experience
  {
    pattern: /\b(it'?s not (that|so) (bad|hard|difficult)|just get over it|stop feeling sorry)\b/i,
    severity: 'warn',
    category: 'minimizing',
  },
  // Block: dangerous self-harm instructions
  {
    pattern: /\b(how to|ways to|methods? (of|for|to)) (harm|hurt|kill|end) (your|my)?self\b/i,
    severity: 'block',
    category: 'self_harm',
  },
];

/**
 * Filter an AI response for safety.
 */
export function filterAIResponse(
  content: string,
  safetyLevel: SafetyLevel = 'moderate',
): SafetyFilterResult {
  const warnings: string[] = [];
  let filteredContent = content;
  let blocked = false;
  let blockReason: string | undefined;

  for (const rule of FILTER_RULES) {
    if (rule.pattern.test(filteredContent)) {
      switch (rule.severity) {
        case 'block':
          if (safetyLevel !== 'relaxed') {
            blocked = true;
            blockReason = rule.category;
            logger.warn('Content blocked by safety filter', { category: rule.category });
          }
          break;

        case 'warn':
          warnings.push(`Potential ${rule.category.replace(/_/g, ' ')} detected`);
          if (safetyLevel === 'strict') {
            filteredContent = filteredContent.replace(rule.pattern, '[content filtered]');
          }
          break;

        case 'replace':
          if (rule.replacement && safetyLevel !== 'relaxed') {
            filteredContent = filteredContent.replace(rule.pattern, rule.replacement);
          }
          break;
      }
    }
  }

  if (blocked) {
    filteredContent = getBlockedContentReplacement(blockReason || 'unknown');
  }

  return {
    safe: !blocked && warnings.length === 0,
    filteredContent,
    warnings,
    blocked,
    blockReason,
  };
}

function getBlockedContentReplacement(reason: string): string {
  switch (reason) {
    case 'substance_suggestion':
      return "I want to support your recovery. Let's focus on healthy coping strategies. What has worked for you in the past?";
    case 'shame':
      return "Recovery takes courage, and you're showing that courage right now by being here. How can I support you?";
    case 'self_harm':
      return "I care about your safety. If you're having thoughts of self-harm, please reach out to the 988 Suicide & Crisis Lifeline (call or text 988). You deserve support.";
    default:
      return "I want to be helpful in a way that supports your recovery. Could you tell me more about what you're going through?";
  }
}
