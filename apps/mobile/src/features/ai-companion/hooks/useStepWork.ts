/**
 * Step Work Hook
 * Manages step work entries (inventories, amends, reflections).
 */

import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import type {
  StepWorkEntry,
  StepWorkEntryType,
  StepWorkStatus,
  ResentmentEntry,
  AmendsEntry,
} from '../types';

/**
 * Generate UUID in a platform-agnostic way
 */
async function generateId(): Promise<string> {
  if (Platform.OS === 'web') {
    return crypto.randomUUID();
  } else {
    const Crypto = await import('expo-crypto');
    return Crypto.randomUUID();
  }
}

export interface UseStepWorkReturn {
  // Inventory (Step 4)
  resentments: ResentmentEntry[];
  addResentment: (entry: ResentmentEntry) => Promise<void>;
  updateResentment: (index: number, entry: ResentmentEntry) => Promise<void>;
  deleteResentment: (index: number) => Promise<void>;

  // Amends (Step 8/9)
  amends: AmendsEntry[];
  addAmends: (entry: Omit<AmendsEntry, 'status' | 'completedAt'>) => Promise<void>;
  updateAmends: (entry: AmendsEntry) => Promise<void>;
  deleteAmends: (who: string) => Promise<void>;

  // General
  getEntriesForStep: (stepNumber: number) => Promise<StepWorkEntry[]>;
  saveEntry: (
    stepNumber: number,
    type: StepWorkEntryType,
    data: Record<string, unknown>
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;

  // Stats
  getStepStats: (stepNumber: number) => Promise<{ total: number; completed: number }>;

  isLoading: boolean;
  error: string | null;
}

export function useStepWork(userId: string): UseStepWorkReturn {
  const { db, isReady } = useDatabase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentments, setResentments] = useState<ResentmentEntry[]>([]);
  const [amends, setAmends] = useState<AmendsEntry[]>([]);

