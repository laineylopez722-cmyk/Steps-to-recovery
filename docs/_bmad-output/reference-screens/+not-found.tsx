/**
 * Not Found Screen
 * 404 page using NativeWind and app design system
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-navy-950 p-6">
        {/* Icon */}
        <View className="w-24 h-24 rounded-full bg-primary-500/20 items-center justify-center mb-6">
          <Text className="text-5xl">🧭</Text>
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-white text-center mb-2">
          Page Not Found
        </Text>

        {/* Message */}
        <Text className="text-surface-400 text-center mb-8 px-4">
          The page you're looking for doesn't exist or has been moved.
        </Text>

        {/* Return Home Button */}
        <TouchableOpacity
          onPress={() => router.replace('/')}
          className="bg-primary-500 rounded-xl px-8 py-4 mb-4"
          accessibilityRole="button"
          accessibilityLabel="Go to home screen"
        >
          <Text className="text-white font-semibold text-lg">Go Home</Text>
        </TouchableOpacity>

        {/* Alternative Link */}
        <Link href="/(tabs)" asChild>
          <TouchableOpacity
            className="px-4 py-2"
            accessibilityRole="link"
            accessibilityLabel="Open main dashboard"
          >
            <Text className="text-primary-400 text-base">
              Open Dashboard →
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}
