/**
 * Literature Store
 * Manages literature progress tracking and promises experience
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';
import type { LiteratureProgress, DbLiteratureProgress } from '../types';
import { logger } from '../utils/logger';

// Book definitions
export interface Book {
  id: string;
  title: string;
  shortTitle: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
}

// NA Basic Text structure
export const NA_BASIC_TEXT: Book = {
  id: 'na-basic-text',
  title: 'Narcotics Anonymous Basic Text',
  shortTitle: 'Basic Text',
  chapters: [
    { id: 'na-bt-1', number: 1, title: 'Who Is an Addict?' },
    { id: 'na-bt-2', number: 2, title: 'What Is the NA Program?' },
    { id: 'na-bt-3', number: 3, title: 'Why Are We Here?' },
    { id: 'na-bt-4', number: 4, title: 'How It Works' },
    { id: 'na-bt-5', number: 5, title: 'What Can I Do?' },
    { id: 'na-bt-6', number: 6, title: 'The Twelve Traditions' },
    { id: 'na-bt-7', number: 7, title: 'Recovery and Relapse' },
    { id: 'na-bt-8', number: 8, title: 'We Do Recover' },
    { id: 'na-bt-9', number: 9, title: 'Just for Today' },
    { id: 'na-bt-10', number: 10, title: 'More Will Be Revealed' },
  ],
};

// AA Big Book structure
export const AA_BIG_BOOK: Book = {
  id: 'aa-big-book',
  title: 'Alcoholics Anonymous (Big Book)',
  shortTitle: 'Big Book',
  chapters: [
    { id: 'aa-bb-1', number: 1, title: "Bill's Story" },
    { id: 'aa-bb-2', number: 2, title: 'There Is a Solution' },
    { id: 'aa-bb-3', number: 3, title: 'More About Alcoholism' },
    { id: 'aa-bb-4', number: 4, title: 'We Agnostics' },
    { id: 'aa-bb-5', number: 5, title: 'How It Works' },
    { id: 'aa-bb-6', number: 6, title: 'Into Action' },
    { id: 'aa-bb-7', number: 7, title: 'Working With Others' },
    { id: 'aa-bb-8', number: 8, title: 'To Wives' },
    { id: 'aa-bb-9', number: 9, title: 'The Family Afterward' },
    { id: 'aa-bb-10', number: 10, title: 'To Employers' },
    { id: 'aa-bb-11', number: 11, title: 'A Vision for You' },
  ],
};

export const AVAILABLE_BOOKS: Book[] = [NA_BASIC_TEXT, AA_BIG_BOOK];

// Promise experience tracking
export interface PromiseExperience {
  promiseId: string;
  experienced: boolean;
  reflection?: string;
  experiencedAt?: Date;
}

export interface DbPromiseExperience {
  promise_id: string;
  experienced: number;
  reflection: string | null;
  experienced_at: string | null;
}

interface LiteratureState {
  // Book progress
  progress: LiteratureProgress[];
  currentBook: Book | null;

  // Promises
  promiseExperiences: PromiseExperience[];

  // UI state
  isLoading: boolean;
  error: string | null;
}

interface LiteratureActions {
  // Book progress
  loadProgress: (bookId: string) => Promise<void>;
  toggleChapterComplete: (bookId: string, chapterId: string) => Promise<void>;
  saveChapterNotes: (bookId: string, chapterId: string, notes: string) => Promise<void>;
  getChapterNotes: (bookId: string, chapterId: string) => Promise<string | null>;
  getBookProgress: (bookId: string) => number;
  setCurrentBook: (book: Book) => void;

  // Promises
  loadPromiseExperiences: () => Promise<void>;
  togglePromiseExperienced: (promiseId: string) => Promise<void>;
  savePromiseReflection: (promiseId: string, reflection: string) => Promise<void>;
  getPromiseReflection: (promiseId: string) => Promise<string | null>;
  getExperiencedPromisesCount: () => number;
}

export const useLiteratureStore = create<LiteratureState & LiteratureActions>((set, get) => ({
  progress: [],
  currentBook: NA_BASIC_TEXT,
  promiseExperiences: [],
  isLoading: false,
  error: null,

  loadProgress: async (bookId: string) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbLiteratureProgress>(
        'SELECT * FROM literature_progress WHERE book_id = ?',
        [bookId],
      );

      const progress: LiteratureProgress[] = rows.map((row: DbLiteratureProgress) => ({
        id: row.id,
        bookId: row.book_id,
        chapterId: row.chapter_id,
        isCompleted: row.is_completed === 1,
        notes: row.notes || undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        createdAt: new Date(row.created_at),
      }));

      set({ progress, isLoading: false });
    } catch (error) {
      logger.error('Failed to load literature progress', error);
      set({ error: 'Failed to load progress', isLoading: false });
    }
  },

  toggleChapterComplete: async (bookId: string, chapterId: string) => {
    try {
      const db = await getDatabase();
      const { progress } = get();

      const existing = progress.find((p) => p.bookId === bookId && p.chapterId === chapterId);

      if (existing) {
        // Toggle existing
        const newCompleted = !existing.isCompleted;
        const now = newCompleted ? new Date().toISOString() : null;

        await db.runAsync(
          'UPDATE literature_progress SET is_completed = ?, completed_at = ? WHERE id = ?',
          [newCompleted ? 1 : 0, now, existing.id],
        );

        set({
          progress: progress.map((p) =>
            p.id === existing.id
              ? { ...p, isCompleted: newCompleted, completedAt: now ? new Date(now) : undefined }
              : p,
          ),
        });
      } else {
        // Create new
        const id = uuidv4();
        const now = new Date();

        await db.runAsync(
          `INSERT INTO literature_progress (id, book_id, chapter_id, is_completed, notes, completed_at, created_at)
           VALUES (?, ?, ?, 1, NULL, ?, ?)`,
          [id, bookId, chapterId, now.toISOString(), now.toISOString()],
        );

        const newProgress: LiteratureProgress = {
          id,
          bookId,
          chapterId,
          isCompleted: true,
          completedAt: now,
          createdAt: now,
        };

        set({ progress: [...progress, newProgress] });
      }
    } catch (error) {
      logger.error('Failed to toggle chapter complete', error);
    }
  },

  saveChapterNotes: async (bookId: string, chapterId: string, notes: string) => {
    try {
      const db = await getDatabase();
      const { progress } = get();
      const encryptedNotes = await encryptContent(notes);

      const existing = progress.find((p) => p.bookId === bookId && p.chapterId === chapterId);

      if (existing) {
        await db.runAsync('UPDATE literature_progress SET notes = ? WHERE id = ?', [
          encryptedNotes,
          existing.id,
        ]);

        set({
          progress: progress.map((p) =>
            p.id === existing.id ? { ...p, notes: encryptedNotes } : p,
          ),
        });
      } else {
        const id = uuidv4();
        const now = new Date();

        await db.runAsync(
          `INSERT INTO literature_progress (id, book_id, chapter_id, is_completed, notes, completed_at, created_at)
           VALUES (?, ?, ?, 0, ?, NULL, ?)`,
          [id, bookId, chapterId, encryptedNotes, now.toISOString()],
        );

        const newProgress: LiteratureProgress = {
          id,
          bookId,
          chapterId,
          isCompleted: false,
          notes: encryptedNotes,
          createdAt: now,
        };

        set({ progress: [...progress, newProgress] });
      }
    } catch (error) {
      logger.error('Failed to save chapter notes', error);
    }
  },

  getChapterNotes: async (bookId: string, chapterId: string) => {
    const { progress } = get();
    const entry = progress.find((p) => p.bookId === bookId && p.chapterId === chapterId);

    if (!entry?.notes) return null;

    try {
      return await decryptContent(entry.notes);
    } catch (error) {
      logger.error('Failed to decrypt chapter notes', error);
      return null;
    }
  },

  getBookProgress: (bookId: string) => {
    const { progress } = get();
    const book = AVAILABLE_BOOKS.find((b) => b.id === bookId);
    if (!book) return 0;

    const completedCount = progress.filter((p) => p.bookId === bookId && p.isCompleted).length;

    return Math.round((completedCount / book.chapters.length) * 100);
  },

  setCurrentBook: (book: Book) => {
    set({ currentBook: book });
  },

  // Promises
  loadPromiseExperiences: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbPromiseExperience>('SELECT * FROM promise_experiences');

      const promiseExperiences: PromiseExperience[] = rows.map((row: DbPromiseExperience) => ({
        promiseId: row.promise_id,
        experienced: row.experienced === 1,
        reflection: row.reflection || undefined,
        experiencedAt: row.experienced_at ? new Date(row.experienced_at) : undefined,
      }));

      set({ promiseExperiences, isLoading: false });
    } catch (error) {
      logger.error('Failed to load promise experiences', error);
      set({ error: 'Failed to load promises', isLoading: false });
    }
  },

  togglePromiseExperienced: async (promiseId: string) => {
    try {
      const db = await getDatabase();
      const { promiseExperiences } = get();

      const existing = promiseExperiences.find((p) => p.promiseId === promiseId);

      if (existing) {
        const newExperienced = !existing.experienced;
        const now = newExperienced ? new Date().toISOString() : null;

        await db.runAsync(
          'UPDATE promise_experiences SET experienced = ?, experienced_at = ? WHERE promise_id = ?',
          [newExperienced ? 1 : 0, now, promiseId],
        );

        set({
          promiseExperiences: promiseExperiences.map((p) =>
            p.promiseId === promiseId
              ? {
                  ...p,
                  experienced: newExperienced,
                  experiencedAt: now ? new Date(now) : undefined,
                }
              : p,
          ),
        });
      } else {
        const now = new Date();

        await db.runAsync(
          `INSERT INTO promise_experiences (promise_id, experienced, reflection, experienced_at)
           VALUES (?, 1, NULL, ?)`,
          [promiseId, now.toISOString()],
        );

        set({
          promiseExperiences: [
            ...promiseExperiences,
            {
              promiseId,
              experienced: true,
              experiencedAt: now,
            },
          ],
        });
      }
    } catch (error) {
      logger.error('Failed to toggle promise experienced', error);
    }
  },

  savePromiseReflection: async (promiseId: string, reflection: string) => {
    try {
      const db = await getDatabase();
      const { promiseExperiences } = get();
      const encryptedReflection = await encryptContent(reflection);

      const existing = promiseExperiences.find((p) => p.promiseId === promiseId);

      if (existing) {
        await db.runAsync('UPDATE promise_experiences SET reflection = ? WHERE promise_id = ?', [
          encryptedReflection,
          promiseId,
        ]);

        set({
          promiseExperiences: promiseExperiences.map((p) =>
            p.promiseId === promiseId ? { ...p, reflection: encryptedReflection } : p,
          ),
        });
      } else {
        await db.runAsync(
          `INSERT INTO promise_experiences (promise_id, experienced, reflection, experienced_at)
           VALUES (?, 0, ?, NULL)`,
          [promiseId, encryptedReflection],
        );

        set({
          promiseExperiences: [
            ...promiseExperiences,
            {
              promiseId,
              experienced: false,
              reflection: encryptedReflection,
            },
          ],
        });
      }
    } catch (error) {
      logger.error('Failed to save promise reflection', error);
    }
  },

  getPromiseReflection: async (promiseId: string) => {
    const { promiseExperiences } = get();
    const entry = promiseExperiences.find((p) => p.promiseId === promiseId);

    if (!entry?.reflection) return null;

    try {
      return await decryptContent(entry.reflection);
    } catch (error) {
      logger.error('Failed to decrypt promise reflection', error);
      return null;
    }
  },

  getExperiencedPromisesCount: () => {
    const { promiseExperiences } = get();
    return promiseExperiences.filter((p) => p.experienced).length;
  },
}));
