/**
 * Platform-agnostic storage adapter factory
 * Automatically selects SQLite (mobile) or IndexedDB (web) based on platform
 *
 * This module provides a unified interface for database operations across platforms:
 * - **Mobile (iOS/Android)**: Uses expo-sqlite for native SQLite access
 * - **Web**: Uses IndexedDB + sql.js WebAssembly for SQLite compatibility
 *
 * Both adapters implement the same StorageAdapter interface for consistent usage.
 */

import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { StorageAdapter } from './types';

import { logger } from '../../utils/logger';

// Export types
export type { StorageAdapter } from './types';

/**
 * Create and initialize storage adapter for current platform
 *
 * **Mobile Platforms**: Requires pre-initialized SQLite database instance
 * **Web Platform**: Initializes IndexedDB adapter automatically
 *
 * @param nativeDb - SQLite database instance (required for mobile, ignored on web)
 * @returns Promise resolving to initialized StorageAdapter
 * @throws Error if mobile platform and no database provided, or initialization fails
 *
 * @example
 * ```typescript
 * // Mobile usage
 * import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
 * import { createStorageAdapter } from './adapters/storage';
 *
 * function App() {
 *   return (
 *     <SQLiteProvider databaseName="recovery.db">
 *       <DatabaseInitializer />
 *     </SQLiteProvider>
 *   );
 * }
 *
 * function DatabaseInitializer() {
 *   const db = useSQLiteContext();
 *   const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
 *
 *   useEffect(() => {
 *     createStorageAdapter(db).then(setAdapter);
 *   }, [db]);
 *
 *   return adapter ? <AppContent adapter={adapter} /> : <Loading />;
 * }
 *
 * // Web usage
 * const adapter = await createStorageAdapter(); // No parameter needed
 * ```
 */
export async function createStorageAdapter(nativeDb?: unknown): Promise<StorageAdapter> {
  try {
    if (Platform.OS === 'web') {
      logger.info('Creating IndexedDB adapter for web platform');
      const { IndexedDBAdapter } = await import('./indexeddb');
      return new IndexedDBAdapter();
    } else {
      // Mobile: Validate and use provided SQLite database
      // Check for core SQLiteDatabase methods to ensure proper type before assertion
      const db = nativeDb as Record<string, unknown>;
      if (
        !nativeDb ||
        typeof db.execAsync !== 'function' ||
        typeof db.runAsync !== 'function' ||
        typeof db.getAllAsync !== 'function' ||
        typeof db.getFirstAsync !== 'function'
      ) {
        throw new Error(
          'Invalid SQLite database instance for mobile platform. ' +
            'Expected expo-sqlite database with execAsync, runAsync, getAllAsync, and getFirstAsync methods. ' +
            'Ensure SQLiteProvider is properly configured and database is initialized.',
        );
      }

      logger.info('Creating SQLite adapter for mobile platform');
      const { SQLiteAdapter } = await import('./sqlite');

      // Runtime validation above ensures nativeDb has all required SQLiteDatabase methods.
      const adapter = new SQLiteAdapter(nativeDb as SQLiteDatabase);
      return adapter;
    }
  } catch (error) {
    logger.error('Failed to create storage adapter', error);
    throw error;
  }
}
