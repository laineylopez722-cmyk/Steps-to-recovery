/**
 * Rate Limiter Service
 * Tracks and enforces daily AI message limits.
 * Uses MMKV for non-sensitive config/counter data.
 */

import { mmkvStorage } from '../../../lib/mmkv';
import { logger } from '../../../utils/logger';

const STORAGE_KEYS = {
  messageCount: 'ai_rate_limit_count',
  countDate: 'ai_rate_limit_date',
  dailyLimit: 'ai_rate_limit_daily_limit',
  enabled: 'ai_rate_limit_enabled',
} as const;

const DEFAULT_DAILY_LIMIT = 50;
const MIN_DAILY_LIMIT = 10;
const MAX_DAILY_LIMIT = 200;

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  enabled: boolean;
  resetsAt: string;
}

/**
 * Get today's date string in local timezone (YYYY-MM-DD).
 */
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get midnight reset time as ISO string.
 */
function getResetTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Load the current message count, resetting if the date has changed.
 */
async function loadCount(): Promise<number> {
  try {
    const storedDate = mmkvStorage.getItem(STORAGE_KEYS.countDate);
    const today = getTodayKey();

    if (storedDate !== today) {
      // New day — reset counter
      mmkvStorage.multiSet([
        [STORAGE_KEYS.messageCount, '0'],
        [STORAGE_KEYS.countDate, today],
      ]);
      return 0;
    }

    const countStr = mmkvStorage.getItem(STORAGE_KEYS.messageCount);
    return countStr ? parseInt(countStr, 10) : 0;
  } catch (err: unknown) {
    logger.warn('Failed to load rate limit count', err);
    return 0;
  }
}

/**
 * Check whether the user can send another AI message.
 */
export async function checkRateLimit(): Promise<RateLimitStatus> {
  const enabled = await isRateLimitEnabled();
  const limit = await getDailyLimit();
  const used = await loadCount();
  const remaining = Math.max(0, limit - used);

  return {
    allowed: !enabled || remaining > 0,
    remaining,
    used,
    limit,
    enabled,
    resetsAt: getResetTime(),
  };
}

/**
 * Increment the daily message counter by one.
 */
export async function incrementMessageCount(): Promise<void> {
  try {
    const today = getTodayKey();
    const storedDate = mmkvStorage.getItem(STORAGE_KEYS.countDate);

    if (storedDate !== today) {
      mmkvStorage.multiSet([
        [STORAGE_KEYS.messageCount, '1'],
        [STORAGE_KEYS.countDate, today],
      ]);
      return;
    }

    const current = await loadCount();
    mmkvStorage.setItem(STORAGE_KEYS.messageCount, String(current + 1));
  } catch (err: unknown) {
    logger.warn('Failed to increment rate limit count', err);
  }
}

/**
 * Get how many messages remain for today.
 */
export async function getRemainingMessages(): Promise<number> {
  const status = await checkRateLimit();
  return status.remaining;
}

/**
 * Set the daily message limit (clamped to 10–200).
 */
export async function setDailyLimit(limit: number): Promise<void> {
  const clamped = Math.min(MAX_DAILY_LIMIT, Math.max(MIN_DAILY_LIMIT, Math.round(limit)));
  try {
    mmkvStorage.setItem(STORAGE_KEYS.dailyLimit, String(clamped));
    logger.debug('Daily AI limit updated', { limit: clamped });
  } catch (err: unknown) {
    logger.warn('Failed to save daily limit', err);
  }
}

/**
 * Get the current daily limit.
 */
export async function getDailyLimit(): Promise<number> {
  try {
    const stored = mmkvStorage.getItem(STORAGE_KEYS.dailyLimit);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_DAILY_LIMIT && parsed <= MAX_DAILY_LIMIT) {
        return parsed;
      }
    }
  } catch (err: unknown) {
    logger.warn('Failed to load daily limit', err);
  }
  return DEFAULT_DAILY_LIMIT;
}

/**
 * Enable or disable rate limiting.
 */
export async function setRateLimitEnabled(enabled: boolean): Promise<void> {
  try {
    mmkvStorage.setItem(STORAGE_KEYS.enabled, enabled ? 'true' : 'false');
    logger.debug('Rate limiting toggled', { enabled });
  } catch (err: unknown) {
    logger.warn('Failed to save rate limit toggle', err);
  }
}

/**
 * Check if rate limiting is currently enabled.
 */
export async function isRateLimitEnabled(): Promise<boolean> {
  try {
    const stored = mmkvStorage.getItem(STORAGE_KEYS.enabled);
    // Default to enabled if never set
    return stored !== 'false';
  } catch (err: unknown) {
    logger.warn('Failed to load rate limit toggle', err);
    return true;
  }
}
