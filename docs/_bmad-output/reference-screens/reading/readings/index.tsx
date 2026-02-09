/**
 * Readings Library
 * Common recovery readings organized by category
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../../components/ui';
import {
  READINGS,
  READING_CATEGORIES,
  getReadingsByCategory,
  getReadingById,
  getCommonReadings,
  type Reading,
} from '../../../lib/constants/readings';

export default function ReadingsLibraryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Reading['category'] | 'all' | 'common'>('common');
  const [selectedReading, setSelectedReading] = useState<string | null>(null);

  const displayedReadings = 
    selectedCategory === 'all'
      ? READINGS
      : selectedCategory === 'common'
        ? getCommonReadings()
        : getReadingsByCategory(selectedCategory);

  const reading = selectedReading ? getReadingById(selectedReading) : null;

  // Show reading detail
  if (reading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <ScrollView className="flex-1 px-4 py-6">
          {/* Header */}
          <TouchableOpacity onPress={() => setSelectedReading(null)} className="mb-6">
            <Text className="text-primary-600 text-base">← Back to Readings</Text>
          </TouchableOpacity>

          {/* Reading Header */}
          <View className="items-center mb-6">
            <Text className="text-5xl mb-4">📖</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              {reading.title}
            </Text>
            {reading.subtitle && (
              <Text className="text-base text-surface-600 dark:text-surface-400 mt-1 text-center">
                {reading.subtitle}
              </Text>
            )}
            <Text className="text-sm text-surface-500 mt-2 text-center">
              — {reading.source}
            </Text>
          </View>

          {/* Reading Content */}
          <Card variant="elevated" className="mb-6 bg-amber-50/50 dark:bg-surface-800">
            <Text className="text-base text-surface-800 dark:text-surface-200 leading-relaxed whitespace-pre-line">
              {reading.content}
            </Text>
          </Card>

          {/* Category Badge */}
          <View className="items-center mb-8">
            <View className="bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-full">
              <Text className="text-surface-600 dark:text-surface-400 text-sm">
                {READING_CATEGORIES.find((c) => c.key === reading.category)?.label || reading.category}
              </Text>
            </View>
          </View>

          {/* Commonly Read Badge */}
          {reading.isCommonlyRead && (
            <Card variant="outlined" className="mb-6">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">⭐</Text>
                <Text className="text-sm text-surface-600 dark:text-surface-400">
                  This reading is commonly read at meetings.
                </Text>
              </View>
            </Card>
          )}

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
              Readings Library
            </Text>
            <Text className="text-surface-500 text-sm">
              {READINGS.length} common recovery readings
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          {/* Common (first) */}
          <TouchableOpacity
            onPress={() => setSelectedCategory('common')}
            className={`px-4 py-2 rounded-full mr-2 flex-row items-center gap-1 ${
              selectedCategory === 'common'
                ? 'bg-primary-500'
                : 'bg-surface-100 dark:bg-surface-800'
            }`}
          >
            <Text>⭐</Text>
            <Text
              className={
                selectedCategory === 'common'
                  ? 'text-white font-medium'
                  : 'text-surface-600 dark:text-surface-400'
              }
            >
              Common
            </Text>
          </TouchableOpacity>

          {/* All */}
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

          {/* Categories */}
          {READING_CATEGORIES.map((category) => (
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

        {/* Reading List */}
        {displayedReadings.map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() => setSelectedReading(r.id)}
            activeOpacity={0.7}
          >
            <Card variant="default" className="mb-3">
              <View className="flex-row items-start gap-3">
                <Text className="text-2xl">📖</Text>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 flex-1">
                      {r.title}
                    </Text>
                    {r.isCommonlyRead && (
                      <Text className="text-sm">⭐</Text>
                    )}
                  </View>
                  <Text className="text-sm text-surface-500 mt-1" numberOfLines={2}>
                    {r.content.split('\n')[0].slice(0, 80)}...
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <View className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                      <Text className="text-xs text-surface-500">
                        {READING_CATEGORIES.find((c) => c.key === r.category)?.label}
                      </Text>
                    </View>
                    <Text className="text-xs text-surface-400">
                      {r.source}
                    </Text>
                  </View>
                </View>
                <Text className="text-surface-400">→</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Info Card */}
        <Card variant="outlined" className="mt-4 mb-8">
          <Text className="text-sm text-surface-600 dark:text-surface-400 text-center leading-relaxed">
            These readings come from recovery literature and are commonly shared at meetings. 
            They represent the core principles and wisdom of the program.
          </Text>
        </Card>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}


