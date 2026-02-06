/**
 * Breathing Circle Component
 * Animated expanding/contracting circle for box breathing exercises
 *
 * Uses react-native-reanimated for smooth, calming animations.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { hapticTick } from '../../utils/haptics';

const BREATH_DURATION = 4000; // 4 seconds per phase

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'idle';

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe In',
  hold1: 'Hold',
  exhale: 'Breathe Out',
  hold2: 'Hold',
  idle: 'Tap to Start',
};

export interface BreathingCircleProps {
  /**
   * Size of the outer container
   * @default 200
   */
  size?: number;
  /**
   * Number of breathing cycles before stopping
   * @default 4
   */
  cycles?: number;
  /**
   * Duration of each breath phase in ms
   * @default 4000
   */
  phaseDuration?: number;
  /**
   * Color of the breathing circle
   */
  color?: string;
  /**
   * Whether to auto-start
   * @default false
   */
  autoStart?: boolean;
  /**
   * Callback when all cycles complete
   */
  onComplete?: () => void;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export function BreathingCircle({
  size = 200,
  cycles = 4,
  phaseDuration = BREATH_DURATION,
  color,
  autoStart = false,
  onComplete,
  testID,
}: BreathingCircleProps): React.ReactElement {
  const theme = useTheme();
  const activeColor = color || theme.colors.primary;

  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);

  // Animation values
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.3);

  // Phase change handler with haptic
  const handlePhaseChange = useCallback((newPhase: BreathPhase) => {
    setPhase(newPhase);
    hapticTick();
  }, []);

  // Complete handler
  const handleComplete = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    setCurrentCycle(0);
    onComplete?.();
  }, [onComplete]);

  // Increment cycle
  const incrementCycle = useCallback(() => {
    setCurrentCycle((prev) => prev + 1);
  }, []);

  // Breathing animation sequence
  useEffect(() => {
    if (!isActive) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(0.5, { duration: 500 });
      opacity.value = withTiming(0.3, { duration: 500 });
      return;
    }

    if (currentCycle >= cycles) {
      runOnJS(handleComplete)();
      return;
    }

    // Inhale - expand
    runOnJS(handlePhaseChange)('inhale');
    scale.value = withTiming(1, {
      duration: phaseDuration,
      easing: Easing.inOut(Easing.ease),
    });
    opacity.value = withTiming(0.8, { duration: phaseDuration });

    // Hold 1
    const hold1Timeout = setTimeout(() => {
      runOnJS(handlePhaseChange)('hold1');
    }, phaseDuration);

    // Exhale - contract
    const exhaleTimeout = setTimeout(() => {
      runOnJS(handlePhaseChange)('exhale');
      scale.value = withTiming(0.5, {
        duration: phaseDuration,
        easing: Easing.inOut(Easing.ease),
      });
      opacity.value = withTiming(0.3, { duration: phaseDuration });
    }, phaseDuration * 2);

    // Hold 2
    const hold2Timeout = setTimeout(() => {
      runOnJS(handlePhaseChange)('hold2');
    }, phaseDuration * 3);

    // Next cycle
    const nextCycleTimeout = setTimeout(() => {
      runOnJS(incrementCycle)();
    }, phaseDuration * 4);

    return () => {
      clearTimeout(hold1Timeout);
      clearTimeout(exhaleTimeout);
      clearTimeout(hold2Timeout);
      clearTimeout(nextCycleTimeout);
    };
  }, [isActive, currentCycle, cycles, phaseDuration]);

  // Animated styles
  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = (): void => {
    if (isActive) {
      setIsActive(false);
      setPhase('idle');
      setCurrentCycle(0);
    } else {
      setIsActive(true);
      setCurrentCycle(0);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[styles.container, { width: size, height: size }]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={
        isActive ? `Breathing exercise: ${PHASE_LABELS[phase]}` : 'Start breathing exercise'
      }
      accessibilityHint={isActive ? 'Tap to stop' : 'Tap to start the breathing exercise'}
    >
      {/* Outer ring */}
      <View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: `${activeColor}30`,
          },
        ]}
      />

      {/* Breathing circle */}
      <Animated.View
        style={[
          styles.breathingCircle,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: (size * 0.8) / 2,
            backgroundColor: activeColor,
          },
          circleAnimatedStyle,
        ]}
      />

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text
          style={[
            styles.phaseLabel,
            { color: phase === 'idle' ? theme.colors.textSecondary : '#FFFFFF' },
          ]}
        >
          {PHASE_LABELS[phase]}
        </Text>
        {isActive && (
          <Text
            style={[
              styles.cycleLabel,
              { color: phase === 'idle' ? theme.colors.textTertiary : 'rgba(255,255,255,0.7)' },
            ]}
          >
            Cycle {currentCycle + 1}/{cycles}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  breathingCircle: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  cycleLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});

