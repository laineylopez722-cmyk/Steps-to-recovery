/**
 * Authenticated Routes Group Layout
 * 
 * Wraps all authenticated (logged-in) routes.
 * Uses the same tab bar as React Navigation for consistency.
 * 
 * Phase 1: Parallel Routes Setup
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function AuthLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Today', href: '/(auth)/index' }} 
      />
      <Tabs.Screen 
        name="journal" 
        options={{ title: 'Journal', href: '/(auth)/journal' }} 
      />
      <Tabs.Screen 
        name="steps" 
        options={{ title: 'Steps', href: '/(auth)/steps' }} 
      />
      <Tabs.Screen 
        name="meetings" 
        options={{ title: 'Meetings', href: '/(auth)/meetings' }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile', href: '/(auth)/profile' }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: 0,
  },
});
