/**
 * Step Work Index Screen
 * Overview and selection of all 12 steps with special step tools
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Card } from '../../components/ui';
import { STEP_PROMPTS } from '../../lib/constants/stepPrompts';
import { useJournalStore, useFourthStepStore, useAmendsStore, useTenthStepStore } from '../../lib/store';

// Get progress indicator color based on journal entries
function getStepProgress(step: number, entries: { type: string; stepNumber?: number }[]): 'none' | 'started' | 'completed' {
  const stepEntries = entries.filter(
    (e) => e.type === 'step-work' && e.stepNumber === step
  );
  if (stepEntries.length === 0) return 'none';
  if (stepEntries.length >= 3) return 'completed'; // 3+ entries = completed
  return 'started';
}

// Special step tools
const SPECIAL_STEP_TOOLS = [
  {
    step: 4,
    title: '4th Step Inventory',
    description: 'Resentments, fears, and relationships in Big Book format',
    icon: '📋',
    route: '/step-work/4/inventory',
    color: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    step: 8,
    title: 'Amends Tracker',
    description: 'Track your 8th & 9th step amends list and progress',
    icon: '📝',
    route: '/step-work/8-9',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    step: 10,
    title: 'Nightly Review',
    description: 'Daily 10th step personal inventory',
    icon: '🌙',
    route: '/step-work/10/review',
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    step: 11,
    title: 'Prayer & Meditation',
    description: 'Morning and evening practice with prayer library',
    icon: '🙏',
    route: '/step-work/11',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
];

function StepCard({
  step,
  progress,
  onPress,
}: {
  step: typeof STEP_PROMPTS[0];
  progress: 'none' | 'started' | 'completed';
  onPress: () => void;
}) {
  const progressColors = {
    none: 'bg-surface-100 dark:bg-surface-800',
    started: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
    completed: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  };

  const numberColors = {
    none: 'bg-surface-300 dark:bg-surface-600',
    started: 'bg-amber-500',
    completed: 'bg-green-500',
  };

  const progressIcon = {
    none: null,
    started: '📝',
    completed: '✅',
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        variant={progress !== 'none' ? 'outlined' : 'default'}
        className={`mb-3 ${progressColors[progress]}`}
      >
        <View className="flex-row items-center">
          {/* Step Number */}
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${numberColors[progress]}`}
          >
            <Text className="text-white font-bold text-lg">{step.step}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {step.title}
              </Text>
              {progressIcon[progress] && (
                <Text className="text-sm">{progressIcon[progress]}</Text>
              )}
            </View>
            <Text className="text-sm text-surface-500" numberOfLines={2}>
              {step.description}
            </Text>
          </View>

          {/* Arrow */}
          <Text className="text-surface-400 text-lg">→</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function StepWorkIndexScreen() {
  const router = useRouter();
  const { entries } = useJournalStore();
  const { loadEntries: loadFourthStep, getCounts } = useFourthStepStore();
  const { loadEntries: loadAmends, getStats } = useAmendsStore();
  const { loadRecentReviews, currentStreak, hasCompletedToday } = useTenthStepStore();

  // Load data for special tools
  useEffect(() => {
    loadFourthStep();
    loadAmends();
    loadRecentReviews(7);
  }, []);

  const fourthStepCounts = getCounts();
  const amendsStats = getStats();
  const tenthStepStreak = currentStreak;
  const tenthStepDone = hasCompletedToday();

  // Calculate overall progress
  const completedSteps = STEP_PROMPTS.filter(
    (s) => getStepProgress(s.step, entries) === 'completed'
  ).length;

  const startedSteps = STEP_PROMPTS.filter(
    (s) => getStepProgress(s.step, entries) === 'started'
  ).length;

  // Get badge info for special tools
  const getToolBadge = (step: number) => {
    switch (step) {
      case 4:
        const total = fourthStepCounts.resentments + fourthStepCounts.fears + fourthStepCounts.sexConduct;
        return total > 0 ? `${total} entries` : null;
      case 8:
        return amendsStats.total > 0 
          ? `${amendsStats.made}/${amendsStats.total} made`
          : null;
      case 10:
        return tenthStepStreak > 0 
          ? `🔥 ${tenthStepStreak} day streak`
          : tenthStepDone ? '✓ Today' : null;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Step Work Guide
            </Text>
          </View>
        </View>

        {/* Progress Overview */}
        <Card variant="elevated" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-primary-500 items-center justify-center">
              <Text className="text-3xl font-bold text-white">{completedSteps}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                Your Progress
              </Text>
              <Text className="text-sm text-primary-700 dark:text-primary-300">
                {completedSteps}/12 steps completed
                {startedSteps > 0 && ` • ${startedSteps} in progress`}
              </Text>
              
              {/* Progress Bar */}
              <View className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full mt-2">
                <View
                  className="h-2 bg-primary-500 rounded-full"
                  style={{ width: `${(completedSteps / 12) * 100}%` }}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Special Step Tools */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            Step Work Tools
          </Text>
          {SPECIAL_STEP_TOOLS.map((tool) => {
            const badge = getToolBadge(tool.step);
            return (
              <TouchableOpacity
                key={tool.step}
                onPress={() => router.push(tool.route as Href)}
                activeOpacity={0.7}
              >
                <Card variant="default" className={`mb-3 ${tool.bgColor}`}>
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-full ${tool.color} items-center justify-center mr-4`}>
                      <Text className="text-xl">{tool.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                          {tool.title}
                        </Text>
                        {badge && (
                          <View className="bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                            <Text className="text-xs text-surface-600 dark:text-surface-400">
                              {badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-surface-500 mt-0.5">
                        {tool.description}
                      </Text>
                    </View>
                    <Text className="text-surface-400 text-lg">→</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Intro Card */}
        <Card variant="outlined" className="mb-6">
          <Text className="text-surface-700 dark:text-surface-300 leading-relaxed">
            The 12 Steps are a spiritual foundation for personal recovery. Work through each step 
            at your own pace with your sponsor. Use these guided prompts to reflect and journal 
            your journey.
          </Text>
        </Card>

        {/* Step List */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            The 12 Steps
          </Text>
          {STEP_PROMPTS.map((step) => (
            <StepCard
              key={step.step}
              step={step}
              progress={getStepProgress(step.step, entries)}
              onPress={() => router.push(`/step-work/${step.step}`)}
            />
          ))}
        </View>

        {/* Disclaimer */}
        <Card variant="default" className="mb-8">
          <Text className="text-surface-500 text-sm text-center">
            💡 These prompts are guides for personal reflection. They're not a substitute for 
            working with a sponsor or attending meetings.
          </Text>
        </Card>

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

