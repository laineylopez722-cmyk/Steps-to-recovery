/**
 * Onboarding: Welcome Screen
 * Single-screen onboarding matching reference site design
 * Features: Privacy cards, name input, recovery date/time input
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Button, Input } from '../../components/ui';
import { useSobriety } from '../../lib/hooks/useSobriety';
import { useSettingsStore } from '../../lib/store';

const FEATURES = [
  {
    icon: 'lock',
    title: '100% Private',
    description: 'Your data never leaves your device',
  },
  {
    icon: 'globe',
    title: 'No sign-up',
    description: 'Start using immediately',
  },
  {
    icon: 'calendar',
    title: 'Works offline',
    description: 'Access anytime, anywhere',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { createProfile } = useSobriety();
  const { updateSettings } = useSettingsStore();

  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState(new Date());
  const [sobrietyTime, setSobrietyTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSobrietyDate(selectedDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setSobrietyTime(selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleContinue = async () => {
    setIsLoading(true);

    try {
      // Combine date and time
      const combinedDate = new Date(sobrietyDate);
      combinedDate.setHours(sobrietyTime.getHours());
      combinedDate.setMinutes(sobrietyTime.getMinutes());

      // Create profile with default program type 'custom'
      await createProfile(combinedDate, 'custom', displayName.trim() || undefined);

      // Set default notification settings
      await updateSettings({
        checkInTime: '08:00',
        notificationsEnabled: false,
      });

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white mb-2">
            Recovery Companion
          </Text>
          <Text className="text-surface-400 text-sm">
            Your private, offline-first companion for recovery.
          </Text>
        </View>

        {/* Feature Cards - Horizontal layout matching reference */}
        <View className="flex-row gap-3 mb-6">
          {FEATURES.map((feature, index) => (
            <View
              key={index}
              className="flex-1 items-center bg-surface-800/30 rounded-xl p-3"
            >
              <View className="mb-2">
                <Feather name={feature.icon as any} size={20} color="#60a5fa" />
              </View>
              <Text className="text-white text-xs font-semibold mb-1 text-center">
                {feature.title}
              </Text>
              <Text className="text-surface-400 text-[10px] leading-tight text-center">
                {feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-white text-sm font-medium mb-2">
            What should we call you?
          </Text>
          <Input
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="First name or nickname"
            placeholderTextColor="#64748b"
            className="bg-surface-800/50 border-surface-700/50"
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        {/* Recovery Date/Time Input */}
        <View className="mb-6">
          <Text className="text-white text-sm font-medium mb-2">
            When did you start your recovery?
          </Text>
          <View className="flex-row gap-3">
            {/* Date Input */}
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(true);
                  }
                }}
                activeOpacity={0.7}
              >
                <View className="relative">
                  <Input
                    value={formatDate(sobrietyDate)}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor="#64748b"
                    className="bg-surface-800/50 border-surface-700/50 pr-10"
                    editable={false}
                    showSoftInputOnFocus={false}
                  />
                  <View className="absolute right-3 top-0 bottom-0 justify-center pointer-events-none">
                    <Feather name="calendar" size={16} color="#64748b" />
                  </View>
                </View>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <View className="mt-2 bg-surface-800/50 rounded-xl overflow-hidden">
                  <DateTimePicker
                    value={sobrietyDate}
                    mode="date"
                    display="compact"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    textColor="#ffffff"
                    themeVariant="dark"
                  />
                </View>
              )}
            </View>

            {/* Time Input */}
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'android') {
                    setShowTimePicker(true);
                  }
                }}
                activeOpacity={0.7}
              >
                <View className="relative">
                  <Input
                    value={formatTime(sobrietyTime)}
                    placeholder="00:00"
                    placeholderTextColor="#64748b"
                    className="bg-surface-800/50 border-surface-700/50 pr-10"
                    editable={false}
                    showSoftInputOnFocus={false}
                  />
                  <View className="absolute right-3 top-0 bottom-0 justify-center pointer-events-none">
                    <Feather name="clock" size={16} color="#64748b" />
                  </View>
                </View>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <View className="mt-2 bg-surface-800/50 rounded-xl overflow-hidden">
                  <DateTimePicker
                    value={sobrietyTime}
                    mode="time"
                    display="compact"
                    onChange={handleTimeChange}
                    textColor="#ffffff"
                    themeVariant="dark"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Android Date/Time Pickers */}
          {Platform.OS === 'android' && (
            <>
              {showDatePicker && (
                <DateTimePicker
                  value={sobrietyDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={sobrietyTime}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-navy-950 border-t border-surface-800/50">
        <Button
          title={isLoading ? 'Setting up...' : 'Continue'}
          onPress={handleContinue}
          disabled={isLoading}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
