/**
 * Native secure storage adapter (iOS/Android)
 * Uses expo-secure-store (iOS Keychain, Android Keystore)
 *
 * Error handling added for Android Keystore reliability issues:
 * - Keystore can be locked after device restart (requires biometric)
 * - Keystore may be unavailable if device security is weak
 * - Graceful degradation with logging for debugging
 */

import * as SecureStore from 'expo-secure-store';
import type { SecureStorageAdapter } from './types';

/**
 * Custom error for SecureStore failures
 */
export class SecureStorageError extends Error {
  constructor(
    message: string,
    public readonly operation: 'get' | 'set' | 'delete',
    public readonly key: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

export class NativeSecureStorageAdapter implements SecureStorageAdapter {
  /**
   * Get item from secure storage with error handling
   * Returns null if item doesn't exist OR if Keystore is unavailable
   */
  async getItemAsync(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Log but don't throw - returning null allows auth flow to handle re-login
      console.error(`[SecureStorage] Failed to get item "${key}":`, error);

      // Check for specific Android Keystore errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('Keystore') ||
        errorMessage.includes('KeyStoreException') ||
        errorMessage.includes('User not authenticated')
      ) {
        // Keystore locked or unavailable - user needs to unlock device or re-authenticate
        console.warn('[SecureStorage] Keystore unavailable - user may need to re-authenticate');
      }

      return null;
    }
  }

  /**
   * Set item in secure storage with error handling
   * Throws SecureStorageError if storage fails (caller must handle)
   */
  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Failed to set item "${key}":`, error);

      throw new SecureStorageError(
        `Failed to store secure data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'set',
        key,
        error,
      );
    }
  }

  /**
   * Delete item from secure storage with error handling
   * Silently succeeds if item doesn't exist
   */
  async deleteItemAsync(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // Log but don't throw - deletion failure during logout is non-critical
      console.error(`[SecureStorage] Failed to delete item "${key}":`, error);

      // Only throw if it's a critical Keystore error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Keystore') || errorMessage.includes('KeyStoreException')) {
        throw new SecureStorageError(
          `Failed to delete secure data: ${errorMessage}`,
          'delete',
          key,
          error,
        );
      }
    }
  }
}
