/**
 * Card Component - Premium App Quality
 * 
 * iOS-style card with subtle shadow elevation
 * ChatGPT-style gradient backgrounds for depth
 * 
 * Follows iOS Human Interface Guidelines:
 * - 12-16px border radius
 * - Subtle shadow for elevation
 * - 16px internal padding
 * - Gradient backgrounds for depth (like ChatGPT)
 */

import React from 'react';
import { View, StyleSheet, Pressable, type ViewProps, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { getGradients } from '../tokens/theme';
import { useDs } from '../DsProvider';

export type GradientType = 'none' | 'card' | 'elevated' | 'surface' | 'inset' | 'highlight' | 'button' | 'header';

export interface GlassCardProps extends ViewProps {
  /** @deprecated No effect - kept for compatibility */
  intensity?: 'subtle' | 'card' | 'modal' | 'light' | 'medium' | 'heavy';
  /** Enable amber accent glow */
  glow?: boolean;
  /** Glow color */
  glowColor?: string;
  /** Enable press interactions */
  pressable?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Pressed state */
  pressed?: boolean;
  /** @deprecated No effect - kept for compatibility */
  variant?: 'nav' | 'card' | 'modal' | 'subtle' | 'elevated' | 'outlined' | 'flat' | 'interactive';
  /** @deprecated No effect - kept for compatibility */
  animate?: boolean;
  /** Use elevated background color */
  elevated?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Gradient type for ChatGPT-style depth effect */
  gradient?: GradientType;
  /** Custom gradient colors (overrides gradient type) */
  gradientColors?: readonly [string, string, ...string[]];
  /** Gradient direction: vertical (default) or horizontal */
  gradientDirection?: 'vertical' | 'horizontal';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  style,
  intensity: _intensity,
  glow = false,
  glowColor,
  pressable = false,
  onPress,
  pressed = false,
  variant: _variant,
  animate: _animate,
  elevated = false,
  noPadding = false,
  accessibilityLabel,
  gradient = 'none',
  gradientColors,
  gradientDirection = 'vertical',
  ...props
}: GlassCardProps): React.ReactElement {
  const theme = useTheme();
  const ds = useDs();
  const gradients = getGradients(theme.isDark);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withTiming(0.98, { duration: 100 });
      opacity.value = withTiming(0.9, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  };

  // Get gradient colors based on type
  const getGradientColors = (): readonly [string, string, ...string[]] | null => {
    if (gradientColors) return gradientColors;
    if (gradient === 'none') return null;
    
    switch (gradient) {
      case 'card':
        return gradients.card;
      case 'elevated':
        return gradients.cardElevated;
      case 'surface':
        return gradients.surface;
      case 'inset':
        return gradients.inset;
      case 'highlight':
        return gradients.highlight;
      case 'button':
        return gradients.button;
      case 'header':
        return gradients.header;
      default:
        return null;
    }
  };

  const colors = getGradientColors();
  const useGradient = colors !== null;

  // iOS-style card with subtle shadow
  const cardStyle: ViewStyle = {
    backgroundColor: useGradient ? 'transparent' : (elevated ? theme.colors.surfaceElevated : theme.colors.surface),
    borderRadius: 12,
    // Subtle shadow for elevation (iOS style)
    shadowColor: ds.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    elevation: 2,
  };

  // Optional glow effect for accent
  const glowStyle: ViewStyle = glow
    ? {
        shadowColor: glowColor || theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
      }
    : {};

  const pressedStyle: ViewStyle = pressed ? { opacity: 0.9 } : {};

  const containerStyle: ViewStyle[] = [
    styles.base,
    cardStyle,
    glowStyle,
    pressedStyle,
    !noPadding && styles.padding,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  // Gradient start/end based on direction
  const gradientStart = gradientDirection === 'vertical' ? { x: 0, y: 0 } : { x: 0, y: 0.5 };
  const gradientEnd = gradientDirection === 'vertical' ? { x: 0, y: 1 } : { x: 1, y: 0.5 };

  // Inner content wrapper
  const renderContent = () => {
    if (useGradient) {
      return (
        <LinearGradient
          colors={colors as [string, string, ...string[]]}
          start={gradientStart}
          end={gradientEnd}
          style={[styles.gradientFill, !noPadding && styles.padding]}
        >
          {children}
        </LinearGradient>
      );
    }
    return children;
  };

  if (pressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerStyle, useGradient && styles.noPaddingOverride, animatedStyle]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        {...props}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  }

  return (
    <View 
      style={[containerStyle, useGradient && styles.noPaddingOverride]} 
      accessibilityLabel={accessibilityLabel} 
      {...props}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  padding: {
    padding: 16,
  },
  gradientFill: {
    flex: 1,
    borderRadius: 12,
  },
  noPaddingOverride: {
    padding: 0,
  },
});

// Export alias
export { GlassCard as Card };
