import { secureStorage } from '@/adapters/secureStorage';
import { logger } from '@/utils/logger';
import type { UserRuntimeTheme } from './types';

const CACHE_KEY = 'runtime-theme:v1';

export interface RuntimeThemeCache {
  get(): Promise<UserRuntimeTheme | null>;
  set(theme: UserRuntimeTheme): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Cache abstraction backed by secure storage.
 * Native: encrypted keychain/keystore.
 * Web: adapter fallback (see secureStorage docs).
 */
export const secureRuntimeThemeCache: RuntimeThemeCache = {
  async get() {
    try {
      const raw = await secureStorage.getItemAsync(CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as UserRuntimeTheme;
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (error) {
      logger.warn('Runtime theme cache read failed; falling back to defaults', error);
      return null;
    }
  },

  async set(theme) {
    try {
      await secureStorage.setItemAsync(CACHE_KEY, JSON.stringify(theme));
    } catch (error) {
      logger.warn('Runtime theme cache write failed; continuing without cache', error);
    }
  },

  async clear() {
    try {
      await secureStorage.deleteItemAsync(CACHE_KEY);
    } catch (error) {
      logger.warn('Runtime theme cache clear failed', error);
    }
  },
};
