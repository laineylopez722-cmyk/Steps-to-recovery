/**
 * iOS-style ListItem Component
 * Reusable list item with icon, label, value, and chevron support
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTheme } from '../hooks/useTheme';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface ListItemProps {
  label: string;
  value?: string;
  icon?: MaterialIconName;
  iconColor?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ListItem({
  label,
  value,
  icon,
  iconColor,
  leftElement,
  rightElement,
  showChevron = false,
  onPress,
  disabled = false,
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
}: ListItemProps): React.ReactElement {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
        },
        containerStyle,
      ]}
    >
      {/* Left Side: Icon or Custom Element */}
      {leftElement || icon ? (
        <View style={styles.leftContainer}>
          {leftElement || (
            <MaterialIcons name={icon} size={24} color={iconColor || theme.colors.primary} />
          )}
        </View>
      ) : null}

      {/* Center: Label and Value */}
      <View style={styles.contentContainer}>
        <Text
          style={[
            theme.typography.body,
            { color: disabled ? theme.colors.textSecondary : theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {value && (
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary }, styles.value]}
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
      </View>

      {/* Right Side: Custom Element or Chevron */}
      {rightElement || showChevron ? (
        <View style={styles.rightContainer}>
          {rightElement || (
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          )}
        </View>
      ) : null}
    </View>
  );

  // If pressable, wrap in Pressable with ripple effect
  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [pressed && { opacity: 0.6 }]}
      >
        {content}
      </Pressable>
    );
  }

  // Otherwise, just render the content
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `${label}${value ? `, ${value}` : ''}`}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48, // WCAG minimum touch target
  },
  leftContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  value: {
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
