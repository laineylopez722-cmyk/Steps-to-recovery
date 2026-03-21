/**
 * Journal Store
 * Manages journal entries and search/filter state
 */

import { create } from 'zustand';
import type { JournalEntry, JournalType } from '../types';
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  deleteJournalEntry,
  decryptJournalContent,
} from '../db/models';

interface JournalStore {
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  decryptedContent: string | null;
  isLoading: boolean;
  error: string | null;

  // Filter state
  filterType: JournalType | null;
  searchQuery: string;

  // Actions
  loadEntries: (type?: JournalType) => Promise<void>;
  loadEntry: (id: string) => Promise<void>;
  createEntry: (
    type: JournalType,
    content: string,
    options?: {
      moodBefore?: number;
      moodAfter?: number;
      cravingLevel?: number;
      emotionTags?: string[];
      stepNumber?: number;
      meetingId?: string;
      audioUri?: string;
      audioDuration?: number;
    },
  ) => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
  decryptEntry: (entry: JournalEntry) => Promise<string>;
  setFilterType: (type: JournalType | null) => void;
  setSearchQuery: (query: string) => void;
  searchEntries: (query: string) => JournalEntry[];
  clearCurrentEntry: () => void;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  currentEntry: null,
  decryptedContent: null,
  isLoading: false,
  error: null,
  filterType: null,
  searchQuery: '',

  loadEntries: async (type?: JournalType) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await getJournalEntries(50, 0, type);
      set({ entries, isLoading: false, filterType: type || null });
    } catch (error) {
      set({ error: 'Failed to load journal entries', isLoading: false });
    }
  },

  loadEntry: async (id: string) => {
    set({ isLoading: true, error: null, decryptedContent: null });
    try {
      const entry = await getJournalEntryById(id);
      if (entry) {
        const content = await decryptJournalContent(entry);
        set({ currentEntry: entry, decryptedContent: content, isLoading: false });
      } else {
        set({ error: 'Entry not found', isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to load entry', isLoading: false });
    }
  },

  createEntry: async (type, content, options) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await createJournalEntry(type, content, options);
      const entries = [entry, ...get().entries];
      set({ entries, isLoading: false });
      return entry;
    } catch (error) {
      set({ error: 'Failed to create entry', isLoading: false });
      throw error;
    }
  },

  deleteEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteJournalEntry(id);
      const entries = get().entries.filter((e) => e.id !== id);
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to delete entry', isLoading: false });
    }
  },

  decryptEntry: async (entry: JournalEntry) => {
    return await decryptJournalContent(entry);
  },

  setFilterType: (type: JournalType | null) => {
    set({ filterType: type });
    get().loadEntries(type || undefined);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  searchEntries: (query: string) => {
    const { entries } = get();
    if (!query.trim()) return entries;

    const lowerQuery = query.toLowerCase();

    return entries.filter((entry) => {
      // Search plaintext fields
      const matchesType = entry.type.toLowerCase().includes(lowerQuery);

      // Search emotion tags
      const matchesTags = entry.emotionTags.some((tag) => tag.toLowerCase().includes(lowerQuery));

      // Note: content is encrypted, so standard search fails on it.
      // We only search plaintext metadata for privacy/performance.
      return matchesType || matchesTags;
    });
  },

  clearCurrentEntry: () => {
    set({ currentEntry: null, decryptedContent: null });
  },
}));
