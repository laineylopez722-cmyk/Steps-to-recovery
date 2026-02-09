/**
 * Trigger Scenarios Layout
 */

import { Stack } from 'expo-router';

export default function ScenariosLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="history" />
    </Stack>
  );
}

