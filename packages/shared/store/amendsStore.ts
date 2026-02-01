/**
 * Amends Store
 * 8th/9th Step amends list tracking
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';
import type { AmendsEntry, DbAmendsEntry, AmendsType, AmendsStatus } from '../types';

interface DecryptedAmendsEntry extends Omit<AmendsEntry, 'person' | 'harm' | 'notes'> {
  person: string;
  harm: string;
  notes?: string;
}

interface AmendsState {
  entries: AmendsEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEntries: () => Promise<void>;
  createEntry: (
    person: string,
    harm: string,
    amendsType: AmendsType,
    status?: AmendsStatus,
    notes?: string,
  ) => Promise<AmendsEntry>;
  updateEntry: (
    id: string,
    updates: Partial<{
      person: string;
      harm: string;
      amendsType: AmendsType;
      status: AmendsStatus;
      notes: string;
    }>,
  ) => Promise<void>;
  markAmendsMade: (id: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntriesByStatus: (status: AmendsStatus) => AmendsEntry[];
  getDecryptedEntry: (id: string) => Promise<DecryptedAmendsEntry | null>;
  getStats: () => {
    total: number;
    notWilling: number;
    willing: number;
    planned: number;
    inProgress: number;
    made: number;
  };
}

export const useAmendsStore = create<AmendsState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  /**
   * Load all amends entries
   */
  loadEntries: async () => {
    set({ isLoading: true, error: null });

    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbAmendsEntry>(
        'SELECT * FROM amends_list ORDER BY created_at DESC',
      );

      const entries: AmendsEntry[] = rows.map((row) => ({
        id: row.id,
        person: row.person,
        harm: row.harm,
        amendsType: row.amends_type as AmendsType,
        status: row.status as AmendsStatus,
        notes: row.notes || undefined,
        madeAt: row.made_at ? new Date(row.made_at) : undefined,
        createdAt: new Date(row.created_at),
      }));

      set({ entries, isLoading: false });
    } catch (error) {
      console.error('Failed to load amends entries:', error);
      set({ error: 'Failed to load amends list', isLoading: false });
    }
  },

  /**
   * Create a new amends entry
   */
  createEntry: async (
    person: string,
    harm: string,
    amendsType: AmendsType,
    status: AmendsStatus = 'not_willing',
    notes?: string,
  ) => {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    // Encrypt sensitive fields
    const encryptedPerson = await encryptContent(person);
    const encryptedHarm = await encryptContent(harm);
    const encryptedNotes = notes ? await encryptContent(notes) : null;

    await db.runAsync(
      `INSERT INTO amends_list (
        id, person, harm, amends_type, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, encryptedPerson, encryptedHarm, amendsType, status, encryptedNotes, now],
    );

    const entry: AmendsEntry = {
      id,
      person: encryptedPerson,
      harm: encryptedHarm,
      amendsType,
      status,
      notes: encryptedNotes || undefined,
      createdAt: new Date(now),
    };

    set((state) => ({ entries: [entry, ...state.entries] }));
    return entry;
  },

  /**
   * Update an amends entry
   */
  updateEntry: async (id: string, updates) => {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.person !== undefined) {
      updateFields.push('person = ?');
      values.push(await encryptContent(updates.person));
    }
    if (updates.harm !== undefined) {
      updateFields.push('harm = ?');
      values.push(await encryptContent(updates.harm));
    }
    if (updates.amendsType !== undefined) {
      updateFields.push('amends_type = ?');
      values.push(updates.amendsType);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(updates.notes ? await encryptContent(updates.notes) : null);
    }

    if (updateFields.length === 0) return;

    values.push(id);
    await db.runAsync(`UPDATE amends_list SET ${updateFields.join(', ')} WHERE id = ?`, values);

    // Reload entries
    await get().loadEntries();
  },

  /**
   * Mark amends as made
   */
  markAmendsMade: async (id: string) => {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(`UPDATE amends_list SET status = 'made', made_at = ? WHERE id = ?`, [
      now,
      id,
    ]);

    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, status: 'made' as AmendsStatus, madeAt: new Date(now) } : e,
      ),
    }));
  },

  /**
   * Delete an amends entry
   */
  deleteEntry: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM amends_list WHERE id = ?', [id]);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },

  /**
   * Get entries by status
   */
  getEntriesByStatus: (status: AmendsStatus) => {
    return get().entries.filter((e) => e.status === status);
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
        person: await decryptContent(entry.person),
        harm: await decryptContent(entry.harm),
        notes: entry.notes ? await decryptContent(entry.notes) : undefined,
      };
    } catch (error) {
      console.error('Failed to decrypt amends entry:', error);
      return null;
    }
  },

  /**
   * Get stats for amends progress
   */
  getStats: () => {
    const entries = get().entries;
    return {
      total: entries.length,
      notWilling: entries.filter((e) => e.status === 'not_willing').length,
      willing: entries.filter((e) => e.status === 'willing').length,
      planned: entries.filter((e) => e.status === 'planned').length,
      inProgress: entries.filter((e) => e.status === 'in_progress').length,
      made: entries.filter((e) => e.status === 'made').length,
    };
  },
}));
