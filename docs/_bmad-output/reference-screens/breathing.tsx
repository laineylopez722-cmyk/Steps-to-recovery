/**
 * Breathing Exercises Screen
 * Guided breathing for crisis moments and daily practice
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../components/ui';

type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out' | 'complete';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  cycles: number;
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Navy SEAL technique for calm under pressure',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    cycles: 4,
  },
  {
    id: '478',
    name: '4-7-8 Relaxation',
    description: 'Dr. Weil\'s technique for anxiety & sleep',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    cycles: 4,
  },
  {
    id: 'calm',
    name: 'Simple Calm',
    description: 'Gentle breathing for beginners',
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    cycles: 6,
  },
  {
    id: 'energize',
    name: 'Energizing Breath',
    description: 'Quick reset when feeling sluggish',
    inhale: 3,
    holdIn: 2,
    exhale: 3,
    holdOut: 0,
    cycles: 8,
  },
];

export default function BreathingScreen() {
  const router = useRouter();
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [countdown, setCountdown] = useState(0);

  // Animations
  const circleScale = useRef(new Animated.Value(0.5)).current;
  const circleOpacity = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  // Animation controller
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive || !selectedPattern) return;

    // Track all timeouts/intervals for proper cleanup
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const runPhase = (phaseName: BreathingPhase, duration: number) => {
      setPhase(phaseName);
      setCountdown(duration);

      // Countdown timer
      intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (intervalId) {
              clearInterval(intervalId);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Animate circle based on phase
      if (phaseName === 'inhale') {
        Animated.parallel([
          Animated.timing(circleScale, {
            toValue: 1,
            duration: duration * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(circleOpacity, {
            toValue: 1,
            duration: duration * 1000,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (phaseName === 'exhale') {
        Animated.parallel([
          Animated.timing(circleScale, {
            toValue: 0.5,
            duration: duration * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(circleOpacity, {
            toValue: 0.5,
            duration: duration * 1000,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Gentle vibration at phase start
      Vibration.vibrate(50);
    };

    const runCycle = (cycleNum: number) => {
      if (cycleNum > selectedPattern.cycles) {
        setPhase('complete');
        setIsActive(false);
        Vibration.vibrate([0, 100, 100, 100]);
        return;
      }

      setCurrentCycle(cycleNum);

      // Calculate delays
      const { inhale, holdIn, exhale, holdOut } = selectedPattern;
      let delay = 0;

      // Inhale
      runPhase('inhale', inhale);
      delay += inhale * 1000;

      // Hold In (if any)
      if (holdIn > 0) {
        timeoutIds.push(setTimeout(() => {
          if (intervalId) {
            clearInterval(intervalId);
          }
          runPhase('hold-in', holdIn);
        }, delay));
        delay += holdIn * 1000;
      }

      // Exhale
      timeoutIds.push(setTimeout(() => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        runPhase('exhale', exhale);
      }, delay));
      delay += exhale * 1000;

      // Hold Out (if any)
      if (holdOut > 0) {
        timeoutIds.push(setTimeout(() => {
          if (intervalId) {
            clearInterval(intervalId);
          }
          runPhase('hold-out', holdOut);
        }, delay));
        delay += holdOut * 1000;
      }

      // Next cycle
      timeoutIds.push(setTimeout(() => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        runCycle(cycleNum + 1);
      }, delay));
    };

    runCycle(currentCycle);

    return () => {
      // Clear ALL timeouts to prevent memory leaks
      timeoutIds.forEach(id => clearTimeout(id));
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isActive, selectedPattern, currentCycle]);

  const startExercise = (pattern: BreathingPattern) => {
    setSelectedPattern(pattern);
    setCurrentCycle(1);
    setPhase('inhale');
    setIsActive(true);
    circleScale.setValue(0.5);
    circleOpacity.setValue(0.5);
  };

  const stopExercise = () => {
    setIsActive(false);
    setSelectedPattern(null);
    setPhase('inhale');
    setCurrentCycle(1);
    circleScale.setValue(0.5);
    circleOpacity.setValue(0.5);
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In...';
      case 'hold-in':
        return 'Hold...';
      case 'exhale':
        return 'Breathe Out...';
      case 'hold-out':
        return 'Hold...';
      case 'complete':
        return 'Complete! 🎉';
      default:
        return '';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return '#3b82f6'; // Blue
      case 'hold-in':
      case 'hold-out':
        return '#f59e0b'; // Amber
      case 'exhale':
        return '#22c55e'; // Green
      case 'complete':
        return '#8b5cf6'; // Purple
      default:
        return '#3b82f6';
    }
  };

  // Active Exercise View
  if (isActive && selectedPattern) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900">
        <View className="flex-1 items-center justify-center px-6">
          {/* Pattern Name */}
          <Text className="text-white/60 text-lg mb-4">
            {selectedPattern.name}
          </Text>

          {/* Breathing Circle */}
          <View className="items-center justify-center mb-8">
            <Animated.View
              style={{
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: getPhaseColor(),
                opacity: circleOpacity,
                transform: [{ scale: circleScale }],
              }}
            />
            
            {/* Countdown */}
            <View className="absolute items-center">
              <Text className="text-white text-6xl font-light mb-2">
                {countdown}
              </Text>
              <Text className="text-white/80 text-xl">
                {getPhaseInstruction()}
              </Text>
            </View>
          </View>

          {/* Cycle Counter */}
          <Text className="text-white/60 text-lg mb-8">
            Cycle {currentCycle} of {selectedPattern.cycles}
          </Text>

          {/* Stop Button */}
          <TouchableOpacity
            onPress={stopExercise}
            className="bg-white/10 rounded-full px-8 py-4"
          >
            <Text className="text-white font-semibold">Stop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Complete View
  if (phase === 'complete' && selectedPattern) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-6">🧘</Text>
          <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
            Well Done!
          </Text>
          <Text className="text-surface-500 text-center mb-8">
            You completed {selectedPattern.cycles} cycles of {selectedPattern.name}
          </Text>

          <Card variant="default" className="w-full mb-6">
            <Text className="text-surface-700 dark:text-surface-300 text-center">
              Take a moment to notice how you feel. Your nervous system is now 
              calmer and more regulated.
            </Text>
          </Card>

          <View className="flex-row gap-4">
            <Button
              title="Do Another"
              onPress={() => {
                setSelectedPattern(null);
                setPhase('inhale');
              }}
              variant="secondary"
            />
            <Button
              title="Done"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Pattern Selection View
  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Intro */}
        <View className="items-center mb-8">
          <Text className="text-5xl mb-4">🧘</Text>
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
            Breathing Exercises
          </Text>
          <Text className="text-surface-500 text-center mt-2">
            Calm your mind and body with guided breathing
          </Text>
        </View>

        {/* Pattern Cards */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            Choose a Pattern
          </Text>
          
          {BREATHING_PATTERNS.map((pattern) => (
            <TouchableOpacity
              key={pattern.id}
              onPress={() => startExercise(pattern)}
              activeOpacity={0.8}
            >
              <Card variant="elevated" className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 items-center justify-center mr-4">
                    <Text className="text-2xl">🌬️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                      {pattern.name}
                    </Text>
                    <Text className="text-sm text-surface-500 mb-1">
                      {pattern.description}
                    </Text>
                    <Text className="text-xs text-primary-600">
                      {pattern.inhale}s in
                      {pattern.holdIn > 0 && ` • ${pattern.holdIn}s hold`}
                      {` • ${pattern.exhale}s out`}
                      {pattern.holdOut > 0 && ` • ${pattern.holdOut}s hold`}
                      {` • ${pattern.cycles} cycles`}
                    </Text>
                  </View>
                  <Text className="text-primary-500 text-xl">▶</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tip */}
        <Card variant="outlined" className="mt-4">
          <Text className="text-sm text-surface-500 text-center">
            💡 Tip: Find a comfortable position. You can sit, stand, or lie down.
            Close your eyes if it helps you focus.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

