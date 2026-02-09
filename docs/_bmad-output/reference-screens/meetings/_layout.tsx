/**
 * Meetings Layout
 * Stack navigator for meeting tracker screens
 */

import { Stack } from 'expo-router';

export default function MeetingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

