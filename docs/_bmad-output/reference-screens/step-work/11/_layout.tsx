/**
 * Eleventh Step Practice Layout
 */

import { Stack } from 'expo-router';

export default function EleventhStepLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

