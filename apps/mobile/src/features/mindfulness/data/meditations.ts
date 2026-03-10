/**
 * Meditation & Breathing Library Data
 *
 * Offline-first: all audio is bundled with the app.
 * No network required — critical for crisis moments.
 */

export type MeditationCategory = 'breathing' | 'urge_surfing' | 'gratitude' | 'sleep' | 'affirmation';

export interface Meditation {
  id: string;
  title: string;
  description: string;
  category: MeditationCategory;
  durationSeconds: number;
  /** Bundled asset require() — loaded at build time */
  audioAsset: number;
  /** Emoji icon for list display */
  icon: string;
  /** Show in emergency/crisis quick actions */
  isEmergency: boolean;
}

export type MeditationCategoryMeta = {
  label: string;
  icon: string;
  description: string;
};

export const CATEGORY_META: Record<MeditationCategory, MeditationCategoryMeta> = {
  breathing: {
    label: 'Breathing',
    icon: 'wind',
    description: 'Calm your nervous system instantly',
  },
  urge_surfing: {
    label: 'Urge Surfing',
    icon: 'activity',
    description: 'Ride out cravings without acting on them',
  },
  gratitude: {
    label: 'Gratitude',
    icon: 'heart',
    description: 'Shift focus to what you have',
  },
  sleep: {
    label: 'Sleep',
    icon: 'moon',
    description: 'Ease into restful sleep',
  },
  affirmation: {
    label: 'Affirmations',
    icon: 'star',
    description: "Strengthen your recovery identity",
  },
};

/**
 * Meditation library.
 *
 * Audio assets are bundled in apps/mobile/assets/audio/
 * Until real recordings are added, these require() calls reference
 * placeholder paths — the app degrades gracefully (shows timer, no audio).
 */
export const MEDITATIONS: Meditation[] = [
  // ── Breathing ──────────────────────────────────────────────────────────────
  {
    id: 'box-breathing-4m',
    title: 'Box Breathing',
    description: '4-4-4-4 technique. Inhale, hold, exhale, hold. Proven to reduce acute stress.',
    category: 'breathing',
    durationSeconds: 4 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/box-breathing-4m.mp3'),
    icon: '🫁',
    isEmergency: true,
  },
  {
    id: 'deep-breath-3m',
    title: '3-Minute Reset',
    description: 'Simple slow belly breathing to interrupt a craving cycle.',
    category: 'breathing',
    durationSeconds: 3 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/deep-breath-3m.mp3'),
    icon: '🌬️',
    isEmergency: true,
  },
  {
    id: '478-breathing-5m',
    title: '4-7-8 Breathing',
    description: 'Inhale 4s, hold 7s, exhale 8s. Activates the parasympathetic nervous system.',
    category: 'breathing',
    durationSeconds: 5 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/478-breathing-5m.mp3'),
    icon: '💨',
    isEmergency: false,
  },

  // ── Urge Surfing ───────────────────────────────────────────────────────────
  {
    id: 'urge-surf-3m',
    title: 'Quick Urge Surf',
    description: 'Notice the craving, observe it without judgment, watch it pass.',
    category: 'urge_surfing',
    durationSeconds: 3 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/urge-surf-3m.mp3'),
    icon: '🌊',
    isEmergency: true,
  },
  {
    id: 'urge-surf-5m',
    title: 'Urge Surfing',
    description: 'A complete guided session. Cravings peak and pass — you can ride this wave.',
    category: 'urge_surfing',
    durationSeconds: 5 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/urge-surf-5m.mp3'),
    icon: '🏄',
    isEmergency: false,
  },
  {
    id: 'urge-surf-10m',
    title: 'Deep Urge Surfing',
    description: 'Extended body-scan approach for intense or prolonged cravings.',
    category: 'urge_surfing',
    durationSeconds: 10 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/urge-surf-10m.mp3'),
    icon: '🌊',
    isEmergency: false,
  },

  // ── Gratitude ──────────────────────────────────────────────────────────────
  {
    id: 'gratitude-morning-5m',
    title: 'Morning Gratitude',
    description: 'Start your day grounded in what recovery has given you.',
    category: 'gratitude',
    durationSeconds: 5 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/gratitude-morning-5m.mp3'),
    icon: '☀️',
    isEmergency: false,
  },
  {
    id: 'gratitude-reflection-7m',
    title: 'Gratitude Reflection',
    description: 'Deep appreciation practice. Works best in the evening.',
    category: 'gratitude',
    durationSeconds: 7 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/gratitude-reflection-7m.mp3'),
    icon: '🙏',
    isEmergency: false,
  },

  // ── Sleep ──────────────────────────────────────────────────────────────────
  {
    id: 'sleep-winddown-10m',
    title: 'Wind-Down',
    description: 'Progressive body relaxation to prepare for sleep.',
    category: 'sleep',
    durationSeconds: 10 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/sleep-winddown-10m.mp3'),
    icon: '🌙',
    isEmergency: false,
  },
  {
    id: 'sleep-release-15m',
    title: 'Release the Day',
    description: 'Let go of the weight of the day and surrender to rest.',
    category: 'sleep',
    durationSeconds: 15 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/sleep-release-15m.mp3'),
    icon: '😴',
    isEmergency: false,
  },

  // ── Affirmations ──────────────────────────────────────────────────────────
  {
    id: 'affirmations-ican-4m',
    title: 'I Can Do This',
    description: 'Powerful affirmations for high-craving moments. Short and direct.',
    category: 'affirmation',
    durationSeconds: 4 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/affirmations-ican-4m.mp3'),
    icon: '💪',
    isEmergency: true,
  },
  {
    id: 'affirmations-identity-6m',
    title: 'Recovery Identity',
    description: 'Reinforce who you are becoming — not who you were.',
    category: 'affirmation',
    durationSeconds: 6 * 60,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioAsset: require('../../../../assets/audio/affirmations-identity-6m.mp3'),
    icon: '✨',
    isEmergency: false,
  },
];

export function getMeditationsByCategory(category: MeditationCategory): Meditation[] {
  return MEDITATIONS.filter((m) => m.category === category);
}

export function getEmergencyMeditations(): Meditation[] {
  return MEDITATIONS.filter((m) => m.isEmergency);
}

export function getMeditationById(id: string): Meditation | undefined {
  return MEDITATIONS.find((m) => m.id === id);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins} min`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
