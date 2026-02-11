/**
 * Personality Learner
 * Learns user communication preferences over time.
 * Adjusts response style (directness, length, tone) based on implicit feedback.
 */

import { logger } from '../../../utils/logger';
import { secureStorage } from '../../../adapters/secureStorage';

const PERSONALITY_KEY = 'ai_personality_profile';

export interface PersonalityProfile {
  directness: number; // 0=gentle questions, 1=direct advice
  responseLength: number; // 0=brief, 1=detailed
  spiritualComfort: number; // 0=secular only, 1=spiritual language welcome
  emotionalDepth: number; // 0=surface-level, 1=deep exploration
  humorLevel: number; // 0=serious only, 1=light humor ok
  updatedAt: string;
  interactionCount: number;
}

const DEFAULT_PROFILE: PersonalityProfile = {
  directness: 0.5,
  responseLength: 0.5,
  spiritualComfort: 0.5,
  emotionalDepth: 0.5,
  humorLevel: 0.3,
  updatedAt: new Date().toISOString(),
  interactionCount: 0,
};

const NUDGE_AMOUNT = 0.03; // Small incremental shifts

class PersonalityLearner {
  private profile: PersonalityProfile = { ...DEFAULT_PROFILE };
  private loaded = false;

  async load(): Promise<PersonalityProfile> {
    if (this.loaded) return this.profile;
    try {
      const raw = await secureStorage.getItemAsync(PERSONALITY_KEY);
      if (raw) {
        this.profile = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
      }
      this.loaded = true;
    } catch {
      this.profile = { ...DEFAULT_PROFILE };
    }
    return this.profile;
  }

  private async save(): Promise<void> {
    this.profile.updatedAt = new Date().toISOString();
    this.profile.interactionCount++;
    try {
      await secureStorage.setItemAsync(PERSONALITY_KEY, JSON.stringify(this.profile));
    } catch (error) {
      logger.error('Failed to save personality profile', error);
    }
  }

  /**
   * Nudge a preference toward 0 or 1 based on observed behavior.
   */
  private nudge(
    key: keyof Omit<PersonalityProfile, 'updatedAt' | 'interactionCount'>,
    direction: 'up' | 'down',
  ): void {
    const current = this.profile[key] as number;
    const delta = direction === 'up' ? NUDGE_AMOUNT : -NUDGE_AMOUNT;
    this.profile[key] = Math.max(0, Math.min(1, current + delta)) as never;
  }

  /**
   * Learn from user's message patterns.
   */
  async learnFromMessage(message: string, responseWasHelpful?: boolean): Promise<void> {
    await this.load();

    // Short messages → user prefers brief responses
    if (message.length < 30) {
      this.nudge('responseLength', 'down');
    } else if (message.length > 200) {
      this.nudge('responseLength', 'up');
      this.nudge('emotionalDepth', 'up');
    }

    // Direct questions → user prefers directness
    if (message.includes('?') && message.split(' ').length < 10) {
      this.nudge('directness', 'up');
    }

    // Spiritual language detection
    const spiritualTerms = ['god', 'higher power', 'prayer', 'faith', 'serenity', 'spiritual'];
    if (spiritualTerms.some((term) => message.toLowerCase().includes(term))) {
      this.nudge('spiritualComfort', 'up');
    }

    // Emotional depth signals
    const deepTerms = ['feel', 'hurt', 'scared', 'ashamed', 'love', 'hate', 'afraid'];
    if (deepTerms.some((term) => message.toLowerCase().includes(term))) {
      this.nudge('emotionalDepth', 'up');
    }

    // Humor signals
    if (message.includes('lol') || message.includes('haha') || message.includes('😂')) {
      this.nudge('humorLevel', 'up');
    }

    // Negative feedback
    if (responseWasHelpful === false) {
      // Shift away from current tendencies
      if (this.profile.directness > 0.5) this.nudge('directness', 'down');
      else this.nudge('directness', 'up');
    }

    await this.save();
    logger.debug('Personality updated', {
      directness: this.profile.directness.toFixed(2),
      interactionCount: this.profile.interactionCount,
    });
  }

  /**
   * Generate a system prompt fragment reflecting learned preferences.
   */
  async getPersonalityPrompt(): Promise<string> {
    await this.load();

    if (this.profile.interactionCount < 5) return '';

    const parts: string[] = ['Adjust your communication style:'];

    if (this.profile.directness > 0.7) {
      parts.push('- Be direct and action-oriented');
    } else if (this.profile.directness < 0.3) {
      parts.push('- Use gentle, exploratory questions');
    }

    if (this.profile.responseLength > 0.7) {
      parts.push('- Give thorough, detailed responses');
    } else if (this.profile.responseLength < 0.3) {
      parts.push('- Keep responses brief and focused');
    }

    if (this.profile.spiritualComfort > 0.7) {
      parts.push('- Spiritual language and 12-step traditions are welcome');
    } else if (this.profile.spiritualComfort < 0.3) {
      parts.push('- Keep language secular and practical');
    }

    if (this.profile.emotionalDepth > 0.7) {
      parts.push('- Explore emotions deeply when appropriate');
    }

    if (this.profile.humorLevel > 0.6) {
      parts.push('- Light, warm humor is appreciated');
    }

    return parts.length > 1 ? parts.join('\n') : '';
  }

  getProfile(): PersonalityProfile {
    return { ...this.profile };
  }

  async reset(): Promise<void> {
    this.profile = { ...DEFAULT_PROFILE };
    this.loaded = false;
    await secureStorage.deleteItemAsync(PERSONALITY_KEY);
  }
}

let instance: PersonalityLearner | null = null;

export function getPersonalityLearner(): PersonalityLearner {
  if (!instance) {
    instance = new PersonalityLearner();
  }
  return instance;
}
