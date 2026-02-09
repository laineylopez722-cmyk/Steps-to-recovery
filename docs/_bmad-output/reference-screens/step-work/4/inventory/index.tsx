/**
 * Fourth Step Inventory Overview
 * Big Book format: Resentments, Fears, Sex Conduct
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../../../components/ui';
import { useFourthStepStore } from '../../../../lib/store';

const INVENTORY_SECTIONS = [
  {
    type: 'resentment' as const,
    title: 'Resentments',
    icon: '😤',
    description: 'Who or what do you resent? What did they do? How does it affect you?',
    columns: ['Who', 'The Cause', 'Affects My...', 'My Part'],
    color: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    type: 'fear' as const,
    title: 'Fears',
    icon: '😰',
    description: 'What are you afraid of? Why? How does it affect your life?',
    columns: ['Fear', 'Why?', 'Affects My...', 'My Part'],
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    type: 'sex_conduct' as const,
    title: 'Relationships & Sex Conduct',
    icon: '💔',
    description: 'Where have you been at fault in relationships? What was your part?',
    columns: ['Who', 'What Happened', 'Affected Others', 'My Ideal'],
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
];

export default function FourthStepInventoryScreen() {
  const router = useRouter();
  const { entries, loadEntries, getCounts, isLoading } = useFourthStepStore();

  useEffect(() => {
    loadEntries();
  }, []);

  const counts = getCounts();
  const totalEntries = counts.resentments + counts.fears + counts.sexConduct;

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
              Step 4 Inventory
            </Text>
            <Text className="text-surface-500 text-sm">
              A searching and fearless moral inventory
            </Text>
          </View>
        </View>

        {/* Progress Overview */}
        <Card variant="elevated" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-primary-500 items-center justify-center">
              <Text className="text-3xl font-bold text-white">{totalEntries}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                Your Inventory
              </Text>
              <Text className="text-sm text-primary-700 dark:text-primary-300">
                {counts.resentments} resentments • {counts.fears} fears • {counts.sexConduct} relationships
              </Text>
            </View>
          </View>
        </Card>

        {/* Instructions */}
        <Card variant="outlined" className="mb-6">
          <View className="flex-row items-start gap-3">
            <Text className="text-2xl">📖</Text>
            <View className="flex-1">
              <Text className="text-base font-medium text-surface-900 dark:text-surface-100 mb-1">
                Big Book Format
              </Text>
              <Text className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                This inventory follows the format from the Big Book. Take your time, be thorough, 
                and remember—this is for your recovery. Share only with your sponsor.
              </Text>
            </View>
          </View>
        </Card>

        {/* Inventory Sections */}
        <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
          Inventory Sections
        </Text>

        {INVENTORY_SECTIONS.map((section) => {
          const count = section.type === 'resentment' 
            ? counts.resentments 
            : section.type === 'fear' 
            ? counts.fears 
            : counts.sexConduct;

          return (
            <TouchableOpacity
              key={section.type}
              onPress={() => router.push(`/step-work/4/inventory/${section.type}`)}
              activeOpacity={0.7}
            >
              <Card variant="default" className={`mb-3 ${section.bgColor}`}>
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-full ${section.color} items-center justify-center mr-4`}>
                    <Text className="text-2xl">{section.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                        {section.title}
                      </Text>
                      <View className="bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                        <Text className="text-xs text-surface-600 dark:text-surface-400">
                          {count}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-surface-500 mt-0.5" numberOfLines={2}>
                      {section.description}
                    </Text>
                  </View>
                  <Text className="text-surface-400 text-lg">→</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* Tips */}
        <Card variant="default" className="mt-4 mb-8">
          <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">
            💡 Tips for Your Inventory
          </Text>
          <View className="gap-2">
            <Text className="text-sm text-surface-600 dark:text-surface-400">
              • Be as honest as possible—this is for your eyes and your sponsor's
            </Text>
            <Text className="text-sm text-surface-600 dark:text-surface-400">
              • Include names, institutions, and principles
            </Text>
            <Text className="text-sm text-surface-600 dark:text-surface-400">
              • Focus on YOUR part, not what others did wrong
            </Text>
            <Text className="text-sm text-surface-600 dark:text-surface-400">
              • Don't rush—this is foundational work
            </Text>
          </View>
        </Card>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

