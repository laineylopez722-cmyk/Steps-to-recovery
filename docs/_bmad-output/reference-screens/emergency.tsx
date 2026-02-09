/**
 * Emergency Resources Screen
 * Crisis hotlines and immediate help resources
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../components/ui';
import { useSettingsStore } from '../lib/store';
import {
  getAvailableRegions,
  getCrisisResources,
  COPING_STRATEGIES,
  type CrisisHotline,
} from '../lib/constants/crisisResources';
import type { CrisisRegion } from '../lib/types';

function HotlineCard({
  hotline,
  onCall,
}: {
  hotline: CrisisHotline;
  onCall: () => void;
}) {
  return (
    <TouchableOpacity onPress={onCall} activeOpacity={0.8}>
      <Card variant="elevated" className="mb-3">
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: hotline.color }}
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
          >
            <Text className="text-white text-xl">📞</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {hotline.name}
            </Text>
            <Text className="text-primary-600 font-bold">{hotline.phone}</Text>
            <Text className="text-sm text-surface-500" numberOfLines={1}>
              {hotline.description}
            </Text>
          </View>
          <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
            <Text className="text-green-700 dark:text-green-300 text-xs">
              {hotline.available}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function EmergencyScreen() {
  const router = useRouter();
  const { settings, setCrisisRegion } = useSettingsStore();

  const currentRegion = settings?.crisisRegion || 'US';
  const resources = getCrisisResources(currentRegion);
  const availableRegions = getAvailableRegions();

  const handleCall = (hotline: CrisisHotline) => {
    const phoneNumber = hotline.phone.replace(/\D/g, '');

    // Special handling for emergency numbers
    if (hotline.isEmergency) {
      Alert.alert(
        `Call ${hotline.name} (${hotline.phone})?`,
        'This will connect you to emergency services for life-threatening emergencies only.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Call ${hotline.phone}`,
            style: 'destructive',
            onPress: () => Linking.openURL(`tel:${phoneNumber}`),
          },
        ]
      );
      return;
    }

    Alert.alert(
      `Call ${hotline.name}?`,
      `You will be connected to ${hotline.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`),
        },
      ]
    );
  };

  const handleChangeRegion = () => {
    Alert.alert(
      'Select Your Region',
      'Choose your region for local crisis resources',
      availableRegions.map(({ code, name }) => ({
        text: name,
        onPress: () => setCrisisRegion(code as CrisisRegion),
        style: code === currentRegion ? 'default' : undefined,
      }))
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleChangeRegion}
            className="bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full"
          >
            <Text className="text-surface-600 dark:text-surface-300 text-sm">
              📍 {resources.name}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Banner */}
        <Card
          variant="elevated"
          className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <View className="items-center py-2">
            <Text className="text-4xl mb-2">🆘</Text>
            <Text className="text-xl font-bold text-red-700 dark:text-red-300 text-center">
              You Are Not Alone
            </Text>
            <Text className="text-red-600 dark:text-red-400 text-center mt-1">
              Help is available right now. Reaching out is a sign of strength.
            </Text>
          </View>
        </Card>

        {/* Crisis Hotlines */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            Crisis Hotlines ({resources.name})
          </Text>
          {resources.hotlines.map((hotline) => (
            <HotlineCard
              key={hotline.id}
              hotline={hotline}
              onCall={() => handleCall(hotline)}
            />
          ))}
        </View>

        {/* Coping Strategies */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            Coping Strategies
          </Text>
          <Card variant="default">
            {COPING_STRATEGIES.map((strategy, index) => (
              <View
                key={strategy.title}
                className={`flex-row items-center py-3 ${index < COPING_STRATEGIES.length - 1
                  ? 'border-b border-surface-100 dark:border-surface-800'
                  : ''
                  }`}
              >
                <Text className="text-2xl mr-3">{strategy.icon}</Text>
                <View className="flex-1">
                  <Text className="font-medium text-surface-900 dark:text-surface-100">
                    {strategy.title}
                  </Text>
                  <Text className="text-sm text-surface-500">
                    {strategy.description}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/breathing')}
            className="flex-1 bg-secondary-100 dark:bg-secondary-900/30 rounded-2xl p-4 items-center"
          >
            <Text className="text-3xl mb-2">🧘</Text>
            <Text className="text-secondary-700 dark:text-secondary-300 font-medium">
              Breathing Exercise
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/journal/new')}
            className="flex-1 bg-primary-100 dark:bg-primary-900/30 rounded-2xl p-4 items-center"
          >
            <Text className="text-3xl mb-2">📝</Text>
            <Text className="text-primary-700 dark:text-primary-300 font-medium">
              Write It Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Affirmation */}
        <Card variant="outlined" className="mb-8">
          <Text className="text-surface-700 dark:text-surface-300 text-center text-lg italic">
            "This craving will pass. It always does. You don't have to act on it."
          </Text>
        </Card>

        {/* Serenity Prayer */}
        <Card variant="default" className="bg-primary-50 dark:bg-primary-900/20 mb-6">
          <Text className="text-center text-primary-800 dark:text-primary-200 leading-relaxed">
            God, grant me the serenity to accept the things I cannot change,{'\n'}
            courage to change the things I can,{'\n'}
            and wisdom to know the difference.
          </Text>
        </Card>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
