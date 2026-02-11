/**
 * Voice Output Service
 * Text-to-speech for AI responses.
 * Uses expo-speech when available, gracefully degrades otherwise.
 */

import { logger } from '../../../utils/logger';
import { secureStorage } from '../../../adapters/secureStorage';

// Optional expo-speech — loaded lazily so app works without it
interface SpeechModule {
  speak: (text: string, options: Record<string, unknown>) => void;
  stop: () => void;
  isSpeakingAsync: () => Promise<boolean>;
}

let _speech: SpeechModule | null = null;
let _speechChecked = false;

async function getSpeech(): Promise<SpeechModule | null> {
  if (_speechChecked) return _speech;
  _speechChecked = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _speech = require('expo-speech') as SpeechModule;
  } catch {
    logger.info('expo-speech not available — TTS disabled');
    _speech = null;
  }
  return _speech;
}

const VOICE_PREFS_KEY = 'ai_voice_output_prefs';

export interface VoicePreferences {
  enabled: boolean;
  rate: number; // 0.5-2.0
  pitch: number; // 0.5-2.0
  language: string; // e.g. 'en-US'
}

const DEFAULT_PREFS: VoicePreferences = {
  enabled: false,
  rate: 0.9,
  pitch: 1.0,
  language: 'en-US',
};

/**
 * Load voice preferences from secure storage.
 */
export async function loadVoicePreferences(): Promise<VoicePreferences> {
  try {
    const raw = await secureStorage.getItemAsync(VOICE_PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    // Fall through
  }
  return { ...DEFAULT_PREFS };
}

/**
 * Save voice preferences.
 */
export async function saveVoicePreferences(prefs: Partial<VoicePreferences>): Promise<void> {
  const current = await loadVoicePreferences();
  const merged = { ...current, ...prefs };
  await secureStorage.setItemAsync(VOICE_PREFS_KEY, JSON.stringify(merged));
}

/**
 * Speak text aloud using device TTS.
 */
export async function speakText(text: string, prefs?: VoicePreferences): Promise<void> {
  try {
    const voicePrefs = prefs || (await loadVoicePreferences());
    if (!voicePrefs.enabled) return;

    await stopSpeaking();

    const cleanedText = cleanForSpeech(text);
    if (!cleanedText.trim()) return;

    const Speech = await getSpeech();
    if (!Speech) return;

    Speech.speak(cleanedText, {
      language: voicePrefs.language,
      rate: voicePrefs.rate,
      pitch: voicePrefs.pitch,
    });

    logger.debug('Speaking text', { length: cleanedText.length });
  } catch (error) {
    logger.error('Failed to speak text', error);
  }
}

/**
 * Stop current speech.
 */
export async function stopSpeaking(): Promise<void> {
  try {
    const Speech = await getSpeech();
    if (!Speech) return;
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) Speech.stop();
  } catch {
    // Ignore
  }
}

/**
 * Check if TTS is currently speaking.
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    const Speech = await getSpeech();
    if (!Speech) return false;
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

/**
 * Clean text for speech output — remove markdown, cards, etc.
 */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\[CARD:[^\]]+\]/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
