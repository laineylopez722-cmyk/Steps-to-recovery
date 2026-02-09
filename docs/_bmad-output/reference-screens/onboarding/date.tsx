/**
 * Onboarding Step 2: Recovery Date
 * Set sobriety/clean date or "Just for today" mode
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../components/ui';

export default function DateScreen() {
  const router = useRouter();

  const [sobrietyDate, setSobrietyDate] = useState(new Date());
  const [justForToday, setJustForToday] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSobrietyDate(selectedDate);
      setJustForToday(false);
    }
  };

  const handleJustForToday = () => {
    setJustForToday(true);
    setSobrietyDate(new Date());
  };

  const handleContinue = () => {
    // Store the date in temporary state (will be saved at the end)
    router.push({
      pathname: '/onboarding/program',
      params: {
        sobrietyDate: sobrietyDate.toISOString(),
        justForToday: justForToday.toString(),
      },
    });
  };

  const getDaysCount = () => {
    if (justForToday) return 0;
    const diff = new Date().getTime() - sobrietyDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1" contentContainerClassName="px-6">
        {/* Progress Indicator */}
        <View className="flex-row justify-center gap-2 mt-4 mb-8">
          {[0, 1, 2, 3].map((step) => (
            <View
              key={step}
              className={`h-2 rounded-full ${
                step <= 1
                  ? 'w-8 bg-primary-500'
                  : 'w-2 bg-surface-300 dark:bg-surface-700'
              }`}
            />
          ))}
        </View>

        {/* Header */}
        <Animated.View style={{ opacity: fadeIn }}>
          <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
            When did your journey begin?
          </Text>
          <Text className="text-surface-600 dark:text-surface-400 text-center mb-8">
            This helps us celebrate your milestones with you
          </Text>
        </Animated.View>

        {/* Date Selection */}
        <Animated.View style={{ opacity: fadeIn }} className="items-center">
          {/* Just For Today Option */}
          <TouchableOpacity
            onPress={handleJustForToday}
            className={`w-full max-w-sm p-4 rounded-2xl mb-4 border-2 ${
              justForToday
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">🌅</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Just for Today
                </Text>
                <Text className="text-surface-500 text-sm">
                  Start fresh from today
                </Text>
              </View>
              {justForToday && (
                <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Date Picker Option */}
          <TouchableOpacity
            onPress={() => {
              setJustForToday(false);
              if (Platform.OS === 'android') {
                setShowDatePicker(true);
              }
            }}
            className={`w-full max-w-sm p-4 rounded-2xl mb-6 border-2 ${
              !justForToday
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">📅</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  I have a date
                </Text>
                <Text className="text-surface-500 text-sm">
                  Set your sobriety date
                </Text>
              </View>
              {!justForToday && (
                <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Date Picker */}
          {!justForToday && (showDatePicker || Platform.OS === 'ios') && (
            <View className="bg-surface-100 dark:bg-surface-800 rounded-2xl p-4 mb-6">
              <DateTimePicker
                value={sobrietyDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                textColor="#000"
              />
            </View>
          )}

          {/* Preview */}
          <View className="bg-secondary-50 dark:bg-secondary-900/30 rounded-2xl p-6 w-full max-w-sm items-center">
            <Text className="text-4xl font-bold text-secondary-600 dark:text-secondary-400">
              {getDaysCount()}
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-lg">
              {getDaysCount() === 1 ? 'day' : 'days'} of recovery
            </Text>
            {!justForToday && getDaysCount() > 0 && (
              <Text className="text-surface-500 text-sm mt-2">
                Since {sobrietyDate.toLocaleDateString()}
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Actions */}
      <View className="px-6 pb-6">
        <Button
          title="Continue"
          onPress={handleContinue}
          size="lg"
        />
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-3 p-2"
        >
          <Text className="text-center text-surface-500">Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

