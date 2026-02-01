/**
 * iOS-style Toggle Component
 * A themed switch control for on/off settings
 */

import React, { useCallback } from 'react';
import { View, Switch, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { hapticSelection } from '../../utils/haptics';

export interface ToggleProps {
  /**
   * Current state of the toggle
   */
  value: boolean;
  /**
   * Callback when toggle state changes
   */
  onValueChange: (value: boolean) => void;
  /**
   * Label text to display next to the toggle
   */
  label?: string;
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom track color when toggle is on
   * If not provided, uses theme.colors.primary
   */
  trackColor?: string;
  /**
   * Custom container style
   */
  style?: ViewStyle;

  /**
   * Accessibility label for the switch (defaults to `label`)
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint for the switch
   */
  accessibilityHint?: string;
}

export function Toggle({
  value,
  onValueChange,
  label,
  disabled = false,
  trackColor,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ToggleProps) {
  const theme = useTheme();

  const activeTrackColor = trackColor || theme.colors.primary;
  const inactiveTrackColor = theme.isDark ? 'rgba(142,142,147,0.3)' : 'rgba(142,142,147,0.2)';

  const thumbColor = Platform.OS === 'ios' ? '#FFFFFF' : value ? activeTrackColor : '#FFFFFF';

  const handleValueChange = useCallback(
    async (newValue: boolean): Promise<void> => {
      await hapticSelection();
      onValueChange(newValue);
    },
    [onValueChange],
  );

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            theme.typography.body,
            {
              flex: 1,
              color: disabled ? theme.colors.textSecondary : theme.colors.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <Switch
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        trackColor={{
          false: inactiveTrackColor,
          true: activeTrackColor,
        }}
        thumbColor={thumbColor}
        ios_backgroundColor={inactiveTrackColor}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44, // WCAG minimum touch target
  },
});
