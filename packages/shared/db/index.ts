/**
 * Database Module Exports
 *
 * Central export point for database operations and models.
 * Provides access to database client functions and data models.
 *
 * @module db
 */

export { getDatabase, initializeDatabase, closeDatabase, clearAllData } from './client';
export * from './models';
