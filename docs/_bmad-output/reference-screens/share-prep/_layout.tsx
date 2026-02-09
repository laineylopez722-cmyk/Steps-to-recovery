/**
 * Share Prep Layout
 * Stack navigator for share preparation
 */

import { Stack } from 'expo-router';

export default function SharePrepLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}

