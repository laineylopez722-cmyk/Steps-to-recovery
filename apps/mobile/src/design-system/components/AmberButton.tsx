/**
 * AmberButton - Primary Action Button
 * 
 * Premium app quality with:
 * - 48px minimum touch target
 * - 12px border radius
 * - Subtle press animation
 * - Full accessibility support
 */

import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { aestheticColors, buttonSizes } from '../tokens/aesthetic';

export interface AmberButtonProps {
  /** Button text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Disable the button */
  disabled?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Button size - all meet touch target requirements */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Add subtle glow effect */
  glow?: boolean;
  /** Button variant */
  variant?: 'solid' | 'outline' | 'ghost';
  /** Left icon */
  icon?: React.ReactNode;
  /** Additional styles */
  style?: ViewStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AmberButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  size = 'md',
  fullWidth = false,
  glow = false,
  variant = 'solid',
  icon,
  style,
  accessibilityLabel,
  accessibilityHint,
}: AmberButtonProps): React.ReactElement {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const sizeConfig = buttonSizes[size];
  const isDisabled = disabled || loading;

  // Variant styles
  const getStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'outline':
        return {
          bg: 'transparent',
          text: aestheticColors.primary[500],
          border: aestheticColors.primary[500],
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: aestheticColors.primary[500],
        };
      case 'solid':
      default:
        return {
          bg: aestheticColors.primary[500],
          text: '#FFFFFF',
        };
    }
  };

  const variantStyles = getStyles();

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: variantStyles.bg,
    borderWidth: variantStyles.border ? 1.5 : 0,
    borderColor: variantStyles.border,
    opacity: isDisabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  const glowStyle: ViewStyle = glow && variant === 'solid'
    ? {
        shadowColor: aestheticColors.primary[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6,
      }
    : {};

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[styles.container, containerStyle, glowStyle, animatedStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { fontSize: sizeConfig.fontSize, color: variantStyles.text }]}>
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0,
  } as TextStyle,
});

// Export alias
export { AmberButton as PrimaryButton };
