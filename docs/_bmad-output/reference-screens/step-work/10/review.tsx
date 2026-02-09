/**
 * Tenth Step Nightly Review
 * Daily personal inventory
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../../components/ui';
import { useTenthStepStore } from '../../../lib/store';

const REVIEW_QUESTIONS = [
  {
    key: 'wasResentful',
    question: 'Was I resentful?',
    placeholder: 'Who or what did I resent today? Why?',
    icon: '😤',
  },
  {
    key: 'wasSelfish',
    question: 'Was I selfish?',
    placeholder: 'Where did I put myself first at the expense of others?',
    icon: '🙄',
  },
  {
    key: 'wasDishonest',
    question: 'Was I dishonest?',
    placeholder: 'Did I lie or withhold the truth? Where?',
    icon: '🤥',
  },
  {
    key: 'wasAfraid',
    question: 'Was I afraid?',
    placeholder: 'What fears influenced my actions today?',
    icon: '😰',
  },
  {
    key: 'oweApology',
    question: 'Do I owe anyone an apology?',
    placeholder: 'Who do I need to make right with? What happened?',
    icon: '🙏',
  },
  {
    key: 'couldDoBetter',
    question: 'What could I have done better?',
    placeholder: 'Where did I fall short? What would I do differently?',
    icon: '💪',
  },
  {
    key: 'gratefulFor',
    question: 'What am I grateful for?',
    placeholder: 'List at least 3 things you\'re grateful for today...',
    icon: '🙏',
  },
] as const;

type ReviewKey = typeof REVIEW_QUESTIONS[number]['key'];

export default function TenthStepReviewScreen() {
  const router = useRouter();
  const { 
    reviews, 
    currentStreak, 
    loadRecentReviews, 
    createReview, 
    getTodayReview, 
    getDecryptedReview,
    hasCompletedToday,
    isLoading 
  } = useTenthStepStore();

  const [answers, setAnswers] = useState<Record<ReviewKey, string>>({
    wasResentful: '',
    wasSelfish: '',
    wasDishonest: '',
    wasAfraid: '',
    oweApology: '',
    couldDoBetter: '',
    gratefulFor: '',
  });
  const [showHistory, setShowHistory] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(REVIEW_QUESTIONS[0].key);

  useEffect(() => {
    loadRecentReviews(7);
  }, []);

  // Load today's review if it exists
  useEffect(() => {
    const loadTodayReview = async () => {
      const todayReview = getTodayReview();
      if (todayReview) {
        const decrypted = await getDecryptedReview(todayReview.id);
        if (decrypted) {
          setAnswers({
            wasResentful: decrypted.wasResentful || '',
            wasSelfish: decrypted.wasSelfish || '',
            wasDishonest: decrypted.wasDishonest || '',
            wasAfraid: decrypted.wasAfraid || '',
            oweApology: decrypted.oweApology || '',
            couldDoBetter: decrypted.couldDoBetter || '',
            gratefulFor: decrypted.gratefulFor || '',
          });
        }
      }
    };

    loadTodayReview();
  }, [reviews]);

  const handleAnswerChange = (key: ReviewKey, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Check if at least one answer is provided
    const hasAnswer = Object.values(answers).some(v => v.trim());
    if (!hasAnswer) {
      Alert.alert('Empty Review', 'Please answer at least one question before saving.');
      return;
    }

    try {
      await createReview({
        wasResentful: answers.wasResentful || undefined,
        wasSelfish: answers.wasSelfish || undefined,
        wasDishonest: answers.wasDishonest || undefined,
        wasAfraid: answers.wasAfraid || undefined,
        oweApology: answers.oweApology || undefined,
        couldDoBetter: answers.couldDoBetter || undefined,
        gratefulFor: answers.gratefulFor || undefined,
      });

      Alert.alert(
        '✅ Review Saved',
        'Your nightly review has been saved. Keep up the great work!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save review:', error);
      Alert.alert('Error', 'Failed to save review. Please try again.');
    }
  };

  const answeredCount = Object.values(answers).filter(v => v.trim()).length;
  const completedToday = hasCompletedToday();

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 border-b border-surface-200 dark:border-surface-700">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary-600 text-base">← Back</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-2">
              {currentStreak > 0 && (
                <View className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full flex-row items-center">
                  <Text className="text-amber-600 text-sm">🔥 {currentStreak} day streak</Text>
                </View>
              )}
            </View>
          </View>
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Nightly Review
          </Text>
          <Text className="text-surface-500 text-sm">
            Step 10 - Continued personal inventory
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
          {/* Status Card */}
          <Card 
            variant="elevated" 
            className={`mb-4 ${completedToday ? 'bg-green-50 dark:bg-green-900/20' : 'bg-primary-50 dark:bg-primary-900/20'}`}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">{completedToday ? '✅' : '📝'}</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {completedToday ? 'Today\'s Review Complete' : 'Today\'s Review'}
                </Text>
                <Text className="text-sm text-surface-500">
                  {completedToday 
                    ? 'You can update your responses anytime'
                    : `${answeredCount} of ${REVIEW_QUESTIONS.length} questions answered`}
                </Text>
              </View>
            </View>
          </Card>

          {/* Introduction */}
          <Card variant="outlined" className="mb-4">
            <Text className="text-sm text-surface-600 dark:text-surface-400 italic leading-relaxed">
              "Continued to take personal inventory and when we were wrong promptly admitted it."
            </Text>
          </Card>

          {/* Questions */}
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
            Review Questions
          </Text>

          {REVIEW_QUESTIONS.map((q, index) => (
            <TouchableOpacity
              key={q.key}
              onPress={() => setExpandedQuestion(expandedQuestion === q.key ? null : q.key)}
              activeOpacity={0.7}
            >
              <Card 
                variant="default" 
                className={`mb-3 ${
                  answers[q.key].trim() 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : ''
                }`}
              >
                <View className="flex-row items-start gap-3">
                  <Text className="text-2xl">{q.icon}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-surface-900 dark:text-surface-100 flex-1">
                        {q.question}
                      </Text>
                      {answers[q.key].trim() && (
                        <Text className="text-green-500 ml-2">✓</Text>
                      )}
                    </View>

                    {expandedQuestion === q.key && (
                      <TextInput
                        value={answers[q.key]}
                        onChangeText={(text) => handleAnswerChange(q.key, text)}
                        placeholder={q.placeholder}
                        placeholderTextColor="#9ca3af"
                        multiline
                        numberOfLines={3}
                        className="mt-3 bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[80px]"
                        textAlignVertical="top"
                      />
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}

          {/* Save Button */}
          <Button
            title={isLoading ? 'Saving...' : (completedToday ? 'Update Review' : 'Save Review')}
            onPress={handleSave}
            disabled={isLoading}
            size="lg"
            className="mt-4"
          />

          {/* View History */}
          <TouchableOpacity
            onPress={() => setShowHistory(!showHistory)}
            className="mt-4 mb-2"
          >
            <Text className="text-primary-600 text-center">
              {showHistory ? 'Hide Recent Reviews' : 'View Recent Reviews'}
            </Text>
          </TouchableOpacity>

          {showHistory && reviews.length > 0 && (
            <Card variant="outlined" className="mb-8">
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">
                Recent Reviews
              </Text>
              {reviews.slice(0, 7).map((review) => (
                <View 
                  key={review.id}
                  className="py-2 border-b border-surface-100 dark:border-surface-800 last:border-b-0"
                >
                  <Text className="text-sm text-surface-700 dark:text-surface-300">
                    {review.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

