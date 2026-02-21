/**
 * Slider Component
 * Dark navy themed slider for mood/craving inputs with accessibility support
 * BMAD Upgrade: Haptic feedback, smooth spring animations, animated track
 */

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from '@/platform/haptics';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Step Button Component with animations
function StepButton({
  stepValue,
  isActive,
  isFilled,
  onPress,
}: {
  stepValue: number;
  isActive: boolean;
  isFilled: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(isActive ? 1.1 : 1);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.1 : 1, { damping: 15, stiffness: 300 });
  }, [isActive]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      onPress={() => {
        scale.value = withSpring(0.9, { damping: 15 }, () => {
          scale.value = withSpring(isActive ? 1.1 : 1, { damping: 15 });
        });
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(isActive ? 1.1 : 1, { damping: 15 });
      }}
      style={buttonStyle}
      className={`w-8 h-8 rounded-full items-center justify-center ${
        isActive ? 'bg-primary-500' : isFilled ? 'bg-primary-500/60' : 'bg-surface-700/50'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Select ${stepValue}`}
      accessibilityState={{ selected: isActive }}
      importantForAccessibility="no"
    >
      <Text
        className={`text-xs font-semibold ${
          isActive || isFilled ? 'text-white' : 'text-surface-500'
        }`}
      >
        {stepValue}
      </Text>
    </AnimatedTouchableOpacity>
  );
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 10,
  step = 1,
  label,
  showValue = true,
  minLabel,
  maxLabel,
  className = '',
  accessibilityLabel,
  accessibilityHint,
}: SliderProps) {
  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }

  const animatedValue = useSharedValue(value);
  const previousValue = useRef(value);

  // Update animated value when prop changes
  React.useEffect(() => {
    animatedValue.value = withSpring(value, {
      damping: 15,
      stiffness: 300,
    });
    previousValue.current = value;
  }, [value]);

  const percentage = ((value - min) / (max - min)) * 100;
  const animatedPercentage = useSharedValue(percentage);

  React.useEffect(() => {
    animatedPercentage.value = withSpring(percentage, {
      damping: 15,
      stiffness: 300,
    });
  }, [percentage]);

  const handleValueChange = (newValue: number) => {
    if (newValue !== previousValue.current) {
      // Haptic feedback on value change
      const diff = Math.abs(newValue - previousValue.current);
      if (diff >= step) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      previousValue.current = newValue;
    }
    onValueChange(newValue);
  };

  // Compute accessibility label
  const computedAccessibilityLabel = accessibilityLabel || label || 'Slider';
  const accessibilityValue = `${value} out of ${max}`;

  return (
    <View
      className={`${className}`}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${computedAccessibilityLabel}, ${accessibilityValue}`}
      accessibilityHint={accessibilityHint || 'Swipe up or down to adjust value'}
      accessibilityValue={{
        min,
        max,
        now: value,
        text: accessibilityValue,
      }}
      accessibilityActions={[
        { name: 'increment', label: 'Increase value' },
        { name: 'decrement', label: 'Decrease value' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'increment':
            if (value < max) {
              onValueChange(Math.min(value + step, max));
            }
            break;
          case 'decrement':
            if (value > min) {
              onValueChange(Math.max(value - step, min));
            }
            break;
        }
      }}
    >
      {/* Label and Value */}
      {(label || showValue) && (
        <View className="flex-row justify-between items-center mb-2">
          {label && <Text className="text-base font-medium text-surface-300">{label}</Text>}
          {showValue && (
            <Text className="text-lg font-bold text-primary-400" accessibilityElementsHidden>
              {value}
            </Text>
          )}
        </View>
      )}

      {/* Slider Track */}
      <View className="relative h-8 mb-2">
        {/* Background Track */}
        <View className="absolute top-3 left-0 right-0 h-2 bg-surface-700/50 rounded-full" />

        {/* Filled Track - Animated */}
        <AnimatedView
          className="absolute top-3 left-0 h-2 bg-primary-500 rounded-full"
          style={useAnimatedStyle(() => ({
            width: `${animatedPercentage.value}%`,
          }))}
        />

        {/* Step Buttons */}
        <View className="flex-row justify-between absolute top-0 left-0 right-0">
          {steps.map((stepValue) => {
            const isActive = stepValue === value;
            const isFilled = stepValue <= value;

            return (
              <StepButton
                key={stepValue}
                stepValue={stepValue}
                isActive={isActive}
                isFilled={isFilled}
                onPress={() => handleValueChange(stepValue)}
              />
            );
          })}
        </View>
      </View>

      {/* Min/Max Labels */}
      {(minLabel || maxLabel) && (
        <View className="flex-row justify-between">
          <Text className="text-xs text-surface-500">{minLabel || ''}</Text>
          <Text className="text-xs text-surface-500">{maxLabel || ''}</Text>
        </View>
      )}
    </View>
  );
}

