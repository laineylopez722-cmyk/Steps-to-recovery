/**
 * Rhythm Store
 * Manages daily recovery rhythm: intentions, pulse checks, and nightly inventory
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';

// Context tags for pulse checks
export type PulseContext =
  | 'alone'
  | 'with_people'
  | 'bored'
  | 'stressed'
  | 'hungry'
  | 'tired'
  | 'anxious'
  | 'angry';

// Daily intention record
export interface DailyIntention {
  id: string;
  date: string; // YYYY-MM-DD
  intention: string;
  isCustom: boolean;
  createdAt: Date;
}

// Pulse check record (multiple per day allowed)
export interface PulseCheck {
  id: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1-10
  cravingLevel: number; // 0-10
  context: PulseContext[];
  notes?: string;
  createdAt: Date;
}

// Tiny inventory (nightly review)
export interface TinyInventory {
  id: string;
  date: string; // YYYY-MM-DD
  stayedClean: 'yes' | 'no' | 'close_call';
  attendedMeeting: boolean;
  contactedSponsor: boolean;
  contactedFellowship: boolean;
  reflection?: string;
  createdAt: Date;
}

interface RhythmStore {
  // Today's data
  todayIntention: DailyIntention | null;
  todayPulseChecks: PulseCheck[];
  todayInventory: TinyInventory | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTodayRhythm: () => Promise<void>;
  setIntention: (intention: string, isCustom?: boolean) => Promise<void>;
  submitPulseCheck: (
    mood: number,
    cravingLevel: number,
    context: PulseContext[],
    notes?: string,
  ) => Promise<void>;
  submitTinyInventory: (data: Omit<TinyInventory, 'id' | 'date' | 'createdAt'>) => Promise<void>;

  // Quick pulse check (from home screen sliders)
  quickPulseCheck: (mood: number, cravingLevel: number) => Promise<void>;
}

// Database table creation (will be added via migration)
const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS daily_intentions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    intention TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pulse_checks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    mood INTEGER NOT NULL,
    craving_level INTEGER NOT NULL,
    context TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tiny_inventories (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    stayed_clean TEXT NOT NULL,
    attended_meeting INTEGER NOT NULL DEFAULT 0,
    contacted_sponsor INTEGER NOT NULL DEFAULT 0,
    contacted_fellowship INTEGER NOT NULL DEFAULT 0,
    reflection TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_intentions_date ON daily_intentions(date);
  CREATE INDEX IF NOT EXISTS idx_pulse_date ON pulse_checks(date);
  CREATE INDEX IF NOT EXISTS idx_inventory_date ON tiny_inventories(date);
`;

// Helper to ensure tables exist
async function ensureTablesExist(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(CREATE_TABLES_SQL);
}

// Get today's date string
function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const useRhythmStore = create<RhythmStore>((set, get) => ({
  todayIntention: null,
  todayPulseChecks: [],
  todayInventory: null,
  isLoading: false,
  error: null,

  loadTodayRhythm: async () => {
    set({ isLoading: true, error: null });
    try {
      await ensureTablesExist();
      const db = await getDatabase();
      const today = getTodayDateStr();

      // Load today's intention
      const intentionRow = await db.getFirstAsync<{
        id: string;
        date: string;
        intention: string;
        is_custom: number;
        created_at: string;
      }>('SELECT * FROM daily_intentions WHERE date = ?', [today]);

      const todayIntention: DailyIntention | null = intentionRow
        ? {
            id: intentionRow.id,
            date: intentionRow.date,
            intention: intentionRow.intention,
            isCustom: intentionRow.is_custom === 1,
            createdAt: new Date(intentionRow.created_at),
          }
        : null;

      // Load today's pulse checks
      const pulseRows = await db.getAllAsync<{
        id: string;
        date: string;
        mood: number;
        craving_level: number;
        context: string;
        notes: string | null;
        created_at: string;
      }>('SELECT * FROM pulse_checks WHERE date = ? ORDER BY created_at DESC', [today]);

      const todayPulseChecks: PulseCheck[] = await Promise.all(
        pulseRows.map(async (row) => {
          const decryptedNotes = row.notes ? await decryptContent(row.notes) : null;
          return {
            id: row.id,
            date: row.date,
            mood: row.mood,
            cravingLevel: row.craving_level,
            context: JSON.parse(row.context) as PulseContext[],
            notes: decryptedNotes || undefined,
            createdAt: new Date(row.created_at),
          };
        }),
      );

      // Load today's inventory
      const inventoryRow = await db.getFirstAsync<{
        id: string;
        date: string;
        stayed_clean: string;
        attended_meeting: number;
        contacted_sponsor: number;
        contacted_fellowship: number;
        reflection: string | null;
        created_at: string;
      }>('SELECT * FROM tiny_inventories WHERE date = ?', [today]);

      const decryptedReflection = inventoryRow?.reflection
        ? await decryptContent(inventoryRow.reflection)
        : null;

      const todayInventory: TinyInventory | null = inventoryRow
        ? {
            id: inventoryRow.id,
            date: inventoryRow.date,
            stayedClean: inventoryRow.stayed_clean as TinyInventory['stayedClean'],
            attendedMeeting: inventoryRow.attended_meeting === 1,
            contactedSponsor: inventoryRow.contacted_sponsor === 1,
            contactedFellowship: inventoryRow.contacted_fellowship === 1,
            reflection: decryptedReflection || undefined,
            createdAt: new Date(inventoryRow.created_at),
          }
        : null;

      set({
        todayIntention,
        todayPulseChecks,
        todayInventory,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load today's rhythm:", error);
      set({ error: 'Failed to load daily rhythm', isLoading: false });
    }
  },

  setIntention: async (intention: string, isCustom = false) => {
    set({ isLoading: true, error: null });
    try {
      await ensureTablesExist();
      const db = await getDatabase();
      const today = getTodayDateStr();
      const id = uuidv4();
      const now = new Date().toISOString();

      // Use INSERT OR REPLACE to update if exists
      await db.runAsync(
        `INSERT OR REPLACE INTO daily_intentions (id, date, intention, is_custom, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, today, intention, isCustom ? 1 : 0, now],
      );

      const newIntention: DailyIntention = {
        id,
        date: today,
        intention,
        isCustom,
        createdAt: new Date(now),
      };

      set({ todayIntention: newIntention, isLoading: false });
    } catch (error) {
      console.error('Failed to set intention:', error);
      set({ error: 'Failed to save intention', isLoading: false });
    }
  },

  submitPulseCheck: async (
    mood: number,
    cravingLevel: number,
    context: PulseContext[],
    notes?: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      await ensureTablesExist();
      const db = await getDatabase();
      const today = getTodayDateStr();
      const id = uuidv4();
      const now = new Date().toISOString();

      // Encrypt notes if provided
      const encryptedNotes = notes ? await encryptContent(notes) : null;

      await db.runAsync(
        `INSERT INTO pulse_checks (id, date, mood, craving_level, context, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, today, mood, cravingLevel, JSON.stringify(context), encryptedNotes, now],
      );

      const newPulseCheck: PulseCheck = {
        id,
        date: today,
        mood,
        cravingLevel,
        context,
        notes: encryptedNotes || undefined,
        createdAt: new Date(now),
      };

      set((state) => ({
        todayPulseChecks: [newPulseCheck, ...state.todayPulseChecks],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to submit pulse check:', error);
      set({ error: 'Failed to save pulse check', isLoading: false });
    }
  },

  quickPulseCheck: async (mood: number, cravingLevel: number) => {
    // Quick pulse check without context - for home screen sliders
    await get().submitPulseCheck(mood, cravingLevel, []);
  },

  submitTinyInventory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await ensureTablesExist();
      const db = await getDatabase();
      const today = getTodayDateStr();
      const id = uuidv4();
      const now = new Date().toISOString();

      // Encrypt reflection if provided
      const encryptedReflection = data.reflection ? await encryptContent(data.reflection) : null;

      await db.runAsync(
        `INSERT OR REPLACE INTO tiny_inventories 
         (id, date, stayed_clean, attended_meeting, contacted_sponsor, contacted_fellowship, reflection, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          today,
          data.stayedClean,
          data.attendedMeeting ? 1 : 0,
          data.contactedSponsor ? 1 : 0,
          data.contactedFellowship ? 1 : 0,
          encryptedReflection,
          now,
        ],
      );

      const newInventory: TinyInventory = {
        id,
        date: today,
        ...data,
        reflection: encryptedReflection || undefined,
        createdAt: new Date(now),
      };

      set({ todayInventory: newInventory, isLoading: false });
    } catch (error) {
      console.error('Failed to submit tiny inventory:', error);
      set({ error: 'Failed to save inventory', isLoading: false });
    }
  },
}));
