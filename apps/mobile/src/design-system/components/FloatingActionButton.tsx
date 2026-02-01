/**
 * iOS-style Floating Action Button (FAB)
 * Replaces react-native-paper FAB with custom iOS design
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle, Animated, View, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { usePressAnimation } from '../hooks/useAnimation';
import { hapticImpact } from '../../utils/haptics';

type FABVariant = 'primary' | 'danger';

export interface FloatingActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  variant?: FABVariant;
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export function FloatingActionButton({
  icon,
  label,
  variant = 'primary',
  onPress,
  style,
  accessibilityLabel,
  testID,
}: FloatingActionButtonProps) {
  const theme = useTheme();
  const { scaleAnim, animatePress } = usePressAnimation(theme.animations.scales.press);

  // Determine background color based on variant
  const backgroundColor = variant === 'danger' ? theme.colors.danger : theme.colors.primary;

  // If label is provided, render extended FAB
  const hasLabel = !!label;

  const handlePress = async (): Promise<void> => {
    await hapticImpact('medium');
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      activeOpacity={0.9}
      accessibilityLabel={accessibilityLabel || label || 'Floating action button'}
      accessibilityRole="button"
      testID={testID}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor,
            borderRadius: hasLabel ? theme.radius.xl : theme.radius.full,
            transform: [{ scale: scaleAnim }],
            ...(theme.isDark ? theme.shadows.lgDark : theme.shadows.xl),
          },
          hasLabel && styles.fabExtended,
        ]}
      >
        <View style={styles.iconContainer}>{icon}</View>
        {label && (
          <Text style={[styles.label, theme.typography.label, { color: '#FFFFFF' }]}>{label}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabExtended: {
    width: 'auto',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 8,
    fontWeight: '600',
  },
});
