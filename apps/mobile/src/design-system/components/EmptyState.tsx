/**
 * Empty State Component with Illustrations
 * Premium empty states that guide and delight
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { aestheticColors } from '../tokens/aesthetic';
import { Button } from './Button';

export interface EmptyStateProps {
  /** Visual icon name from MaterialCommunityIcons */
  icon: string;
  /** Main title text */
  title: string;
  /** Supporting description */
  description: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action handler */
  onAction?: () => void;
  /** Variant style */
  variant?: 'default' | 'glass' | 'minimal';
  /** Custom style override */
  style?: ViewStyle;
}

// Convenience exports for specific empty states
export function EmptySearch(props: Omit<EmptyStateProps, 'icon'>): React.ReactElement {
  return <EmptyState {...props} icon="magnify" />;
}

export function EmptyJournal(props: Omit<EmptyStateProps, 'icon'>): React.ReactElement {
  return <EmptyState {...props} icon="book-open" />;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant: _variant = 'default',
  style,
}: EmptyStateProps): React.ReactElement {
  const theme = useTheme();

  const iconColors: Record<string, string> = {
    'book': aestheticColors.primary[400],
    'book-open': aestheticColors.primary[400],
    'book-open-variant': aestheticColors.primary[400],
    'calendar': aestheticColors.secondary[400],
    'chart-line': aestheticColors.accent[400],
    'check-circle': aestheticColors.success.DEFAULT,
    'emoticon': aestheticColors.gold.DEFAULT,
    'file-document': aestheticColors.primary[400],
    'heart': aestheticColors.warning.DEFAULT,
    'meditation': aestheticColors.secondary[400],
    'note': aestheticColors.primary[400],
    'notebook': aestheticColors.primary[400],
    'phone': aestheticColors.warning.DEFAULT,
    'search': theme.colors.textSecondary,
    'search-off': theme.colors.textSecondary,
    'shield': aestheticColors.success.DEFAULT,
    'star': aestheticColors.gold.DEFAULT,
    'users': aestheticColors.accent[400],
    'default': theme.colors.primary,
  };

  const iconColor = iconColors[icon] || iconColors.default;

  return (
    <Animated.View 
      entering={FadeInUp.duration(400)}
      style={[styles.container, style]}
    >
      {/* Icon Container with Glow */}
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={48}
          color={iconColor}
        />
        {/* Glow effect */}
        <View 
          style={[
            styles.glow,
            { backgroundColor: iconColor }
          ]} 
          pointerEvents="none" 
        />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.actionButton}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  } as ViewStyle,
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  } as ViewStyle,
  glow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
    blur: 20,
  } as ViewStyle,
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  } as TextStyle,
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  } as TextStyle,
  actionButton: {
    minWidth: 160,
  },
});
