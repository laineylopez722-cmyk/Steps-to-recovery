/**
 * iOS-style EmptyState Component
 * Consistent empty state pattern for lists and collections
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import type { ButtonProps } from './Button';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface EmptyStateProps {
  icon?: MaterialIconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonProps['variant'];
  containerStyle?: ViewStyle;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  containerStyle,
}: EmptyStateProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, containerStyle]}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description || ''}`}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialIcons name={icon} size={48} color={theme.colors.textSecondary} />
      </View>

      {/* Title */}
      <Text
        style={[
          theme.typography.title3,
          { color: theme.colors.textSecondary, textAlign: 'center' },
          styles.title,
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: 'center' },
            styles.description,
          ]}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          size="medium"
          onPress={onAction}
          accessibilityLabel={actionLabel}
          style={styles.action}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    lineHeight: 22,
  },
  action: {
    minWidth: 140,
  },
});
