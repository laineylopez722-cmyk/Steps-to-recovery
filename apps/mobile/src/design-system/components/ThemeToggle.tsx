/**
 * Theme Toggle Component
 * 
 * Elegant dark/light mode toggle with:
 * - Smooth animated transitions
 * - Haptic feedback
 * - Glassmorphism styling
 * - Sun/moon icon morphing
 */

import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

import { hapticLight } from '../../utils/haptics';
import { aestheticColors } from '../tokens/aesthetic';
import { FadeIn, withSequence } from 'react-native-reanimated';

// ============================================================================
// TYPES
// ============================================================================

interface ThemeToggleProps {
  /** Current theme state */
  isDark: boolean;
  /** Theme change handler */
  onToggle: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Glass effect intensity */
  glassIntensity?: 'light' | 'medium' | 'heavy';
}

// ============================================================================
// SIZE CONFIGS
// ============================================================================

const sizeConfigs = {
  sm: {
    container: { width: 48, height: 28, borderRadius: 14 },
    knob: { width: 22, height: 22, borderRadius: 11 },
    icon: 12,
    padding: 3,
  },
  md: {
    container: { width: 56, height: 32, borderRadius: 16 },
    knob: { width: 26, height: 26, borderRadius: 13 },
    icon: 14,
    padding: 3,
  },
  lg: {
    container: { width: 64, height: 36, borderRadius: 18 },
    knob: { width: 30, height: 30, borderRadius: 15 },
    icon: 16,
    padding: 3,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ThemeToggle({
  isDark,
  onToggle,
  size = 'md',
  showLabel = false,
  style,
  glassIntensity = 'medium',
}: ThemeToggleProps) {
  const progress = useSharedValue(isDark ? 1 : 0);
  const scale = useSharedValue(1);

  // Animate when isDark changes externally
  React.useEffect(() => {
    progress.value = withSpring(isDark ? 1 : 0, {
      damping: 15,
      stiffness: 120,
    });
  }, [isDark, progress]);

  const handlePress = useCallback(() => {
    hapticLight();
    
    // Button press animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    onToggle();
  }, [onToggle, scale]);

  const config = sizeConfigs[size];

  // Animated knob position
  const knobStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [0, config.container.width - config.knob.width - config.padding * 2],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { translateX },
        { scale: scale.value },
      ],
    };
  });

  // Background color animation
  const backgroundStyle = useAnimatedStyle(() => {
    // Use opacity to blend between light and dark backgrounds
    return {
      backgroundColor: isDark 
        ? `rgba(245, 158, 11, ${0.2 + progress.value * 0.1})`
        : `rgba(20, 184, 166, ${0.2 + (1 - progress.value) * 0.1})`,
    };
  });

  // Icon rotation
  const iconStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      progress.value,
      [0, 1],
      [0, 180],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, 0.5, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotate}deg` }],
      opacity,
    };
  });

  const blurIntensity = {
    light: 20,
    medium: 40,
    heavy: 60,
  }[glassIntensity];

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      style={[styles.wrapper, style]}
    >
      <Animated.View
        style={[
          styles.container,
          config.container,
          backgroundStyle,
        ]}
      >
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: config.container.borderRadius }]}
        />
        
        {/* Icons */}
        <View style={styles.iconsContainer}>
          <Feather
            name="sun"
            size={config.icon}
            color={isDark ? '#64748B' : '#F59E0B'}
            style={styles.leftIcon}
          />
          <Feather
            name="moon"
            size={config.icon}
            color={isDark ? '#14B8A6' : '#64748B'}
            style={styles.rightIcon}
          />
        </View>
        
        {/* Animated Knob */}
        <Animated.View
          style={[
            styles.knob,
            config.knob,
            knobStyle,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              shadowColor: isDark ? '#000' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.5 : 0.15,
              shadowRadius: isDark ? 4 : 3,
              elevation: isDark ? 4 : 3,
            },
          ]}
        >
          <Animated.View style={iconStyle}>
            <Feather
              name={isDark ? 'moon' : 'sun'}
              size={config.icon - 2}
              color={isDark ? '#14B8A6' : '#F59E0B'}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      
      {showLabel && (
        <Animated.Text
          entering={FadeIn.duration(200)}
          style={[
            styles.label,
            { color: isDark ? aestheticColors.navy[200] : aestheticColors.navy[400] },
          ]}
        >
          {isDark ? 'Dark' : 'Light'}
        </Animated.Text>
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface CompactThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CompactThemeToggle({
  isDark,
  onToggle,
  style,
}: CompactThemeToggleProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const handlePress = useCallback(() => {
    hapticLight();
    
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    
    rotate.value = withTiming(rotate.value + 180, {
      duration: 300,
    });
    
    onToggle();
  }, [onToggle, scale, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.compactContainer, style]}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <BlurView
        intensity={40}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={animatedStyle}>
        <Feather
          name={isDark ? 'moon' : 'sun'}
          size={20}
          color={isDark ? aestheticColors.secondary[500] : aestheticColors.primary[500]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  leftIcon: {
    marginLeft: 2,
  },
  rightIcon: {
    marginRight: 2,
  },
  knob: {
    position: 'absolute',
    left: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export default ThemeToggle;
