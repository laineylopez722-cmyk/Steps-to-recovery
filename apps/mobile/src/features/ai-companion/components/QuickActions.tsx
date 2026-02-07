/**
 * Quick Actions Component
 * Horizontal scroll of action chips for common recovery intents.
 * Shows different suggestions based on time of day.
 */

import React, { useMemo, useCallback } from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface QuickAction {
  id: string;
  label: string;
  message: string;
}

// Core actions always available
const CORE_ACTIONS: QuickAction[] = [
  {
    id: 'vent',
    label: 'I need to vent',
    message: "I need to get something off my chest.",
  },
  {
    id: 'struggling',
    label: "Not doing great",
    message: "I'm not doing great right now.",
  },
  {
    id: 'thinking',
    label: 'Help me think',
    message: "I need help thinking through something.",
  },
];

// Time-specific actions
const MORNING_ACTIONS: QuickAction[] = [
  {
    id: 'morning',
    label: "Starting my day",
    message: "Good morning. I want to set an intention for today.",
  },
  {
    id: 'nervous',
    label: 'Nervous about today',
    message: "I'm anxious about something coming up today.",
  },
];

const EVENING_ACTIONS: QuickAction[] = [
  {
    id: 'reflect',
    label: 'Reflect on today',
    message: "I want to reflect on how today went.",
  },
  {
    id: 'cant_sleep',
    label: "Can't sleep",
    message: "I can't sleep. My mind won't stop.",
  },
];

const AFTERNOON_ACTIONS: QuickAction[] = [
  {
    id: 'win',
    label: 'Had a win today',
    message: "Something good happened — I want to tell you about it.",
  },
  {
    id: 'craving',
    label: 'Having a craving',
    message: "I'm experiencing a craving right now.",
  },
];

const STEP_ACTION: QuickAction = {
  id: 'steps',
  label: 'Step work',
  message: "Can we work on step work?",
};

function getTimeBasedActions(): QuickAction[] {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    // Morning (5am - 12pm)
    return [...CORE_ACTIONS.slice(0, 2), ...MORNING_ACTIONS, STEP_ACTION];
  } else if (hour >= 12 && hour < 18) {
    // Afternoon (12pm - 6pm)
    return [...CORE_ACTIONS, ...AFTERNOON_ACTIONS, STEP_ACTION];
  } else if (hour >= 18 && hour < 22) {
    // Evening (6pm - 10pm)
    return [...CORE_ACTIONS.slice(0, 2), ...EVENING_ACTIONS, STEP_ACTION];
  } else {
    // Night (10pm - 5am)
    return [
      CORE_ACTIONS[1], // Not doing great
      EVENING_ACTIONS[1], // Can't sleep
      CORE_ACTIONS[0], // Vent
      {
        id: 'lonely',
        label: "Feeling alone",
        message: "It's late and I'm feeling alone.",
      },
    ];
  }
}

interface QuickActionsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  // Get time-based actions (memoized to avoid recalculating on every render)
  const actions = useMemo(() => getTimeBasedActions(), []);

  const handleSelect = useCallback((message: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect(message);
  }, [onSelect]);

  return (
    <View className="border-t border-gray-800/50">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="py-3"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        accessibilityRole="list"
        accessibilityLabel="Quick actions"
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handleSelect(action.message)}
            disabled={disabled}
            activeOpacity={0.7}
            className={`
              px-4 py-2.5 rounded-full border
              ${disabled 
                ? 'border-gray-800 opacity-40' 
                : 'border-gray-700 bg-gray-900/50 active:bg-gray-800'
              }
            `}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{ disabled }}
          >
            <Text className={`text-sm ${disabled ? 'text-gray-600' : 'text-gray-300'}`}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
