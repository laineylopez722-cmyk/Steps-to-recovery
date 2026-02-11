/**
 * useFavoriteMeetings Hook
 * Manages user's favorite meetings with encryption
 * Favorites are encrypted behavioral data (reveals user's meeting preferences)
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { addToSyncQueue } from '../../../services/syncService';
import { generateId } from '../../../utils/id';
import type { FavoriteMeeting } from '../types/meeting';

export interface UseFavoriteMeetingsReturn {
  favoriteMeetings: FavoriteMeeting[];
  isLoading: boolean;
  error: string | null;
  addFavorite: (meetingId: string, notes?: string) => Promise<void>;
  removeFavorite: (meetingId: string) => Promise<void>;
  updateNotes: (meetingId: string, notes: string) => Promise<void>;
  isFavorite: (meetingId: string) => boolean;
  getFavoriteNotes: (meetingId: string) => Promise<string | null>;
}

/**
 * Hook to manage user's favorite meetings
 * @returns Favorite meetings state and control functions
 */
export function useFavoriteMeetings(): UseFavoriteMeetingsReturn {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Fetch all favorite meetings
   */
  const {
    data: favoriteMeetings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['favorite-meetings', user?.id],
    queryFn: async () => {
      if (!db || !user) {
        return [];
      }

      const favorites = await db.getAllAsync<FavoriteMeeting>(
        'SELECT * FROM favorite_meetings WHERE user_id = ? ORDER BY created_at DESC',
        [user.id],
      );

      return favorites;
    },
    enabled: !!db && !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes - reference data, rarely changes
  });

  /**
   * Add a meeting to favorites
   */
  const addFavoriteMutation = useMutation({
    mutationFn: async ({ meetingId, notes }: { meetingId: string; notes?: string }) => {
      if (!db || !user) {
        throw new Error('Database or user not initialized');
      }

      // Check if already favorited
      const existing = await db.getFirstAsync<FavoriteMeeting>(
        'SELECT * FROM favorite_meetings WHERE user_id = ? AND meeting_id = ?',
        [user.id, meetingId],
      );

      if (existing) {
        throw new Error('Meeting already favorited');
      }

      const id = generateId('favorite');
      const now = new Date().toISOString();

      // Encrypt notes if provided
      let encryptedNotes: string | null = null;
      if (notes && notes.trim()) {
        encryptedNotes = await encryptContent(notes.trim());
      }

      // Insert into local database
      await db.runAsync(
        `INSERT INTO favorite_meetings (
          id, user_id, meeting_id, encrypted_notes,
          notification_enabled, created_at, sync_status, supabase_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, user.id, meetingId, encryptedNotes, 0, now, 'pending', null],
      );

      // Add to sync queue
      await addToSyncQueue(db, 'favorite_meetings', id, 'insert');

      logger.info('Favorite meeting added', { meetingId, hasNotes: !!notes });
    },
    onSuccess: () => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['favorite-meetings'] });
    },
  });

  /**
   * Remove a meeting from favorites
   */
  const removeFavoriteMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      if (!db || !user) {
        throw new Error('Database or user not initialized');
      }

      // Get the favorite record
      const favorite = await db.getFirstAsync<FavoriteMeeting>(
        'SELECT * FROM favorite_meetings WHERE user_id = ? AND meeting_id = ?',
        [user.id, meetingId],
      );

      if (!favorite) {
        throw new Error('Meeting not in favorites');
      }

      // Delete from local database
      await db.runAsync('DELETE FROM favorite_meetings WHERE user_id = ? AND meeting_id = ?', [
        user.id,
        meetingId,
      ]);

      // Add delete to sync queue (if it was synced to Supabase)
      if (favorite.supabase_id) {
        await db.runAsync(
          `INSERT INTO sync_queue (id, table_name, record_id, operation, supabase_id, created_at, retry_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (table_name, record_id, operation) DO UPDATE SET supabase_id = excluded.supabase_id`,
          [
            generateId('sync'),
            'favorite_meetings',
            favorite.id,
            'delete',
            favorite.supabase_id,
            new Date().toISOString(),
            0,
          ],
        );
      }

      logger.info('Favorite meeting removed', { meetingId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-meetings'] });
    },
  });

  /**
   * Update notes for a favorited meeting
   */
  const updateNotesMutation = useMutation({
    mutationFn: async ({ meetingId, notes }: { meetingId: string; notes: string }) => {
      if (!db || !user) {
        throw new Error('Database or user not initialized');
      }

      // Get the favorite record
      const favorite = await db.getFirstAsync<FavoriteMeeting>(
        'SELECT * FROM favorite_meetings WHERE user_id = ? AND meeting_id = ?',
        [user.id, meetingId],
      );

      if (!favorite) {
        throw new Error('Meeting not in favorites');
      }

      // Encrypt notes
      const encryptedNotes = notes.trim() ? await encryptContent(notes.trim()) : null;

      // Update in local database
      await db.runAsync(
        `UPDATE favorite_meetings
         SET encrypted_notes = ?, sync_status = 'pending'
         WHERE user_id = ? AND meeting_id = ?`,
        [encryptedNotes, user.id, meetingId],
      );

      // Add to sync queue
      await addToSyncQueue(db, 'favorite_meetings', favorite.id, 'update');

      logger.info('Favorite meeting notes updated', { meetingId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-meetings'] });
    },
  });

  /**
   * Check if a meeting is favorited
   */
  const isFavorite = useCallback(
    (meetingId: string): boolean => {
      return favoriteMeetings.some((fav) => fav.meeting_id === meetingId);
    },
    [favoriteMeetings],
  );

  /**
   * Get decrypted notes for a favorited meeting
   */
  const getFavoriteNotes = useCallback(
    async (meetingId: string): Promise<string | null> => {
      const favorite = favoriteMeetings.find((fav) => fav.meeting_id === meetingId);

      if (!favorite || !favorite.encrypted_notes) {
        return null;
      }

      try {
        const decrypted = await decryptContent(favorite.encrypted_notes);
        return decrypted;
      } catch (error) {
        logger.warn('Failed to decrypt favorite notes', error);
        return null;
      }
    },
    [favoriteMeetings],
  );

  return {
    favoriteMeetings,
    isLoading,
    error: error instanceof Error ? error.message : null,
    addFavorite: useCallback(
      async (meetingId: string, notes?: string) => {
        await addFavoriteMutation.mutateAsync({ meetingId, notes });
      },
      [addFavoriteMutation],
    ),
    removeFavorite: useCallback(
      async (meetingId: string) => {
        await removeFavoriteMutation.mutateAsync(meetingId);
      },
      [removeFavoriteMutation],
    ),
    updateNotes: useCallback(
      async (meetingId: string, notes: string) => {
        await updateNotesMutation.mutateAsync({ meetingId, notes });
      },
      [updateNotesMutation],
    ),
    isFavorite,
    getFavoriteNotes,
  };
}
