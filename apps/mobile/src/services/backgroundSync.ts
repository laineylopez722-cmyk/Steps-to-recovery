import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { processSyncQueue } from './syncService';
import type { StorageAdapter } from '../adapters/storage/types';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

/**
 * Background Sync Service
 *
 * Provides automatic background synchronization when:
 * - App is in the background
 * - Device comes back online
 * - Periodic intervals (every 15 minutes minimum)
 *
 * Features:
 * - Battery-efficient sync using iOS/Android background fetch APIs
 * - Respects user preferences (can be disabled)
 * - Handles errors gracefully
 * - Logs sync attempts for debugging
 */

/**
 * Define the background sync task
 * This runs when the OS decides to grant background execution time
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    logger.info('Background sync task started');

    // Get current user
    const userId = await getStoredUserId();
    if (!userId) {
      logger.info('Background sync: No user logged in, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Open database connection
    const db = await openDatabase();
    if (!db) {
      logger.error('Background sync: Failed to open database');
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Check if there's pending work
    const pendingResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE retry_count < 3',
    );

    if (!pendingResult || pendingResult.count === 0) {
      logger.info('Background sync: No pending items');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    logger.info('Background sync: Processing', { pendingCount: pendingResult.count });

    // Process sync queue
    const result = await processSyncQueue(db, userId);

    logger.info('Background sync completed', {
      synced: result.synced,
      failed: result.failed,
    });

    if (result.failed > 0) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    logger.error('Background sync failed', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background sync task
 * Should be called once when the app starts
 */
export async function registerBackgroundSync(): Promise<void> {
  // Skip on web - background fetch is not supported
  if (Platform.OS === 'web') {
    logger.info('Background sync not supported on web');
    return;
  }

  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

    if (isRegistered) {
      logger.info('Background sync already registered');
      return;
    }

    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes minimum
      stopOnTerminate: false, // Continue after app termination (iOS)
      startOnBoot: true, // Start after device reboot (Android)
    });

    logger.info('Background sync registered successfully');
  } catch (error) {
    logger.error('Failed to register background sync', error);
  }
}

/**
 * Unregister the background sync task
 * Call this when user disables background sync in settings
 */
export async function unregisterBackgroundSync(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      logger.info('Background sync unregistered');
    }
  } catch (error) {
    logger.error('Failed to unregister background sync', error);
  }
}

/**
 * Check if background sync is registered
 */
export async function isBackgroundSyncRegistered(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  } catch (error) {
    logger.error('Failed to check background sync status', error);
    return false;
  }
}

/**
 * Get the background fetch status
 * Returns whether background fetch is available and configured
 */
export async function getBackgroundFetchStatus(): Promise<{
  isAvailable: boolean;
  status: BackgroundFetch.BackgroundFetchStatus | null;
}> {
  if (Platform.OS === 'web') {
    return { isAvailable: false, status: null };
  }

  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isAvailable = status === BackgroundFetch.BackgroundFetchStatus.Available;
    return { isAvailable, status };
  } catch (error) {
    logger.error('Failed to get background fetch status', error);
    return { isAvailable: false, status: null };
  }
}

/**
 * Trigger a background sync immediately
 * Useful for "Pull to refresh" or manual sync buttons
 */
export async function triggerBackgroundSync(): Promise<{
  success: boolean;
  message: string;
}> {
  if (Platform.OS === 'web') {
    return { success: false, message: 'Background sync not supported on web' };
  }

  const isRegistered = await isBackgroundSyncRegistered();
  if (!isRegistered) {
    return { success: false, message: 'Background sync not registered' };
  }

  try {
    // Note: We can't actually trigger the background task manually
    // But we can simulate what it does
    const userId = await getStoredUserId();
    if (!userId) {
      return { success: false, message: 'No user logged in' };
    }

    const db = await openDatabase();
    if (!db) {
      return { success: false, message: 'Database not available' };
    }

    const result = await processSyncQueue(db, userId);

    return {
      success: result.failed === 0,
      message: `Synced ${result.synced} items, ${result.failed} failed`,
    };
  } catch (error) {
    logger.error('Manual background sync failed', error);
    return { success: false, message: 'Sync failed' };
  }
}

/**
 * Set up background sync on app initialization
 * Call this in your app's root component or navigation setup
 */
export async function setupBackgroundSync(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Check if background fetch is available
    const { isAvailable } = await getBackgroundFetchStatus();

    if (!isAvailable) {
      logger.warn('Background fetch not available on this device');
      return;
    }

    // Register the sync task
    await registerBackgroundSync();

    logger.info('Background sync setup completed');
  } catch (error) {
    logger.error('Failed to setup background sync', error);
  }
}

/**
 * Get the currently logged-in user's ID from Supabase session
 * Used by background sync task to identify which user's data to sync
 */
async function getStoredUserId(): Promise<string | null> {
  try {
    // Import supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('../lib/supabase');
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch (error) {
    logger.error('Failed to get stored user ID', error);
    return null;
  }
}

/**
 * Open a database connection for background sync operations
 * Creates a new storage adapter instance for the background task
 */
async function openDatabase(): Promise<StorageAdapter | null> {
  try {
    // Import storage adapter dynamically to avoid circular dependencies
    const { createStorageAdapter } = await import('../adapters/storage');
    const adapter = await createStorageAdapter();

    // Initialize database schema if needed
    const { initDatabase } = await import('../utils/database');
    await initDatabase(adapter);

    return adapter;
  } catch (error) {
    logger.error('Failed to open database for background sync', error);
    return null;
  }
}
