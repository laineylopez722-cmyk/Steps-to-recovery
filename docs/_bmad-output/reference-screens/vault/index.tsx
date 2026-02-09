/**
 * Motivation Vault Index Screen
 * Extra biometric protection for personal motivation content
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Card, Button } from '../../components/ui';
import { useVaultStore } from '../../lib/store';
import type { VaultItem, VaultItemType } from '../../lib/types';

const TYPE_CONFIG: Record<VaultItemType, { emoji: string; label: string; color: string }> = {
  letter: { emoji: '✉️', label: 'Letter to Self', color: 'bg-purple-100 dark:bg-purple-900/30' },
  photo: { emoji: '📷', label: 'Photo Memory', color: 'bg-blue-100 dark:bg-blue-900/30' },
  audio: { emoji: '🎙️', label: 'Voice Message', color: 'bg-green-100 dark:bg-green-900/30' },
  reason: { emoji: '💪', label: 'Reason for Recovery', color: 'bg-amber-100 dark:bg-amber-900/30' },
  quote: { emoji: '💬', label: 'Meaningful Quote', color: 'bg-rose-100 dark:bg-rose-900/30' },
};

function VaultItemCard({
  item,
  onPress,
}: {
  item: VaultItem;
  onPress: () => void;
}) {
  const config = TYPE_CONFIG[item.type];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant={item.isFavorite ? 'elevated' : 'default'} className="mb-3">
        <View className="flex-row items-start gap-3">
          {/* Type Icon */}
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${config.color}`}
          >
            <Text className="text-2xl">{config.emoji}</Text>
          </View>

          {/* Content Preview */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 flex-1">
                {item.title}
              </Text>
              {item.isFavorite && <Text>⭐</Text>}
            </View>
            <Text className="text-sm text-surface-500" numberOfLines={2}>
              {item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content}
            </Text>
            <Text className="text-xs text-surface-400 mt-1">
              {config.label} • Viewed {item.viewCount} times
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function LockedVaultView({ onUnlock }: { onUnlock: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-6">
          <Text className="text-5xl">🔐</Text>
        </View>

        <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
          Motivation Vault
        </Text>
        <Text className="text-surface-500 text-center mb-8 px-4">
          Your most personal motivations are protected with an extra layer of security.
        </Text>

        <Button
          title="Unlock with Biometrics"
          onPress={onUnlock}
          size="lg"
        />

        <Text className="text-xs text-surface-400 text-center mt-6 px-8">
          The vault contains your most private reasons for recovery.
          Authentication is required each time you access it.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function VaultIndexScreen() {
  const router = useRouter();
  const {
    items,
    isLoading,
    isVaultUnlocked,
    loadItems,
    unlockVault,
    lockVault,
    recordView,
    getFavorites,
  } = useVaultStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    return () => {
      // Lock vault when leaving
      lockVault();
    };
  }, []);

  useEffect(() => {
    if (isVaultUnlocked) {
      loadItems();
    }
  }, [isVaultUnlocked]);

  const handleUnlock = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Fallback: allow access without biometrics on devices without support
      unlockVault();
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Motivation Vault',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });

    if (result.success) {
      unlockVault();
    } else {
      Alert.alert(
        'Authentication Failed',
        'Please try again to access your vault.'
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleItemPress = async (item: VaultItem) => {
    await recordView(item.id);
    router.push(`/vault/${item.id}`);
  };

  // Show locked state
  if (!isVaultUnlocked) {
    return <LockedVaultView onUnlock={handleUnlock} />;
  }

  const favorites = getFavorites();
  const otherItems = items.filter((i) => !i.isFavorite);

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <View className="flex-1 px-4 py-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary-600">← Back</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center justify-center">
            <Text className="text-6xl mb-4">🔐</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              Your Motivation Vault
            </Text>
            <Text className="text-surface-500 text-center mt-2 mb-6 px-8">
              Store your deepest reasons for recovery, letters to yourself, and
              moments that keep you going.
            </Text>
            <Button
              title="Add Your First Motivation"
              onPress={() => router.push('/vault/new')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary-600">← Back</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Motivation Vault
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/vault/new')}
            className="bg-primary-600 rounded-full w-10 h-10 items-center justify-center"
          >
            <Text className="text-white text-2xl">+</Text>
          </TouchableOpacity>
        </View>

        {/* Encouragement Card */}
        <Card variant="elevated" className="mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30">
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">💪</Text>
            <View className="flex-1">
              <Text className="text-base font-medium text-primary-800 dark:text-primary-200">
                You have {items.length} reason{items.length !== 1 ? 's' : ''} to stay strong
              </Text>
              <Text className="text-sm text-primary-600 dark:text-primary-400">
                Revisit them whenever you need a reminder
              </Text>
            </View>
          </View>
        </Card>

        {/* Favorites */}
        {favorites.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              ⭐ Favorites ({favorites.length})
            </Text>
            {favorites.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                onPress={() => handleItemPress(item)}
              />
            ))}
          </View>
        )}

        {/* All Items */}
        {otherItems.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              All Motivations ({otherItems.length})
            </Text>
            {otherItems.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                onPress={() => handleItemPress(item)}
              />
            ))}
          </View>
        )}

        {/* Types Grid */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            Add More
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(TYPE_CONFIG).map(([type, config]) => (
              <TouchableOpacity
                key={type}
                onPress={() => router.push({ pathname: '/vault/new', params: { type } })}
                className={`px-4 py-3 rounded-xl ${config.color}`}
              >
                <Text className="text-center">
                  {config.emoji} {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Note */}
        <Card variant="outlined" className="mb-6">
          <View className="flex-row items-center gap-2">
            <Text>🔒</Text>
            <Text className="text-sm text-surface-500 flex-1">
              Everything in your vault is encrypted and stored only on your device.
              It requires authentication each time you access it.
            </Text>
          </View>
        </Card>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

