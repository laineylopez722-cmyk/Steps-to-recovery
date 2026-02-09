/**
 * My Meetings Layout
 * Stack navigator for regular meetings management
 */

import { Stack } from 'expo-router';

export default function MyMeetingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

