/**
 * iOS-style Card Component
 * Container with elevation variants and optional animations
 */

import React from 'react';
import { StyleProp, ViewStyle, TouchableOpacity, Animated, AccessibilityRole } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useFadeAndScaleIn, usePressAnimation } from '../hooks/useAnimation';
import { hapticImpact } from '../../utils/haptics';

type CardVariant = 'default' | 'elevated' | 'interactive' | 'flat' | 'outlined' | 'outline';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  animate = false,
  style,
  testID,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();
  const { fadeAnim, scaleAnim } = useFadeAndScaleIn(0);
  const { scaleAnim: pressScale, animatePress } = usePressAnimation(theme.animations.scales.press);

  // Determine shadow based on variant
  const getShadow = () => {
    if (variant === 'default') return {};
    if (variant === 'elevated' || variant === 'interactive') {
      return theme.isDark ? theme.shadows.mdDark : theme.shadows.md;
    }
    if (variant === 'flat') return {}; // No shadow for flat variant
    if (variant === 'outlined' || variant === 'outline') return {}; // No shadow for outlined variants
    return {};
  };

  // Determine border based on variant
  const getBorder = (): ViewStyle => {
    if (variant === 'outlined' || variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: theme.isDark ? theme.colors.border : theme.colors.borderLight,
      };
    }
    return {};
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.cardPadding,
    ...getShadow(),
    ...getBorder(),
  };

  // If animate is true, use fade and scale animations
  const animatedStyle = animate
    ? {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }
    : {};

  // If interactive variant, add press animation
  const interactiveStyle =
    variant === 'interactive' && onPress ? { transform: [{ scale: pressScale }] } : {};

  // Combine all styles
  const combinedAnimatedStyle = {
    ...animatedStyle,
    ...(variant === 'interactive' ? interactiveStyle : {}),
  };

  const handlePress = async (): Promise<void> => {
    if (variant === 'interactive') {
      await hapticImpact('light');
    }
    onPress?.();
  };

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={() => variant === 'interactive' && animatePress(true)}
        onPressOut={() => variant === 'interactive' && animatePress(false)}
        activeOpacity={variant === 'interactive' ? 0.95 : 0.7}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        <Animated.View style={[cardStyle, combinedAnimatedStyle, style]}>{children}</Animated.View>
      </TouchableOpacity>
    );
  }

  // If no onPress, just render View
  return (
    <Animated.View
      style={[cardStyle, combinedAnimatedStyle, style]}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </Animated.View>
  );
}
