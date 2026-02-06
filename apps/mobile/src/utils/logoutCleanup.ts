/**
 * Logout Cleanup Utility
 *
 * Centralized utility for performing complete logout cleanup.
 * Ensures all sensitive data is removed when a user logs out.
 *
 * **Cleanup Operations**:
 * 1. Deletes encryption keys from secure storage
 * 2. Clears web secure storage session (web only)
 * 3. Clears all local database data
 * 4. Clears shared database data (native only)
 *
 * **Security**: This MUST be called before signing out to prevent
 * data leaks. All operations are logged and errors are handled gracefully.
 *
 * @module utils/logoutCleanup
 */

import { Platform } from 'react-native';
import { deleteEncryptionKey } from './encryption';
import { clearDatabase } from './database';
import { secureStorage } from '../adapters/secureStorage';
import type { StorageAdapter } from '../adapters/storage';
import { logger } from './logger';

export interface LogoutCleanupOptions {
  /**
   * Database instance (required for mobile, optional for web)
   */
  db?: StorageAdapter;
}

/**
 * Perform complete logout cleanup
 *
 * **Critical**: This MUST be called before signing out to prevent data leaks.
 * All sensitive data (encryption keys, local database, shared database, session) is cleared.
 *
 * @param options - Cleanup options
 * @param options.db - Database instance (required for mobile, optional for web)
 * @returns Promise that resolves when cleanup is complete
 * @throws Never throws - errors are logged but cleanup continues
 * @example
 * ```ts
 * // Before calling supabase.auth.signOut()
 * await performLogoutCleanup({ db });
 * await supabase.auth.signOut();
 * ```
 */
export async function performLogoutCleanup(options: LogoutCleanupOptions = {}): Promise<void> {
  const errors: Error[] = [];

  try {
    // Step 1: Delete encryption keys from secure storage
    logger.info('Logout cleanup: Deleting encryption keys');
    await deleteEncryptionKey();
  } catch (error) {
    logger.error('Failed to delete encryption key during logout', error);
    errors.push(error instanceof Error ? error : new Error('Failed to delete encryption key'));
  }

  try {
    // Step 2: Clear web secure storage session (no-op on mobile)
    logger.info('Logout cleanup: Clearing secure storage session');
    await secureStorage.clearSession();
  } catch (error) {
    logger.error('Failed to clear secure storage session during logout', error);
    errors.push(error instanceof Error ? error : new Error('Failed to clear session'));
  }

  try {
    // Step 3: Clear local database (if provided)
    if (options.db) {
      logger.info('Logout cleanup: Clearing local database');
      await clearDatabase(options.db);
    } else {
      logger.warn('Logout cleanup: No database instance provided, skipping database clear');
    }
  } catch (error) {
    logger.error('Failed to clear database during logout', error);
    errors.push(error instanceof Error ? error : new Error('Failed to clear database'));
  }

  try {
    // Step 4: Clear shared database (native only)
    if (Platform.OS !== 'web') {
      logger.info('Logout cleanup: Clearing shared database');
      const { clearAllData } = await import('@recovery/shared');
      await clearAllData();
    }
  } catch (error) {
    logger.error('Failed to clear shared database during logout', error);
    errors.push(error instanceof Error ? error : new Error('Failed to clear shared database'));
  }

  if (errors.length > 0) {
    logger.error('Logout cleanup completed with errors', { errorCount: errors.length });
    // Don't throw - partial cleanup is better than no cleanup
    // Errors are already logged
  } else {
    logger.info('Logout cleanup completed successfully');
  }
}
