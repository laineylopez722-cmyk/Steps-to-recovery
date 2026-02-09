/**
 * Urge Surfing Timer Screen
 * A 5-minute timer to help ride out cravings
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Vibration, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '../components/ui';

const TIMER_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
];

const ENCOURAGEMENTS = [
  "This craving will pass. You've got this.",
  "Ride the wave. It always subsides.",
  "One breath at a time. You're doing great.",
  "This moment is temporary. Your recovery is permanent.",
  "You are stronger than this craving.",
  "Every second you resist makes you stronger.",
  "Focus on right now. Nothing else matters.",
  "You've survived 100% of your worst days.",
];

export default function TimerScreen() {
  const router = useRouter();
  const [selectedDuration, setSelectedDuration] = useState(300); // 5 minutes default
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const appStateRef = useRef(AppState.currentState);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isRunning
      ) {
        // App came back to foreground, recalculate time left
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, selectedDuration - elapsed);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft <= 0) {
          handleComplete();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, selectedDuration]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Update encouragement periodically
  useEffect(() => {
    if (isRunning) {
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      const encouragementInterval = setInterval(() => {
        setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      }, 15000); // Change every 15 seconds

      return () => clearInterval(encouragementInterval);
    }
  }, [isRunning]);

  const handleComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setIsComplete(true);
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsComplete(false);
    startTimeRef.current = Date.now();
    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsComplete(false);
    setTimeLeft(selectedDuration);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleSelectDuration = (seconds: number) => {
    if (!isRunning) {
      setSelectedDuration(seconds);
      setTimeLeft(seconds);
      setIsComplete(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration - timeLeft) / selectedDuration) * 100;

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-700/30">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="x" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Urge Surfing Timer</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-4 py-6">
        {/* Introduction */}
        {!isRunning && !isComplete && (
          <View className="bg-primary-500/10 rounded-2xl p-4 mb-6 border border-primary-500/30">
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="clock" size={18} color="#60a5fa" />
              <Text className="text-primary-400 font-semibold">Urge Surfing</Text>
            </View>
            <Text className="text-surface-300 text-sm leading-5">
              Cravings typically peak and subside within 15-30 minutes. 
              Use this timer to ride out the wave. Focus on your breathing 
              and remember: this feeling is temporary.
            </Text>
          </View>
        )}

        {/* Timer Display */}
        <View className="items-center mb-8">
          {/* Circular progress */}
          <View className="w-64 h-64 items-center justify-center">
            {/* Background circle */}
            <View className="absolute w-64 h-64 rounded-full border-8 border-surface-700/30" />
            
            {/* Progress indicator (simplified) */}
            <View 
              className="absolute w-64 h-64 rounded-full border-8 border-primary-500"
              style={{
                borderColor: isComplete ? '#4ade80' : '#60a5fa',
                transform: [{ rotate: '-90deg' }],
                borderRightColor: 'transparent',
                borderBottomColor: progress > 50 ? (isComplete ? '#4ade80' : '#60a5fa') : 'transparent',
                borderLeftColor: progress > 75 ? (isComplete ? '#4ade80' : '#60a5fa') : 'transparent',
              }}
            />

            {/* Time display */}
            <View className="items-center">
              {isComplete ? (
                <>
                  <Feather name="check-circle" size={48} color="#4ade80" />
                  <Text className="text-success-400 text-xl font-semibold mt-2">
                    You did it!
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white text-6xl font-bold">
                    {formatTime(timeLeft)}
                  </Text>
                  <Text className="text-surface-400 text-sm mt-2">
                    {isRunning ? 'Stay strong...' : 'Ready when you are'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Encouragement */}
        {isRunning && (
          <View className="bg-navy-800/40 rounded-2xl p-4 mb-6 border border-surface-700/30">
            <Text className="text-white text-center text-lg leading-6">
              "{encouragement}"
            </Text>
          </View>
        )}

        {/* Duration presets */}
        {!isRunning && !isComplete && (
          <View className="mb-6">
            <Text className="text-surface-400 text-sm mb-3 text-center">Select duration</Text>
            <View className="flex-row gap-3 justify-center">
              {TIMER_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.seconds}
                  onPress={() => handleSelectDuration(preset.seconds)}
                  className={`px-4 py-3 rounded-xl ${
                    selectedDuration === preset.seconds
                      ? 'bg-primary-500'
                      : 'bg-navy-800/40 border border-surface-700/30'
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedDuration === preset.seconds }}
                >
                  <Text className={`font-medium ${
                    selectedDuration === preset.seconds
                      ? 'text-white'
                      : 'text-surface-300'
                  }`}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Controls */}
        <View className="flex-row gap-3 justify-center">
          {isComplete ? (
            <>
              <Button
                title="Start Again"
                onPress={handleReset}
                variant="outline"
                icon="refresh-cw"
              />
              <Button
                title="Done"
                onPress={() => router.back()}
                icon="check"
              />
            </>
          ) : isRunning ? (
            <>
              <Button
                title="Pause"
                onPress={handlePause}
                variant="outline"
                icon="pause"
              />
              <Button
                title="Reset"
                onPress={handleReset}
                variant="secondary"
                icon="refresh-cw"
              />
            </>
          ) : (
            <Button
              title="Start Timer"
              onPress={handleStart}
              size="lg"
              icon="play"
            />
          )}
        </View>

        {/* Tips during timer */}
        {isRunning && (
          <View className="mt-8">
            <Text className="text-surface-500 text-center text-sm mb-3">
              While you wait, try:
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {['Deep breathing', 'Cold water', 'Walk around', 'Call someone'].map((tip) => (
                <View key={tip} className="bg-surface-700/30 px-3 py-2 rounded-lg">
                  <Text className="text-surface-400 text-sm">{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Completion celebration */}
        {isComplete && (
          <View className="mt-6 bg-success-500/10 rounded-2xl p-4 border border-success-500/30">
            <Text className="text-success-400 text-center">
              You rode out the wave! The craving has likely passed or reduced significantly. 
              Remember this moment - you ARE stronger than your cravings.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

