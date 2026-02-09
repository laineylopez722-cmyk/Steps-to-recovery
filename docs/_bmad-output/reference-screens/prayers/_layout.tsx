/**
 * Prayer Library Layout
 */

import { Stack } from 'expo-router';

export default function PrayersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

