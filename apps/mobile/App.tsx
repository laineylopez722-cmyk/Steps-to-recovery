// CRITICAL: Import polyfills FIRST before any other code
import './polyfills';

// Initialize Sentry early for crash reporting
import { initSentry, wrapWithSentry as sentryWrap } from './src/lib/sentry';
initSentry();

import React, { Suspense, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from './src/providers/QueryProvider';
import { ThemeProvider } from './src/design-system';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { SyncProvider } from './src/contexts/SyncContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { PortalHost } from '@rn-primitives/portal';

/**
 * Loading fallback shown during Suspense boundaries
 * Uses dark theme colors to match app aesthetic
 */
function LoadingFallback(): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a', // navy-900
      }}
      accessible
      accessibilityLabel="Loading application"
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color="#8b5cf6" />
      <Text
        style={{
          marginTop: 16,
          color: '#94a3b8', // slate-400
          fontSize: 14,
        }}
      >
        Loading...
      </Text>
    </View>
  );
}

/**
 * Root App Component
 *
 * Provider order is CRITICAL for proper initialization:
 * 1. ErrorBoundary - Catches all errors
 * 2. QueryProvider - React Query with offline persistence
 * 3. SafeAreaProvider - Safe area insets
 * 4. GestureHandlerRootView - Required for gestures/animations
 * 5. ThemeProvider - Design system theming
 * 6. DatabaseProvider - Local SQLite/IndexedDB
 * 7. AuthProvider - Supabase authentication
 * 8. SyncProvider - Background cloud sync (legacy, being phased out)
 * 9. NotificationProvider - Push notifications
 */
function App(): React.ReactElement {
  // Key used to force a full remount of the app tree on error recovery
  const [resetKey, setResetKey] = useState(0);

  // Callback to trigger a full app remount (used by ErrorBoundary)
  const handleReset = useCallback(() => {
    setResetKey((k: number) => k + 1);
  }, []);

  return (
    <ErrorBoundary key={resetKey} onReset={handleReset}>
      <QueryProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
              <DatabaseProvider>
                <AuthProvider>
                  <SyncProvider>
                    <NotificationProvider>
                      <Suspense fallback={<LoadingFallback />}>
                        <RootNavigator />
                      </Suspense>
                      <StatusBar
                        style="light"
                        backgroundColor="#0f172a"
                        translucent={Platform.OS === 'android'}
                      />
                      <PortalHost />
                    </NotificationProvider>
                  </SyncProvider>
                </AuthProvider>
              </DatabaseProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

// Wrap with Sentry for automatic error tracking
export default sentryWrap(App);
