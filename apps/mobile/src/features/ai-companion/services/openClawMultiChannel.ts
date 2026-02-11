/**
 * OpenClaw Multi-Channel Check-ins
 * Enables proactive recovery check-ins through external messaging channels
 * (WhatsApp, Telegram, Discord) when OpenClaw is connected.
 */

import { logger } from '../../../utils/logger';
import { secureStorage } from '../../../adapters/secureStorage';
import { getOpenClawProvider } from './openClawProvider';

const CHANNEL_PREFS_KEY = 'openclaw_channel_preferences';

export interface ChannelPreference {
  channel: 'whatsapp' | 'telegram' | 'discord' | 'sms';
  enabled: boolean;
  identifier: string; // phone number or username
}

export interface MultiChannelConfig {
  channels: ChannelPreference[];
  checkInSchedule: {
    morningEnabled: boolean;
    morningTime: string; // HH:mm
    eveningEnabled: boolean;
    eveningTime: string; // HH:mm
  };
  encouragementEnabled: boolean;
}

const DEFAULT_CONFIG: MultiChannelConfig = {
  channels: [],
  checkInSchedule: {
    morningEnabled: false,
    morningTime: '08:00',
    eveningEnabled: false,
    eveningTime: '20:00',
  },
  encouragementEnabled: false,
};

/**
 * Load multi-channel configuration.
 */
export async function loadChannelConfig(): Promise<MultiChannelConfig> {
  try {
    const raw = await secureStorage.getItemAsync(CHANNEL_PREFS_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // Fall through
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save multi-channel configuration.
 */
export async function saveChannelConfig(config: MultiChannelConfig): Promise<void> {
  await secureStorage.setItemAsync(CHANNEL_PREFS_KEY, JSON.stringify(config));
  logger.info('Multi-channel config saved', {
    enabledChannels: config.channels.filter((c) => c.enabled).length,
  });
}

/**
 * Register channel preferences with OpenClaw.
 */
export async function syncChannelsToOpenClaw(config: MultiChannelConfig): Promise<boolean> {
  try {
    const provider = getOpenClawProvider();
    const isConfigured = await provider.isConfigured();
    if (!isConfigured) {
      logger.warn('OpenClaw not configured — skipping channel sync');
      return false;
    }

    // Send channel configuration as a system message
    await provider.chat(
      [
        {
          role: 'system',
          content: `CHANNEL_CONFIG_UPDATE: ${JSON.stringify({
            channels: config.channels.filter((c) => c.enabled),
            schedule: config.checkInSchedule,
            encouragement: config.encouragementEnabled,
          })}`,
        },
        { role: 'user', content: 'Channels updated.' },
      ],
      { maxTokens: 10 },
    );

    logger.info('Channel config synced to OpenClaw');
    return true;
  } catch (error) {
    logger.error('Failed to sync channels to OpenClaw', error);
    return false;
  }
}

/**
 * Get available channels based on OpenClaw capabilities.
 */
export function getAvailableChannels(): Array<{
  channel: ChannelPreference['channel'];
  label: string;
  icon: string;
}> {
  return [
    { channel: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { channel: 'telegram', label: 'Telegram', icon: '✈️' },
    { channel: 'discord', label: 'Discord', icon: '🎮' },
    { channel: 'sms', label: 'SMS', icon: '📱' },
  ];
}
