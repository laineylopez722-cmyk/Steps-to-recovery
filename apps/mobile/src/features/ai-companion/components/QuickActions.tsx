/**
 * Quick Actions Component
 * Horizontal scroll of action chips for common recovery intents.
 */

import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';

interface QuickAction {
  id: string;
  label: string;
  message: string;
}

const QUICK_ACTIONS: QuickAction[] = [
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
  {
    id: 'win',
    label: 'Had a win today',
    message: "Something good happened — I want to tell you about it.",
  },
  {
    id: 'steps',
    label: 'Step work',
    message: "Can we work on step work?",
  },
];

interface QuickActionsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-2 px-2"
      contentContainerStyle={{ paddingHorizontal: 8 }}
      accessibilityRole="list"
      accessibilityLabel="Quick actions"
    >
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={() => onSelect(action.message)}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-full mr-2 border
            ${disabled ? 'border-gray-700 opacity-50' : 'border-gray-600 active:bg-gray-800'}
          `}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled }}
        >
          <Text className="text-gray-300 text-sm">{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
