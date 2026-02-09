/**
 * Onboarding Step 4: Notifications
 * Set up daily check-in reminders
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui';
import { useSobriety } from '../../lib/hooks/useSobriety';
import { useSettingsStore } from '../../lib/store';
import {
  requestNotificationPermissions,
  scheduleDailyCheckinReminder,
} from '../../lib/notifications';
import type { ProgramType } from '../../lib/types';

const TIMES = [
  { label: 'Morning', value: '08:00', icon: '🌅' },
  { label: 'Midday', value: '12:00', icon: '☀️' },
  { label: 'Evening', value: '18:00', icon: '🌆' },
  { label: 'Night', value: '21:00', icon: '🌙' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sobrietyDate: string;
    justForToday: string;
    programType: string;
    displayName: string;
  }>();

  const { createProfile } = useSobriety();
  const { updateSettings } = useSettingsStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setNotificationsEnabled(enabled);
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Create the profile
      const sobrietyDate = new Date(params.sobrietyDate || new Date().toISOString());
      const programType = (params.programType as ProgramType) || 'custom';
      const displayName = params.displayName || undefined;

      await createProfile(sobrietyDate, programType, displayName);

      // Save settings - this will also schedule notifications via the store
      await updateSettings({
        checkInTime: selectedTime,
        notificationsEnabled,
      });

      // Explicitly schedule notification if enabled (belt and suspenders)
      if (notificationsEnabled) {
        await scheduleDailyCheckinReminder(selectedTime);
      }

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="flex-1 px-6">
        {/* Progress Indicator */}
        <View className="flex-row justify-center gap-2 mt-4 mb-8">
          {[0, 1, 2, 3].map((step) => (
            <View
              key={step}
              className="w-8 h-2 rounded-full bg-primary-500"
            />
          ))}
        </View>

        {/* Header */}
        <Animated.View style={{ opacity: fadeIn }}>
          <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
            Stay on track
          </Text>
          <Text className="text-surface-600 dark:text-surface-400 text-center mb-8">
            Daily check-ins help build healthy habits
          </Text>
        </Animated.View>

        {/* Notification Toggle */}
        <Animated.View style={{ opacity: fadeIn }}>
          <View className="bg-surface-100 dark:bg-surface-800 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Text className="text-2xl">🔔</Text>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                    Daily Reminders
                  </Text>
                  <Text className="text-surface-500 text-sm">
                    Get a gentle nudge to check in
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#e4e4e7', true: '#3b82f6' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Time Selection */}
          {notificationsEnabled && (
            <View className="mb-8">
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
                Best time for you?
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {TIMES.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    onPress={() => setSelectedTime(time.value)}
                    className={`flex-1 min-w-[45%] p-4 rounded-xl border-2 ${
                      selectedTime === time.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800'
                    }`}
                  >
                    <Text className="text-2xl text-center mb-1">{time.icon}</Text>
                    <Text className="text-center font-semibold text-surface-900 dark:text-surface-100">
                      {time.label}
                    </Text>
                    <Text className="text-center text-surface-500 text-sm">
                      {time.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Summary Card */}
          <View className="bg-secondary-50 dark:bg-secondary-900/30 rounded-2xl p-5">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              You're all set! 🎉
            </Text>
            <View className="gap-2">
              {params.displayName && (
                <Text className="text-surface-600 dark:text-surface-400">
                  👋 Welcome, {params.displayName}
                </Text>
              )}
              <Text className="text-surface-600 dark:text-surface-400">
                📅 Starting your journey{' '}
                {params.justForToday === 'true' ? 'today' : `from ${new Date(params.sobrietyDate || '').toLocaleDateString()}`}
              </Text>
              <Text className="text-surface-600 dark:text-surface-400">
                🎯 Following:{' '}
                {params.programType === '12-step-aa'
                  ? 'AA'
                  : params.programType === '12-step-na'
                  ? 'NA'
                  : params.programType === 'smart'
                  ? 'SMART Recovery'
                  : 'My Own Path'}
              </Text>
              {notificationsEnabled && (
                <Text className="text-surface-600 dark:text-surface-400">
                  🔔 Daily check-in at {selectedTime}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Actions */}
      <View className="px-6 pb-6">
        <Button
          title={isLoading ? 'Setting up...' : "Let's Begin"}
          onPress={handleComplete}
          disabled={isLoading}
          size="lg"
        />
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-3 p-2"
          disabled={isLoading}
        >
          <Text className="text-center text-surface-500">Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

