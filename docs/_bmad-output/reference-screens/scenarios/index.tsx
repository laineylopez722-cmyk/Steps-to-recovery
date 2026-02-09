/**
 * Trigger Scenario Simulator Index
 * Practice responding to triggers with evidence-based coping strategies
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useScenarioStore } from '../../lib/store';
import {
  SCENARIO_CATEGORIES,
  TRIGGER_SCENARIOS,
  getScenariosByCategory,
  getRandomScenario,
} from '../../lib/constants/triggerScenarios';
import type { ScenarioCategory, TriggerScenario } from '../../lib/types';

function CategoryCard({
  category,
  onPress,
  scenarioCount,
}: {
  category: typeof SCENARIO_CATEGORIES[0];
  onPress: () => void;
  scenarioCount: number;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="mb-3">
      <Card variant="elevated">
        <View className="flex-row items-center gap-4">
          <View
            className="w-14 h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: category.color + '20' }}
          >
            <Text className="text-3xl">{category.emoji}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {category.label}
            </Text>
            <Text className="text-sm text-surface-500">
              {scenarioCount} scenario{scenarioCount !== 1 ? 's' : ''} to practice
            </Text>
          </View>
          <Text className="text-surface-400 text-lg">→</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function ScenarioCard({
  scenario,
  onPress,
  isPracticed,
}: {
  scenario: TriggerScenario;
  onPress: () => void;
  isPracticed: boolean;
}) {
  const category = SCENARIO_CATEGORIES.find((c) => c.id === scenario.category);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="mb-3">
      <Card variant={isPracticed ? 'default' : 'outlined'}>
        <View className="flex-row items-start gap-3">
          <View
            className="w-10 h-10 rounded-lg items-center justify-center"
            style={{ backgroundColor: (category?.color || '#6366f1') + '20' }}
          >
            <Text className="text-xl">{category?.emoji || '🎯'}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-medium text-surface-900 dark:text-surface-100 flex-1">
                {scenario.title}
              </Text>
              {isPracticed && <Text className="text-green-500">✓</Text>}
            </View>
            <Text className="text-sm text-surface-500 mt-1" numberOfLines={2}>
              {scenario.description}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function ScenariosIndexScreen() {
  const router = useRouter();
  const { loadPractices, practices, getTotalPractices, getSuccessRate } = useScenarioStore();

  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | null>(null);

  useEffect(() => {
    loadPractices();
  }, []);

  const handleRandomScenario = () => {
    const scenario = getRandomScenario();
    router.push(`/scenarios/${scenario.id}`);
  };

  const handleCategoryPress = (category: ScenarioCategory) => {
    setSelectedCategory(category);
  };

  const getPracticedScenarioIds = () => {
    return new Set(practices.map((p) => p.scenarioId));
  };

  const practicedIds = getPracticedScenarioIds();
  const totalPractices = getTotalPractices();
  const successRate = getSuccessRate();

  // Category selection view
  if (!selectedCategory) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <ScrollView className="flex-1 px-4 py-6">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary-600">← Back</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Trigger Scenarios
            </Text>
          </View>

          {/* Introduction */}
          <Card variant="elevated" className="mb-6 bg-amber-50 dark:bg-amber-900/20">
            <View className="flex-row items-start gap-3">
              <Text className="text-3xl">🎯</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-amber-800 dark:text-amber-200">
                  Practice Makes Progress
                </Text>
                <Text className="text-sm text-amber-600 dark:text-amber-400">
                  Rehearse your responses to common triggers. The more you practice healthy choices
                  here, the easier they become in real life.
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick Start */}
          <Button
            title="🎲 Random Scenario"
            onPress={handleRandomScenario}
            variant="secondary"
            className="mb-6"
          />

          {/* Stats */}
          {totalPractices > 0 && (
            <Card variant="default" className="mb-6">
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-primary-600">{totalPractices}</Text>
                  <Text className="text-xs text-surface-500">Practices</Text>
                </View>
                <View className="w-px bg-surface-200 dark:bg-surface-700" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-green-600">{successRate}%</Text>
                  <Text className="text-xs text-surface-500">Healthy Choices</Text>
                </View>
                <View className="w-px bg-surface-200 dark:bg-surface-700" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-secondary-600">{practicedIds.size}</Text>
                  <Text className="text-xs text-surface-500">Unique Scenarios</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Categories */}
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            Choose a Category
          </Text>
          {SCENARIO_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategoryPress(category.id)}
              scenarioCount={getScenariosByCategory(category.id).length}
            />
          ))}

          {/* History Link */}
          {totalPractices > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/scenarios/history')}
              className="mt-4 py-3"
            >
              <Text className="text-center text-primary-600">
                View Practice History →
              </Text>
            </TouchableOpacity>
          )}

          {/* Info Card */}
          <Card variant="outlined" className="mt-6 mb-8">
            <View className="flex-row items-start gap-2">
              <Text>💡</Text>
              <Text className="text-sm text-surface-500 flex-1">
                <Text className="font-medium">"Play the tape forward"</Text> - When facing a trigger,
                imagine the full consequences of each choice before acting.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Scenario list for selected category
  const categoryScenarios = getScenariosByCategory(selectedCategory);
  const categoryInfo = SCENARIO_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => setSelectedCategory(null)} className="mr-3">
            <Text className="text-primary-600">← Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Text className="text-xl">{categoryInfo?.emoji}</Text>
            <Text className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {categoryInfo?.label}
            </Text>
          </View>
        </View>

        {/* Scenarios */}
        {categoryScenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onPress={() => router.push(`/scenarios/${scenario.id}`)}
            isPracticed={practicedIds.has(scenario.id)}
          />
        ))}

        {categoryScenarios.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-surface-400">No scenarios in this category yet</Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

