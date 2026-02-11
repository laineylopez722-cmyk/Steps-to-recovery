/**
 * IndexedDB storage adapter for web
 * Uses sql.js (SQLite compiled to WebAssembly) + IndexedDB for persistence
 *
 * Features:
 * - Full SQLite compatibility via WebAssembly
 * - IndexedDB-backed persistence with automatic save/load
 * - Transaction support with nested savepoints
 * - Type-safe parameter validation
 * - Comprehensive error handling and logging
 * - Memory-efficient with lazy initialization
 *
 * @see StorageAdapter for interface documentation
 */

import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { StorageAdapter } from './types';
import { logger } from '../../utils/logger';

const DB_NAME = 'StepsToRecovery';
const STORE_NAME = 'sqliteData';
const DB_VERSION = 1;

type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;

/**
 * Validates that parameters are compatible with SQLite bind values
 * @param params - Parameters to validate
 * @returns true if all parameters are valid SQLite types
 * @internal
 */
function validateSQLiteParams(
  params: unknown[],
): params is (string | number | null | Uint8Array)[] {
  return params.every(
    (param) =>
      typeof param === 'string' ||
      typeof param === 'number' ||
      param === null ||
      param instanceof Uint8Array,
  );
}

/**
 * Wraps IndexedDB operations with error handling and logging
 * @param operation - Description of the operation for logging
 * @param fn - The database operation function
 * @returns Promise resolving to the operation result
 * @internal
 */
async function withErrorHandling<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`IndexedDBAdapter ${operation} failed`, error);
    throw error;
  }
}

interface StepsToRecoveryDbSchema extends DBSchema {
  [STORE_NAME]: {
    key: 'database';
    // idb supports structured cloning of Uint8Array; allow ArrayBuffer for
    // forward/backward compatibility with older persisted formats.
    value: Uint8Array | ArrayBuffer;
  };
}

export interface IndexedDBAdapterOptions {
  /**
   * Base URL used by sql.js to load its wasm file.
   * Defaults to sql.js CDN. If you bundle the wasm locally, override this.
   */
  wasmBaseUrl?: string;
}

/**
 * IndexedDB adapter implementation for web platforms
 *
 * Provides SQLite-compatible database operations using sql.js WebAssembly
 * with IndexedDB persistence. Supports full transactions, prepared statements,
 * and automatic persistence.
 *
 * **Initialization**: Lazy-loaded on first database operation
 * **Persistence**: Automatic save to IndexedDB on successful transactions
 * **Transactions**: Full nested transaction support with savepoints
 * **Error Handling**: Comprehensive logging and error recovery
 */
export class IndexedDBAdapter implements StorageAdapter {
  private db: Database | null = null;
  private idb: IDBPDatabase<StepsToRecoveryDbSchema> | null = null;

  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private persistQueue: Promise<void> = Promise.resolve();

  private transactionDepth = 0;

  private readonly wasmBaseUrl: string;

