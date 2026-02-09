/**
 * Journal Layout
 * Wraps journal screens
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="new" />
      <Stack.Screen name="voice" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

