/**
 * Amends Tracker Layout
 */

import { Stack } from 'expo-router';

export default function AmendsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

