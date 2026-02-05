import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { createStorageAdapter, type StorageAdapter } from '../adapters/storage';
import { initDatabase } from '../utils/database';
import { logger } from '../utils/logger';

interface DatabaseContextValue {
  db: StorageAdapter | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Platform-agnostic database provider
 * - Mobile: Uses SQLiteProvider with expo-sqlite
 * - Web: Uses IndexedDB adapter
 */
export function DatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement {
  if (Platform.OS === 'web') {
    return <WebDatabaseProvider>{children}</WebDatabaseProvider>;
  }

  // Mobile: Use SQLiteProvider (lazy loaded)
  return <MobileDatabaseProvider>{children}</MobileDatabaseProvider>;
}

/**
 * Mobile database provider (uses SQLiteProvider from expo-sqlite)
 * Includes timeout protection and error handling to prevent ANR on slow devices
 */
function MobileDatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement {
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [SQLiteProviderComponent, setSQLiteProviderComponent] = useState<React.ComponentType<{
    databaseName: string;
    onInit: (db: unknown) => Promise<void>;
    children: ReactNode;
  }> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSQLite() {
      try {
        // Add timeout to prevent ANR on slow devices (10 second limit)
        const loadPromise = import('expo-sqlite');
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('SQLite load timeout - device may be slow')), 10000);
        });

        const { SQLiteProvider } = await Promise.race([loadPromise, timeoutPromise]);

        if (isMounted) {
          setSQLiteProviderComponent(() => SQLiteProvider);
          logger.info('Mobile: SQLite loaded successfully');
        }
      } catch (err) {
        logger.error('Mobile: Failed to load SQLite', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load SQLite'));
        }
      }
    }

    loadSQLite();

    return () => {
      isMounted = false;
    };
  }, []);

  const errorContextValue = useMemo(() => ({ db: null, isReady: false }), []);

  // Show error state if SQLite failed to load
  if (error) {
    logger.error('Mobile: Database initialization failed', error);
    // Return context with null db - consuming code should handle gracefully
    return (
      <DatabaseContext.Provider value={errorContextValue}>
        {children}
      </DatabaseContext.Provider>
    );
  }

  // Wait for SQLiteProvider to load
  if (!SQLiteProviderComponent) {
    return <></>;
  }

  const SQLiteProviderElement = SQLiteProviderComponent;

  const contextValue = useMemo(
    () => ({ db: adapter, isReady: adapter !== null }),
    [adapter]
  );

  return (
    <SQLiteProviderElement
      databaseName="recovery.db"
      onInit={async (db: unknown) => {
        try {
          const storageAdapter = await createStorageAdapter(db);
          await initDatabase(storageAdapter);
          setAdapter(storageAdapter);
          logger.info('Mobile: Database initialized successfully');
        } catch (err) {
          logger.error('Mobile: Database init failed in onInit', err);
          setError(err instanceof Error ? err : new Error('Database init failed'));
        }
      }}
    >
      <DatabaseContext.Provider value={contextValue}>
        {children}
      </DatabaseContext.Provider>
    </SQLiteProviderElement>
  );
}

/**
 * Web database provider (creates IndexedDB adapter)
 */
function WebDatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement {
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function setupAdapter() {
      try {
        logger.info('Web: Initializing IndexedDB adapter');
        const storageAdapter = await createStorageAdapter();
        logger.info('Web: Adapter created, initializing database schema');
        await initDatabase(storageAdapter);
        logger.info('Web: Database initialized successfully');
        if (isMounted) {
          setAdapter(storageAdapter);
        }
      } catch (err) {
        logger.error('Web: Failed to initialize database', err);
        if (isMounted) {
          setError(err as Error);
          // Keep adapter as null - consuming code should handle null db gracefully
          setAdapter(null);
        }
      }
    }
    setupAdapter();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    logger.warn('Web: Running with error, database operations may fail');
  }

  const contextValue = useMemo(
    () => ({ db: adapter, isReady: adapter !== null }),
    [adapter]
  );

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}
