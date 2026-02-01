/**
 * Platform-agnostic secure storage
 * Automatically selects native (mobile) or web implementation
 */

import { Platform } from 'react-native';
import type { SecureStorageAdapter } from './types';

// Export types
export type { SecureStorageAdapter } from './types';

let adapter: SecureStorageAdapter | null = null;

/**
 * Get secure storage adapter for current platform
 */
async function getAdapter(): Promise<SecureStorageAdapter> {
  if (adapter) return adapter;

  if (Platform.OS === 'web') {
    const { WebSecureStorageAdapter } = await import('./web');
    adapter = new WebSecureStorageAdapter();
  } else {
    const { NativeSecureStorageAdapter } = await import('./native');
    adapter = new NativeSecureStorageAdapter();
  }

  return adapter;
}

/**
 * Platform-agnostic secure storage API
 */
export const secureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    const adapter = await getAdapter();
    return adapter.getItemAsync(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    const adapter = await getAdapter();
    return adapter.setItemAsync(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    const adapter = await getAdapter();
    return adapter.deleteItemAsync(key);
  },

  /**
   * Initialize secure storage with user session (web only, no-op on native)
   * MUST be called after authentication on web platform
   */
  async initializeWithSession(userId: string, sessionToken: string): Promise<void> {
    if (Platform.OS === 'web') {
      const adapter = await getAdapter();
      // Type guard: check if adapter has initializeWithSession method
      if (
        'initializeWithSession' in adapter &&
        typeof adapter.initializeWithSession === 'function'
      ) {
        await adapter.initializeWithSession(userId, sessionToken);
      }
    }
    // Native platforms don't need initialization - they use system keystore
  },

  /**
   * Clear session data (web only, no-op on native)
   * MUST be called on logout to clear encryption keys
   */
  async clearSession(): Promise<void> {
    if (Platform.OS === 'web') {
      const adapter = await getAdapter();
      // Type guard: check if adapter has clearSession method
      if ('clearSession' in adapter && typeof adapter.clearSession === 'function') {
        adapter.clearSession();
      }
    }
    // Native platforms handle this automatically
  },
};
