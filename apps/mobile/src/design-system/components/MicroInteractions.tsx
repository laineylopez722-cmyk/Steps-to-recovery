// @ts-nocheck
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { darkAccent, gradients, radius, spacing, typography } from '../tokens/modern';
import { useHaptics } from '../../hooks/useHaptics';

// Animated Checkbox
interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
}

export function AnimatedCheckbox({
  checked,
  onToggle,
  label,
  disabled = false,
}: AnimatedCheckboxProps): React.ReactElement {
  const scale = useSharedValue(1);
  const checkProgress = useSharedValue(checked ? 1 : 0);
  const { light } = useHaptics();

  useEffect(() => {
    checkProgress.value = withSpring(checked ? 1 : 0);
  }, [checked]);

  const handlePress = async () => {
    if (disabled) return;
    await light();
    scale.value = withSequence(withTiming(0.9, { duration: 50 }), withSpring(1, { damping: 15 }));
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolate(
      checkProgress.value,
      [0, 1],
      [darkAccent.surfaceHigh, darkAccent.success],
    ),
    borderColor: interpolate(checkProgress.value, [0, 1], [darkAccent.border, darkAccent.success]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkProgress.value,
    transform: [{ scale: checkProgress.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={styles.checkboxContainer}
      accessibilityRole="checkbox"
      accessibilityLabel={label || 'Checkbox'}
      accessibilityState={{ checked, disabled }}
    >
      <Animated.View style={[styles.checkbox, animatedStyle]}>
        <Animated.View style={checkStyle}>
          <MaterialIcons name="check" size={18} color="#FFF" />
        </Animated.View>
      </Animated.View>
      {label && (
        <Text style={[styles.checkboxLabel, disabled && styles.disabledText]}>{label}</Text>
      )}
    </Pressable>
  );
}

// Animated Toggle Switch
interface AnimatedToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function AnimatedToggle({
  value,
  onValueChange,
  label,
  disabled = false,
}: AnimatedToggleProps): React.ReactElement {
  const translateX = useSharedValue(value ? 24 : 0);
  const { light } = useHaptics();

  useEffect(() => {
    translateX.value = withSpring(value ? 24 : 0, { damping: 20 });
  }, [value]);

  const handlePress = async () => {
    if (disabled) return;
    await light();
    onValueChange(!value);
  };

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolate(
      translateX.value,
      [0, 24],
      [darkAccent.surfaceHigh, darkAccent.success],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={styles.toggleContainer}
      accessibilityRole="switch"
      accessibilityLabel={label || 'Toggle'}
      accessibilityState={{ checked: value, disabled }}
    >
      {label && <Text style={[styles.toggleLabel, disabled && styles.disabledText]}>{label}</Text>}
      <Animated.View style={[styles.toggleTrack, trackStyle]}>
        <Animated.View style={[styles.toggleThumb, thumbStyle]}>
          <LinearGradient colors={['#FFF', '#F0F0F0']} style={styles.toggleThumbGradient} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// Animated Radio Button
interface AnimatedRadioProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  disabled?: boolean;
}

export function AnimatedRadio({
  selected,
  onSelect,
  label,
  disabled = false,
}: AnimatedRadioProps): React.ReactElement {
  const scale = useSharedValue(0);
  const { light } = useHaptics();

  useEffect(() => {
    scale.value = withSpring(selected ? 1 : 0, { damping: 20 });
  }, [selected]);

  const handlePress = async () => {
    if (disabled) return;
    await light();
    onSelect();
  };

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={styles.radioContainer}
      accessibilityRole="radio"
      accessibilityLabel={label || 'Radio option'}
      accessibilityState={{ selected, disabled }}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        <Animated.View style={[styles.radioInner, innerStyle]} />
      </View>
      {label && <Text style={[styles.radioLabel, disabled && styles.disabledText]}>{label}</Text>}
    </Pressable>
  );
}

// Success Checkmark Animation
interface SuccessCheckmarkProps {
  size?: number;
  onComplete?: () => void;
}

export function SuccessCheckmark({
  size = 60,
  onComplete,
}: SuccessCheckmarkProps): React.ReactElement {
  const circleProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 12 });

    // Circle draw
    circleProgress.value = withTiming(1, { duration: 600 }, () => {
      // Check draw after circle
      checkProgress.value = withTiming(1, { duration: 400 }, () => {
        onComplete?.();
      });
    });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[containerStyle, { width: size, height: size }]}>
      <View style={[styles.checkmarkContainer, { width: size, height: size }]}>
        <LinearGradient
          colors={gradients.success}
          style={[styles.checkmarkBackground, { borderRadius: size / 2 }]}
        >
          <MaterialIcons name="check" size={size * 0.5} color="#FFF" />
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

// Animated Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  style,
}: AnimatedCounterProps): React.ReactElement {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
  }, [value]);

  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener((v) => {
      setDisplayValue(Math.round(v.value));
    });
    return () => animatedValue.removeListener(listener);
  }, []);

  return <Text style={[styles.counter, style]}>{displayValue}</Text>;
}

// Heart/Favorite Button with Animation
interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 24,
}: FavoriteButtonProps): React.ReactElement {
  const scale = useSharedValue(1);
  const { medium } = useHaptics();

  const handlePress = async () => {
    await medium();
    scale.value = withSequence(withTiming(1.3, { duration: 100 }), withSpring(1, { damping: 10 }));
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      accessibilityState={{ selected: isFavorite }}
    >
      <Animated.View style={animatedStyle}>
        <MaterialIcons
          name={isFavorite ? 'favorite' : 'favorite-border'}
          size={size}
          color={isFavorite ? '#EF4444' : darkAccent.textMuted}
        />
      </Animated.View>
    </Pressable>
  );
}

// Bouncing Badge
interface BouncingBadgeProps {
  count: number;
  children: React.ReactNode;
}

export function BouncingBadge({ count, children }: BouncingBadgeProps): React.ReactElement {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withTiming(1.4, { duration: 150 }), withSpring(1, { damping: 10 }));
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.badgeContainer}>
      {children}
      {count > 0 && (
        <Animated.View style={[styles.badge, animatedStyle]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    ...typography.body,
    color: darkAccent.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  toggleLabel: {
    ...typography.body,
    color: darkAccent.text,
    flex: 1,
  },
  toggleTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleThumbGradient: {
    flex: 1,
    borderRadius: 12,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: darkAccent.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: darkAccent.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: darkAccent.primary,
  },
  radioLabel: {
    ...typography.body,
    color: darkAccent.text,
  },
  disabledText: {
    opacity: 0.5,
  },
  checkmarkContainer: {
    shadowColor: darkAccent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmarkBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    ...typography.h2,
    color: darkAccent.text,
    fontVariant: ['tabular-nums'],
  },
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkAccent.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700',
  },
});
