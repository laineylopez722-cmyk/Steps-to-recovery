/**
 * Tab Layout
 * 6-tab navigation matching reference site design
 * BMAD Upgrade: Floating Glass Tab Bar
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

// Tab configuration with icons
const TAB_CONFIG: Record<string, { icon: FeatherIconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  steps: { icon: 'book-open', label: 'Steps' },
  journal: { icon: 'edit-3', label: 'Journal' },
  insights: { icon: 'bar-chart-2', label: 'Insights' },
  emergency: { icon: 'alert-circle', label: 'Emergency' },
  more: { icon: 'more-horizontal', label: 'More' },
};

// Tab bar icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const config = TAB_CONFIG[name] || { icon: 'circle', label: name };
  const activeColor = '#60a5fa'; // primary-400
  const inactiveColor = '#94a3b8'; // surface-400

  return (
    <View className="items-center justify-center py-1">
      <View
        className={`p-2 rounded-xl ${focused ? 'bg-primary-500/20' : 'bg-transparent'}`}
      >
        <Feather
          name={config.icon}
          size={20}
          color={focused ? activeColor : inactiveColor}
        />
      </View>
      <Text
        className={`text-[10px] mt-0.5 ${focused
          ? 'text-primary-400 font-semibold'
          : 'text-surface-500'
          }`}
      >
        {config.label}
      </Text>
    </View>
  );
}

const SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: {
    position: 'absolute' as const,
    bottom: 20,
    left: 16,
    right: 16,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  tabBarBackground: () => (
    <BlurView
      intensity={30}
      tint="dark"
      style={StyleSheet.absoluteFill}
      className="rounded-[36px] overflow-hidden border border-white/10 bg-navy-900/60"
    />
  ),
  tabBarShowLabel: false,
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={SCREEN_OPTIONS}>
      {Object.entries(TAB_CONFIG).map(([name, config]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: config.label,
            tabBarIcon: ({ focused }) => <TabIcon name={name} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
