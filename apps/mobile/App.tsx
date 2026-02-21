// CRITICAL: Import polyfills FIRST before any other code
import './polyfills';

// Reactotron - Development debugging (dev only)
if (__DEV__) {
  require('./src/lib/reactotron');
}

// Uniwind - Import global CSS with design system tokens
import './src/global.css';

// Set Inter as default font for ALL Text components app-wide.
// This catches the ~470 inline fontWeight usages that don't go through
// the design system typography tokens. Without this, those render as
// system font (Roboto on Android) instead of Inter.
import { Text as RNText } from "react-native";
import { fonts } from './src/lib/fonts';

const _defaultStyle = (RNText as any).defaultProps?.style;
(RNText as any).defaultProps = {
  ...(RNText as any).defaultProps,
  style: [{ fontFamily: fonts.regular }, _defaultStyle],
};

// Keep native splash screen visible until app is fully initialized
// (DB migrations + auth check complete). Prevents flash of loading spinner.
import * as SplashScreen from "expo-splash-screen";
SplashScreen.preventAutoHideAsync().catch(() => {});

// Initialize Sentry early for crash reporting
import { initSentry, wrapWithSentry as sentryWrap } from './src/lib/sentry';
initSentry();

import { initGlobalErrorHandlers } from './src/utils/globalErrorHandler';
initGlobalErrorHandlers();

import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from './src/providers/QueryProvider';
import { ThemeProvider } from './src/design-system';
import { DsProvider } from './src/design-system/DsProvider';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { SyncProvider } from './src/contexts/SyncContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { BiometricLockScreen } from './src/components/BiometricLockScreen';
import { useBiometricLock } from './src/hooks/useBiometricLock';
import { useQuickEscape, QuickEscapeTapZone } from './src/hooks/useQuickEscape';
import { navigationRef } from './src/navigation/navigationRef';
import { PortalHost } from '@rn-primitives/portal';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from './src/lib/fonts';

/**
 * Biometric Lock Overlay
 * Shows lock screen when app is locked. Must be inside DsProvider for theming.
 */
function BiometricLockOverlay({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isLocked, authenticate, validatePin, emergencyUnlock, biometricType, hasPinSet } =
    useBiometricLock();
  const {
    isEnabled: quickEscapeEnabled,
    isEscapeTriggered,
    registerTap,
    resetEscape,
  } = useQuickEscape();

  const handleEmergencyAccess = useCallback(() => {
    emergencyUnlock();
    resetEscape();
    if (navigationRef.isReady()) {
      navigationRef.navigate('MainApp', {
        screen: 'Home',
        params: { screen: 'Emergency' },
      });
    }
  }, [emergencyUnlock, resetEscape]);

  const handleAuthenticate = useCallback(async (): Promise<boolean> => {
    const success = await authenticate();
    if (success) {
      resetEscape();
    }
    return success;
  }, [authenticate, resetEscape]);

  const handlePinValidate = useCallback(
    async (pin: string): Promise<boolean> => {
      const success = await validatePin(pin);
      if (success) {
        resetEscape();
      }
      return success;
    },
    [validatePin, resetEscape],
  );

  const shouldShowLock = isLocked || isEscapeTriggered;

  return (
    <>
      <QuickEscapeTapZone onTripleTap={registerTap} enabled={quickEscapeEnabled}>
        {children}
      </QuickEscapeTapZone>
      {shouldShowLock ? (
        <BiometricLockScreen
          onAuthenticate={handleAuthenticate}
          onPinValidate={handlePinValidate}
          onEmergencyAccess={handleEmergencyAccess}
          biometricType={biometricType}
          hasPinSet={hasPinSet}
        />
      ) : null}
    </>
  );
}

/**
 * Loading fallback shown during Suspense boundaries
 * Uses design system colors
 */
function LoadingFallback(): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000', // bg-primary
      }}
      accessible
      accessibilityLabel="Loading application"
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color="#E8A855" />
      <Text
        style={{
          marginTop: 16,
          color: 'rgba(255, 255, 255, 0.48)', // text-tertiary
          fontSize: 14,
        }}
      >
        Loading...
      </Text>
    </View>
  );
}

/**
 * Uniwind Safe Area Bridge
 * Forwards safe area insets to Uniwind for p-safe/m-safe utilities
 */
function UniwindSafeAreaBridge({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <SafeAreaInsetsContext.Consumer>
      {(insets) => {
        if (insets) {
          Uniwind.updateInsets(insets);
        }
        return <>{children}</>;
      }}
    </SafeAreaInsetsContext.Consumer>
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

  // Load Inter font family — splash screen stays visible until fonts are ready
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Callback to trigger a full app remount (used by ErrorBoundary)
  const handleReset = useCallback(() => {
    setResetKey((k: number) => k + 1);
  }, []);

  // Android: set system navigation bar to true black to match app theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000').catch(() => {});
      NavigationBar.setButtonStyleAsync('light').catch(() => {});
    }
  }, []);

  // Don't render until fonts are loaded (splash screen stays visible)
  if (!fontsLoaded && !fontError) {
    // deno-lint-ignore jsx-no-useless-fragment
    return <></>;
  }

  return (
    <ErrorBoundary key={resetKey} onReset={handleReset}>
      <QueryProvider>
        <SafeAreaProvider>
          <UniwindSafeAreaBridge>
            <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <ThemeProvider>
                <DsProvider>
                  <DatabaseProvider>
                    <AuthProvider>
                      <SyncProvider>
                        <NotificationProvider>
                          <BiometricLockOverlay>
                            <Suspense fallback={<LoadingFallback />}>
                              <RootNavigator />
                            </Suspense>
                          </BiometricLockOverlay>
                          <StatusBar
                            style="light"
                            backgroundColor="#000000"
                            translucent={Platform.OS === 'android'}
                          />
                          <PortalHost />
                        </NotificationProvider>
                      </SyncProvider>
                    </AuthProvider>
                  </DatabaseProvider>
                </DsProvider>
              </ThemeProvider>
            </BottomSheetModalProvider>
            </GestureHandlerRootView>
          </UniwindSafeAreaBridge>
        </SafeAreaProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

// Wrap with Sentry for automatic error tracking
export default sentryWrap(App);
