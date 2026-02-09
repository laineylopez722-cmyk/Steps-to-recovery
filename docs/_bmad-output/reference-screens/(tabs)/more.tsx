/**
 * More Tab Screen
 * Additional tools and resources menu - matches reference site design
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: FeatherIconName;
  route: string;
  iconColor?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'worksheets',
    title: 'Worksheets',
    description: 'Recovery worksheets and exercises',
    icon: 'file-text',
    route: '/step-work',
  },
  {
    id: 'meetings',
    title: 'Meetings',
    description: 'Track your meeting attendance',
    icon: 'users',
    route: '/meetings',
  },
  {
    id: 'resources',
    title: 'Resources',
    description: 'Helpful recovery resources',
    icon: 'book',
    route: '/readings',
  },
  {
    id: 'contacts',
    title: 'Contacts',
    description: 'Sponsor and fellowship contacts',
    icon: 'phone',
    route: '/contacts',
  },
  {
    id: 'sponsor',
    title: 'Sponsor Connection',
    description: 'Connect and share with your sponsor',
    icon: 'link',
    route: '/contacts',
  },
  {
    id: 'vault',
    title: 'Motivation Vault',
    description: 'Your personal reasons for recovery',
    icon: 'lock',
    route: '/vault',
  },
  {
    id: 'achievements',
    title: 'Achievements',
    description: 'View your progress and milestones',
    icon: 'award',
    route: '/achievements',
  },
  {
    id: 'capsule',
    title: 'Time Capsule',
    description: 'Letters to your future self',
    icon: 'mail',
    route: '/capsule',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'App preferences and data',
    icon: 'settings',
    route: '/settings',
  },
];

function MenuCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-navy-800/40 rounded-2xl p-4 border border-surface-700/30"
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={item.description}
    >
      <View className="flex-row items-center">
        <View className="bg-primary-500/20 p-3 rounded-xl mr-3">
          <Feather name={item.icon} size={22} color="#60a5fa" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.title}</Text>
          <Text className="text-surface-400 text-sm mt-0.5" numberOfLines={1}>
            {item.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();

  const handlePress = (route: string) => {
    router.push(route as Href);
  };

  // Split items into pairs for 2-column grid
  const rows: MenuItem[][] = [];
  for (let i = 0; i < MENU_ITEMS.length; i += 2) {
    rows.push(MENU_ITEMS.slice(i, i + 2));
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-6">
          <Text className="text-2xl font-bold text-white mb-1">More</Text>
          <Text className="text-surface-400">Additional tools and resources</Text>
        </View>

        {/* Menu Grid */}
        <View className="px-4 pb-8">
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-3 mb-3">
              {row.map((item) => (
                <View key={item.id} className="flex-1">
                  <MenuCard item={item} onPress={() => handlePress(item.route)} />
                </View>
              ))}
              {/* Add empty spacer if odd number of items in last row */}
              {row.length === 1 && <View className="flex-1" />}
            </View>
          ))}
        </View>

        {/* App Info */}
        <View className="px-4 pb-8">
          <View className="bg-navy-800/20 rounded-2xl p-4 items-center border border-surface-700/20">
            <Text className="text-surface-500 text-sm">Recovery Companion</Text>
            <Text className="text-surface-600 text-xs mt-1">Version 1.0.0</Text>
            <Text className="text-surface-600 text-xs mt-1">Your journey, your privacy.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

