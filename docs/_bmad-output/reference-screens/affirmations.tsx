/**
 * Daily Affirmations Screen
 * Positive recovery affirmations with personalization
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../components/ui';
import { useSobriety } from '../lib/hooks/useSobriety';

const { width } = Dimensions.get('window');

interface Affirmation {
  id: string;
  text: string;
  category: 'strength' | 'gratitude' | 'growth' | 'peace' | 'hope';
}

const AFFIRMATIONS: Affirmation[] = [
  // Strength
  { id: 's1', text: "I am stronger than my cravings. This moment will pass.", category: 'strength' },
  { id: 's2', text: "I have survived 100% of my hardest days. I will survive this one too.", category: 'strength' },
  { id: 's3', text: "My past does not define me. Every day I choose who I become.", category: 'strength' },
  { id: 's4', text: "I am worthy of recovery and a life free from addiction.", category: 'strength' },
  { id: 's5', text: "I have the courage to face my fears without numbing myself.", category: 'strength' },
  
  // Gratitude
  { id: 'g1', text: "I am grateful for this moment of clarity.", category: 'gratitude' },
  { id: 'g2', text: "My sobriety is a gift I give myself every day.", category: 'gratitude' },
  { id: 'g3', text: "I appreciate the small victories that make up my recovery.", category: 'gratitude' },
  { id: 'g4', text: "I am thankful for the people who support my journey.", category: 'gratitude' },
  { id: 'g5', text: "Every sober breath is a blessing I do not take for granted.", category: 'gratitude' },
  
  // Growth
  { id: 'gr1', text: "Progress, not perfection, is my goal.", category: 'growth' },
  { id: 'gr2', text: "I learn and grow from every experience, including setbacks.", category: 'growth' },
  { id: 'gr3', text: "I am becoming the person I was always meant to be.", category: 'growth' },
  { id: 'gr4', text: "Every step forward, no matter how small, is still progress.", category: 'growth' },
  { id: 'gr5', text: "I embrace change as an opportunity for growth.", category: 'growth' },
  
  // Peace
  { id: 'p1', text: "I release what I cannot control and focus on what I can.", category: 'peace' },
  { id: 'p2', text: "I deserve peace, and I am creating it in my life.", category: 'peace' },
  { id: 'p3', text: "I let go of guilt and shame. They no longer serve me.", category: 'peace' },
  { id: 'p4', text: "In this moment, I am safe. I am at peace.", category: 'peace' },
  { id: 'p5', text: "I accept myself exactly as I am, while working to improve.", category: 'peace' },
  
  // Hope
  { id: 'h1', text: "Today is a new beginning. My story is not over.", category: 'hope' },
  { id: 'h2', text: "Recovery is possible. I am living proof.", category: 'hope' },
  { id: 'h3', text: "Better days are ahead. I am building them right now.", category: 'hope' },
  { id: 'h4', text: "I have hope because I have survived this far.", category: 'hope' },
  { id: 'h5', text: "Every sunrise is another chance to make today count.", category: 'hope' },
];

const CATEGORY_INFO = {
  strength: { label: 'Strength', emoji: '💪', color: '#ef4444' },
  gratitude: { label: 'Gratitude', emoji: '🙏', color: '#f59e0b' },
  growth: { label: 'Growth', emoji: '🌱', color: '#22c55e' },
  peace: { label: 'Peace', emoji: '☮️', color: '#3b82f6' },
  hope: { label: 'Hope', emoji: '✨', color: '#8b5cf6' },
};

export default function AffirmationsScreen() {
  const router = useRouter();
  const { soberDays } = useSobriety();
  
  const [selectedCategory, setSelectedCategory] = useState<Affirmation['category'] | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get today's affirmation based on sobriety days
  const todaysAffirmation = AFFIRMATIONS[soberDays % AFFIRMATIONS.length];

  // Filter affirmations
  const filteredAffirmations = selectedCategory === 'all'
    ? AFFIRMATIONS
    : AFFIRMATIONS.filter((a) => a.category === selectedCategory);

  const currentAffirmation = filteredAffirmations[currentIndex % filteredAffirmations.length];

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    animateTransition(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredAffirmations.length);
    });
  };

  const handlePrevious = () => {
    animateTransition(() => {
      setCurrentIndex((prev) => 
        prev === 0 ? filteredAffirmations.length - 1 : prev - 1
      );
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${currentAffirmation.text}" — Recovery Companion 🌱`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
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
        </View>

        {/* Title */}
        <View className="items-center mb-6">
          <Text className="text-3xl mb-2">💬</Text>
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Daily Affirmations
          </Text>
          <Text className="text-surface-500 text-center mt-1">
            Words of encouragement for your journey
          </Text>
        </View>

        {/* Today's Special */}
        <Card 
          variant="elevated" 
          className="mb-6 bg-primary-50 dark:bg-primary-900/20"
        >
          <View className="items-center">
            <Text className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-2">
              ✨ Today's Affirmation — Day {soberDays}
            </Text>
            <Text className="text-xl text-primary-900 dark:text-primary-100 text-center italic leading-relaxed">
              "{todaysAffirmation.text}"
            </Text>
          </View>
        </Card>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-4 px-4"
        >
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory('all');
                setCurrentIndex(0);
              }}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'all'
                  ? 'bg-primary-500'
                  : 'bg-surface-100 dark:bg-surface-800'
              }`}
            >
              <Text
                className={
                  selectedCategory === 'all'
                    ? 'text-white font-medium'
                    : 'text-surface-600 dark:text-surface-400'
                }
              >
                All
              </Text>
            </TouchableOpacity>
            
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  setSelectedCategory(key as Affirmation['category']);
                  setCurrentIndex(0);
                }}
                style={{
                  backgroundColor:
                    selectedCategory === key ? info.color : undefined,
                }}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory !== key
                    ? 'bg-surface-100 dark:bg-surface-800'
                    : ''
                }`}
              >
                <Text
                  className={
                    selectedCategory === key
                      ? 'text-white font-medium'
                      : 'text-surface-600 dark:text-surface-400'
                  }
                >
                  {info.emoji} {info.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Main Affirmation Card */}
        <Card variant="elevated" className="mb-6 min-h-[200px] justify-center">
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="items-center"
          >
            <Text className="text-2xl mb-4">
              {CATEGORY_INFO[currentAffirmation.category].emoji}
            </Text>
            <Text className="text-xl text-surface-900 dark:text-surface-100 text-center leading-relaxed px-4">
              "{currentAffirmation.text}"
            </Text>
            <View
              style={{
                backgroundColor: CATEGORY_INFO[currentAffirmation.category].color,
              }}
              className="mt-4 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-sm">
                {CATEGORY_INFO[currentAffirmation.category].label}
              </Text>
            </View>
          </Animated.View>
        </Card>

        {/* Navigation & Actions */}
        <View className="flex-row items-center justify-center gap-4 mb-6">
          <TouchableOpacity
            onPress={handlePrevious}
            className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 items-center justify-center"
          >
            <Text className="text-2xl text-surface-600 dark:text-surface-400">←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite(currentAffirmation.id)}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              favorites.includes(currentAffirmation.id)
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-surface-100 dark:bg-surface-800'
            }`}
          >
            <Text className="text-2xl">
              {favorites.includes(currentAffirmation.id) ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 items-center justify-center"
          >
            <Text className="text-2xl">📤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 items-center justify-center"
          >
            <Text className="text-2xl text-surface-600 dark:text-surface-400">→</Text>
          </TouchableOpacity>
        </View>

        {/* Counter */}
        <Text className="text-center text-surface-400 mb-6">
          {currentIndex + 1} of {filteredAffirmations.length}
        </Text>

        {/* Practice Tip */}
        <Card variant="outlined" className="mb-8">
          <Text className="text-surface-600 dark:text-surface-400 text-center">
            💡 <Text className="font-medium">Practice tip:</Text> Read each affirmation 
            slowly. Breathe. Let it sink in. Say it out loud if you can.
          </Text>
        </Card>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              ❤️ Your Favorites
            </Text>
            {AFFIRMATIONS.filter((a) => favorites.includes(a.id)).map((aff) => (
              <Card key={aff.id} variant="default" className="mb-2">
                <Text className="text-surface-700 dark:text-surface-300 italic">
                  "{aff.text}"
                </Text>
              </Card>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

