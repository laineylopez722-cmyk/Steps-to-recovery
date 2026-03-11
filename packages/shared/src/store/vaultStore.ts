/**
 * Motivation Vault Store
 * Manages encrypted personal motivation content with extra biometric protection
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';
import type { VaultItem, VaultItemType, DbVaultItem } from '../types';
import { logger } from '../utils/logger';

interface VaultState {
  items: VaultItem[];
  isLoading: boolean;
  isVaultUnlocked: boolean;
  error: string | null;

  // Actions
  loadItems: () => Promise<void>;
  addItem: (
    item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'lastViewedAt'>,
  ) => Promise<VaultItem>;
  updateItem: (id: string, updates: Partial<Omit<VaultItem, 'id' | 'createdAt'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  recordView: (id: string) => Promise<void>;
  getItemById: (id: string) => Promise<VaultItem | null>;
  getRandomMotivation: () => Promise<VaultItem | null>;
  getFavorites: () => VaultItem[];
  unlockVault: () => void;
  lockVault: () => void;
}

function generateId(): string {
  return `vault_${uuidv4()}`;
}

function dbToVaultItem(row: DbVaultItem, decryptedContent: string): VaultItem {
  return {
    id: row.id,
    type: row.type as VaultItemType,
    title: row.title,
    content: decryptedContent,
    mediaUri: row.media_uri || undefined,
    isFavorite: row.is_favorite === 1,
    viewCount: row.view_count,
    lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const useVaultStore = create<VaultState>((set, get) => ({
  items: [],
  isLoading: false,
  isVaultUnlocked: false,
  error: null,

  unlockVault: () => {
    set({ isVaultUnlocked: true });
  },

  lockVault: () => {
    set({ isVaultUnlocked: false, items: [] });
  },

  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbVaultItem>(
        'SELECT * FROM motivation_vault ORDER BY is_favorite DESC, created_at DESC',
      );

      const items: VaultItem[] = [];
      for (const row of rows) {
        try {
          const decryptedContent = await decryptContent(row.content);
          items.push(dbToVaultItem(row, decryptedContent));
        } catch (error) {
          logger.error('Failed to decrypt vault item', error);
        }
      }

      set({ items, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load vault items', isLoading: false });
      logger.error('Load vault items error', error);
    }
  },

  addItem: async (item) => {
    const id = generateId();
    const now = new Date().toISOString();

    try {
      const encryptedContent = await encryptContent(item.content);
      const db = await getDatabase();

      await db.runAsync(
        `INSERT INTO motivation_vault (id, type, title, content, media_uri, is_favorite, view_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          id,
          item.type,
          item.title,
          encryptedContent,
          item.mediaUri || null,
          item.isFavorite ? 1 : 0,
          now,
          now,
        ],
      );

      const newItem: VaultItem = {
        id,
        type: item.type,
        title: item.title,
        content: item.content,
        mediaUri: item.mediaUri,
        isFavorite: item.isFavorite,
        viewCount: 0,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      set((state) => ({
        items: [newItem, ...state.items],
      }));

      return newItem;
    } catch (error) {
      logger.error('Add vault item error', error);
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    const now = new Date().toISOString();

    try {
      const db = await getDatabase();
      const currentItem = get().items.find((i) => i.id === id);
      if (!currentItem) return;

      const encryptedContent = updates.content
        ? await encryptContent(updates.content)
        : await encryptContent(currentItem.content);

      await db.runAsync(
        `UPDATE motivation_vault SET 
         type = ?, title = ?, content = ?, media_uri = ?, is_favorite = ?, updated_at = ?
         WHERE id = ?`,
        [
          updates.type || currentItem.type,
          updates.title || currentItem.title,
          encryptedContent,
          updates.mediaUri !== undefined ? updates.mediaUri : currentItem.mediaUri || null,
          (updates.isFavorite !== undefined ? updates.isFavorite : currentItem.isFavorite) ? 1 : 0,
          now,
          id,
        ],
      );

      set((state) => ({
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                updatedAt: new Date(now),
              }
            : item,
        ),
      }));
    } catch (error) {
      logger.error('Update vault item error', error);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM motivation_vault WHERE id = ?', [id]);

      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      logger.error('Delete vault item error', error);
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    await get().updateItem(id, { isFavorite: !item.isFavorite });
  },

  recordView: async (id) => {
    const now = new Date().toISOString();

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE motivation_vault SET view_count = view_count + 1, last_viewed_at = ? WHERE id = ?`,
        [now, id],
      );

      set((state) => ({
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                viewCount: item.viewCount + 1,
                lastViewedAt: new Date(now),
              }
            : item,
        ),
      }));
    } catch (error) {
      logger.error('Record view error', error);
    }
  },

  getItemById: async (id) => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<DbVaultItem>('SELECT * FROM motivation_vault WHERE id = ?', [
      id,
    ]);

    if (!row) return null;

    const decryptedContent = await decryptContent(row.content);
    return dbToVaultItem(row, decryptedContent);
  },

  getRandomMotivation: async () => {
    const items = get().items;
    if (items.length === 0) return null;

    // Prefer favorites
    const favorites = items.filter((i) => i.isFavorite);
    const pool = favorites.length > 0 ? favorites : items;

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  },

  getFavorites: () => {
    return get().items.filter((item) => item.isFavorite);
  },
}));
