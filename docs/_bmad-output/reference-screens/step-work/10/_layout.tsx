/**
 * Tenth Step Review Layout
 */

import { Stack } from 'expo-router';

export default function TenthStepLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="review" />
    </Stack>
  );
}

