/**
 * Grounding Techniques Screen
 * 5-4-3-2-1 grounding exercise for crisis moments
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '../components/ui';

interface GroundingStep {
  count: number;
  sense: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  color: string;
  prompt: string;
  examples: string[];
}

const GROUNDING_STEPS: GroundingStep[] = [
  {
    count: 5,
    sense: 'SEE',
    icon: 'eye',
    color: '#60a5fa', // blue
    prompt: 'Name 5 things you can SEE right now',
    examples: ['The wall color', 'A window', 'Your hands', 'A piece of furniture', 'Something on the floor'],
  },
  {
    count: 4,
    sense: 'TOUCH',
    icon: 'edit-3', // Using 'hand' but Feather doesn't have it, will use 'edit-3'
    color: '#4ade80', // green
    prompt: 'Name 4 things you can TOUCH',
    examples: ['Your clothes', 'The chair', 'Your phone', 'The floor beneath your feet'],
  },
  {
    count: 3,
    sense: 'HEAR',
    icon: 'headphones',
    color: '#fbbf24', // yellow
    prompt: 'Name 3 things you can HEAR',
    examples: ['Traffic outside', 'Your breathing', 'Air conditioning', 'Birds'],
  },
  {
    count: 2,
    sense: 'SMELL',
    icon: 'wind',
    color: '#f472b6', // pink
    prompt: 'Name 2 things you can SMELL',
    examples: ['Fresh air', 'Coffee', 'Your soap', 'Food'],
  },
  {
    count: 1,
    sense: 'TASTE',
    icon: 'coffee',
    color: '#a78bfa', // purple
    prompt: 'Name 1 thing you can TASTE',
    examples: ['Water', 'Mint', 'Coffee', 'Your toothpaste'],
  },
];

function GroundingStepCard({
  step,
  isActive,
  isComplete,
  onComplete,
}: {
  step: GroundingStep;
  isActive: boolean;
  isComplete: boolean;
  onComplete: () => void;
}) {
  const [items, setItems] = useState<string[]>([]);

  const handleAddItem = () => {
    if (items.length < step.count) {
      setItems([...items, `Item ${items.length + 1}`]);
      if (items.length + 1 >= step.count) {
        onComplete();
      }
    }
  };

  return (
    <View 
      className={`rounded-2xl p-5 mb-4 border ${
        isComplete 
          ? 'bg-success-500/10 border-success-500/30' 
          : isActive 
            ? 'bg-navy-800/60 border-primary-500/50' 
            : 'bg-navy-800/30 border-surface-700/30'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: `${step.color}20` }}
          >
            <Text className="text-2xl font-bold" style={{ color: step.color }}>
              {step.count}
            </Text>
          </View>
          <View>
            <Text className="text-white text-lg font-semibold">{step.sense}</Text>
            <Text className="text-surface-400 text-sm">things you can {step.sense.toLowerCase()}</Text>
          </View>
        </View>
        {isComplete && (
          <Feather name="check-circle" size={24} color="#4ade80" />
        )}
      </View>

      {/* Prompt */}
      <Text className="text-surface-300 mb-4">{step.prompt}</Text>

      {/* Progress dots */}
      {isActive && !isComplete && (
        <View className="mb-4">
          <View className="flex-row gap-2 mb-3">
            {Array.from({ length: step.count }).map((_, i) => (
              <View
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < items.length ? 'bg-primary-500' : 'bg-surface-700/50'
                }`}
              />
            ))}
          </View>
          <Text className="text-surface-400 text-sm text-center">
            {items.length} of {step.count} identified
          </Text>
        </View>
      )}

      {/* Examples */}
      {isActive && !isComplete && (
        <View className="mb-4">
          <Text className="text-surface-500 text-xs mb-2">Examples:</Text>
          <View className="flex-row flex-wrap gap-2">
            {step.examples.slice(0, 3).map((example, i) => (
              <View key={i} className="bg-surface-700/30 px-2 py-1 rounded">
                <Text className="text-surface-400 text-xs">{example}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action button */}
      {isActive && !isComplete && (
        <TouchableOpacity
          onPress={handleAddItem}
          className="bg-primary-500 py-3 rounded-xl flex-row items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={`I found something I can ${step.sense.toLowerCase()}`}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">
            I found one ({items.length + 1}/{step.count})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GroundingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps([...completedSteps, stepIndex]);
    if (stepIndex < GROUNDING_STEPS.length - 1) {
      setTimeout(() => setCurrentStep(stepIndex + 1), 500);
    }
  };

  const allComplete = completedSteps.length === GROUNDING_STEPS.length;

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
        <Text className="text-white text-lg font-semibold">5-4-3-2-1 Grounding</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Introduction */}
        <View className="bg-primary-500/10 rounded-2xl p-4 mb-6 border border-primary-500/30">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="anchor" size={18} color="#60a5fa" />
            <Text className="text-primary-400 font-semibold">Grounding Exercise</Text>
          </View>
          <Text className="text-surface-300 text-sm leading-5">
            This technique helps bring you back to the present moment when you're feeling overwhelmed. 
            Focus on your senses to anchor yourself in the here and now.
          </Text>
        </View>

        {/* Progress */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-surface-400">Progress</Text>
            <Text className="text-primary-400">{completedSteps.length}/5 complete</Text>
          </View>
          <View className="flex-row gap-1">
            {GROUNDING_STEPS.map((step, i) => (
              <View
                key={i}
                className={`flex-1 h-2 rounded-full`}
                style={{ 
                  backgroundColor: completedSteps.includes(i) 
                    ? step.color 
                    : 'rgba(100, 116, 139, 0.3)' 
                }}
              />
            ))}
          </View>
        </View>

        {/* Steps */}
        {GROUNDING_STEPS.map((step, index) => (
          <GroundingStepCard
            key={index}
            step={step}
            isActive={currentStep === index}
            isComplete={completedSteps.includes(index)}
            onComplete={() => handleStepComplete(index)}
          />
        ))}

        {/* Completion message */}
        {allComplete && (
          <View className="bg-success-500/10 rounded-2xl p-6 mb-6 border border-success-500/30 items-center">
            <Feather name="check-circle" size={48} color="#4ade80" />
            <Text className="text-success-400 text-xl font-semibold mt-3">
              You're grounded!
            </Text>
            <Text className="text-surface-300 text-center mt-2">
              Take a deep breath. You've successfully anchored yourself in the present moment.
            </Text>
            <View className="flex-row gap-3 mt-4">
              <Button
                title="Do Again"
                onPress={() => {
                  setCurrentStep(0);
                  setCompletedSteps([]);
                }}
                variant="outline"
              />
              <Button
                title="Done"
                onPress={() => router.back()}
              />
            </View>
          </View>
        )}

        {/* Tips */}
        <View className="bg-navy-800/40 rounded-2xl p-4 mb-8 border border-surface-700/30">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="info" size={16} color="#94a3b8" />
            <Text className="text-surface-400 font-medium">Tips</Text>
          </View>
          <Text className="text-surface-400 text-sm leading-5">
            • Take your time with each sense{'\n'}
            • Actually look around, touch things, listen{'\n'}
            • Name specific items, not general categories{'\n'}
            • Repeat this exercise as needed
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

