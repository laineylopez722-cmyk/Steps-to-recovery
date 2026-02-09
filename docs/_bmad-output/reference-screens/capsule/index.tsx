/**
 * Time Capsule List Screen
 * View all time capsules - locked and unlocked
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useCapsuleStore } from '../../lib/store';
import type { TimeCapsule } from '../../lib/types';

import { CapsuleCard } from '../../components/capsule/CapsuleCard';

export default function CapsuleListScreen() {
  const router = useRouter();
  const { capsules, isLoading, loadCapsules, checkForUnlockableCapsules } =
    useCapsuleStore();

  const [refreshing, setRefreshing] = useState(false);
  const [unlockableCapsules, setUnlockableCapsules] = useState<TimeCapsule[]>([]);

  useEffect(() => {
    loadCapsules();
  }, []);

  useEffect(() => {
    checkUnlockable();
  }, [capsules]);

  const checkUnlockable = async () => {
    const ready = await checkForUnlockableCapsules();
    setUnlockableCapsules(ready);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCapsules();
    setRefreshing(false);
  };

  const lockedCapsules = capsules.filter((c) => !c.isUnlocked);
  const openedCapsules = capsules.filter((c) => c.isUnlocked);

  // Empty state
  if (!isLoading && capsules.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <View className="flex-1 px-4 py-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary-600">← Back</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center justify-center">
            <Text className="text-6xl mb-4">💌</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              Time Capsules
            </Text>
            <Text className="text-surface-500 text-center mt-2 mb-6 px-8">
              Write a letter to your future self. It will be locked until your
              chosen date.
            </Text>
            <Button
              title="Create First Capsule"
              onPress={() => router.push('/capsule/new')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <SectionList
        className="flex-1 px-4"
        sections={[
          { title: 'Waiting to Open', data: lockedCapsules },
          { title: 'Opened', data: openedCapsules },
        ].filter((s) => s.data.length > 0)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CapsuleCard
            capsule={item}
            onPress={() => router.push(`/capsule/${item.id}`)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3 mt-4">
            {title}
          </Text>
        )}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6 pt-6">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                  <Text className="text-primary-600">← Back</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  Time Capsules
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/capsule/new')}
                className="bg-primary-600 rounded-full w-10 h-10 items-center justify-center"
              >
                <Text className="text-white text-2xl">+</Text>
              </TouchableOpacity>
            </View>

            {/* Unlockable capsules alert */}
            {unlockableCapsules.length > 0 && (
              <Card
                variant="elevated"
                className="mb-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">✨</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                      {unlockableCapsules.length} Capsule
                      {unlockableCapsules.length > 1 ? 's' : ''} Ready!
                    </Text>
                    <Text className="text-sm text-amber-600 dark:text-amber-400">
                      Tap to open and read your message
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        }
        ListFooterComponent={
          <>
            {/* Encouragement */}
            <Card variant="outlined" className="mb-6 mt-6">
              <Text className="text-surface-600 dark:text-surface-400 text-center italic">
                "The best time to plant a tree was 20 years ago. The second best time
                is now."
              </Text>
            </Card>

            <View className="h-8" />
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

