import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type GestureResponderEvent,
  View,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { darkAccent, gradients, radius } from '../tokens/modern';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface GradientButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
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
  ...props
}: GradientButtonProps): React.ReactElement {
  const pressed = useSharedValue(0);
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: 100 });
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: 150 });
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (haptic && !disabled && !loading) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress?.(e);
    },
    [haptic, disabled, loading, onPress]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      pressed.value,
      [0, 1],
      ['#FFFFFF', 'rgba(255,255,255,0.8)']
    ),
  }));

  const gradientColors = {
    primary: gradients.primary,
    secondary: gradients.success,
    success: gradients.success,
    ghost: ['transparent', 'transparent'] as const,
    danger: ['#EF4444', '#DC2626'] as const,
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md },
    md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: radius.lg },
    lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: radius.xl },
  };

  const textSizeStyles: Record<ButtonSize, { fontSize: number; fontWeight: '600' | '700' }> = {
    sm: { fontSize: 14, fontWeight: '600' },
    md: { fontSize: 16, fontWeight: '600' },
    lg: { fontSize: 18, fontWeight: '600' },
  };

  const isGhost = variant === 'ghost';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.container,
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        animatedStyle,
        isGhost && styles.ghost,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={gradientColors[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: sizeStyles[size].borderRadius },
        ]}
      />

      {isGhost && (
        <View style={styles.ghostBorder} pointerEvents="none" />
      )}

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Animated.Text
              style={[
                styles.text,
                textSizeStyles[size],
                textAnimatedStyle,
                isGhost && { color: darkAccent.primary },
              ]}
            >
              {title}
            </Animated.Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: darkAccent.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
