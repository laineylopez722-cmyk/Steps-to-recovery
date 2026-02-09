/**
 * Mindfulness Pack Screen
 * A collection of quick mindfulness exercises
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '../components/ui';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface MindfulnessExercise {
  id: string;
  title: string;
  duration: string;
  icon: FeatherIconName;
  color: string;
  description: string;
  instructions: string[];
}

const EXERCISES: MindfulnessExercise[] = [
  {
    id: 'body-scan',
    title: 'Quick Body Scan',
    duration: '3 min',
    icon: 'user',
    color: '#60a5fa',
    description: 'Notice sensations throughout your body without judgment.',
    instructions: [
      'Close your eyes and take three deep breaths',
      'Notice your feet - any tension, temperature, pressure?',
      'Move attention up to your legs, hips, stomach',
      'Notice your chest, shoulders, arms, hands',
      'Finally, notice your neck, face, and head',
      'Take one more deep breath and open your eyes',
    ],
  },
  {
    id: 'loving-kindness',
    title: 'Loving Kindness',
    duration: '5 min',
    icon: 'heart',
    color: '#f472b6',
    description: 'Send compassion to yourself and others.',
    instructions: [
      'Sit comfortably and close your eyes',
      'Think of yourself. Say: "May I be happy, may I be healthy, may I be at peace"',
      'Think of someone you love. Send them the same wishes',
      'Think of someone neutral. Send them the same wishes',
      'Think of someone difficult. Send them the same wishes',
      'Finally, send these wishes to all beings everywhere',
    ],
  },
  {
    id: 'mindful-moment',
    title: 'One Mindful Moment',
    duration: '1 min',
    icon: 'sun',
    color: '#fbbf24',
    description: 'A quick reset to bring you back to the present.',
    instructions: [
      'Stop whatever you\'re doing',
      'Take one slow, deep breath',
      'Notice one thing you can see',
      'Notice one thing you can hear',
      'Notice how your body feels right now',
      'Continue with your day, present',
    ],
  },
  {
    id: 'acceptance',
    title: 'Radical Acceptance',
    duration: '3 min',
    icon: 'check-circle',
    color: '#4ade80',
    description: 'Accept this moment exactly as it is.',
    instructions: [
      'Acknowledge what you\'re feeling right now',
      'Say to yourself: "This is what\'s happening"',
      'Notice any resistance to this moment',
      'Say: "I accept this moment as it is"',
      'Breathe into any tension you feel',
      'Remember: acceptance doesn\'t mean approval',
    ],
  },
  {
    id: 'observe-thoughts',
    title: 'Thought Clouds',
    duration: '5 min',
    icon: 'cloud',
    color: '#a78bfa',
    description: 'Watch your thoughts pass like clouds in the sky.',
    instructions: [
      'Close your eyes and imagine a blue sky',
      'As thoughts arise, see them as clouds',
      'Don\'t grab onto thoughts - just watch them pass',
      'When you notice you\'re lost in thought, gently return to the sky',
      'Some clouds are dark, some are light - all pass',
      'You are the sky, not the clouds',
    ],
  },
  {
    id: 'gratitude-breath',
    title: 'Gratitude Breathing',
    duration: '2 min',
    icon: 'gift',
    color: '#fb923c',
    description: 'Combine breathing with gratitude for powerful calm.',
    instructions: [
      'Breathe in slowly for 4 counts',
      'As you breathe in, think of something you\'re grateful for',
      'Hold for 4 counts, feeling that gratitude',
      'Breathe out for 4 counts, releasing tension',
      'Repeat with a new gratitude each breath',
      'Continue for 2 minutes',
    ],
  },
];

// Animated breathing circle component
function BreathingCircle({ isActive }: { isActive: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    if (!isActive) {
      scaleAnim.setValue(1);
      return;
    }

    const breatheCycle = () => {
      // Breathe in
      setPhase('in');
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        // Hold
        setPhase('hold');
        setTimeout(() => {
          // Breathe out
          setPhase('out');
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }).start(() => {
            if (isActive) {
              breatheCycle();
            }
          });
        }, 2000);
      });
    };

    breatheCycle();

    return () => {
      scaleAnim.stopAnimation();
    };
  }, [isActive]);

  return (
    <View className="items-center my-6">
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
        className="w-32 h-32 rounded-full bg-primary-500/30 items-center justify-center"
      >
        <View className="w-24 h-24 rounded-full bg-primary-500/50 items-center justify-center">
          <Text className="text-primary-300 font-medium">
            {phase === 'in' ? 'Breathe In' : phase === 'hold' ? 'Hold' : 'Breathe Out'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function ExerciseCard({
  exercise,
  isActive,
  onStart,
  onComplete,
}: {
  exercise: MindfulnessExercise;
  isActive: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setIsRunning(false);
    }
  }, [isActive]);

  const handleStart = () => {
    setIsRunning(true);
    onStart();
  };

  const handleNext = () => {
    if (currentStep < exercise.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsRunning(false);
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View className={`rounded-2xl mb-4 border overflow-hidden ${
      isActive 
        ? 'bg-navy-800/60 border-primary-500/50' 
        : 'bg-navy-800/40 border-surface-700/30'
    }`}>
      {/* Header */}
      <TouchableOpacity
        onPress={isActive ? undefined : handleStart}
        className="flex-row items-center p-4"
        disabled={isActive}
      >
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${exercise.color}20` }}
        >
          <Feather name={exercise.icon} size={24} color={exercise.color} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg">{exercise.title}</Text>
          <Text className="text-surface-400 text-sm">{exercise.duration}</Text>
        </View>
        {!isActive && (
          <View className="bg-primary-500/20 px-3 py-1.5 rounded-full">
            <Text className="text-primary-400 text-sm font-medium">Start</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded content */}
      {isActive && (
        <View className="px-4 pb-4 border-t border-surface-700/30 pt-4">
          {!isRunning ? (
            <>
              <Text className="text-surface-300 mb-4">{exercise.description}</Text>
              <Button
                title="Begin Exercise"
                onPress={handleStart}
                icon="play"
              />
            </>
          ) : (
            <>
              {/* Breathing animation for certain exercises */}
              {(exercise.id === 'gratitude-breath' || exercise.id === 'body-scan') && (
                <BreathingCircle isActive={isRunning} />
              )}

              {/* Progress */}
              <View className="flex-row gap-1 mb-4">
                {exercise.instructions.map((_, i) => (
                  <View
                    key={i}
                    className={`flex-1 h-1 rounded-full ${
                      i <= currentStep ? 'bg-primary-500' : 'bg-surface-700/50'
                    }`}
                  />
                ))}
              </View>

              {/* Current instruction */}
              <View className="bg-navy-900/60 rounded-xl p-4 mb-4">
                <Text className="text-surface-400 text-xs mb-1">
                  Step {currentStep + 1} of {exercise.instructions.length}
                </Text>
                <Text className="text-white text-lg leading-7">
                  {exercise.instructions[currentStep]}
                </Text>
              </View>

              {/* Navigation */}
              <View className="flex-row gap-3">
                <Button
                  title="Previous"
                  onPress={handlePrev}
                  variant="outline"
                  disabled={currentStep === 0}
                  icon="chevron-left"
                />
                <View className="flex-1">
                  <Button
                    title={currentStep === exercise.instructions.length - 1 ? 'Complete' : 'Next'}
                    onPress={handleNext}
                    icon={currentStep === exercise.instructions.length - 1 ? 'check' : 'chevron-right'}
                    iconPosition="right"
                  />
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function MindfulnessScreen() {
  const router = useRouter();
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const handleStart = (id: string) => {
    setActiveExercise(id);
  };

  const handleComplete = (id: string) => {
    setCompletedExercises([...completedExercises, id]);
    setActiveExercise(null);
  };

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
          <Feather name="arrow-left" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Mindfulness Pack</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Introduction */}
        <View className="bg-primary-500/10 rounded-2xl p-4 mb-6 border border-primary-500/30">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="sun" size={18} color="#60a5fa" />
            <Text className="text-primary-400 font-semibold">Present Moment Awareness</Text>
          </View>
          <Text className="text-surface-300 text-sm leading-5">
            Mindfulness helps us step back from cravings and difficult emotions. 
            These exercises take just a few minutes and can be done anywhere.
          </Text>
        </View>

        {/* Progress */}
        {completedExercises.length > 0 && (
          <View className="mb-4">
            <Text className="text-surface-400 text-sm">
              {completedExercises.length} of {EXERCISES.length} completed today
            </Text>
          </View>
        )}

        {/* Exercise list */}
        {EXERCISES.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isActive={activeExercise === exercise.id}
            onStart={() => handleStart(exercise.id)}
            onComplete={() => handleComplete(exercise.id)}
          />
        ))}

        {/* Completion message */}
        {completedExercises.length === EXERCISES.length && (
          <View className="bg-success-500/10 rounded-2xl p-6 mb-6 border border-success-500/30 items-center">
            <Feather name="award" size={48} color="#4ade80" />
            <Text className="text-success-400 text-xl font-semibold mt-3">
              All exercises complete!
            </Text>
            <Text className="text-surface-300 text-center mt-2">
              You've practiced every mindfulness exercise. Great work taking care of yourself today.
            </Text>
          </View>
        )}

        {/* Tips */}
        <View className="bg-navy-800/40 rounded-2xl p-4 mb-8 border border-surface-700/30">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="info" size={16} color="#94a3b8" />
            <Text className="text-surface-400 font-medium">Mindfulness Tips</Text>
          </View>
          <Text className="text-surface-400 text-sm leading-5">
            • There's no "wrong" way to do these exercises{'\n'}
            • If your mind wanders, gently bring it back{'\n'}
            • Start with shorter exercises and build up{'\n'}
            • Practice regularly, not just in crisis
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

