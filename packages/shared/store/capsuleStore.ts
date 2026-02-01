/**
 * Time Capsule Store
 * Manages time capsule entries - letters to future self
 *
 * Features:
 * - Encrypted content storage with automatic decryption
 * - Scheduled notifications for unlock dates
 * - Automatic unlock checking and state management
 * - Transaction-safe database operations
 * - Comprehensive error handling and logging
 *
 * @see TimeCapsule for application model
 * @see DbTimeCapsule for database model
 */

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../db';
import { encryptContent, decryptContent } from '../encryption';
import { scheduleTimeCapsuleNotification, cancelTimeCapsuleNotification } from '../notifications';
import type { TimeCapsule, DbTimeCapsule } from '../types';

/**
 * Validates capsule creation parameters
 * @param title - Capsule title
 * @param content - Capsule content
 * @param unlockDate - Unlock date
 * @throws Error if validation fails
 */
function validateCapsuleParams(title: string, content: string, unlockDate: Date): void {
  if (!title || title.trim().length === 0) {
    throw new Error('Capsule title cannot be empty');
  }

  if (title.length > 200) {
    throw new Error('Capsule title cannot exceed 200 characters');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('Capsule content cannot be empty');
  }

  if (content.length > 10000) {
    throw new Error('Capsule content cannot exceed 10,000 characters');
  }

  if (!(unlockDate instanceof Date) || isNaN(unlockDate.getTime())) {
    throw new Error('Invalid unlock date provided');
  }

  const now = new Date();
  if (unlockDate <= now) {
    throw new Error('Unlock date must be in the future');
  }

  // Don't allow dates too far in the future (100 years max)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 100);
  if (unlockDate > maxDate) {
    throw new Error('Unlock date cannot be more than 100 years in the future');
  }
}

interface CapsuleState {
  capsules: TimeCapsule[];
  isLoading: boolean;
  unlockedCapsule: TimeCapsule | null;
  decryptedContent: string | null;
}

interface CapsuleActions {
  loadCapsules: () => Promise<void>;
  createCapsule: (title: string, content: string, unlockDate: Date) => Promise<TimeCapsule>;
  unlockCapsule: (id: string) => Promise<string | null>;
  deleteCapsule: (id: string) => Promise<void>;
  checkForUnlockableCapsules: () => Promise<TimeCapsule[]>;
  getCapsuleById: (id: string) => Promise<TimeCapsule | null>;
  clearUnlockedCapsule: () => void;
}

