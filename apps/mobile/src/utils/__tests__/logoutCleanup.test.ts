jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../encryption', () => ({
  deleteEncryptionKey: jest.fn(),
}));

jest.mock('../database', () => ({
  clearDatabase: jest.fn(),
}));

jest.mock('../../adapters/secureStorage', () => ({
  secureStorage: {
    clearSession: jest.fn(),
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('@recovery/shared', () => ({
  clearAllData: jest.fn(),
}));

import { performLogoutCleanup } from '../logoutCleanup';
import { deleteEncryptionKey } from '../encryption';
import { clearDatabase } from '../database';
import { secureStorage } from '../../adapters/secureStorage';
import { logger } from '../logger';
import type { StorageAdapter } from '../../adapters/storage';

const mockDeleteEncryptionKey = deleteEncryptionKey as jest.MockedFunction<
  typeof deleteEncryptionKey
>;
const mockClearDatabase = clearDatabase as jest.MockedFunction<typeof clearDatabase>;
const mockClearSession = secureStorage.clearSession as jest.MockedFunction<
  typeof secureStorage.clearSession
>;

describe('performLogoutCleanup', () => {
  let mockDb: jest.Mocked<StorageAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getDatabaseName: jest.fn().mockReturnValue('test.db'),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
    } as jest.Mocked<StorageAdapter>;

    mockDeleteEncryptionKey.mockResolvedValue();
    mockClearSession.mockResolvedValue();
    mockClearDatabase.mockResolvedValue();
  });

  it('deletes encryption keys', async () => {
    await performLogoutCleanup({ db: mockDb });
    expect(mockDeleteEncryptionKey).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Deleting encryption keys'),
    );
  });

  it('clears secure storage session', async () => {
    await performLogoutCleanup({ db: mockDb });
    expect(mockClearSession).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Clearing secure storage session'),
    );
  });

  it('clears local database when db is provided', async () => {
    await performLogoutCleanup({ db: mockDb });
    expect(mockClearDatabase).toHaveBeenCalledWith(mockDb);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Clearing local database'),
    );
  });

  it('warns when no database instance is provided', async () => {
    await performLogoutCleanup({});
    expect(mockClearDatabase).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('No database instance provided'),
    );
  });

  it('logs success when all steps complete on web', async () => {
    // Re-mock Platform as 'web' to skip the shared data step (dynamic import)
    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));
    jest.doMock('../encryption', () => ({ deleteEncryptionKey: jest.fn().mockResolvedValue(undefined) }));
    jest.doMock('../database', () => ({ clearDatabase: jest.fn().mockResolvedValue(undefined) }));
    jest.doMock('../../adapters/secureStorage', () => ({
      secureStorage: { clearSession: jest.fn().mockResolvedValue(undefined) },
    }));
    jest.doMock('../logger', () => ({
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    }));

    /* eslint-disable @typescript-eslint/no-require-imports */
    const { performLogoutCleanup: cleanupWeb } = require('../logoutCleanup') as typeof import('../logoutCleanup');
    const { logger: webLogger } = require('../logger') as typeof import('../logger');

    await cleanupWeb({ db: mockDb });

    const infoCalls = (webLogger.info as jest.Mock).mock.calls;
    const hasSuccess = infoCalls.some(
      (call: unknown[]) =>
        typeof call[0] === 'string' && (call[0] as string).includes('completed successfully'),
    );
    expect(hasSuccess).toBe(true);
  });

  it('handles encryption key deletion failure gracefully', async () => {
    mockDeleteEncryptionKey.mockRejectedValueOnce(new Error('Key deletion failed'));
    await performLogoutCleanup({ db: mockDb });

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete encryption key'),
      expect.anything(),
    );
    // Should still continue with other cleanup steps
    expect(mockClearSession).toHaveBeenCalled();
    expect(mockClearDatabase).toHaveBeenCalledWith(mockDb);
  });

  it('handles session clear failure gracefully', async () => {
    mockClearSession.mockRejectedValueOnce(new Error('Session clear failed'));
    await performLogoutCleanup({ db: mockDb });

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to clear secure storage session'),
      expect.anything(),
    );
    // Should still continue
    expect(mockClearDatabase).toHaveBeenCalledWith(mockDb);
  });

  it('handles database clear failure gracefully', async () => {
    mockClearDatabase.mockRejectedValueOnce(new Error('DB clear failed'));
    await performLogoutCleanup({ db: mockDb });

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to clear database'),
      expect.anything(),
    );
  });

  it('logs error count when cleanup has errors', async () => {
    mockDeleteEncryptionKey.mockRejectedValueOnce(new Error('fail1'));
    mockClearSession.mockRejectedValueOnce(new Error('fail2'));

    await performLogoutCleanup({ db: mockDb });

    expect(logger.error).toHaveBeenCalledWith(
      'Logout cleanup completed with errors',
      expect.objectContaining({ errorCount: expect.any(Number) }),
    );
  });

  it('never throws even when all steps fail', async () => {
    mockDeleteEncryptionKey.mockRejectedValueOnce(new Error('fail1'));
    mockClearSession.mockRejectedValueOnce(new Error('fail2'));
    mockClearDatabase.mockRejectedValueOnce(new Error('fail3'));

    await expect(performLogoutCleanup({ db: mockDb })).resolves.toBeUndefined();
  });

  it('uses default empty options when none provided', async () => {
    await performLogoutCleanup();
    expect(mockDeleteEncryptionKey).toHaveBeenCalled();
    expect(mockClearSession).toHaveBeenCalled();
    expect(mockClearDatabase).not.toHaveBeenCalled();
  });
});
