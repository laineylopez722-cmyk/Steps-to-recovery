/**
 * iOS-style Badge Component
 * Self-sizing pill with color variants for categories and status
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, AccessibilityRole } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface BadgeProps {
  children: string | React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted' | 'category';
  category?:
    | 'gratitude'
    | 'reflection'
    | 'action'
    | 'connection'
    | 'self-care'
    | 'sponsor'
    | 'meeting';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
}

export function Badge({
  children,
  variant = 'primary',
  category,
  size = 'medium',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
}: BadgeProps) {
  const theme = useTheme();

  // Determine background and text colors based on variant or category
  const getColors = () => {
    // Category-specific colors take precedence
    if (variant === 'category' && category) {
      const categoryColor = theme.categoryColors[category];
      return {
        background: categoryColor,
        text: '#FFFFFF', // White text for all category colors
      };
    }

    // Standard variant colors
    switch (variant) {
      case 'primary':
        return { background: theme.colors.primary, text: '#FFFFFF' };
      case 'secondary':
        return { background: theme.colors.secondary, text: '#FFFFFF' };
      case 'success':
        return { background: theme.colors.success, text: '#FFFFFF' };
      case 'warning':
        return { background: theme.colors.warning, text: '#FFFFFF' };
      case 'danger':
        return { background: theme.colors.danger, text: '#FFFFFF' };
      case 'muted':
        return {
          background: theme.isDark ? 'rgba(142,142,147,0.3)' : 'rgba(142,142,147,0.2)',
          text: theme.colors.textSecondary,
        };
      default:
        return { background: theme.colors.primary, text: '#FFFFFF' };
    }
  };

  // Size-based padding and font size
  const getSizeStyles = (): { containerStyle: ViewStyle; textStyle: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          containerStyle: { paddingHorizontal: 8, paddingVertical: 2, minHeight: 20 },
          textStyle: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
        };
      case 'medium':
        return {
          containerStyle: { paddingHorizontal: 12, paddingVertical: 4, minHeight: 24 },
          textStyle: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
        };
      case 'large':
        return {
          containerStyle: { paddingHorizontal: 16, paddingVertical: 6, minHeight: 32 },
          textStyle: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
        };
    }
  };

  const colors = getColors();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderRadius: theme.radius.badge,
        },
        sizeStyles.containerStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityHint={accessibilityHint}
    >
      {typeof children === 'string' ? (
        <Text style={[sizeStyles.textStyle, { color: colors.text }, textStyle]} numberOfLines={1}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
