/**
 * Onboarding Step 3: Program Type
 * Select recovery program type
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui';
import type { ProgramType } from '../../lib/types';

interface ProgramOption {
  id: ProgramType;
  name: string;
  description: string;
  icon: string;
}

const PROGRAMS: ProgramOption[] = [
  {
    id: '12-step-aa',
    name: 'Alcoholics Anonymous',
    description: '12-Step program for alcohol recovery',
    icon: '🔷',
  },
  {
    id: '12-step-na',
    name: 'Narcotics Anonymous',
    description: '12-Step program for drug recovery',
    icon: '🔶',
  },
  {
    id: 'smart',
    name: 'SMART Recovery',
    description: 'Self-Management and Recovery Training',
    icon: '🧠',
  },
  {
    id: 'custom',
    name: 'My Own Path',
    description: 'Personal recovery journey',
    icon: '💫',
  },
];

export default function ProgramScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sobrietyDate: string;
    justForToday: string;
  }>();

  const [selectedProgram, setSelectedProgram] = useState<ProgramType | null>(null);
  const [displayName, setDisplayName] = useState('');

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    if (!selectedProgram) return;

    router.push({
      pathname: '/onboarding/notifications',
      params: {
        sobrietyDate: params.sobrietyDate,
        justForToday: params.justForToday,
        programType: selectedProgram,
        displayName: displayName.trim() || '',
      },
    });
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
                step <= 2
                  ? 'w-8 bg-primary-500'
                  : 'w-2 bg-surface-300 dark:bg-surface-700'
              }`}
            />
          ))}
        </View>

        {/* Header */}
        <Animated.View style={{ opacity: fadeIn }}>
          <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
            What's your path?
          </Text>
          <Text className="text-surface-600 dark:text-surface-400 text-center mb-8">
            This helps us tailor the experience for you
          </Text>
        </Animated.View>

        {/* Program Options */}
        <Animated.View style={{ opacity: fadeIn }} className="gap-3 mb-8">
          {PROGRAMS.map((program) => (
            <TouchableOpacity
              key={program.id}
              onPress={() => setSelectedProgram(program.id)}
              className={`p-4 rounded-2xl border-2 ${
                selectedProgram === program.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800'
              }`}
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 bg-surface-200 dark:bg-surface-700 rounded-xl items-center justify-center">
                  <Text className="text-2xl">{program.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                    {program.name}
                  </Text>
                  <Text className="text-surface-500 text-sm">
                    {program.description}
                  </Text>
                </View>
                {selectedProgram === program.id && (
                  <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs">✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Name Input */}
        <Animated.View style={{ opacity: fadeIn }}>
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
            What should we call you?
          </Text>
          <Text className="text-surface-500 text-sm mb-3">
            Optional - for a personalized experience
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name or leave blank"
            placeholderTextColor="#9ca3af"
            className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 text-base"
            autoCapitalize="words"
            autoComplete="name"
          />
        </Animated.View>
      </ScrollView>

      {/* Actions */}
      <View className="px-6 pb-6">
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedProgram}
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

