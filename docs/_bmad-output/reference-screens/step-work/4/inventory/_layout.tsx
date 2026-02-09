/**
 * Fourth Step Inventory Layout
 */

import { Stack } from 'expo-router';

export default function FourthStepInventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[type]" />
    </Stack>
  );
}

