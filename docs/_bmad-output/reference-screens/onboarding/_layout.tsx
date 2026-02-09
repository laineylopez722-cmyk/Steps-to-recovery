/**
 * Onboarding Layout
 * Flow for first-time user setup
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="date" />
      <Stack.Screen name="program" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

