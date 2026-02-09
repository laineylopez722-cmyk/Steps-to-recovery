/**
 * FloatingActionButton - DEPRECATED
 * 
 * This component is deprecated and should not be used in new code.
 * The FAB pattern was removed from the design system for a cleaner UX.
 * 
 * Use inline buttons or fixed bottom bars instead.
 * 
 * @deprecated Use AmberButton or standard buttons instead
 */

import type { ReactNode, ReactElement } from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle, Animated, View, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { usePressAnimation } from '../hooks/useAnimation';
import { logger } from '../../utils/logger';
import { hapticImpact } from '../../utils/haptics';
import { ds } from '../tokens/ds';

type FABVariant = 'primary' | 'danger';

export interface FloatingActionButtonProps {
  icon: ReactNode;
  label?: string;
  variant?: FABVariant;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  testID?: string;
  /** 
   * Show the FAB. Defaults to false (hidden).
   * @deprecated FAB is deprecated - use inline buttons instead
   */
  visible?: boolean;
}

/**
 * @deprecated This component is deprecated. Use AmberButton or inline actions instead.
 */
export function FloatingActionButton({
  icon,
  label,
  variant = 'primary',
  onPress,
  style,
  accessibilityLabel,
  testID,
  visible = false, // Hidden by default
}: FloatingActionButtonProps): ReactElement | null {
  const theme = useTheme();
  const { scaleAnim, animatePress } = usePressAnimation(theme.animations.scales.press);

  // Return null if not visible (default behavior)
  if (!visible) {
    return null;
  }

  // Log deprecation warning in development
  if (__DEV__) {
    logger.warn('FloatingActionButton is deprecated', {
      alternative: 'Use AmberButton or inline buttons instead',
    });
  }

  const backgroundColor = variant === 'danger' ? theme.colors.danger : theme.colors.primary;
  const hasLabel = !!label;

  const handlePress = async (): Promise<void> => {
    await hapticImpact('medium');
    if (onPress) {
      onPress();
    }
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
          },
          hasLabel && styles.fabExtended,
        ]}
      >
        <View style={styles.iconContainer}>{icon}</View>
        {label && (
          <Text style={[styles.label, theme.typography.label, { color: ds.semantic.text.onDark }]}>{label}</Text>
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
    // Simplified shadow
    shadowColor: ds.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
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
