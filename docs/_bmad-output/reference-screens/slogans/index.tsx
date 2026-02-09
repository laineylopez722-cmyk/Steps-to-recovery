/**
 * Slogans Reference
 * Recovery slogans with explanations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';
import {
  SLOGANS,
  SLOGAN_CATEGORIES,
  getSlogansByCategory,
  getSloganById,
  getRandomSlogan,
  type Slogan,
} from '../../lib/constants/slogans';

export default function SlogansScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Slogan['category'] | 'all'>('all');
  const [selectedSlogan, setSelectedSlogan] = useState<string | null>(null);
  const [dailySlogan, setDailySlogan] = useState<Slogan | null>(null);

  // Get a random slogan for the day (seeded by date)
  useEffect(() => {
    const today = new Date().toDateString();
    // Use date as seed for consistent daily slogan
    const dateHash = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(dateHash) % SLOGANS.length;
    setDailySlogan(SLOGANS[index]);
  }, []);

  const displayedSlogans = selectedCategory === 'all'
    ? SLOGANS
    : getSlogansByCategory(selectedCategory);

  const slogan = selectedSlogan ? getSloganById(selectedSlogan) : null;

  // Show slogan detail
  if (slogan) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <ScrollView className="flex-1 px-4 py-6">
          {/* Header */}
          <TouchableOpacity onPress={() => setSelectedSlogan(null)} className="mb-6">
            <Text className="text-primary-600 text-base">← Back to Slogans</Text>
          </TouchableOpacity>

          {/* Slogan Header */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 items-center justify-center mb-4">
              <Text className="text-4xl">💬</Text>
            </View>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              "{slogan.text}"
            </Text>
          </View>

          {/* Category Badge */}
          <View className="items-center mb-6">
            <View className="flex-row items-center gap-2 bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-full">
              <Text>{SLOGAN_CATEGORIES.find((c) => c.key === slogan.category)?.icon}</Text>
              <Text className="text-surface-600 dark:text-surface-400 text-sm">
                {SLOGAN_CATEGORIES.find((c) => c.key === slogan.category)?.label}
              </Text>
            </View>
          </View>

          {/* Explanation */}
          <Card variant="elevated" className="mb-4">
            <Text className="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2 uppercase">
              What it means
            </Text>
            <Text className="text-base text-surface-800 dark:text-surface-200 leading-relaxed whitespace-pre-line">
              {slogan.explanation}
            </Text>
          </Card>

          {/* When to Use */}
          <Card variant="default" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
            <View className="flex-row items-start gap-3">
              <Text className="text-xl">💡</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-1">
                  When to use this slogan
                </Text>
                <Text className="text-sm text-primary-700 dark:text-primary-300">
                  {slogan.whenToUse}
                </Text>
              </View>
            </View>
          </Card>

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Recovery Slogans
            </Text>
            <Text className="text-surface-500 text-sm">
              {SLOGANS.length} slogans for your journey
            </Text>
          </View>
        </View>

        {/* Daily Slogan Card */}
        {dailySlogan && (
          <TouchableOpacity
            onPress={() => setSelectedSlogan(dailySlogan.id)}
            activeOpacity={0.8}
          >
            <Card variant="elevated" className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
              <View className="items-center py-2">
                <Text className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                  ☀️ Today's Slogan
                </Text>
                <Text className="text-xl font-semibold text-amber-900 dark:text-amber-100 text-center">
                  "{dailySlogan.text}"
                </Text>
                <Text className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                  Tap to learn more →
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === 'all'
                ? 'bg-primary-500'
                : 'bg-surface-100 dark:bg-surface-800'
            }`}
          >
            <Text
              className={
                selectedCategory === 'all'
                  ? 'text-white font-medium'
                  : 'text-surface-600 dark:text-surface-400'
              }
            >
              All
            </Text>
          </TouchableOpacity>
          {SLOGAN_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              onPress={() => setSelectedCategory(category.key)}
              className={`px-4 py-2 rounded-full mr-2 flex-row items-center gap-1 ${
                selectedCategory === category.key
                  ? 'bg-primary-500'
                  : 'bg-surface-100 dark:bg-surface-800'
              }`}
            >
              <Text>{category.icon}</Text>
              <Text
                className={
                  selectedCategory === category.key
                    ? 'text-white font-medium'
                    : 'text-surface-600 dark:text-surface-400'
                }
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Slogans List */}
        {displayedSlogans.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setSelectedSlogan(s.id)}
            activeOpacity={0.7}
          >
            <Card variant="default" className="mb-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 items-center justify-center">
                  <Text>{SLOGAN_CATEGORIES.find((c) => c.key === s.category)?.icon || '💬'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                    "{s.text}"
                  </Text>
                  <Text className="text-xs text-surface-500 mt-1">
                    {SLOGAN_CATEGORIES.find((c) => c.key === s.category)?.label}
                  </Text>
                </View>
                <Text className="text-surface-400">→</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Footer */}
        <Card variant="outlined" className="mt-4 mb-8">
          <Text className="text-sm text-surface-600 dark:text-surface-400 text-center leading-relaxed">
            These slogans have been passed down through generations of recovering addicts. 
            They capture the wisdom of the program in memorable phrases.
          </Text>
        </Card>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}


