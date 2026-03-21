import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { createStorageAdapter, type StorageAdapter } from '../adapters/storage';
import { initDatabase } from '../utils/database';
import { logger } from '../utils/logger';

interface DatabaseContextValue {
  db: StorageAdapter | null;
  isReady: boolean;
  error: Error | null;
  retryInit: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
  error: null,
  retryInit: () => {},
});

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Platform-agnostic database provider
 */
export function DatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement {
  if (Platform.OS === 'web') {
    return <WebDatabaseProvider>{children}</WebDatabaseProvider>;
  }
  return <MobileDatabaseProvider>{children}</MobileDatabaseProvider>;
}

/**
 * Mobile database provider - simplified to prevent render loops
 */
function MobileDatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement {
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const initStartedRef = useRef(false);

  useEffect(() => {
    // Reset the guard on retry so initialization can re-run
    if (retryCount > 0) {
      initStartedRef.current = false;
    }

    // Prevent double initialization in StrictMode or re-renders
    if (initStartedRef.current) {
      return;
    }
    initStartedRef.current = true;

    let isMounted = true;

    async function initializeDatabase(): Promise<void> {
      const INIT_TIMEOUT_MS = 10_000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Database initialization timed out after 10s')),
          INIT_TIMEOUT_MS,
        ),
      );

      try {
        setInitError(null);
        logger.info('Mobile: Starting database initialization');

        await Promise.race([
          (async () => {
            // Dynamically import expo-sqlite
            const { openDatabaseAsync } = await import('expo-sqlite');

            // Open the database directly (not using SQLiteProvider component)
            const db = await openDatabaseAsync('recovery.db');

            if (!isMounted) return;

            logger.info('Mobile: Database opened, creating adapter');
            const storageAdapter = await createStorageAdapter(db);

            if (!isMounted) return;

            logger.info('Mobile: Initializing schema');
            await initDatabase(storageAdapter);

            if (!isMounted) return;

            logger.info('Mobile: Database ready');
            setAdapter(storageAdapter);
          })(),
          timeoutPromise,
        ]);
      } catch (err) {
        logger.error('Mobile: Database initialization failed', err);
        if (isMounted) {
          setInitError(err instanceof Error ? err : new Error('Database initialization failed'));
        }
      }
    }

    initializeDatabase();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  const retryInit = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const contextValue = useMemo(
    () => ({ db: adapter, isReady: adapter !== null, error: initError, retryInit }),
    [adapter, initError, retryInit],
  );

  // Always render children - don't block on database loading
  return <DatabaseContext.Provider value={contextValue}>{children}</DatabaseContext.Provider>;
}

/**
 * Web database provider (IndexedDB)
 */
function WebDatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement {
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (retryCount > 0) {
      initStartedRef.current = false;
    }
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    let isMounted = true;

    async function setupAdapter(): Promise<void> {
      const INIT_TIMEOUT_MS = 10_000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Database initialization timed out after 10s')),
          INIT_TIMEOUT_MS,
        ),
      );

      try {
        setInitError(null);
        logger.info('Web: Initializing IndexedDB adapter');

        await Promise.race([
          (async () => {
            const storageAdapter = await createStorageAdapter();
            await initDatabase(storageAdapter);
            logger.info('Web: Database initialized successfully');
            if (isMounted) {
              setAdapter(storageAdapter);
            }
          })(),
          timeoutPromise,
        ]);
      } catch (err) {
        logger.error('Web: Failed to initialize database', err);
        if (isMounted) {
          setInitError(err instanceof Error ? err : new Error('Database initialization failed'));
        }
      }
    }

    setupAdapter();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  const retryInit = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const contextValue = useMemo(
    () => ({ db: adapter, isReady: adapter !== null, error: initError, retryInit }),
    [adapter, initError, retryInit],
  );

  return <DatabaseContext.Provider value={contextValue}>{children}</DatabaseContext.Provider>;
}
