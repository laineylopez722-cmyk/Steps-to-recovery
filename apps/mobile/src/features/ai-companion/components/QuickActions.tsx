/**
 * Quick Actions Component
 *
 * Pill-shaped action chips, no borders.
 * Time-aware suggestions.
 */

import React, { useMemo, useCallback } from 'react';
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from '@/platform/haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface QuickAction {
  id: string;
  label: string;
  message: string;
}

const CORE_ACTIONS: QuickAction[] = [
  {
    id: 'vent',
    label: 'Need to vent',
    message: 'I need to get something off my chest.',
  },
  {
    id: 'struggling',
    label: 'Not great',
    message: "I'm not doing great right now.",
  },
  {
    id: 'thinking',
    label: 'Think it through',
    message: 'I need help thinking through something.',
  },
];

const MORNING_ACTIONS: QuickAction[] = [
  {
    id: 'morning',
    label: 'Set intention',
    message: 'Good morning. I want to set an intention for today.',
  },
  {
    id: 'nervous',
    label: 'Anxious',
    message: "I'm anxious about something coming up today.",
  },
];

const EVENING_ACTIONS: QuickAction[] = [
  {
    id: 'reflect',
    label: 'Reflect',
    message: 'I want to reflect on how today went.',
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
    label: 'Good news',
    message: 'Something good happened — I want to tell you about it.',
  },
  {
    id: 'craving',
    label: 'Craving',
    message: "I'm experiencing a craving right now.",
  },
];

const STEP_ACTION: QuickAction = {
  id: 'steps',
  label: 'Step work',
  message: 'Can we work on step work?',
};

function getTimeBasedActions(): QuickAction[] {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return [...CORE_ACTIONS.slice(0, 2), ...MORNING_ACTIONS, STEP_ACTION];
  } else if (hour >= 12 && hour < 18) {
    return [...CORE_ACTIONS, ...AFTERNOON_ACTIONS, STEP_ACTION];
  } else if (hour >= 18 && hour < 22) {
    return [...CORE_ACTIONS.slice(0, 2), ...EVENING_ACTIONS, STEP_ACTION];
  } else {
    return [
      CORE_ACTIONS[1],
      EVENING_ACTIONS[1],
      CORE_ACTIONS[0],
      {
        id: 'lonely',
        label: 'Feeling alone',
        message: "It's late and I'm feeling alone.",
      },
    ];
  }
}

function ActionChip({
  action,
  onPress,
  disabled,
}: {
  action: QuickAction;
  onPress: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, ds.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ds.spring.smooth);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={`Quick action: ${action.label}`}
      accessibilityRole="button"
      accessibilityHint={`Sends "${action.label}" prompt to the AI companion`}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[styles.chip, disabled && styles.chipDisabled, animatedStyle]}>
        <Text style={[styles.chipText, disabled && styles.chipTextDisabled]}>{action.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

interface QuickActionsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const actions = useMemo(() => getTimeBasedActions(), []);

  const handleSelect = useCallback(
    (message: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onSelect(message);
    },
    [onSelect],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="list"
        accessibilityLabel="Quick actions"
      >
        {actions.map((action) => (
          <ActionChip
            key={action.id}
            action={action}
            onPress={() => handleSelect(action.message)}
            disabled={disabled}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.colors.borderSubtle,
    },
    scrollContent: {
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      gap: ds.space[2],
    },

    chip: {
      backgroundColor: ds.colors.bgTertiary,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.full,
    },
    chipDisabled: {
      opacity: 0.4,
    },

    chipText: {
      fontSize: 15,
      fontWeight: '500',
      color: ds.colors.textSecondary,
    },
    chipTextDisabled: {
      color: ds.colors.textQuaternary,
    },
  }) as const;

