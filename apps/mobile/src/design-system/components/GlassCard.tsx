import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { darkAccent, radius, modernShadows } from '../tokens/modern';

export interface GlassCardProps extends ViewProps {
  intensity?: 'light' | 'medium' | 'heavy';
  glow?: boolean;
  glowColor?: string;
  borderGradient?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  pressed?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 'medium',
  glow = false,
  glowColor,
  borderGradient = false,
  pressable = false,
  onPress,
  pressed = false,
  ...props
}: GlassCardProps): React.ReactElement {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const intensityStyles = {
    light: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderColor: 'rgba(255,255,255,0.08)',
    },
    medium: {
      backgroundColor: 'rgba(30,41,59,0.6)',
      borderColor: 'rgba(255,255,255,0.1)',
    },
    heavy: {
      backgroundColor: 'rgba(15,23,42,0.85)',
      borderColor: 'rgba(255,255,255,0.06)',
    },
  };

  const glowStyle = glow ? {
    shadowColor: glowColor || darkAccent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  } : modernShadows.sm;

  const CardWrapper = pressable ? Animated.createAnimatedComponent(View) : View;

  return (
    <CardWrapper
      style={[
        styles.base,
        intensityStyles[intensity],
        glowStyle,
        borderGradient && styles.borderGradient,
        pressable && animatedStyle,
        pressed && styles.pressed,
        style,
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
      {...props}
    >
      {borderGradient && (
        <View style={styles.gradientBorder} pointerEvents="none" />
      )}
      <View style={styles.content}>{children}</View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    padding: spacing[3],
  },
  borderGradient: {
    position: 'relative',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: darkAccent.primary,
    opacity: 0.3,
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});

// Spacing reference for the styles above
const spacing = { 3: 16 };