  /**
   * Create IndexedDB adapter with optional configuration
   * @param options - Configuration options for the adapter
   */
  constructor(options: IndexedDBAdapterOptions = {}) {
    const base =
      options.wasmBaseUrl ??
      process.env.EXPO_PUBLIC_SQLJS_WASM_BASE_URL ??
      'https://sql.js.org/dist/';
    this.wasmBaseUrl = base.endsWith('/') ? base : `${base}/`;
    try {
      const parsed = new URL(this.wasmBaseUrl);
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'sql.js.org') {
        logger.warn(
          'IndexedDB adapter is using the sql.js CDN. Set EXPO_PUBLIC_SQLJS_WASM_BASE_URL to a local asset for offline-first use.',
        );
      }
    } catch {
      // If the URL is malformed, skip CDN host detection and warning.
    }
  }

  /**
   * Get database identifier for duplicate initialization detection
   * @returns Database name used for tracking initialization state
   */
  getDatabaseName(): string {
    return DB_NAME;
  }

  /**
   * Initialize sql.js WebAssembly and load database from IndexedDB
   *
   * This method is called automatically on first database operation.
   * Initialization includes loading the SQLite WebAssembly binary,
   * opening IndexedDB connection, and restoring previous database state.
   *
   * @returns Promise resolving when initialization is complete
   * @throws Error if IndexedDB is unavailable or initialization fails
   * @private
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = withErrorHandling('initialize', async () => {
      if (typeof indexedDB === 'undefined') {
        throw new Error('IndexedDB is not available in this environment');
      }

      logger.info('Initializing IndexedDB adapter', {
        dbName: DB_NAME,
        wasmBaseUrl: this.wasmBaseUrl,
      });

      // Initialize sql.js WebAssembly
      const SQL: SqlJsStatic = await initSqlJs({
        locateFile: (file: string) => `${this.wasmBaseUrl}${file}`,
      });

      // Open IndexedDB with upgrade handling
      this.idb = await openDB<StepsToRecoveryDbSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          logger.info('Upgrading IndexedDB schema', { version: DB_VERSION });
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });

      // Load existing database or create new one
      const savedData = await this.idb.get(STORE_NAME, 'database');
      if (savedData) {
        const bytes = savedData instanceof Uint8Array ? savedData : new Uint8Array(savedData);
        this.db = new SQL.Database(bytes);
        logger.info('Loaded existing database from IndexedDB', { size: bytes.length });
      } else {
        this.db = new SQL.Database();
        logger.info('Created new SQLite database');
      }

      this.initialized = true;
      logger.info('IndexedDB adapter initialization complete');
    })
      .catch((err) => {
        // Reset state to allow retry on next call
        this.initialized = false;
        this.db = null;
        this.idb = null;
        logger.error('IndexedDB adapter initialization failed', err);
        throw err;
      })
      .finally(() => {
        this.initPromise = null;
      });

    return this.initPromise;
  }

  /**
   * Get initialized SQLite database instance
   * @returns Promise resolving to ready SQLite database
   * @throws Error if initialization failed
   * @private
   */
  private async getReadyDb(): Promise<Database> {
    await this.initialize();
    if (!this.db) {
      throw new Error('SQLite database not initialized - initialization may have failed');
    }
    return this.db;
  }

  /**
   * Get initialized IndexedDB instance
   * @returns Promise resolving to ready IndexedDB connection
   * @throws Error if initialization failed
   * @private
   */
  private async getReadyIdb(): Promise<IDBPDatabase<StepsToRecoveryDbSchema>> {
    await this.initialize();
    if (!this.idb) {
      throw new Error('IndexedDB not initialized - initialization may have failed');
    }
    return this.idb;
  }

  /**
   * Persist current database state to IndexedDB
   *
   * Exports the SQLite database as binary data and saves it to IndexedDB.
   * Persistence is queued to ensure writes are serialized and the newest
   * export always wins in concurrent scenarios.
   *
   * @returns Promise resolving when persistence is complete
   * @private
   */
  private async persist(): Promise<void> {
    return withErrorHandling('persist', async () => {
      const db = this.db;
      const idb = this.idb;
      if (!db || !idb) {
        logger.warn('Persist called but database not ready, skipping');
        return;
      }

      const data = db.export();
      logger.debug('Persisting database to IndexedDB', { size: data.length });

      // Serialize writes to IndexedDB so the newest export always wins
      const persistPromise = this.persistQueue.then(async () => {
        await idb.put(STORE_NAME, data, 'database');
      });
      this.persistQueue = persistPromise;
      await this.persistQueue;

      logger.debug('Database persistence complete');
    });
  }
  /**
   * Close database connections and free resources
   *
   * This method is optional and not required by StorageAdapter interface.
   * Useful for web teardown, testing, or hot reload scenarios.
   * After calling close(), the adapter will reinitialize on next operation.
   */
  close(): void {
    logger.info('Closing IndexedDB adapter resources');

    try {
      this.db?.close();
    } catch (error) {
      logger.warn('Error closing SQLite database', error);
    } finally {
      this.db = null;
      this.initialized = false;
    }

    try {
      this.idb?.close();
    } catch (error) {
      logger.warn('Error closing IndexedDB connection', error);
    } finally {
      this.idb = null;
    }
  }

  /**
   * Execute query and return all matching rows
   * @template T - Expected row type for type safety
   * @param query - SQL query string
   * @param params - Optional bind parameters (validated at runtime)
   * @returns Promise resolving to array of result rows
   * @throws Error if query execution fails or parameters are invalid
   */
  async getAllAsync<T = unknown>(query: string, params?: unknown[]): Promise<T[]> {
    return withErrorHandling('getAllAsync', async () => {
      const db = await this.getReadyDb();

      if (params && params.length > 0 && !validateSQLiteParams(params)) {
        throw new Error(
          'Invalid parameter types for SQLite query. Parameters must be string, number, null, or Uint8Array.',
        );
      }

      const stmt = db.prepare(query);
      try {
        if (params) stmt.bind(params as (string | number | null | Uint8Array)[]);

        const results: T[] = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          results.push(row as T);
        }
        return results;
      } finally {
        stmt.free();
      }
    });
  }

  /**
   * Execute query and return first matching row
   * @template T - Expected row type for type safety
   * @param query - SQL query string
   * @param params - Optional bind parameters (validated at runtime)
   * @returns Promise resolving to first result row or null if no matches
   * @throws Error if query execution fails or parameters are invalid
   */
  async getFirstAsync<T = unknown>(query: string, params?: unknown[]): Promise<T | null> {
    return withErrorHandling('getFirstAsync', async () => {
      const db = await this.getReadyDb();

      if (params && params.length > 0 && !validateSQLiteParams(params)) {
        throw new Error(
          'Invalid parameter types for SQLite query. Parameters must be string, number, null, or Uint8Array.',
        );
      }

      const stmt = db.prepare(query);
      try {
        if (params) stmt.bind(params as (string | number | null | Uint8Array)[]);

        if (stmt.step()) {
          return stmt.getAsObject() as T;
        }
        return null;
      } finally {
        stmt.free();
      }
    });
  }

  /**
   * Execute query without returning rows (INSERT, UPDATE, DELETE)
   * @param query - SQL query string
   * @param params - Optional bind parameters (validated at runtime)
   * @returns Promise resolving when operation completes
   * @throws Error if query execution fails or parameters are invalid
   */
  async runAsync(query: string, params?: unknown[]): Promise<void> {
    return withErrorHandling('runAsync', async () => {
      const db = await this.getReadyDb();

      if (params && params.length > 0 && !validateSQLiteParams(params)) {
        throw new Error(
          'Invalid parameter types for SQLite query. Parameters must be string, number, null, or Uint8Array.',
        );
      }

      if (params) db.run(query, params as (string | number | null | Uint8Array)[]);
      else db.run(query);

      // Don't persist mid-transaction; outermost commit will persist.
      if (this.transactionDepth === 0) {
        await this.persist();
      }
    });
  }

  /**
   * Execute raw SQL (for schema creation, migrations)
   * @param sql - Raw SQL string (typically multi-statement)
   * @returns Promise resolving when execution completes
   * @throws Error if SQL execution fails
   */
  async execAsync(sql: string): Promise<void> {
    return withErrorHandling('execAsync', async () => {
      const db = await this.getReadyDb();
      db.exec(sql);

      // Don't persist mid-transaction; outermost commit will persist.
      if (this.transactionDepth === 0) {
        await this.persist();
      }
    });
  }

  /**
   * Execute multiple statements in a transaction with automatic rollback on error
   *
   * Supports nested transactions using SQLite savepoints. Only the outermost
   * transaction triggers persistence to IndexedDB. Failed transactions are
   * automatically rolled back and the original error is re-thrown.
   *
   * @param callback - Async function containing database operations to execute atomically
   * @returns Promise resolving when transaction completes successfully
   * @throws Error if transaction fails or callback throws
   */
  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    return withErrorHandling('withTransactionAsync', async () => {
      const db = await this.getReadyDb();
      const idb = await this.getReadyIdb();

      // Ensure any prior queued persist completes before starting a new transaction,
      // so we don't end up with older exports overwriting a later commit.
      await this.persistQueue;

      const depth = this.transactionDepth;
      const savepoint: string = `sp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      this.transactionDepth += 1;

      try {
        if (depth === 0) {
          db.run('BEGIN TRANSACTION');
          logger.debug('Started outermost transaction');
        } else {
          db.run(`SAVEPOINT ${savepoint}`);
          logger.debug('Created savepoint', { savepoint, depth: this.transactionDepth });
        }

        await callback();

        if (depth === 0) {
          db.run('COMMIT');
          logger.debug('Committed outermost transaction');

          // Persist only after a successful outermost commit.
          const data = db.export();
          // Queue persistence to ensure writes are serialized
          const persistPromise = this.persistQueue.then(async () => {
            await idb.put(STORE_NAME, data as Uint8Array, 'database');
            logger.debug('Persisted transaction to IndexedDB');
          });
          this.persistQueue = persistPromise;
          await this.persistQueue;
        } else {
          db.run(`RELEASE SAVEPOINT ${savepoint}`);
          logger.debug('Released savepoint', { savepoint });
        }
      } catch (error) {
        logger.warn('Transaction failed, rolling back', { depth, savepoint });

        try {
          if (depth === 0) {
            db.run('ROLLBACK');
            logger.debug('Rolled back outermost transaction');
          } else {
            db.run(`ROLLBACK TO SAVEPOINT ${savepoint}`);
            db.run(`RELEASE SAVEPOINT ${savepoint}`);
            logger.debug('Rolled back to savepoint', { savepoint });
          }
        } catch (rollbackError) {
          logger.error('Rollback failed', rollbackError);
          // Ignore rollback failures; surface the original error.
        }
        throw error;
      } finally {
        this.transactionDepth = Math.max(0, this.transactionDepth - 1);
      }
    });
  }
}
