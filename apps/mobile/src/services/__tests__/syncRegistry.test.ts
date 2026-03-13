/**
 * syncRegistry tests
 *
 * Validates the canonical table registry for consistency:
 * - VALID_SYNC_TABLES = SYNCABLE_TABLES ∪ PUSH_ONLY_TABLES
 * - PULL_SYNC_TABLES = SYNCABLE_TABLES (bidirectional tables only)
 * - CLEANUP_TABLES contains every user-data table exactly once
 * - FK ordering: sponsor_messages before sponsor_connections, etc.
 * - Type guards behave correctly
 */

import {
  SYNCABLE_TABLES,
  PUSH_ONLY_TABLES,
  VALID_SYNC_TABLES,
  PULL_SYNC_TABLES,
  CLEANUP_TABLES,
  isValidSyncTable,
  isPullSyncTable,
} from '../syncRegistry';

describe('syncRegistry', () => {
  // ─── Set membership helpers ──────────────────────────────────────────────

  const syncableSet = new Set<string>(SYNCABLE_TABLES);
  const pushOnlySet = new Set<string>(PUSH_ONLY_TABLES);
  const validSet = new Set<string>(VALID_SYNC_TABLES);
  const pullSet = new Set<string>(PULL_SYNC_TABLES);
  const cleanupSet = new Set<string>(CLEANUP_TABLES);

  // ─── VALID_SYNC_TABLES is the union ────────────────────────────────────

  describe('VALID_SYNC_TABLES', () => {
    it('contains every SYNCABLE_TABLE', () => {
      for (const t of SYNCABLE_TABLES) {
        expect(validSet).toContain(t);
      }
    });

    it('contains every PUSH_ONLY_TABLE', () => {
      for (const t of PUSH_ONLY_TABLES) {
        expect(validSet).toContain(t);
      }
    });

    it('has no entries that are neither SYNCABLE nor PUSH_ONLY', () => {
      for (const t of VALID_SYNC_TABLES) {
        const inSyncable = syncableSet.has(t);
        const inPushOnly = pushOnlySet.has(t);
        expect(inSyncable || inPushOnly).toBe(true);
      }
    });

    it('has no duplicate entries', () => {
      expect(VALID_SYNC_TABLES.length).toBe(validSet.size);
    });
  });

  // ─── PULL_SYNC_TABLES = SYNCABLE_TABLES ────────────────────────────────

  describe('PULL_SYNC_TABLES', () => {
    it('equals SYNCABLE_TABLES exactly', () => {
      expect(PULL_SYNC_TABLES).toStrictEqual(SYNCABLE_TABLES);
    });

    it('does not contain PUSH_ONLY tables', () => {
      for (const t of PUSH_ONLY_TABLES) {
        expect(pullSet).not.toContain(t);
      }
    });

    it('has no duplicate entries', () => {
      expect(PULL_SYNC_TABLES.length).toBe(pullSet.size);
    });
  });

  // ─── CLEANUP_TABLES completeness ───────────────────────────────────────

  describe('CLEANUP_TABLES', () => {
    // All known user-data tables (must stay in sync with migrations in database.ts)
    const ALL_USER_TABLES: string[] = [
      'user_profile',
      'journal_entries',
      'daily_checkins',
      'step_work',
      'achievements',
      'sync_queue',
      'daily_readings',
      'reading_reflections',
      'cached_meetings',
      'favorite_meetings',
      'meeting_search_cache',
      'sponsor_connections',
      'sponsor_shared_entries',
      'weekly_reports',
      'personal_inventory',
      'gratitude_entries',
      'craving_surf_sessions',
      'safety_plans',
      'sponsor_messages',
      'sync_metadata',
      'ai_memories',
      'active_challenges',
      'weather_snapshots',
    ];

    it('contains every user-data table', () => {
      for (const table of ALL_USER_TABLES) {
        expect(cleanupSet).toContain(table);
      }
    });

    it('does NOT contain schema_migrations (device-level, must survive logout)', () => {
      expect(cleanupSet).not.toContain('schema_migrations');
    });

    it('has no duplicate entries', () => {
      expect(CLEANUP_TABLES.length).toBe(cleanupSet.size);
    });

    // ─── FK ordering checks ─────────────────────────────────────────────

    function indexOf(table: string): number {
      return (CLEANUP_TABLES as readonly string[]).indexOf(table);
    }

    it('deletes sponsor_messages before sponsor_connections', () => {
      expect(indexOf('sponsor_messages')).toBeLessThan(indexOf('sponsor_connections'));
    });

    it('deletes sponsor_shared_entries before sponsor_connections', () => {
      expect(indexOf('sponsor_shared_entries')).toBeLessThan(indexOf('sponsor_connections'));
    });

    it('deletes favorite_meetings before cached_meetings', () => {
      expect(indexOf('favorite_meetings')).toBeLessThan(indexOf('cached_meetings'));
    });

    it('deletes reading_reflections before daily_readings', () => {
      expect(indexOf('reading_reflections')).toBeLessThan(indexOf('daily_readings'));
    });

    it('deletes user_profile last', () => {
      const lastIndex = CLEANUP_TABLES.length - 1;
      expect(CLEANUP_TABLES[lastIndex]).toBe('user_profile');
    });

    it('deletes all user-data tables before user_profile', () => {
      const userProfileIdx = indexOf('user_profile');
      const tablesBeforeRoot = ALL_USER_TABLES.filter((t) => t !== 'user_profile');
      for (const table of tablesBeforeRoot) {
        expect(indexOf(table)).toBeLessThan(userProfileIdx);
      }
    });
  });

  // ─── Type guards ───────────────────────────────────────────────────────

  describe('isValidSyncTable', () => {
    it('returns true for every VALID_SYNC_TABLE entry', () => {
      for (const t of VALID_SYNC_TABLES) {
        expect(isValidSyncTable(t)).toBe(true);
      }
    });

    it('returns false for unknown tables', () => {
      expect(isValidSyncTable('unknown_table')).toBe(false);
      expect(isValidSyncTable('')).toBe(false);
      expect(isValidSyncTable('personal_inventory')).toBe(false); // excluded from sync
      expect(isValidSyncTable('gratitude_entries')).toBe(false);
      expect(isValidSyncTable('craving_surf_sessions')).toBe(false);
    });

    it('returns false for SQL injection attempts', () => {
      expect(isValidSyncTable("journal_entries; DROP TABLE user_profile;--")).toBe(false);
      expect(isValidSyncTable("' OR '1'='1")).toBe(false);
    });
  });

  describe('isPullSyncTable', () => {
    it('returns true for every PULL_SYNC_TABLE entry', () => {
      for (const t of PULL_SYNC_TABLES) {
        expect(isPullSyncTable(t)).toBe(true);
      }
    });

    it('returns false for push-only tables', () => {
      for (const t of PUSH_ONLY_TABLES) {
        expect(isPullSyncTable(t)).toBe(false);
      }
    });

    it('returns false for excluded tables', () => {
      expect(isPullSyncTable('personal_inventory')).toBe(false);
      expect(isPullSyncTable('craving_surf_sessions')).toBe(false);
    });
  });
});
