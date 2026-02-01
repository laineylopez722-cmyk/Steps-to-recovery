/**
 * Crisis Quick Access Button (FAB)
 * Provides instant access to emergency resources from any screen
 * Target: < 5 seconds to reach help
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Modal, Pressable } from 'react-native';
import { useRouterCompat, useSegmentsCompat } from '../../utils/navigationHelper';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '@recovery/shared';
import { getCrisisResources, type CrisisResource } from '@recovery/shared';

export function CrisisButton() {
  const [showQuickHelp, setShowQuickHelp] = useState(false);
  const router = useRouterCompat();
  const segments = useSegmentsCompat();
  const { settings } = useSettingsStore();

  // Get region-specific quick resources
  const currentRegion = settings?.crisisRegion || 'AU';
  const resources = getCrisisResources(currentRegion);
  const quickResources = resources.quickResources;

  // Hide on certain screens
  const currentPath = segments.join('/');
  const hiddenPaths = ['onboarding', 'emergency', '(auth)', 'lock', 'scenarios'];

  const shouldHide = hiddenPaths.some((path) => currentPath.includes(path));

  if (shouldHide) return null;

  const handlePress = () => {
    setShowQuickHelp(true);
  };

  const handleGoToResources = () => {
    setShowQuickHelp(false);
    router.push('/(tabs)/emergency');
  };

  const handleCallResource = (resource: CrisisResource) => {
    setShowQuickHelp(false);
    Linking.openURL(`tel:${resource.phone}`);
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className="absolute bottom-24 right-4 z-50"
        accessibilityRole="button"
        accessibilityLabel="Need help? Tap for crisis resources"
        accessibilityHint="Opens quick access to emergency hotlines and resources"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="bg-danger-500 rounded-full w-14 h-14 items-center justify-center border-2 border-danger-400">
          <Feather name="alert-circle" size={28} color="#fff" />
        </View>
        {/* Pulse animation indicator */}
        <View
          className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View className="bg-danger-500 rounded-full w-2 h-2" />
        </View>
      </TouchableOpacity>

      {/* Quick Help Modal */}
      <Modal
        visible={showQuickHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickHelp(false)}
      >
        <Pressable
          className="flex-1 bg-black/70 justify-end"
          onPress={() => setShowQuickHelp(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-navy-900 rounded-t-3xl p-6 pb-8 border-t border-surface-700/30"
          >
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-surface-600 rounded-full mb-4" />
              <Text className="text-xl font-bold text-white">Need Help Right Now?</Text>
              <Text className="text-surface-400 text-center mt-1">
                You're not alone. Reach out immediately.
              </Text>
              <Text className="text-surface-500 text-center text-xs mt-1">📍 {resources.name}</Text>
            </View>

            {/* Quick Actions */}
            <View className="gap-3">
              {quickResources.map((resource: CrisisResource) => (
                <TouchableOpacity
                  key={resource.id}
                  onPress={() => handleCallResource(resource)}
                  className={`${resource.color} rounded-xl p-4 flex-row items-center gap-4`}
                  accessibilityRole="button"
                  accessibilityLabel={`${resource.title}: ${resource.subtitle}`}
                >
                  <Text className="text-2xl">{resource.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{resource.title}</Text>
                    <Text className="text-white/80">{resource.subtitle}</Text>
                  </View>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
              ))}
            </View>

            {/* More Resources Link */}
            <TouchableOpacity
              onPress={handleGoToResources}
              className="mt-4 py-3 items-center"
              accessibilityRole="button"
              accessibilityLabel="View all emergency resources"
            >
              <Text className="text-primary-400 font-medium">View All Resources →</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowQuickHelp(false)}
              className="mt-2 py-3 items-center"
              accessibilityRole="button"
              accessibilityLabel="Close this menu"
            >
              <Text className="text-surface-500">Close</Text>
            </TouchableOpacity>

            {/* Safe messaging */}
            <View className="mt-4 p-3 bg-navy-800/50 rounded-lg border border-surface-700/30">
              <Text className="text-xs text-surface-400 text-center">
                💚 It takes courage to reach out. Whatever you're going through, help is available
                24/7.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default CrisisButton;
