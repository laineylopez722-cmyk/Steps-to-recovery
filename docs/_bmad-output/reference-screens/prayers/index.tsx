/**
 * Prayer Library
 * All recovery prayers organized by category
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
import { Card } from '../../components/ui';
import {
  PRAYERS,
  PRAYER_CATEGORIES,
  getPrayersByCategory,
  getPrayerById,
  type Prayer,
} from '../../lib/constants/prayers';

export default function PrayerLibraryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Prayer['category'] | 'all'>('all');
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);

  const displayedPrayers = selectedCategory === 'all'
    ? PRAYERS
    : getPrayersByCategory(selectedCategory);

  const prayer = selectedPrayer ? getPrayerById(selectedPrayer) : null;

  // Show prayer detail
  if (prayer) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <ScrollView className="flex-1 px-4 py-6">
          {/* Header */}
          <TouchableOpacity onPress={() => setSelectedPrayer(null)} className="mb-6">
            <Text className="text-primary-600 text-base">← Back to Prayers</Text>
          </TouchableOpacity>

          {/* Prayer Header */}
          <View className="items-center mb-6">
            <Text className="text-5xl mb-4">🙏</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              {prayer.title}
            </Text>
            {prayer.source && (
              <Text className="text-sm text-surface-500 mt-1 text-center">
                — {prayer.source}
              </Text>
            )}
            {prayer.stepAssociation && prayer.stepAssociation.length > 0 && (
              <View className="flex-row gap-2 mt-3">
                {prayer.stepAssociation.map((step) => (
                  <View
                    key={step}
                    className="bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full"
                  >
                    <Text className="text-primary-700 dark:text-primary-300 text-sm">
                      Step {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Prayer Content */}
          <Card variant="elevated" className="mb-6">
            <Text className="text-lg text-surface-800 dark:text-surface-200 leading-loose whitespace-pre-line text-center">
              {prayer.content}
            </Text>
          </Card>

          {/* Category Badge */}
          <View className="items-center mb-8">
            <View className="bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-full">
              <Text className="text-surface-600 dark:text-surface-400 text-sm capitalize">
                {PRAYER_CATEGORIES.find((c) => c.key === prayer.category)?.label || prayer.category}
              </Text>
            </View>
          </View>
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
              Prayer Library
            </Text>
            <Text className="text-surface-500 text-sm">
              {PRAYERS.length} prayers for your recovery
            </Text>
          </View>
        </View>

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
          {PRAYER_CATEGORIES.map((category) => (
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

        {/* Prayer List */}
        {displayedPrayers.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setSelectedPrayer(p.id)}
            activeOpacity={0.7}
          >
            <Card variant="default" className="mb-3">
              <View className="flex-row items-start gap-3">
                <Text className="text-2xl">🙏</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                    {p.title}
                  </Text>
                  <Text className="text-sm text-surface-500 mt-1" numberOfLines={2}>
                    {p.content.split('\n')[0]}...
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <View className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                      <Text className="text-xs text-surface-500 capitalize">
                        {PRAYER_CATEGORIES.find((c) => c.key === p.category)?.label}
                      </Text>
                    </View>
                    {p.stepAssociation && p.stepAssociation.length > 0 && (
                      <View className="bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                        <Text className="text-xs text-primary-700 dark:text-primary-300">
                          Step {p.stepAssociation.join(', ')}
                        </Text>
                      </View>
                    )}
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
            These prayers come from the Big Book, NA literature, and common recovery traditions. 
            Feel free to adapt them to your own understanding of a Higher Power.
          </Text>
        </Card>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

