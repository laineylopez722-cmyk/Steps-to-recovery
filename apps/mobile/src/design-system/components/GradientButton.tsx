/**
 * GradientButton - Versatile Button Component
 * 
 * Premium app quality with:
 * - 48px minimum touch target (36px for small)
 * - Multiple variants (primary, secondary, ghost, danger)
 * - Subtle, fast animations (150-200ms)
 * - Full accessibility support
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { aestheticColors, buttonSizes } from '../tokens/aesthetic';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface GradientButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  haptic = true,
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
}: GradientButtonProps): React.ReactElement {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
    opacity.value = withTiming(0.9, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  }, []);

  const handlePress = useCallback(() => {
    if (haptic && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [haptic, disabled, loading, onPress]);

  const sizeConfig = buttonSizes[size];
  const isDisabled = disabled || loading;

  // Variant colors - solid colors, no gradients for cleaner look
  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: aestheticColors.primary[500], text: '#FFFFFF' };
      case 'secondary':
        return { bg: aestheticColors.dark.surface, text: aestheticColors.text.primary };
      case 'success':
        return { bg: aestheticColors.semantic.success, text: '#FFFFFF' };
      case 'danger':
        return { bg: aestheticColors.semantic.danger, text: '#FFFFFF' };
      case 'outline':
        return { 
          bg: 'transparent', 
          text: aestheticColors.text.primary,
          border: aestheticColors.dark.border,
        };
      case 'ghost':
        return { bg: 'transparent', text: aestheticColors.primary[500] };
      default:
        return { bg: aestheticColors.primary[500], text: '#FFFFFF' };
    }
  };

  const variantStyles = getVariantStyles();

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

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[styles.container, containerStyle, animatedStyle, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, { fontSize: sizeConfig.fontSize, color: variantStyles.text }]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
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
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
