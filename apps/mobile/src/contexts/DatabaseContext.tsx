import React, {
  createContext,
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
  const [isLoading, setIsLoading] = useState(true);
  const initStartedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode or re-renders
    if (initStartedRef.current) {
      return;
    }
    initStartedRef.current = true;

    let isMounted = true;

    async function initializeDatabase() {
      try {
        logger.info('Mobile: Starting database initialization');
        
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
      } catch (err) {
        logger.error('Mobile: Database initialization failed', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const contextValue = useMemo(
    () => ({ db: adapter, isReady: adapter !== null }),
    [adapter]
  );

  // Always render children - don't block on database loading
  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Web database provider (IndexedDB)
 */
function WebDatabaseProvider({ children }: DatabaseProviderProps): React.ReactElement {
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    let isMounted = true;

    async function setupAdapter() {
      try {
        logger.info('Web: Initializing IndexedDB adapter');
        const storageAdapter = await createStorageAdapter();
        await initDatabase(storageAdapter);
        logger.info('Web: Database initialized successfully');
        if (isMounted) {
          setAdapter(storageAdapter);
        }
      } catch (err) {
        logger.error('Web: Failed to initialize database', err);
      }
    }
    
    setupAdapter();

    return () => {
      isMounted = false;
    };
  }, []);

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
