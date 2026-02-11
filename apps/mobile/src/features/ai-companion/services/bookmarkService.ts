/**
 * Bookmark Service
 * Save and manage important AI messages.
 */

import { logger } from '../../../utils/logger';
import { secureStorage } from '../../../adapters/secureStorage';

const BOOKMARKS_KEY = 'ai_bookmarked_messages';

export interface Bookmark {
  id: string;
  messageId: string;
  conversationId: string;
  content: string;
  category: 'insight' | 'coping' | 'encouragement' | 'exercise' | 'other';
  createdAt: string;
  note?: string;
}

class BookmarkService {
  private bookmarks: Bookmark[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await secureStorage.getItemAsync(BOOKMARKS_KEY);
      this.bookmarks = raw ? JSON.parse(raw) : [];
      this.loaded = true;
    } catch {
      this.bookmarks = [];
      this.loaded = true;
    }
  }

  private async save(): Promise<void> {
    await secureStorage.setItemAsync(BOOKMARKS_KEY, JSON.stringify(this.bookmarks));
  }

  async add(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    await this.load();
    const entry: Bookmark = {
      ...bookmark,
      id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.bookmarks.unshift(entry);
    await this.save();
    logger.debug('Bookmark added', { messageId: entry.messageId });
    return entry;
  }

  async remove(id: string): Promise<void> {
    await this.load();
    this.bookmarks = this.bookmarks.filter((b) => b.id !== id);
    await this.save();
  }

  async getAll(): Promise<Bookmark[]> {
    await this.load();
    return [...this.bookmarks];
  }

  async getByCategory(category: Bookmark['category']): Promise<Bookmark[]> {
    await this.load();
    return this.bookmarks.filter((b) => b.category === category);
  }

  isBookmarked(messageId: string): boolean {
    return this.bookmarks.some((b) => b.messageId === messageId);
  }
}

let instance: BookmarkService | null = null;

export function getBookmarkService(): BookmarkService {
  if (!instance) {
    instance = new BookmarkService();
  }
  return instance;
}
