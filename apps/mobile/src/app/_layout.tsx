/**
 * Expo Router Root Layout
 * 
 * Phase 1: Parallel Routes Setup
 * This file coexists with React Navigation until full migration.
 * 
 * Created: 2026-02-16
 */

import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DsProvider } from '../design-system/DsProvider';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DsProvider>
        <Slot />
        <StatusBar style="auto" />
      </DsProvider>
    </AuthProvider>
  );
}
