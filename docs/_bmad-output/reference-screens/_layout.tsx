/**
 * Root Layout
 * App initialization and global providers
 * Phase 4: Added ErrorBoundary and performance optimizations
 * UI/UX Upgrade: Custom fonts loaded via expo-google-fonts
 */

import '../polyfills';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { initializeDatabase } from '../lib/db';
import { initializeEncryptionKey } from '../lib/encryption';
import { useSettingsStore } from '../lib/store';
import {
  initializeNotifications,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '../lib/notifications';
import {
  initializeErrorTracking,
  captureException,
  logNavigation,
} from '../lib/services/errorTracking';
import { CrisisButton, ErrorBoundary } from '../components/common';
import '../global.css';

// Keep splash screen visible while we initialize
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen may have already been hidden
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { loadSettings, settings } = useSettingsStore();
  const router = useRouter();

  // Notification listeners - using EventSubscription type
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const initialize = useCallback(async () => {
    try {
      setIsRetrying(true);
      setError(null);

      initializeErrorTracking();

      // Initialize database
      await initializeDatabase();

      // Initialize encryption
      await initializeEncryptionKey();

      // Load settings
      await loadSettings();

      setIsReady(true);
    } catch (err) {
      console.error('Initialization error:', err);
      captureException(err as Error, {
        component: 'AppInitializer',
        action: 'initialize',
      });
      setError('Failed to initialize app. Please try again.');
    } finally {
      setIsRetrying(false);
      // Hide splash screen after initialization (success or fail)
      await SplashScreen.hideAsync().catch(() => { });
    }
  }, [loadSettings]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize notifications after settings are loaded
  useEffect(() => {
    if (isReady && settings) {
      initializeNotifications(
        settings.notificationsEnabled,
        settings.checkInTime
      );
    }
  }, [isReady, settings?.notificationsEnabled, settings?.checkInTime]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener(
      (_notification) => {
        // Notification received in foreground - no action needed
        // The notification will be displayed by the system
      }
    );

    // Listener for when user taps on notification
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;

      // Navigate based on notification data
      if (data?.screen === 'checkin') {
        logNavigation('checkin', { source: 'notification' });
        router.push('/checkin');
      } else if (data?.screen === 'progress') {
        logNavigation('insights', { source: 'notification' });
        router.push('/(tabs)/insights');
      } else if (data?.screen === 'achievements') {
        logNavigation('achievements', { source: 'notification' });
        router.push('/achievements');
      } else if (data?.screen === 'emergency') {
        logNavigation('emergency', { source: 'notification' });
        router.push('/(tabs)/emergency');
      } else if (data?.screen === 'scenarios') {
        logNavigation('scenarios', { source: 'notification' });
        router.push('/scenarios');
      } else if (data?.type === 'navigate' && data?.payload) {
        // Handle JITAI navigation - payload should be a valid route path
        const route = String(data.payload);
        logNavigation(route, { source: 'jitai_notification' });
        router.push(route as `/checkin` | `/scenarios` | `/achievements` | `/(tabs)/insights` | `/(tabs)/emergency`);
      }
    });

    return () => {
      // Remove notification subscriptions using the remove() method
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-navy-950 p-6">
        <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-6">
          <Text className="text-4xl">⚠️</Text>
        </View>
        <Text className="text-xl font-bold text-white text-center mb-2">
          Unable to Start
        </Text>
        <Text className="text-surface-400 text-center mb-6 px-4">
          {error}
        </Text>
        <TouchableOpacity
          onPress={initialize}
          disabled={isRetrying}
          className="bg-primary-500 rounded-xl px-8 py-4 mb-4"
          accessibilityRole="button"
          accessibilityLabel="Retry initialization"
        >
          {isRetrying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white font-semibold text-lg">Try Again</Text>
          )}
        </TouchableOpacity>
        <View className="mt-8 p-4 border border-danger-500/30 rounded-xl bg-danger-500/10">
          <Text className="text-danger-400 text-center font-semibold">
            🆘 Need Help? Call 988
          </Text>
          <Text className="text-surface-500 text-center text-sm mt-1">
            Suicide & Crisis Lifeline (US)
          </Text>
        </View>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-navy-950">
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text className="text-white mt-4 text-lg">Loading...</Text>
      </View>
    );
  }

  return (
    <>
      {children}
      <CrisisButton />
    </>
  );
}

export default function RootLayout() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    // Plus Jakarta Sans - Body text
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    // Outfit - Display/Headlines
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    // JetBrains Mono - Counters/Stats
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  // Show loading state while fonts are loading
  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-navy-950">
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppInitializer>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="checkin" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="journal" options={{ headerShown: false }} />
            <Stack.Screen name="meetings" options={{ headerShown: false }} />
            <Stack.Screen name="capsule" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
        </AppInitializer>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
