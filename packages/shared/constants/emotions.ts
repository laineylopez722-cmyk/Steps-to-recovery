/**
 * Default Emotion Tags
 *
 * Predefined emotions for quick tagging in journal entries and check-ins.
 * Each emotion has a name and associated color for UI display.
 *
 * @example
 * ```ts
 * const emotion = DEFAULT_EMOTIONS.find(e => e.name === 'Grateful');
 * // { name: 'Grateful', color: '#10B981' }
 * ```
 */

export interface EmotionTag {
  /** The display name of the emotion */
  readonly name: string;
  /** Hex color code for UI display */
  readonly color: string;
}

export const DEFAULT_EMOTIONS: readonly EmotionTag[] = [
  { name: 'Grateful', color: '#10B981' },
  { name: 'Happy', color: '#FBBF24' },
  { name: 'Peaceful', color: '#60A5FA' },
  { name: 'Hopeful', color: '#A78BFA' },
  { name: 'Proud', color: '#F472B6' },
  { name: 'Anxious', color: '#F87171' },
  { name: 'Sad', color: '#6B7280' },
  { name: 'Angry', color: '#EF4444' },
  { name: 'Frustrated', color: '#FB923C' },
  { name: 'Lonely', color: '#8B5CF6' },
  { name: 'Tired', color: '#9CA3AF' },
  { name: 'Overwhelmed', color: '#EC4899' },
  { name: 'Motivated', color: '#34D399' },
  { name: 'Confused', color: '#FBBF24' },
  { name: 'Scared', color: '#F59E0B' },
] as const;

/** Type representing valid emotion names from DEFAULT_EMOTIONS */
export type DefaultEmotionName = (typeof DEFAULT_EMOTIONS)[number]['name'];

/**
 * Get an emotion tag by name
 * @param name - The emotion name to look up
 * @returns The emotion tag if found, undefined otherwise
 */
export function getEmotionByName(name: string): EmotionTag | undefined {
  return DEFAULT_EMOTIONS.find((emotion) => emotion.name === name);
}

/**
 * Check if an emotion name is valid
 * @param name - The emotion name to validate
 * @returns True if the name exists in DEFAULT_EMOTIONS
 */
export function isValidEmotionName(name: string): name is DefaultEmotionName {
  return DEFAULT_EMOTIONS.some((emotion) => emotion.name === name);
}
