/**
 * Fourth Step Inventory Store
 * Proper Big Book format: Resentments, Fears, Sex Conduct
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';
import type { FourthStepEntry, DbFourthStepEntry, FourthStepType } from '../types';
import { logger } from '../utils/logger';

// The affects options for resentments (Big Book columns)
export const AFFECTS_OPTIONS = [
  'Self-Esteem',
  'Security',
  'Ambitions',
  'Personal Relations',
  'Sex Relations',
] as const;

export type AffectsOption = (typeof AFFECTS_OPTIONS)[number];

interface DecryptedFourthStepEntry extends Omit<FourthStepEntry, 'who' | 'cause' | 'myPart'> {
  who: string;
  cause: string;
  myPart: string;
}

interface FourthStepState {
  entries: FourthStepEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEntries: () => Promise<void>;
  loadEntriesByType: (type: FourthStepType) => Promise<void>;
  createEntry: (
    type: FourthStepType,
    who: string,
    cause: string,
    affects: string[],
    myPart: string,
  ) => Promise<FourthStepEntry>;
  updateEntry: (
    id: string,
    updates: Partial<{
      who: string;
      cause: string;
      affects: string[];
      myPart: string;
    }>,
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntriesByType: (type: FourthStepType) => FourthStepEntry[];
  getDecryptedEntry: (id: string) => Promise<DecryptedFourthStepEntry | null>;
  getCounts: () => { resentments: number; fears: number; sexConduct: number };
}

export const useFourthStepStore = create<FourthStepState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  /**
   * Load all inventory entries
   */
  loadEntries: async () => {
    set({ isLoading: true, error: null });

    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbFourthStepEntry>(
        'SELECT * FROM fourth_step_inventory ORDER BY created_at DESC',
      );

      const entries: FourthStepEntry[] = rows.map((row: DbFourthStepEntry) => ({
        id: row.id,
        type: row.type as FourthStepType,
        who: row.who,
        cause: row.cause,
        affects: JSON.parse(row.affects),
        myPart: row.my_part || '',
        createdAt: new Date(row.created_at),
      }));

      set({ entries, isLoading: false });
    } catch (error) {
      logger.error('Failed to load 4th step entries', error);
      set({ error: 'Failed to load inventory', isLoading: false });
    }
  },

  /**
   * Load entries by type
   */
  loadEntriesByType: async (type: FourthStepType) => {
    set({ isLoading: true, error: null });

    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbFourthStepEntry>(
        'SELECT * FROM fourth_step_inventory WHERE type = ? ORDER BY created_at DESC',
        [type],
      );

      const typeEntries: FourthStepEntry[] = rows.map((row: DbFourthStepEntry) => ({
        id: row.id,
        type: row.type as FourthStepType,
        who: row.who,
        cause: row.cause,
        affects: JSON.parse(row.affects),
        myPart: row.my_part || '',
        createdAt: new Date(row.created_at),
      }));

      // Merge with existing entries from other types
      set((state) => ({
        entries: [...state.entries.filter((e) => e.type !== type), ...typeEntries],
        isLoading: false,
      }));
    } catch (error) {
      logger.error('Failed to load entries by type', error);
      set({ error: 'Failed to load inventory', isLoading: false });
    }
  },

  /**
   * Create a new inventory entry
   */
  createEntry: async (
    type: FourthStepType,
    who: string,
    cause: string,
    affects: string[],
    myPart: string,
  ) => {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    // Encrypt sensitive fields
    const encryptedWho = await encryptContent(who);
    const encryptedCause = await encryptContent(cause);
    const encryptedMyPart = await encryptContent(myPart);

    await db.runAsync(
      `INSERT INTO fourth_step_inventory (
        id, type, who, cause, affects, my_part, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, type, encryptedWho, encryptedCause, JSON.stringify(affects), encryptedMyPart, now],
    );

    const entry: FourthStepEntry = {
      id,
      type,
      who: encryptedWho,
      cause: encryptedCause,
      affects,
      myPart: encryptedMyPart,
      createdAt: new Date(now),
    };

    set((state) => ({ entries: [entry, ...state.entries] }));
    return entry;
  },

  /**
   * Update an inventory entry
   */
  updateEntry: async (id: string, updates) => {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.who !== undefined) {
      updateFields.push('who = ?');
      values.push(await encryptContent(updates.who));
    }
    if (updates.cause !== undefined) {
      updateFields.push('cause = ?');
      values.push(await encryptContent(updates.cause));
    }
    if (updates.affects !== undefined) {
      updateFields.push('affects = ?');
      values.push(JSON.stringify(updates.affects));
    }
    if (updates.myPart !== undefined) {
      updateFields.push('my_part = ?');
      values.push(await encryptContent(updates.myPart));
    }

    if (updateFields.length === 0) return;

    values.push(id);
    await db.runAsync(
      `UPDATE fourth_step_inventory SET ${updateFields.join(', ')} WHERE id = ?`,
      values,
    );

    // Reload entries to get updated data
    await get().loadEntries();
  },

  /**
   * Delete an inventory entry
   */
  deleteEntry: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM fourth_step_inventory WHERE id = ?', [id]);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },

  /**
   * Get entries filtered by type
   */
  getEntriesByType: (type: FourthStepType) => {
    return get().entries.filter((e) => e.type === type);
  },

  /**
   * Get decrypted entry for display
   */
  getDecryptedEntry: async (id: string) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return null;

    try {
      return {
        ...entry,
        who: await decryptContent(entry.who),
        cause: await decryptContent(entry.cause),
        myPart: await decryptContent(entry.myPart),
      };
    } catch (error) {
      logger.error('Failed to decrypt entry', error);
      return null;
    }
  },

  /**
   * Get count of entries by type
   */
  getCounts: () => {
    const entries = get().entries;
    return {
      resentments: entries.filter((e) => e.type === 'resentment').length,
      fears: entries.filter((e) => e.type === 'fear').length,
      sexConduct: entries.filter((e) => e.type === 'sex_conduct').length,
    };
  },
}));
