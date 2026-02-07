/**
 * Chat Skeleton Component
 * Loading placeholder for chat messages.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

export function ChatSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View className="flex-1 px-4 py-6">
      {/* AI message skeleton */}
      <View className="flex-row justify-start mb-4">
        <Animated.View
          style={{ opacity }}
          className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]"
        >
          <View className="h-4 w-48 bg-gray-700 rounded mb-2" />
          <View className="h-4 w-36 bg-gray-700 rounded" />
        </Animated.View>
      </View>

      {/* User message skeleton */}
      <View className="flex-row justify-end mb-4">
        <Animated.View
          style={{ opacity }}
          className="bg-amber-500/30 rounded-2xl rounded-br-sm px-4 py-3 max-w-[70%]"
        >
          <View className="h-4 w-32 bg-amber-500/40 rounded" />
        </Animated.View>
      </View>

      {/* AI message skeleton */}
      <View className="flex-row justify-start mb-4">
        <Animated.View
          style={{ opacity }}
          className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[75%]"
        >
          <View className="h-4 w-52 bg-gray-700 rounded mb-2" />
          <View className="h-4 w-44 bg-gray-700 rounded mb-2" />
          <View className="h-4 w-28 bg-gray-700 rounded" />
        </Animated.View>
      </View>
    </View>
  );
}
