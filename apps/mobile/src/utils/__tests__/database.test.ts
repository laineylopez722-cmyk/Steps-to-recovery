jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { initDatabase, clearDatabase } from '../database';
import type { StorageAdapter } from '../../adapters/storage';
import { logger } from '../logger';

describe('database utilities', () => {
  let mockDb: jest.Mocked<StorageAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getDatabaseName: jest.fn().mockReturnValue(`test-${Date.now()}.db`),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue(undefined),
      execAsync: jest.fn().mockResolvedValue(undefined),
      withTransactionAsync: jest.fn().mockImplementation(async (cb: () => Promise<void>) => {
        await cb();
      }),
    } as jest.Mocked<StorageAdapter>;
  });

  describe('initDatabase', () => {
    it('creates all required tables and indexes', async () => {
      // Return version 0 to trigger all migrations, then record them
      mockDb.getFirstAsync.mockResolvedValue({ version: 0 });
      mockDb.getAllAsync.mockResolvedValue([]);

      await initDatabase(mockDb);

      // Should have called execAsync many times for CREATE TABLE, CREATE INDEX, and migrations
      expect(mockDb.execAsync).toHaveBeenCalled();
      const calls = mockDb.execAsync.mock.calls.map((c) => c[0] as string);

      // Verify core tables
      expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS user_profile'))).toBe(
        true,
      );
      expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS journal_entries'))).toBe(
        true,
      );
      expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS daily_checkins'))).toBe(
        true,
      );
      expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS step_work'))).toBe(true);
      expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS achievements'))).toBe(
        true,
      );
      expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS sync_queue'))).toBe(true);
      expect(
        calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations')),
      ).toBe(true);

      // Verify indexes
      expect(calls.some((sql) => sql.includes('CREATE INDEX IF NOT EXISTS idx_journal_user'))).toBe(
        true,
      );
      expect(calls.some((sql) => sql.includes('CREATE INDEX IF NOT EXISTS idx_checkin_date'))).toBe(
        true,
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Database initialization complete',
        expect.anything(),
      );
    });

    it('skips initialization if already initialized with same db name', async () => {
      const stableName = `stable-${Date.now()}.db`;
      mockDb.getDatabaseName.mockReturnValue(stableName);
      mockDb.getFirstAsync.mockResolvedValue({ version: 0 });
      mockDb.getAllAsync.mockResolvedValue([]);

      await initDatabase(mockDb);
      jest.clearAllMocks();

      // Second call with same db name should skip
      await initDatabase(mockDb);
      expect(mockDb.execAsync).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Database already initialized, skipping',
        expect.anything(),
      );
    });

    it('runs migrations when schema version is behind', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ version: 0 });
      mockDb.getAllAsync.mockResolvedValue([]);

      await initDatabase(mockDb);

      // Should record migrations via runAsync INSERT INTO schema_migrations
      const runCalls = mockDb.runAsync.mock.calls.map((c) => c[0] as string);
      const migrationInserts = runCalls.filter((sql) =>
        sql.includes('INSERT INTO schema_migrations'),
      );
      expect(migrationInserts.length).toBeGreaterThan(0);
    });

    it('skips migrations when schema is up to date', async () => {
      const freshName = `fresh-${Date.now()}.db`;
      mockDb.getDatabaseName.mockReturnValue(freshName);
      // Return a high version that equals CURRENT_SCHEMA_VERSION (19)
      mockDb.getFirstAsync.mockResolvedValue({ version: 19 });
      mockDb.getAllAsync.mockResolvedValue([]);

      await initDatabase(mockDb);

      expect(logger.info).toHaveBeenCalledWith('Database schema is up to date');
    });

    it('sets WAL journal mode pragma', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ version: 19 });
      mockDb.getAllAsync.mockResolvedValue([]);

      await initDatabase(mockDb);

      const calls = mockDb.execAsync.mock.calls.map((c) => c[0] as string);
      expect(calls.some((sql) => sql.includes('PRAGMA journal_mode = WAL'))).toBe(true);
    });

    it('handles pragma failures gracefully', async () => {
      const pragmaName = `pragma-${Date.now()}.db`;
      mockDb.getDatabaseName.mockReturnValue(pragmaName);
      mockDb.getFirstAsync.mockResolvedValue({ version: 15 });
      mockDb.getAllAsync.mockResolvedValue([]);

      // Make pragmas fail but table creation succeed
      let _callIndex = 0;
      mockDb.execAsync.mockImplementation(async (sql: string) => {
        _callIndex++;
        if (sql.includes('PRAGMA')) {
          throw new Error('PRAGMA not supported');
        }
      });

      // Should not throw - pragmas are best-effort
      await initDatabase(mockDb);

      // Tables should still be created
      expect(mockDb.execAsync).toHaveBeenCalled();
    });
  });

  describe('clearDatabase', () => {
    it('deletes data from all tables in a transaction', async () => {
      await clearDatabase(mockDb);

      expect(mockDb.withTransactionAsync).toHaveBeenCalled();

      const runCalls = mockDb.runAsync.mock.calls.map((c) => c[0] as string);

      // Verify key tables are cleared
      expect(runCalls.some((sql) => sql.includes('DELETE FROM sync_queue'))).toBe(true);
      expect(runCalls.some((sql) => sql.includes('DELETE FROM journal_entries'))).toBe(true);
      expect(runCalls.some((sql) => sql.includes('DELETE FROM daily_checkins'))).toBe(true);
      expect(runCalls.some((sql) => sql.includes('DELETE FROM step_work'))).toBe(true);
      expect(runCalls.some((sql) => sql.includes('DELETE FROM achievements'))).toBe(true);
      expect(runCalls.some((sql) => sql.includes('DELETE FROM user_profile'))).toBe(true);
    });

    it('deletes from child tables before parent tables', async () => {
      await clearDatabase(mockDb);

      const runCalls = mockDb.runAsync.mock.calls.map((c) => c[0] as string);

      // sync_queue (child) should be deleted before user_profile (parent)
      const syncQueueIdx = runCalls.findIndex((sql) => sql.includes('DELETE FROM sync_queue'));
      const userProfileIdx = runCalls.findIndex((sql) => sql.includes('DELETE FROM user_profile'));

      expect(syncQueueIdx).toBeLessThan(userProfileIdx);

      // journal_entries should be before user_profile
      const journalIdx = runCalls.findIndex((sql) => sql.includes('DELETE FROM journal_entries'));
      expect(journalIdx).toBeLessThan(userProfileIdx);
    });
  });

  describe('columnExists (tested via migrations)', () => {
    it('checks column existence before adding columns in migrations', async () => {
      const colCheckName = `colcheck-${Date.now()}.db`;
      mockDb.getDatabaseName.mockReturnValue(colCheckName);
      mockDb.getFirstAsync.mockResolvedValue({ version: 0 });

      // Simulate column already existing
      mockDb.getAllAsync.mockResolvedValue([
        { name: 'id' },
        { name: 'supabase_id' },
        { name: 'updated_at' },
        { name: 'failed_at' },
        { name: 'encrypted_gratitude' },
        { name: 'sync_status' },
      ]);

      await initDatabase(mockDb);

      // Should have called PRAGMA table_info for column checks
      const _execCalls = mockDb.execAsync.mock.calls.map((c) => c[0] as string);
      const pragmaTableInfoCalls = mockDb.getAllAsync.mock.calls.filter(
        (c) => typeof c[0] === 'string' && (c[0] as string).includes('PRAGMA table_info'),
      );
      expect(pragmaTableInfoCalls.length).toBeGreaterThan(0);
    });

    it('adds columns when they do not exist', async () => {
      const addColName = `addcol-${Date.now()}.db`;
      mockDb.getDatabaseName.mockReturnValue(addColName);
      mockDb.getFirstAsync.mockResolvedValue({ version: 0 });

      // Simulate columns NOT existing
      mockDb.getAllAsync.mockResolvedValue([{ name: 'id' }]);

      await initDatabase(mockDb);

      const execCalls = mockDb.execAsync.mock.calls.map((c) => c[0] as string);
      // Should attempt ALTER TABLE to add missing columns
      const alterCalls = execCalls.filter((sql) => sql.includes('ALTER TABLE'));
      expect(alterCalls.length).toBeGreaterThan(0);
    });
  });

  describe('migration version recording', () => {
    it('records each migration version', async () => {
      const recName = `rec-${Date.now()}.db`;
      mockDb.getDatabaseName.mockReturnValue(recName);
      mockDb.getFirstAsync.mockResolvedValue({ version: 0 });
      mockDb.getAllAsync.mockResolvedValue([]);

      await initDatabase(mockDb);

      const runCalls = mockDb.runAsync.mock.calls;
      const migrationRecords = runCalls.filter(
        (c) =>
          typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO schema_migrations'),
      );

      // Should have recorded migrations 1 through 19
      expect(migrationRecords.length).toBe(19);
    });
  });
});
