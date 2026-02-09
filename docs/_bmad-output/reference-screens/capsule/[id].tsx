/**
 * Time Capsule Detail Screen
 * View or unlock a time capsule
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useCapsuleStore } from '../../lib/store';
import type { TimeCapsule } from '../../lib/types';

export default function CapsuleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getCapsuleById,
    unlockCapsule,
    deleteCapsule,
    unlockedCapsule,
    decryptedContent,
    clearUnlockedCapsule,
  } = useCapsuleStore();

  const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [localContent, setLocalContent] = useState<string | null>(null);

  // Animations
  const envelopeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCapsule();
    return () => {
      clearUnlockedCapsule();
    };
  }, [id]);

  const loadCapsule = async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getCapsuleById(id);
    setCapsule(data);
    setIsLoading(false);
  };

  const now = new Date();
  const isReady = capsule && capsule.unlockDate <= now;
  const daysUntilUnlock = capsule
    ? Math.ceil(
        (capsule.unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const handleUnlock = async () => {
    if (!id || !capsule) return;

    setIsUnlocking(true);

    // Envelope opening animation
    Animated.timing(envelopeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Delay then unlock
    setTimeout(async () => {
      const content = await unlockCapsule(id);
      if (content) {
        setLocalContent(content);
        setCapsule({ ...capsule, isUnlocked: true, unlockedAt: new Date() });

        // Content reveal animation
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
      setIsUnlocking(false);
    }, 1000);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Time Capsule',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteCapsule(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!capsule) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center px-6">
        <Text className="text-5xl mb-4">💌</Text>
        <Text className="text-xl font-semibold text-surface-900 dark:text-surface-100 text-center">
          Capsule Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-500 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Already unlocked or just unlocked - show content
  if (capsule.isUnlocked || localContent) {
    const contentToShow = localContent || decryptedContent || '';

    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <ScrollView className="flex-1 px-4 py-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary-600">← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Text className="text-red-500">Delete</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Animated.View
            style={{ opacity: contentAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1],
            }) }}
            className="items-center mb-6"
          >
            <Text className="text-4xl mb-2">📖</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              {capsule.title}
            </Text>
            <Text className="text-surface-500 mt-1">
              Written{' '}
              {capsule.createdAt.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {capsule.unlockedAt && (
              <Text className="text-green-600 dark:text-green-400 text-sm">
                Opened{' '}
                {capsule.unlockedAt.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            )}
          </Animated.View>

          {/* Content */}
          <Animated.View style={{ opacity: contentAnim }}>
            <Card variant="elevated" className="mb-6">
              <Text className="text-surface-800 dark:text-surface-200 text-base leading-7 whitespace-pre-wrap">
                {contentToShow}
              </Text>
            </Card>
          </Animated.View>

          {/* Reflection prompt */}
          <Card variant="outlined" className="mb-6">
            <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
              💭 Reflection
            </Text>
            <Text className="text-surface-500">
              How does it feel to read this message from your past self? Take a
              moment to appreciate how far you've come.
            </Text>
          </Card>

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Locked capsule - show unlock UI
  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <View className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white/70">← Back</Text>
          </TouchableOpacity>
          {!isReady && (
            <TouchableOpacity onPress={handleDelete}>
              <Text className="text-red-400">Delete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Envelope visualization */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={{
              transform: [
                {
                  rotateY: envelopeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            <View className="w-48 h-36 bg-amber-100 dark:bg-amber-900/50 rounded-lg items-center justify-center shadow-lg">
              <Text className="text-6xl">
                {isReady ? '✨' : '🔐'}
              </Text>
            </View>
          </Animated.View>

          <Text className="text-2xl font-bold text-white text-center mt-8">
            {capsule.title}
          </Text>

          {isReady ? (
            <>
              <Text className="text-amber-400 text-center mt-2 text-lg">
                Ready to open!
              </Text>
              <Text className="text-white/60 text-center mt-1">
                Your message from{' '}
                {capsule.createdAt.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                awaits
              </Text>
            </>
          ) : (
            <>
              <Text className="text-white/70 text-center mt-2">
                Unlocks on{' '}
                {capsule.unlockDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <View className="mt-6 bg-white/10 rounded-2xl px-6 py-4">
                <Text className="text-4xl font-bold text-white text-center">
                  {daysUntilUnlock}
                </Text>
                <Text className="text-white/60 text-center">
                  day{daysUntilUnlock !== 1 ? 's' : ''} remaining
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Unlock button */}
        {isReady && (
          <View className="mb-8">
            <Button
              title={isUnlocking ? 'Opening...' : 'Open Time Capsule 💌'}
              onPress={handleUnlock}
              disabled={isUnlocking}
              size="lg"
            />
          </View>
        )}

        {/* Info for locked capsules */}
        {!isReady && (
          <Card variant="default" className="bg-white/5 mb-8">
            <View className="flex-row items-center gap-2">
              <Text>💡</Text>
              <Text className="text-white/60 text-sm flex-1">
                This capsule is time-locked. Come back when the unlock date
                arrives to read your message.
              </Text>
            </View>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}

