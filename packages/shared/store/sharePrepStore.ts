/**
 * Share Prep Store
 * Temporary storage for meeting share preparation notes
 * Notes persist until user logs a meeting or clears them
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Custom storage adapter using expo-secure-store
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface SharePrepNotes {
  topic: string;
  gratitude: string;
  struggle: string;
  experience: string;
  other: string;
  lastUpdated: Date | null;
}

interface SharePrepState {
  notes: SharePrepNotes;
  isLoading: boolean;
}

interface SharePrepActions {
  updateNote: (field: keyof Omit<SharePrepNotes, 'lastUpdated'>, value: string) => void;
  clearNotes: () => void;
  hasContent: () => boolean;
  getPreviewText: () => string;
}

const initialNotes: SharePrepNotes = {
  topic: '',
  gratitude: '',
  struggle: '',
  experience: '',
  other: '',
  lastUpdated: null,
};

export const useSharePrepStore = create<SharePrepState & SharePrepActions>()(
  persist(
    (set, get) => ({
      notes: initialNotes,
      isLoading: false,

      updateNote: (field, value) => {
        set((state) => ({
          notes: {
            ...state.notes,
            [field]: value,
            lastUpdated: new Date(),
          },
        }));
      },

      clearNotes: () => {
        set({ notes: initialNotes });
      },

      hasContent: () => {
        const { notes } = get();
        return !!(
          notes.topic.trim() ||
          notes.gratitude.trim() ||
          notes.struggle.trim() ||
          notes.experience.trim() ||
          notes.other.trim()
        );
      },

      getPreviewText: () => {
        const { notes } = get();
        const parts: string[] = [];

        if (notes.topic.trim()) parts.push(notes.topic.trim());
        if (notes.gratitude.trim()) parts.push(notes.gratitude.trim());
        if (notes.struggle.trim()) parts.push(notes.struggle.trim());
        if (notes.experience.trim()) parts.push(notes.experience.trim());
        if (notes.other.trim()) parts.push(notes.other.trim());

        return parts.join('\n\n');
      },
    }),
    {
      name: 'share-prep-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ notes: state.notes }),
    },
  ),
);
