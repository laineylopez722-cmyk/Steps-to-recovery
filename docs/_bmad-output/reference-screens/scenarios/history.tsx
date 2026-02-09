/**
 * Scenario Practice History
 * View past scenario practice sessions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';
import { useScenarioStore } from '../../lib/store';
import {
  getScenarioById,
  SCENARIO_CATEGORIES,
} from '../../lib/constants/triggerScenarios';
import type { ScenarioPractice } from '../../lib/types';

function PracticeCard({ practice }: { practice: ScenarioPractice }) {
  const router = useRouter();
  const scenario = getScenarioById(practice.scenarioId);
  if (!scenario) return null;

  const category = SCENARIO_CATEGORIES.find((c) => c.id === scenario.category);
  const selectedOption = scenario.options[practice.selectedOptionIndex];
  const wasHealthy = selectedOption?.isHealthy;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/scenarios/${scenario.id}`)}
      activeOpacity={0.7}
    >
      <Card variant="default" className="mb-3">
        <View className="flex-row items-start gap-3">
          {/* Status indicator */}
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              wasHealthy
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}
          >
            <Text>{wasHealthy ? '✓' : '📚'}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                {scenario.title}
              </Text>
            </View>
            <Text className="text-sm text-surface-500">
              {category?.emoji} {category?.label}
            </Text>
            <Text className="text-xs text-surface-400 mt-1">
              {practice.completedAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>

            {/* Reflection preview */}
            {practice.reflection && (
              <View className="mt-2 bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-2">
                <Text className="text-xs text-surface-500" numberOfLines={2}>
                  "{practice.reflection}"
                </Text>
              </View>
            )}
          </View>

          {/* Choice indicator */}
          <View
            className={`px-2 py-1 rounded ${
              wasHealthy ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            }`}
          >
            <Text
              className={`text-xs ${
                wasHealthy ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {wasHealthy ? 'Healthy' : 'Learning'}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function ScenarioHistoryScreen() {
  const router = useRouter();
  const { practices, loadPractices, getTotalPractices, getSuccessRate } = useScenarioStore();

  useEffect(() => {
    loadPractices();
  }, []);

  const totalPractices = getTotalPractices();
  const successRate = getSuccessRate();
  const healthyCount = practices.filter((p) => {
    const scenario = getScenarioById(p.scenarioId);
    return scenario?.options[p.selectedOptionIndex]?.isHealthy;
  }).length;

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-primary-600">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Practice History
          </Text>
        </View>

        {/* Stats Summary */}
        <Card variant="elevated" className="mb-6">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-3xl font-bold text-primary-600">{totalPractices}</Text>
              <Text className="text-xs text-surface-500">Total Practices</Text>
            </View>
            <View className="w-px bg-surface-200 dark:bg-surface-700" />
            <View className="items-center">
              <Text className="text-3xl font-bold text-green-600">{healthyCount}</Text>
              <Text className="text-xs text-surface-500">Healthy Choices</Text>
            </View>
            <View className="w-px bg-surface-200 dark:bg-surface-700" />
            <View className="items-center">
              <Text className="text-3xl font-bold text-secondary-600">{successRate}%</Text>
              <Text className="text-xs text-surface-500">Success Rate</Text>
            </View>
          </View>
        </Card>

        {/* Encouragement based on progress */}
        {totalPractices > 0 && (
          <Card
            variant="default"
            className={`mb-6 ${
              successRate >= 70
                ? 'bg-green-50 dark:bg-green-900/20'
                : successRate >= 50
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : 'bg-primary-50 dark:bg-primary-900/20'
            }`}
          >
            <View className="items-center">
              <Text className="text-3xl mb-2">
                {successRate >= 70 ? '🌟' : successRate >= 50 ? '📈' : '💪'}
              </Text>
              <Text
                className={`text-center font-medium ${
                  successRate >= 70
                    ? 'text-green-800 dark:text-green-200'
                    : successRate >= 50
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-primary-800 dark:text-primary-200'
                }`}
              >
                {successRate >= 70
                  ? 'Excellent work! Your healthy choices are becoming habits.'
                  : successRate >= 50
                  ? "You're learning and growing. Keep practicing!"
                  : 'Every practice is a step forward. Be patient with yourself.'}
              </Text>
            </View>
          </Card>
        )}

        {/* Practice List */}
        {practices.length > 0 ? (
          <>
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              Recent Practice Sessions
            </Text>
            {practices.map((practice) => (
              <PracticeCard key={practice.id} practice={practice} />
            ))}
          </>
        ) : (
          <View className="items-center py-12">
            <Text className="text-5xl mb-4">🎯</Text>
            <Text className="text-lg font-medium text-surface-700 dark:text-surface-300 text-center">
              No practice sessions yet
            </Text>
            <Text className="text-surface-500 text-center mt-2">
              Start practicing scenarios to build your coping skills
            </Text>
          </View>
        )}

        {/* Tips */}
        <Card variant="outlined" className="mt-6 mb-8">
          <View className="flex-row items-start gap-2">
            <Text>💡</Text>
            <Text className="text-sm text-surface-500 flex-1">
              Research shows that mental rehearsal improves real-world decision making.
              The more you practice healthy responses here, the more automatic they become
              when facing actual triggers.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

