import { useEffect, useState, useCallback, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../features/auth/screens/OnboardingScreen';
import { OnboardingSteps } from '../features/onboarding/components/OnboardingSteps';
import { supabase } from '../lib/supabase';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';
import { logger } from '../utils/logger';

const Stack = createNativeStackNavigator<RootStackParamList>();
let navigatorInstanceCounter = 0;

export function RootNavigator() {
  const { user, loading: authLoading, initialized: authInitialized } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const instanceIdRef = useRef<number | null>(null);
  const hasCheckedProfileRef = useRef(false);

  if (instanceIdRef.current === null) {
    instanceIdRef.current = navigatorInstanceCounter++;
  }
  const instanceId = instanceIdRef.current;

  useEffect(() => {
    if (__DEV__) {
      logger.debug('RootNavigator mounted', { instanceId });
    }
    return () => {
      if (__DEV__) {
        logger.debug('RootNavigator unmounted', { instanceId });
      }
    };
  }, [instanceId]);

  /**
   * Android hardware back button handling
   * Prevents app from closing unexpectedly when user presses back at root screens
   *
   * Behavior:
   * - If can go back in navigation stack -> go back (default behavior)
   * - If at root of main app (Home tab) -> minimize app (don't close)
   * - If at auth screens -> allow default exit behavior
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Check if we can go back in the navigation stack
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true; // Handled - don't exit app
      }

      // At root level - if user is logged in, minimize instead of exit
      // This prevents accidental app closure and data loss during sync
      if (user && !needsOnboarding) {
        // Return false to let the system handle it (minimizes the app)
        // But first log that we're at root
        logger.info('Back pressed at root - minimizing app');
        return false;
      }

      // Auth screens - allow normal exit behavior
      return false;
    });

    return () => backHandler.remove();
  }, [user, needsOnboarding]);

  useEffect(() => {
    if (__DEV__) {
      logger.debug('Navigation auth state', {
        instanceId,
        hasUser: Boolean(user),
        authLoading,
        authInitialized,
        needsOnboarding,
        checkingProfile,
      });
    }
  }, [user, authLoading, needsOnboarding, checkingProfile, authInitialized, instanceId]);

  const checkOnboardingStatus = useCallback(async () => {
    // Prevent multiple checks
    if (hasCheckedProfileRef.current) {
      return;
    }

    if (!user) {
      setCheckingProfile(false);
      return;
    }

    hasCheckedProfileRef.current = true;

    const timeoutId = setTimeout(() => {
      logger.warn('Onboarding profile check timed out, skipping onboarding');
      setNeedsOnboarding(false); // Skip onboarding on timeout
      setCheckingProfile(false);
    }, 8000);

    try {
      // First check local storage (fallback for when Supabase table doesn't exist)
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const localComplete = await AsyncStorage.getItem(`onboarding_complete_${user.id}`);

      if (localComplete === 'true') {
        logger.info('Onboarding already completed (from local storage)');
        setNeedsOnboarding(false);
        clearTimeout(timeoutId);
        setCheckingProfile(false);
        return;
      }

      // Then try Supabase profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error) {
        // Table might not exist - check error code
        if (error.code === 'PGRST205' || error.message?.includes('not find')) {
          logger.warn('Profiles table does not exist in Supabase, checking local only');
          // No local completion found either, needs onboarding
          setNeedsOnboarding(true);
        } else if (error.code === 'PGRST116') {
          // No rows returned - profile doesn't exist
          setNeedsOnboarding(true);
        } else {
          logger.error('Error checking profile', error);
          setNeedsOnboarding(true);
        }
      } else if (data) {
        // Profile exists in Supabase
        setNeedsOnboarding(false);
      } else {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      logger.error('Error checking onboarding status', error);
      setNeedsOnboarding(true);
    } finally {
      clearTimeout(timeoutId);
      setCheckingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  // Re-check when user completes onboarding
  useEffect(() => {
    if (user && needsOnboarding) {
      const subscription = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          () => {
            setNeedsOnboarding(false);
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
    return undefined;
  }, [user, needsOnboarding]);

  if ((!authInitialized && authLoading) || checkingProfile) {
    return <LoadingSpinner message="Loading your journey..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animationTypeForReplace: 'pop' }}
          />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingSteps onComplete={() => setNeedsOnboarding(false)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainApp" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
