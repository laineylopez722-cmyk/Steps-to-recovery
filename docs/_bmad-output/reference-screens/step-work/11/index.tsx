/**
 * Eleventh Step Practice
 * Prayer and meditation tools
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../../components/ui';
import { PRAYERS, PRAYER_CATEGORIES, getPrayersByCategory, getPrayerById } from '../../../lib/constants/prayers';

const MEDITATION_TIMES = [
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 20, label: '20 min' },
];

export default function EleventhStepScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'morning' | 'meditation' | 'evening'>('morning');
  const [meditationTime, setMeditationTime] = useState(10);
  const [isMeditating, setIsMeditating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showPrayer, setShowPrayer] = useState<string | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Use the browser Timeout type to avoid Node-only typings when targeting native
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Meditation pulse animation
  useEffect(() => {
    if (isMeditating) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(pulse).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [isMeditating]);

  // Meditation timer
  useEffect(() => {
    if (isMeditating && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsMeditating(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isMeditating]);

  const startMeditation = () => {
    setTimeRemaining(meditationTime * 60);
    setIsMeditating(true);
  };

  const stopMeditation = () => {
    setIsMeditating(false);
    setTimeRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedPrayer = showPrayer ? getPrayerById(showPrayer) : null;

  // Get recommended prayers for 11th step
  const stepPrayers = PRAYERS.filter(p => p.stepAssociation?.includes(11));
  const morningPrayers = getPrayersByCategory('daily').filter(p => 
    p.id === 'morning' || p.id === 'set-aside'
  );
  const eveningPrayers = getPrayersByCategory('daily').filter(p => 
    p.id === 'evening' || p.id === 'gratitude'
  );

  if (showPrayer && selectedPrayer) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <ScrollView className="flex-1 px-4 py-6">
          <TouchableOpacity onPress={() => setShowPrayer(null)} className="mb-6">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>

          <View className="items-center mb-6">
            <Text className="text-4xl mb-4">🙏</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              {selectedPrayer.title}
            </Text>
            {selectedPrayer.source && (
              <Text className="text-sm text-surface-500 mt-1">
                — {selectedPrayer.source}
              </Text>
            )}
          </View>

          <Card variant="elevated" className="mb-6">
            <Text className="text-lg text-surface-800 dark:text-surface-200 leading-relaxed whitespace-pre-line">
              {selectedPrayer.content}
            </Text>
          </Card>

          <Button
            title="Done"
            onPress={() => setShowPrayer(null)}
            size="lg"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isMeditating) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900">
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
            }}
            className="w-64 h-64 rounded-full bg-primary-500/20 items-center justify-center"
          >
            <View className="w-48 h-48 rounded-full bg-primary-500/40 items-center justify-center">
              <View className="w-32 h-32 rounded-full bg-primary-500 items-center justify-center">
                <Text className="text-4xl font-bold text-white">
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Text className="text-xl text-surface-300 mt-8 text-center">
            Breathe slowly...
          </Text>
          <Text className="text-surface-500 mt-2 text-center">
            Let thoughts pass like clouds
          </Text>

          <TouchableOpacity
            onPress={stopMeditation}
            className="mt-12 px-8 py-3 rounded-xl bg-surface-800"
          >
            <Text className="text-surface-300 font-medium">End Meditation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              Step 11 Practice
            </Text>
            <Text className="text-surface-500 text-sm">
              Prayer and meditation
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-6 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
          {(['morning', 'meditation', 'evening'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-lg ${
                activeTab === tab
                  ? 'bg-white dark:bg-surface-700'
                  : ''
              }`}
            >
              <Text className={`text-center font-medium ${
                activeTab === tab
                  ? 'text-primary-600'
                  : 'text-surface-500'
              }`}>
                {tab === 'morning' ? '☀️ Morning' : tab === 'meditation' ? '🧘 Meditate' : '🌙 Evening'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Morning Tab */}
        {activeTab === 'morning' && (
          <View>
            <Card variant="outlined" className="mb-4">
              <Text className="text-sm text-surface-600 dark:text-surface-400 italic leading-relaxed">
                "On awakening, let us think about the twenty-four hours ahead. We consider our plans 
                for the day. Before we begin, we ask God to direct our thinking..."
              </Text>
              <Text className="text-xs text-surface-500 mt-2">— Alcoholics Anonymous</Text>
            </Card>

            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              Morning Prayers
            </Text>

            {morningPrayers.map((prayer) => (
              <TouchableOpacity
                key={prayer.id}
                onPress={() => setShowPrayer(prayer.id)}
                activeOpacity={0.7}
              >
                <Card variant="default" className="mb-3 bg-amber-50 dark:bg-amber-900/20">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">☀️</Text>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                        {prayer.title}
                      </Text>
                      <Text className="text-sm text-surface-500" numberOfLines={1}>
                        {prayer.content.split('\n')[0]}...
                      </Text>
                    </View>
                    <Text className="text-surface-400">→</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}

            {/* Third Step Prayer */}
            <TouchableOpacity
              onPress={() => setShowPrayer('third-step')}
              activeOpacity={0.7}
            >
              <Card variant="default" className="mb-3">
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">🙏</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                      Third Step Prayer
                    </Text>
                    <Text className="text-sm text-surface-500">
                      Turn your will and life over
                    </Text>
                  </View>
                  <Text className="text-surface-400">→</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Meditation Tab */}
        {activeTab === 'meditation' && (
          <View>
            <Card variant="elevated" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
              <View className="items-center">
                <Text className="text-5xl mb-4">🧘</Text>
                <Text className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  Meditation Timer
                </Text>
                <Text className="text-surface-500 text-center mb-4">
                  Set your intention, then simply be present
                </Text>

                {/* Time Selection */}
                <View className="flex-row gap-2 mb-6">
                  {MEDITATION_TIMES.map((time) => (
                    <TouchableOpacity
                      key={time.minutes}
                      onPress={() => setMeditationTime(time.minutes)}
                      className={`px-4 py-2 rounded-xl ${
                        meditationTime === time.minutes
                          ? 'bg-primary-500'
                          : 'bg-surface-200 dark:bg-surface-700'
                      }`}
                    >
                      <Text className={
                        meditationTime === time.minutes
                          ? 'text-white font-medium'
                          : 'text-surface-600 dark:text-surface-400'
                      }>
                        {time.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  title="Begin Meditation"
                  onPress={startMeditation}
                  size="lg"
                />
              </View>
            </Card>

            {/* Meditation Tips */}
            <Card variant="outlined" className="mb-4">
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">
                💡 Meditation Tips
              </Text>
              <View className="gap-2">
                <Text className="text-sm text-surface-600 dark:text-surface-400">
                  • Find a quiet, comfortable place
                </Text>
                <Text className="text-sm text-surface-600 dark:text-surface-400">
                  • Focus on your breath
                </Text>
                <Text className="text-sm text-surface-600 dark:text-surface-400">
                  • When thoughts arise, acknowledge them and let them pass
                </Text>
                <Text className="text-sm text-surface-600 dark:text-surface-400">
                  • Be gentle with yourself—there's no "perfect" meditation
                </Text>
              </View>
            </Card>

            {/* St. Francis Prayer */}
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              11th Step Prayer
            </Text>
            <TouchableOpacity
              onPress={() => setShowPrayer('eleventh-step')}
              activeOpacity={0.7}
            >
              <Card variant="default" className="mb-3 bg-indigo-50 dark:bg-indigo-900/20">
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">✨</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                      St. Francis Prayer
                    </Text>
                    <Text className="text-sm text-surface-500">
                      "Lord, make me a channel of thy peace..."
                    </Text>
                  </View>
                  <Text className="text-surface-400">→</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Evening Tab */}
        {activeTab === 'evening' && (
          <View>
            <Card variant="outlined" className="mb-4">
              <Text className="text-sm text-surface-600 dark:text-surface-400 italic leading-relaxed">
                "When we retire at night, we constructively review our day... 
                We ask God's forgiveness and inquire what corrective measures should be taken."
              </Text>
              <Text className="text-xs text-surface-500 mt-2">— Alcoholics Anonymous</Text>
            </Card>

            {/* Link to 10th Step Review */}
            <TouchableOpacity
              onPress={() => router.push('/step-work/10/review')}
              activeOpacity={0.7}
            >
              <Card variant="elevated" className="mb-4 bg-indigo-100 dark:bg-indigo-900/30">
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">📝</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                      Nightly Inventory
                    </Text>
                    <Text className="text-sm text-surface-500">
                      Complete your 10th Step review
                    </Text>
                  </View>
                  <Text className="text-surface-400 text-lg">→</Text>
                </View>
              </Card>
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              Evening Prayers
            </Text>

            {eveningPrayers.map((prayer) => (
              <TouchableOpacity
                key={prayer.id}
                onPress={() => setShowPrayer(prayer.id)}
                activeOpacity={0.7}
              >
                <Card variant="default" className="mb-3 bg-indigo-50 dark:bg-indigo-900/20">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">🌙</Text>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                        {prayer.title}
                      </Text>
                      <Text className="text-sm text-surface-500" numberOfLines={1}>
                        {prayer.content.split('\n')[0]}...
                      </Text>
                    </View>
                    <Text className="text-surface-400">→</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}

            {/* Seventh Step Prayer */}
            <TouchableOpacity
              onPress={() => setShowPrayer('seventh-step')}
              activeOpacity={0.7}
            >
              <Card variant="default" className="mb-3">
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">🙏</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                      Seventh Step Prayer
                    </Text>
                    <Text className="text-sm text-surface-500">
                      Remove my shortcomings
                    </Text>
                  </View>
                  <Text className="text-surface-400">→</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Full Prayer Library Link */}
        <TouchableOpacity
          onPress={() => router.push('/prayers')}
          className="mt-4 mb-8"
        >
          <Card variant="outlined">
            <View className="flex-row items-center justify-center gap-2">
              <Text className="text-primary-600 font-medium">View All Prayers</Text>
              <Text className="text-primary-600">→</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

