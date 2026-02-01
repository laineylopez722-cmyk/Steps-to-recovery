/**
 * SQLite storage adapter for mobile (iOS/Android)
 * Wraps expo-sqlite with StorageAdapter interface
 *
 * Features:
 * - Type-safe parameter validation
 * - Comprehensive error handling and logging
 * - Platform-specific optimizations
 * - Memory-efficient parameter handling
 *
 * @see StorageAdapter for interface documentation
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { StorageAdapter } from './types';
import { logger } from '../../utils/logger';

// Type for SQLite bind parameters (string, number, null, Uint8Array, or array of these)
type SQLiteParams = (string | number | null | Uint8Array)[];

/**
 * Validates that parameters are compatible with SQLite bind values
 * @param params - Parameters to validate
 * @returns true if all parameters are valid SQLite types
 * @internal
 */
function validateSQLiteParams(params: unknown[]): params is SQLiteParams {
  return params.every(
    (param) =>
      typeof param === 'string' ||
      typeof param === 'number' ||
      param === null ||
      param instanceof Uint8Array,
  );
}

/**
 * Wraps SQLite operations with error handling and logging
 * @param operation - Description of the operation for logging
 * @param fn - The database operation function
 * @returns Promise resolving to the operation result
 * @internal
 */
async function withErrorHandling<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`SQLiteAdapter ${operation} failed`, error);
    throw error;
  }
}

/**
 * SQLite adapter implementation for mobile platforms
 *
 * Provides a type-safe, error-handling wrapper around expo-sqlite
 * that implements the StorageAdapter interface for platform-agnostic database operations.
 */
export class SQLiteAdapter implements StorageAdapter {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Get database identifier for duplicate initialization detection
   * @returns Database name used for tracking initialization state
   */
  getDatabaseName(): string {
    return 'recovery.db';
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
      if (params && params.length > 0) {
        if (!validateSQLiteParams(params)) {
          throw new Error(
            'Invalid parameter types for SQLite query. Parameters must be string, number, null, or Uint8Array.',
          );
        }
        return this.db.getAllAsync<T>(query, params);
      }
      return this.db.getAllAsync<T>(query);
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
      if (params && params.length > 0) {
        if (!validateSQLiteParams(params)) {
          throw new Error(
            'Invalid parameter types for SQLite query. Parameters must be string, number, null, or Uint8Array.',
          );
        }
        return this.db.getFirstAsync<T>(query, params);
      }
      return this.db.getFirstAsync<T>(query);
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
      if (params && params.length > 0) {
        if (!validateSQLiteParams(params)) {
          throw new Error(
            'Invalid parameter types for SQLite query. Parameters must be string, number, null, or Uint8Array.',
          );
        }
        await this.db.runAsync(query, params);
      } else {
        await this.db.runAsync(query);
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
      await this.db.execAsync(sql);
    });
  }

  /**
   * Execute multiple statements in a transaction
   * @param callback - Async function containing database operations to execute atomically
   * @returns Promise resolving when transaction completes
   * @throws Error if transaction fails or callback throws
   */
  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    return withErrorHandling('withTransactionAsync', async () => {
      await this.db.withTransactionAsync(callback);
    });
  }
}
