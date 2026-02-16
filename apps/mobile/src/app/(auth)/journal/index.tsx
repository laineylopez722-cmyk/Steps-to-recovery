/**
 * Journal List Route (Expo Router)
 * 
 * Placeholder for future migration from JournalStack.
 * Currently redirects to React Navigation implementation.
 * 
 * Phase 1: Parallel Routes Setup
 */

import { Redirect } from 'expo-router';

export default function JournalIndex() {
  // For Phase 1, redirect to existing React Navigation screen
  // This file exists to establish the route structure
  return <Redirect href="/journal-list" />;
}
