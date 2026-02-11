/**
 * Safety Plan Service
 * Personal safety plan for crisis situations.
 * Integrates with crisis detection to surface relevant plan sections.
 */

import { secureStorage } from '../../../adapters/secureStorage';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';

const SAFETY_PLAN_KEY = 'recovery_safety_plan';

export interface SafetyPlan {
  warningSignals: string[];
  copingStrategies: string[];
  distractions: string[];
  supportPeople: SupportContact[];
  professionalContacts: SupportContact[];
  safeEnvironment: string[];
  reasonsToLive: string[];
  lastUpdated: Date;
}

export interface SupportContact {
  name: string;
  phone?: string;
  relationship: string;
}

const DEFAULT_PLAN: SafetyPlan = {
  warningSignals: [],
  copingStrategies: [],
  distractions: [],
  supportPeople: [],
  professionalContacts: [
    { name: '988 Suicide & Crisis Lifeline', phone: '988', relationship: 'crisis' },
    { name: 'Crisis Text Line', phone: '741741', relationship: 'crisis' },
    { name: 'SAMHSA Helpline', phone: '18006624357', relationship: 'substance' },
  ],
  safeEnvironment: [],
  reasonsToLive: [],
  lastUpdated: new Date(),
};

/**
 * Load the user's safety plan
 */
export async function loadSafetyPlan(): Promise<SafetyPlan> {
  try {
    const stored = await secureStorage.getItemAsync(SAFETY_PLAN_KEY);
    if (!stored) return { ...DEFAULT_PLAN };

    const decrypted = await decryptContent(stored);
    const parsed = JSON.parse(decrypted) as Partial<SafetyPlan>;
    return {
      ...DEFAULT_PLAN,
      ...parsed,
      lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : new Date(),
    };
  } catch (err) {
    logger.warn('Failed to load safety plan', err);
    return { ...DEFAULT_PLAN };
  }
}

/**
 * Save the user's safety plan (encrypted)
 */
export async function saveSafetyPlan(plan: SafetyPlan): Promise<void> {
  try {
    plan.lastUpdated = new Date();
    const encrypted = await encryptContent(JSON.stringify(plan));
    await secureStorage.setItemAsync(SAFETY_PLAN_KEY, encrypted);
  } catch (err) {
    logger.error('Failed to save safety plan', err);
  }
}

/**
 * Get relevant plan section based on crisis severity
 */
export function getRelevantPlanSection(
  plan: SafetyPlan,
  severity: 'low' | 'medium' | 'high',
): string[] {
  const suggestions: string[] = [];

  switch (severity) {
    case 'high':
      if (plan.professionalContacts.length > 0) {
        suggestions.push('📞 Call for help:');
        for (const c of plan.professionalContacts) {
          suggestions.push(`  • ${c.name}: ${c.phone || 'no number'}`);
        }
      }
      if (plan.reasonsToLive.length > 0) {
        suggestions.push('', '💛 Remember why:');
        for (const r of plan.reasonsToLive.slice(0, 3)) {
          suggestions.push(`  • ${r}`);
        }
      }
      break;

    case 'medium':
      if (plan.supportPeople.length > 0) {
        suggestions.push('👥 Reach out to:');
        for (const p of plan.supportPeople.slice(0, 3)) {
          suggestions.push(`  • ${p.name} (${p.relationship})${p.phone ? `: ${p.phone}` : ''}`);
        }
      }
      if (plan.copingStrategies.length > 0) {
        suggestions.push('', '🛡️ Your coping strategies:');
        for (const s of plan.copingStrategies.slice(0, 3)) {
          suggestions.push(`  • ${s}`);
        }
      }
      break;

    case 'low':
      if (plan.distractions.length > 0) {
        suggestions.push('🎯 Healthy distractions:');
        for (const d of plan.distractions.slice(0, 3)) {
          suggestions.push(`  • ${d}`);
        }
      }
      if (plan.safeEnvironment.length > 0) {
        suggestions.push('', '🏠 Safe places:');
        for (const e of plan.safeEnvironment.slice(0, 2)) {
          suggestions.push(`  • ${e}`);
        }
      }
      break;
  }

  return suggestions;
}

/**
 * Format safety plan as context for AI companion
 */
export function formatPlanForContext(plan: SafetyPlan): string {
  const parts: string[] = [];

  if (plan.warningSignals.length > 0) {
    parts.push(`Warning signals: ${plan.warningSignals.join(', ')}`);
  }
  if (plan.copingStrategies.length > 0) {
    parts.push(`Coping strategies: ${plan.copingStrategies.join(', ')}`);
  }
  if (plan.supportPeople.length > 0) {
    parts.push(`Support people: ${plan.supportPeople.map((p) => p.name).join(', ')}`);
  }

  return parts.length > 0 ? `Safety plan context:\n${parts.join('\n')}` : '';
}
