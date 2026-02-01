/**
 * Journal Hook
 * Manages journal entries with encryption
 */

import { useEffect, useCallback } from 'react';
import { useJournalStore } from '@recovery/shared';
import type { JournalType } from '@recovery/shared';

export function useJournal() {
  const {
    entries,
    currentEntry,
    decryptedContent,
    isLoading,
    error,
    filterType,
    searchQuery,
    loadEntries,
    loadEntry,
    createEntry,
    deleteEntry,
    decryptEntry,
    setFilterType,
    setSearchQuery,
    clearCurrentEntry,
    searchEntries,
  } = useJournalStore();

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Filter entries by search query (searches plaintext metadata: type and emotion tags)
  // Note: Content is encrypted, so we only search plaintext fields for privacy/performance
  const filteredEntries = searchQuery.trim() ? searchEntries(searchQuery) : entries;

  // Create a new entry
  const createNewEntry = useCallback(
    async (
      type: JournalType,
      content: string,
      options?: {
        moodBefore?: number;
        moodAfter?: number;
        cravingLevel?: number;
        emotionTags?: string[];
        stepNumber?: number;
        meetingId?: string;
      },
    ) => {
      return await createEntry(type, content, options);
    },
    [createEntry],
  );

  // Get entry type display name
  const getTypeLabel = useCallback((type: JournalType): string => {
    switch (type) {
      case 'freeform':
        return 'Freeform';
      case 'step-work':
        return 'Step Work';
      case 'meeting-reflection':
        return 'Meeting Reflection';
      case 'daily-checkin':
        return 'Daily Check-in';
      case 'voice':
        return 'Voice Journal';
      default:
        return type;
    }
  }, []);

  // Format audio duration
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    entries: filteredEntries,
    currentEntry,
    decryptedContent,
    isLoading,
    error,
    filterType,
    searchQuery,
    loadEntries,
    loadEntry,
    createEntry: createNewEntry,
    deleteEntry,
    decryptEntry,
    setFilterType,
    setSearchQuery,
    clearCurrentEntry,
    getTypeLabel,
    formatDuration,
  };
}