export const useCapsuleStore = create<CapsuleState & CapsuleActions>((set, get) => ({
  capsules: [],
  isLoading: false,
  unlockedCapsule: null,
  decryptedContent: null,

  loadCapsules: async () => {
    set({ isLoading: true });

    try {
      console.debug('Loading time capsules from database');
      const db = await getDatabase();

      const rows = await db.getAllAsync<DbTimeCapsule>(
        'SELECT * FROM time_capsules ORDER BY unlock_date ASC',
      );

      const capsules: TimeCapsule[] = rows
        .map((row) => {
          try {
            const capsule: TimeCapsule = {
              id: row.id,
              title: row.title,
              content: row.content,
              unlockDate: new Date(row.unlock_date),
              isUnlocked: row.is_unlocked === 1,
              unlockedAt: row.unlocked_at ? new Date(row.unlocked_at) : undefined,
              createdAt: new Date(row.created_at),
            };
            return capsule;
          } catch (parseError) {
            console.warn('Failed to parse capsule row, skipping', {
              capsuleId: row.id,
              error: parseError,
            });
            return null;
          }
        })
        .filter((capsule): capsule is TimeCapsule => capsule !== null);

      console.info('Loaded time capsules', { count: capsules.length });
      set({ capsules, isLoading: false });
    } catch (error) {
      console.error('Failed to load time capsules', error);
      set({ isLoading: false });
      throw error; // Re-throw to allow caller to handle
    }
  },

  createCapsule: async (title, content, unlockDate) => {
    try {
      // Validate input parameters
      validateCapsuleParams(title, content, unlockDate);

      const id = uuid();
      const now = new Date();

      console.log('Creating time capsule', {
        capsuleId: id,
        title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
        unlockDate: unlockDate.toISOString(),
      });

      // Encrypt content before storage
      const encryptedContent = await encryptContent(content);

      const db = await getDatabase();

      // Use transaction for atomicity
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO time_capsules (id, title, content, unlock_date, is_unlocked, created_at)
           VALUES (?, ?, ?, ?, 0, ?)`,
          [id, title.trim(), encryptedContent, unlockDate.toISOString(), now.toISOString()],
        );
      });

      const capsule: TimeCapsule = {
        id,
        title: title.trim(),
        content: encryptedContent,
        unlockDate,
        isUnlocked: false,
        createdAt: now,
      };

      // Update state with sorted capsules
      set((state) => ({
        capsules: [...state.capsules, capsule].sort(
          (a, b) => a.unlockDate.getTime() - b.unlockDate.getTime(),
        ),
      }));

      // Schedule notification for unlock date
      try {
        await scheduleTimeCapsuleNotification(id, title, unlockDate);
        console.debug('Scheduled notification for capsule', { capsuleId: id });
      } catch (notificationError) {
        console.warn('Failed to schedule capsule notification', {
          capsuleId: id,
          error: notificationError,
        });
        // Don't fail the entire operation for notification issues
      }

      console.info('Time capsule created successfully', { capsuleId: id });
      return capsule;
    } catch (error) {
      console.error('Failed to create time capsule', error);
      throw error;
    }
  },

  unlockCapsule: async (id) => {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid capsule ID provided');
    }

    try {
      const db = await getDatabase();
      const now = new Date();

      // Get the capsule from state
      const { capsules } = get();
      const capsule = capsules.find((c) => c.id === id);

      if (!capsule) {
        console.warn('Capsule not found for unlocking', { capsuleId: id });
        return null;
      }

      // Check if it's time to unlock
      if (capsule.unlockDate > now) {
        console.debug('Capsule not yet unlockable', {
          capsuleId: id,
          unlockDate: capsule.unlockDate.toISOString(),
          currentTime: now.toISOString(),
        });
        return null;
      }

      if (capsule.isUnlocked) {
        console.debug('Capsule already unlocked', { capsuleId: id });
        // Return cached decrypted content if available
        const { decryptedContent } = get();
        if (decryptedContent) {
          return decryptedContent;
        }
        // Re-decrypt if not cached
        return await decryptContent(capsule.content);
      }

      console.info('Unlocking time capsule', { capsuleId: id });

      // Decrypt content first (fail fast if decryption fails)
      const decrypted = await decryptContent(capsule.content);

      // Mark as unlocked in database using transaction
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `UPDATE time_capsules SET is_unlocked = 1, unlocked_at = ? WHERE id = ?`,
          [now.toISOString(), id],
        );
      });

      // Update state
      const updatedCapsule: TimeCapsule = {
        ...capsule,
        isUnlocked: true,
        unlockedAt: now,
      };

      set((state) => ({
        capsules: state.capsules.map((c) => (c.id === id ? updatedCapsule : c)),
        unlockedCapsule: updatedCapsule,
        decryptedContent: decrypted,
      }));

      // Cancel the notification since it's now unlocked
      try {
        await cancelTimeCapsuleNotification(id);
        console.debug('Cancelled notification for unlocked capsule', { capsuleId: id });
      } catch (notificationError) {
        console.warn('Failed to cancel capsule notification', {
          capsuleId: id,
          error: notificationError,
        });
        // Don't fail the unlock operation for notification issues
      }

      console.info('Time capsule unlocked successfully', { capsuleId: id });
      return decrypted;
    } catch (error) {
      console.error('Failed to unlock time capsule', { capsuleId: id, error });
      throw error;
    }
  },

  deleteCapsule: async (id) => {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid capsule ID provided');
    }

    try {
      console.info('Deleting time capsule', { capsuleId: id });

      const db = await getDatabase();

      // Check if capsule exists before deletion
      const existing = await db.getFirstAsync<DbTimeCapsule>(
        'SELECT id FROM time_capsules WHERE id = ?',
        [id],
      );

      if (!existing) {
        console.warn('Attempted to delete non-existent capsule', { capsuleId: id });
        return; // Silently succeed for idempotency
      }

      // Delete from database
      await db.runAsync('DELETE FROM time_capsules WHERE id = ?', [id]);

      // Update state
      set((state) => ({
        capsules: state.capsules.filter((c) => c.id !== id),
        // Clear unlocked capsule if it was the deleted one
        unlockedCapsule: state.unlockedCapsule?.id === id ? null : state.unlockedCapsule,
        decryptedContent: state.unlockedCapsule?.id === id ? null : state.decryptedContent,
      }));

      // Cancel any scheduled notification
      try {
        await cancelTimeCapsuleNotification(id);
        console.debug('Cancelled notification for deleted capsule', { capsuleId: id });
      } catch (notificationError) {
        console.warn('Failed to cancel notification for deleted capsule', {
          capsuleId: id,
          error: notificationError,
        });
        // Don't fail the delete operation for notification issues
      }

      console.info('Time capsule deleted successfully', { capsuleId: id });
    } catch (error) {
      console.error('Failed to delete time capsule', { capsuleId: id, error });
      throw error;
    }
  },

  checkForUnlockableCapsules: async () => {
    try {
      const { capsules } = get();
      const now = new Date();

      const unlockableCapsules = capsules.filter((c) => !c.isUnlocked && c.unlockDate <= now);

      if (unlockableCapsules.length > 0) {
        console.info('Found unlockable capsules', {
          count: unlockableCapsules.length,
          capsuleIds: unlockableCapsules.map((c) => c.id),
        });
      }

      return unlockableCapsules;
    } catch (error) {
      console.error('Failed to check for unlockable capsules', error);
      throw error;
    }
  },

  getCapsuleById: async (id) => {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid capsule ID provided');
    }

    try {
      const { capsules } = get();
      const capsule = capsules.find((c) => c.id === id);

      if (capsule) {
        console.debug('Found capsule by ID', { capsuleId: id });
      } else {
        console.debug('Capsule not found by ID', { capsuleId: id });
      }

      return capsule || null;
    } catch (error) {
      console.error('Failed to get capsule by ID', { capsuleId: id, error });
      throw error;
    }
  },

  clearUnlockedCapsule: () => {
    set({ unlockedCapsule: null, decryptedContent: null });
  },
}));
