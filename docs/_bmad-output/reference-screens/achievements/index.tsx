/**
 * Achievements Screen
 * Wall of achievements and keytags display
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';
import {
  KeytagWall,
  KeytagModal,
  AchievementCard,
  UnlockCelebrationModal,
} from '../../components/achievements';
import { useAchievements } from '../../lib/hooks/useAchievements';
import type { KeytagWithStatus } from '../../lib/constants/keytags';
import type { AchievementCategory } from '../../lib/types';

type CategoryTab = 'all' | AchievementCategory;

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fellowship', label: 'Fellowship' },
  { key: 'step_work', label: 'Step Work' },
  { key: 'daily_practice', label: 'Practice' },
  { key: 'service', label: 'Service' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const {
    achievements,
    keytags,
    isLoading,
    totalUnlocked,
    totalAchievements,
    earnedKeytags,
    totalKeytags,
    categoryProgress,
    recentUnlock,
    dismissRecentUnlock,
    selfCheckAchievement,
    saveReflection,
  } = useAchievements();

  const [selectedKeytag, setSelectedKeytag] = useState<KeytagWithStatus | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');

  const overallProgress = Math.round(
    ((totalUnlocked + earnedKeytags) / Math.max(totalAchievements + totalKeytags, 1)) * 100
  );

  const handleKeytagPress = useCallback((keytag: KeytagWithStatus) => {
    setSelectedKeytag(keytag);
  }, []);

  const handleAchievementPress = useCallback((achievementId: string) => {
    router.push(`/achievements/${achievementId}`);
  }, [router]);

  const handleSaveKeytagReflection = useCallback((reflection: string) => {
    if (selectedKeytag) {
      // Save reflection for keytag (using achievement reflection system)
      saveReflection(selectedKeytag.id, reflection);
      setSelectedKeytag(null);
    }
  }, [selectedKeytag, saveReflection]);

  // Filter achievements by category
  const filteredAchievements = activeTab === 'all'
    ? achievements
    : achievements.filter((a) => a.category === activeTab);

  // Separate by status for display
  const unlockedAchievements = filteredAchievements.filter((a) => a.status === 'unlocked');
  const inProgressAchievements = filteredAchievements.filter((a) => a.status === 'in_progress');
  const lockedAchievements = filteredAchievements.filter((a) => a.status === 'locked');

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <SectionList
        className="flex-1"
        sections={[
          { title: 'In Progress', data: inProgressAchievements },
          { title: 'Unlocked', data: unlockedAchievements },
          { title: 'Locked', data: lockedAchievements },
        ].filter((s) => s.data.length > 0)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 mb-3">
            <AchievementCard
              achievement={item}
              onPress={() => handleAchievementPress(item.id)}
              showProgress={item.status === 'in_progress'}
            />
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="px-4 mb-3 mt-4 bg-surface-50 dark:bg-surface-900 py-1">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {title} ({
                title === 'Unlocked' ? unlockedAchievements.length :
                  title === 'Locked' ? lockedAchievements.length :
                    inProgressAchievements.length
              })
            </Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="px-4 py-6">
              <View className="flex-row items-center mb-2">
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-primary-600 text-lg mr-3">←</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  My Recovery Journey
                </Text>
              </View>

              {/* Overall Progress */}
              <Card variant="elevated" className="mt-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm text-surface-500">Overall Progress</Text>
                  <Text className="text-lg font-bold text-primary-600">
                    {overallProgress}%
                  </Text>
                </View>
                <View className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                    style={{
                      width: `${overallProgress}%`,
                      backgroundColor: '#7C3AED',
                    }}
                  />
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-xs text-surface-500">
                    {totalUnlocked + earnedKeytags} earned
                  </Text>
                  <Text className="text-xs text-surface-500">
                    {totalAchievements + totalKeytags} total
                  </Text>
                </View>
              </Card>
            </View>

            {/* Keytags Section */}
            <View className="px-4 mb-6">
              <KeytagWall keytags={keytags} onKeytagPress={handleKeytagPress} />
            </View>

            {/* Category Stats */}
            <View className="px-4 mb-4">
              <View className="flex-row gap-2">
                {Object.entries(categoryProgress)
                  .filter(([key]) => key !== 'keytags')
                  .map(([key, value]) => (
                    <View
                      key={key}
                      className="flex-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-2"
                    >
                      <Text className="text-xs text-surface-500 capitalize">
                        {key.replace('_', ' ')}
                      </Text>
                      <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                        {value.unlocked}/{value.total}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* Category Tabs */}
            <View className="px-4 mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {CATEGORY_TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 mr-2 rounded-full ${activeTab === tab.key
                        ? 'bg-primary-600'
                        : 'bg-surface-200 dark:bg-surface-700'
                      }`}
                  >
                    <Text
                      className={`text-sm font-medium ${activeTab === tab.key
                          ? 'text-white'
                          : 'text-surface-600 dark:text-surface-400'
                        }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Empty state (when filtering returns no results AND done loading) */}
            {filteredAchievements.length === 0 && !isLoading && (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">🏆</Text>
                <Text className="text-surface-500 text-center">
                  No achievements in this category yet.{'\n'}
                  Keep working your program!
                </Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Keytag Detail Modal */}
      <KeytagModal
        keytag={selectedKeytag}
        visible={!!selectedKeytag}
        onClose={() => setSelectedKeytag(null)}
        onSaveReflection={handleSaveKeytagReflection}
      />

      {/* Achievement Unlock Celebration */}
      <UnlockCelebrationModal
        achievement={recentUnlock}
        visible={!!recentUnlock}
        onClose={dismissRecentUnlock}
      />
    </SafeAreaView>
  );
}