  // Initialize table
  useEffect(() => {
    if (!db || !isReady) return;

    const initTable = async () => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS step_work_entries (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            step_number INTEGER NOT NULL,
            entry_type TEXT NOT NULL,
            data TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_step_work_user ON step_work_entries(user_id);
          CREATE INDEX IF NOT EXISTS idx_step_work_step ON step_work_entries(step_number);
        `);
      } catch (err) {
        console.error('Failed to init step work table:', err);
      }
    };

    initTable();
  }, [db, isReady]);

  // Load data on mount
  useEffect(() => {
    if (isReady) {
      loadResentments();
      loadAmends();
    }
  }, [isReady, userId]);

  const loadResentments = useCallback(async () => {
    if (!db || !isReady) return;

    try {
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM step_work_entries 
         WHERE user_id = ? AND step_number = 4 AND entry_type = 'resentment'
         ORDER BY created_at DESC`,
        [userId]
      );

      const entries: ResentmentEntry[] = [];
      for (const row of rows) {
        try {
          const decrypted = await decryptContent(row.data);
          entries.push(JSON.parse(decrypted) as ResentmentEntry);
        } catch {
          // Skip corrupted entries
        }
      }

      setResentments(entries);
    } catch (err) {
      console.error('Failed to load resentments:', err);
      setError('Failed to load resentments');
    }
  }, [db, isReady, userId]);

  const loadAmends = useCallback(async () => {
    if (!db || !isReady) return;

    try {
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM step_work_entries 
         WHERE user_id = ? AND step_number IN (8, 9) AND entry_type = 'amend'
         ORDER BY created_at DESC`,
        [userId]
      );

      const entries: AmendsEntry[] = [];
      for (const row of rows) {
        try {
          const decrypted = await decryptContent(row.data);
          entries.push(JSON.parse(decrypted) as AmendsEntry);
        } catch {
          // Skip corrupted entries
        }
      }

      setAmends(entries);
    } catch (err) {
      console.error('Failed to load amends:', err);
      setError('Failed to load amends');
    }
  }, [db, isReady, userId]);

  const saveEntry = useCallback(
    async (
      stepNumber: number,
      type: StepWorkEntryType,
      data: Record<string, unknown>,
      status: StepWorkStatus = 'draft'
    ) => {
      if (!db || !isReady) return;

      setIsLoading(true);
      setError(null);

      try {
        const id = await generateId();
        const encrypted = await encryptContent(JSON.stringify(data));
        const now = new Date().toISOString();

        await db.runAsync(
          `INSERT INTO step_work_entries 
           (id, user_id, step_number, entry_type, data, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, stepNumber, type, encrypted, status, now, now]
        );
      } catch (err) {
        console.error('Failed to save step work entry:', err);
        setError('Failed to save entry');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, isReady, userId]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!db || !isReady) return;

      try {
        await db.runAsync('DELETE FROM step_work_entries WHERE id = ? AND user_id = ?', [
          id,
          userId,
        ]);
      } catch (err) {
        console.error('Failed to delete entry:', err);
        setError('Failed to delete entry');
      }
    },
    [db, isReady, userId]
  );

  const addResentment = useCallback(
    async (entry: ResentmentEntry) => {
      await saveEntry(4, 'resentment', entry as unknown as Record<string, unknown>);
      await loadResentments();
    },
    [saveEntry, loadResentments]
  );

  const updateResentment = useCallback(
    async (index: number, entry: ResentmentEntry) => {
      if (!db || !isReady) return;

      // For simplicity, we delete and re-add
      // A more robust solution would store the ID with the entry
      const current = resentments[index];
      if (current) {
        // Find the DB entry by matching content
        const rows = await db.getAllAsync<any>(
          `SELECT id, data FROM step_work_entries 
           WHERE user_id = ? AND step_number = 4 AND entry_type = 'resentment'`,
          [userId]
        );

        for (const row of rows) {
          try {
            const decrypted = await decryptContent(row.data);
            const parsed = JSON.parse(decrypted);
            if (parsed.who === current.who && parsed.cause === current.cause) {
              await deleteEntry(row.id);
              break;
            }
          } catch {
            // Skip
          }
        }
      }

      await addResentment(entry);
    },
    [db, isReady, userId, resentments, deleteEntry, addResentment]
  );

  const deleteResentment = useCallback(
    async (index: number) => {
      if (!db || !isReady) return;

      const current = resentments[index];
      if (!current) return;

      const rows = await db.getAllAsync<any>(
        `SELECT id, data FROM step_work_entries 
         WHERE user_id = ? AND step_number = 4 AND entry_type = 'resentment'`,
        [userId]
      );

      for (const row of rows) {
        try {
          const decrypted = await decryptContent(row.data);
          const parsed = JSON.parse(decrypted);
          if (parsed.who === current.who && parsed.cause === current.cause) {
            await deleteEntry(row.id);
            break;
          }
        } catch {
          // Skip
        }
      }

      await loadResentments();
    },
    [db, isReady, userId, resentments, deleteEntry, loadResentments]
  );

  const addAmends = useCallback(
    async (entry: Omit<AmendsEntry, 'status' | 'completedAt'>) => {
      const fullEntry: AmendsEntry = { ...entry, status: 'not_started' };
      await saveEntry(8, 'amend', fullEntry as unknown as Record<string, unknown>);
      await loadAmends();
    },
    [saveEntry, loadAmends]
  );

  const updateAmends = useCallback(
    async (entry: AmendsEntry) => {
      if (!db || !isReady) return;

      const encrypted = await encryptContent(JSON.stringify(entry));
      const now = new Date().toISOString();
      const newStatus = entry.status === 'complete' ? 'complete' : entry.status;

      // Find by 'who' field
      const rows = await db.getAllAsync<any>(
        `SELECT id, data FROM step_work_entries 
         WHERE user_id = ? AND entry_type = 'amend'`,
        [userId]
      );

      for (const row of rows) {
        try {
          const decrypted = await decryptContent(row.data);
          const parsed = JSON.parse(decrypted);
          if (parsed.who === entry.who) {
            await db.runAsync(
              `UPDATE step_work_entries SET data = ?, updated_at = ?, status = ?
               WHERE id = ?`,
              [encrypted, now, newStatus, row.id]
            );
            break;
          }
        } catch {
          // Skip
        }
      }

      await loadAmends();
    },
    [db, isReady, userId, loadAmends]
  );

  const deleteAmends = useCallback(
    async (who: string) => {
      if (!db || !isReady) return;

      const rows = await db.getAllAsync<any>(
        `SELECT id, data FROM step_work_entries 
         WHERE user_id = ? AND entry_type = 'amend'`,
        [userId]
      );

      for (const row of rows) {
        try {
          const decrypted = await decryptContent(row.data);
          const parsed = JSON.parse(decrypted);
          if (parsed.who === who) {
            await deleteEntry(row.id);
            break;
          }
        } catch {
          // Skip
        }
      }

      await loadAmends();
    },
    [db, isReady, userId, deleteEntry, loadAmends]
  );

  const getEntriesForStep = useCallback(
    async (stepNumber: number): Promise<StepWorkEntry[]> => {
      if (!db || !isReady) return [];

      try {
        const rows = await db.getAllAsync<any>(
          `SELECT * FROM step_work_entries WHERE user_id = ? AND step_number = ?`,
          [userId, stepNumber]
        );

        const entries: StepWorkEntry[] = [];
        for (const row of rows) {
          try {
            const decrypted = await decryptContent(row.data);
            entries.push({
              id: row.id,
              userId: row.user_id,
              stepNumber: row.step_number,
              entryType: row.entry_type as StepWorkEntryType,
              data: JSON.parse(decrypted),
              status: row.status as StepWorkStatus,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at),
            });
          } catch {
            // Skip corrupted entries
          }
        }

        return entries;
      } catch (err) {
        console.error('Failed to get step entries:', err);
        return [];
      }
    },
    [db, isReady, userId]
  );

  const getStepStats = useCallback(
    async (stepNumber: number): Promise<{ total: number; completed: number }> => {
      if (!db || !isReady) return { total: 0, completed: 0 };

      try {
        const total = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM step_work_entries 
           WHERE user_id = ? AND step_number = ?`,
          [userId, stepNumber]
        );

        const completed = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM step_work_entries 
           WHERE user_id = ? AND step_number = ? AND status = 'complete'`,
          [userId, stepNumber]
        );

        return {
          total: total?.count || 0,
          completed: completed?.count || 0,
        };
      } catch {
        return { total: 0, completed: 0 };
      }
    },
    [db, isReady, userId]
  );

  return {
    resentments,
    addResentment,
    updateResentment,
    deleteResentment,
    amends,
    addAmends,
    updateAmends,
    deleteAmends,
    getEntriesForStep,
    saveEntry,
    deleteEntry,
    getStepStats,
    isLoading,
    error,
  };
}
