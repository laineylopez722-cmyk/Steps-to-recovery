/**
 * Journal Editor Route (Expo Router)
 * 
 * Placeholder for future migration from JournalStack.
 * Currently redirects to React Navigation implementation.
 * 
 * Phase 1: Parallel Routes Setup
 */

import { Redirect } from 'expo-router';

export default function JournalEntry({ params }: { params: { entryId?: string } }) {
  // For Phase 1, redirect to existing React Navigation screen
  // Dynamic route structure established for future migration
  const entryId = params.entryId || 'new';
  return <Redirect href={`/journal-editor?entryId=${entryId}`} />;
}
