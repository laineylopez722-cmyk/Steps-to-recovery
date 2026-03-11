/**
 * Tenth Step Store
 * Nightly review tracking
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';
import type { TenthStepReview, DbTenthStepReview } from '../types';
import { logger } from '../utils/logger';

interface DecryptedTenthStepReview {
  id: string;
  date: Date;
  wasResentful?: string;
  wasSelfish?: string;
  wasDishonest?: string;
  wasAfraid?: string;
  oweApology?: string;
  couldDoBetter?: string;
  gratefulFor?: string;
  createdAt: Date;
}

interface TenthStepState {
  reviews: TenthStepReview[];
  currentStreak: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadReviews: () => Promise<void>;
  loadRecentReviews: (limit?: number) => Promise<void>;
  getTodayReview: () => TenthStepReview | undefined;
  createReview: (review: {
    wasResentful?: string;
    wasSelfish?: string;
    wasDishonest?: string;
    wasAfraid?: string;
    oweApology?: string;
    couldDoBetter?: string;
    gratefulFor?: string;
  }) => Promise<TenthStepReview>;
  updateReview: (
    id: string,
    updates: Partial<{
      wasResentful?: string;
      wasSelfish?: string;
      wasDishonest?: string;
      wasAfraid?: string;
      oweApology?: string;
      couldDoBetter?: string;
      gratefulFor?: string;
    }>,
  ) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  getDecryptedReview: (id: string) => Promise<DecryptedTenthStepReview | null>;
  calculateStreak: () => Promise<number>;
  hasCompletedToday: () => boolean;
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const useTenthStepStore = create<TenthStepState>((set, get) => ({
  reviews: [],
  currentStreak: 0,
  isLoading: false,
  error: null,

  /**
   * Load all reviews
   */
  loadReviews: async () => {
    set({ isLoading: true, error: null });

    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbTenthStepReview>(
        'SELECT * FROM tenth_step_reviews ORDER BY date DESC',
      );

      const reviews: TenthStepReview[] = rows.map((row: DbTenthStepReview) => ({
        id: row.id,
        date: new Date(row.date),
        wasResentful: row.was_resentful || undefined,
        wasSelfish: row.was_selfish || undefined,
        wasDishonest: row.was_dishonest || undefined,
        wasAfraid: row.was_afraid || undefined,
        oweApology: row.owe_apology || undefined,
        couldDoBetter: row.could_do_better || undefined,
        gratefulFor: row.grateful_for || undefined,
        createdAt: new Date(row.created_at),
      }));

      const streak = await get().calculateStreak();
      set({ reviews, currentStreak: streak, isLoading: false });
    } catch (error) {
      logger.error('Failed to load 10th step reviews', error);
      set({ error: 'Failed to load reviews', isLoading: false });
    }
  },

  /**
   * Load recent reviews with limit
   */
  loadRecentReviews: async (limit = 7) => {
    set({ isLoading: true, error: null });

    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbTenthStepReview>(
        'SELECT * FROM tenth_step_reviews ORDER BY date DESC LIMIT ?',
        [limit],
      );

      const reviews: TenthStepReview[] = rows.map((row: DbTenthStepReview) => ({
        id: row.id,
        date: new Date(row.date),
        wasResentful: row.was_resentful || undefined,
        wasSelfish: row.was_selfish || undefined,
        wasDishonest: row.was_dishonest || undefined,
        wasAfraid: row.was_afraid || undefined,
        oweApology: row.owe_apology || undefined,
        couldDoBetter: row.could_do_better || undefined,
        gratefulFor: row.grateful_for || undefined,
        createdAt: new Date(row.created_at),
      }));

      const streak = await get().calculateStreak();
      set({ reviews, currentStreak: streak, isLoading: false });
    } catch (error) {
      logger.error('Failed to load recent reviews', error);
      set({ error: 'Failed to load reviews', isLoading: false });
    }
  },

  /**
   * Get today's review if exists
   */
  getTodayReview: () => {
    const today = getDateString(new Date());
    return get().reviews.find((r) => getDateString(r.date) === today);
  },

  /**
   * Create a new review
   */
  createReview: async (review) => {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date();
    const dateStr = getDateString(now);

    // Check if review for today already exists
    const existing = await db.getFirstAsync<DbTenthStepReview>(
      'SELECT * FROM tenth_step_reviews WHERE date = ?',
      [dateStr],
    );

    if (existing) {
      // Update instead of create
      await get().updateReview(existing.id, review);
      return get().reviews.find((r) => r.id === existing.id)!;
    }

    // Encrypt all fields
    const encryptedData = {
      was_resentful: review.wasResentful ? await encryptContent(review.wasResentful) : null,
      was_selfish: review.wasSelfish ? await encryptContent(review.wasSelfish) : null,
      was_dishonest: review.wasDishonest ? await encryptContent(review.wasDishonest) : null,
      was_afraid: review.wasAfraid ? await encryptContent(review.wasAfraid) : null,
      owe_apology: review.oweApology ? await encryptContent(review.oweApology) : null,
      could_do_better: review.couldDoBetter ? await encryptContent(review.couldDoBetter) : null,
      grateful_for: review.gratefulFor ? await encryptContent(review.gratefulFor) : null,
    };

    await db.runAsync(
      `INSERT INTO tenth_step_reviews (
        id, date, was_resentful, was_selfish, was_dishonest, was_afraid,
        owe_apology, could_do_better, grateful_for, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dateStr,
        encryptedData.was_resentful,
        encryptedData.was_selfish,
        encryptedData.was_dishonest,
        encryptedData.was_afraid,
        encryptedData.owe_apology,
        encryptedData.could_do_better,
        encryptedData.grateful_for,
        now.toISOString(),
      ],
    );

    const newReview: TenthStepReview = {
      id,
      date: new Date(dateStr),
      wasResentful: encryptedData.was_resentful || undefined,
      wasSelfish: encryptedData.was_selfish || undefined,
      wasDishonest: encryptedData.was_dishonest || undefined,
      wasAfraid: encryptedData.was_afraid || undefined,
      oweApology: encryptedData.owe_apology || undefined,
      couldDoBetter: encryptedData.could_do_better || undefined,
      gratefulFor: encryptedData.grateful_for || undefined,
      createdAt: now,
    };

    const streak = await get().calculateStreak();
    set((state) => ({
      reviews: [newReview, ...state.reviews],
      currentStreak: streak,
    }));

    return newReview;
  },

  /**
   * Update an existing review
   */
  updateReview: async (id: string, updates) => {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.wasResentful !== undefined) {
      updateFields.push('was_resentful = ?');
      values.push(updates.wasResentful ? await encryptContent(updates.wasResentful) : null);
    }
    if (updates.wasSelfish !== undefined) {
      updateFields.push('was_selfish = ?');
      values.push(updates.wasSelfish ? await encryptContent(updates.wasSelfish) : null);
    }
    if (updates.wasDishonest !== undefined) {
      updateFields.push('was_dishonest = ?');
      values.push(updates.wasDishonest ? await encryptContent(updates.wasDishonest) : null);
    }
    if (updates.wasAfraid !== undefined) {
      updateFields.push('was_afraid = ?');
      values.push(updates.wasAfraid ? await encryptContent(updates.wasAfraid) : null);
    }
    if (updates.oweApology !== undefined) {
      updateFields.push('owe_apology = ?');
      values.push(updates.oweApology ? await encryptContent(updates.oweApology) : null);
    }
    if (updates.couldDoBetter !== undefined) {
      updateFields.push('could_do_better = ?');
      values.push(updates.couldDoBetter ? await encryptContent(updates.couldDoBetter) : null);
    }
    if (updates.gratefulFor !== undefined) {
      updateFields.push('grateful_for = ?');
      values.push(updates.gratefulFor ? await encryptContent(updates.gratefulFor) : null);
    }

    if (updateFields.length === 0) return;

    values.push(id);
    await db.runAsync(
      `UPDATE tenth_step_reviews SET ${updateFields.join(', ')} WHERE id = ?`,
      values,
    );

    // Reload reviews
    await get().loadReviews();
  },

  /**
   * Delete a review
   */
  deleteReview: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM tenth_step_reviews WHERE id = ?', [id]);

    const streak = await get().calculateStreak();
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== id),
      currentStreak: streak,
    }));
  },

  /**
   * Get decrypted review for display
   */
  getDecryptedReview: async (id: string) => {
    const review = get().reviews.find((r) => r.id === id);
    if (!review) return null;

    try {
      return {
        id: review.id,
        date: review.date,
        wasResentful: review.wasResentful ? await decryptContent(review.wasResentful) : undefined,
        wasSelfish: review.wasSelfish ? await decryptContent(review.wasSelfish) : undefined,
        wasDishonest: review.wasDishonest ? await decryptContent(review.wasDishonest) : undefined,
        wasAfraid: review.wasAfraid ? await decryptContent(review.wasAfraid) : undefined,
        oweApology: review.oweApology ? await decryptContent(review.oweApology) : undefined,
        couldDoBetter: review.couldDoBetter
          ? await decryptContent(review.couldDoBetter)
          : undefined,
        gratefulFor: review.gratefulFor ? await decryptContent(review.gratefulFor) : undefined,
        createdAt: review.createdAt,
      };
    } catch (error) {
      logger.error('Failed to decrypt review', error);
      return null;
    }
  },

  /**
   * Calculate current streak of consecutive days
   */
  calculateStreak: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ date: string }>(
      'SELECT DISTINCT date FROM tenth_step_reviews ORDER BY date DESC',
    );

    if (rows.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < rows.length; i++) {
      const reviewDate = new Date(rows[i].date);
      reviewDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (reviewDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0) {
        // If first review isn't today, check if it's yesterday
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (reviewDate.getTime() === yesterday.getTime()) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  },

  /**
   * Check if review completed today
   */
  hasCompletedToday: () => {
    return get().getTodayReview() !== undefined;
  },
}));
