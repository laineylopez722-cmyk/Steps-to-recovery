/**
 * The Promises
 * Track which promises you're experiencing in recovery
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';
import { PROMISES, PROMISES_CLOSING, type Promise as PromiseType } from '../../lib/constants/promises';
import { useLiteratureStore } from '../../lib/store/literatureStore';

export default function PromisesScreen() {
  const router = useRouter();
  const {
    promiseExperiences,
    loadPromiseExperiences,
    togglePromiseExperienced,
    savePromiseReflection,
    getPromiseReflection,
    getExperiencedPromisesCount,
  } = useLiteratureStore();

  const [selectedPromise, setSelectedPromise] = useState<PromiseType | null>(null);
  const [reflection, setReflection] = useState('');
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);

  useEffect(() => {
    loadPromiseExperiences();
  }, []);

  const experiencedCount = getExperiencedPromisesCount();
  const progressPercent = Math.round((experiencedCount / PROMISES.length) * 100);

  const isPromiseExperienced = (promiseId: string) => {
    return promiseExperiences.some((p) => p.promiseId === promiseId && p.experienced);
  };

  const handlePromisePress = async (promise: PromiseType) => {
    setSelectedPromise(promise);
    setReflection('');
    setIsLoadingReflection(true);
    
    try {
      const existingReflection = await getPromiseReflection(promise.id);
      if (existingReflection) {
        setReflection(existingReflection);
      }
    } catch (error) {
      console.error('Failed to load reflection:', error);
    } finally {
      setIsLoadingReflection(false);
    }
  };

  const handleToggleExperienced = async () => {
    if (!selectedPromise) return;
    await togglePromiseExperienced(selectedPromise.id);
  };

  const handleSaveReflection = async () => {
    if (!selectedPromise || !reflection.trim()) return;
    await savePromiseReflection(selectedPromise.id, reflection.trim());
    setSelectedPromise(null);
  };

  const handleClose = () => {
    setSelectedPromise(null);
    setReflection('');
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
              The Promises
            </Text>
            <Text className="text-surface-500 text-sm">
              Track your spiritual growth
            </Text>
          </View>
        </View>

        {/* Progress Card */}
        <Card variant="elevated" className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
          <View className="items-center py-2">
            <Text className="text-4xl mb-2">✨</Text>
            <Text className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {experiencedCount} of {PROMISES.length}
            </Text>
            <Text className="text-amber-700 dark:text-amber-300 text-sm mb-3">
              Promises Experienced
            </Text>
            
            {/* Progress Bar */}
            <View className="w-full h-3 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
              <View 
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              {progressPercent}% of promises coming true
            </Text>
          </View>
        </Card>

        {/* Introduction */}
        <Card variant="default" className="mb-6">
          <Text className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed italic">
            "If we are painstaking about this phase of our development, we will be amazed before we are half way through..."
          </Text>
          <Text className="text-xs text-surface-500 mt-2 text-right">
            — Big Book, p. 83
          </Text>
        </Card>

        {/* Promises List */}
        {PROMISES.map((promise) => {
          const isExperienced = isPromiseExperienced(promise.id);
          
          return (
            <TouchableOpacity
              key={promise.id}
              onPress={() => handlePromisePress(promise)}
              activeOpacity={0.7}
            >
              <Card 
                variant={isExperienced ? 'elevated' : 'default'} 
                className={`mb-3 ${isExperienced ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500' : ''}`}
              >
                <View className="flex-row items-start gap-3">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                    isExperienced 
                      ? 'bg-green-500' 
                      : 'bg-surface-200 dark:bg-surface-700'
                  }`}>
                    {isExperienced ? (
                      <Text className="text-white text-lg">✓</Text>
                    ) : (
                      <Text className="text-surface-500 text-sm font-medium">{promise.number}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base leading-relaxed ${
                      isExperienced 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-surface-800 dark:text-surface-200'
                    }`}>
                      {promise.text}
                    </Text>
                    {isExperienced && (
                      <Text className="text-xs text-green-600 dark:text-green-400 mt-2">
                        ✨ You're experiencing this promise
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* Closing Statement */}
        <Card variant="outlined" className="mt-4 mb-8">
          <Text className="text-sm text-surface-600 dark:text-surface-400 text-center leading-relaxed italic">
            {PROMISES_CLOSING}
          </Text>
        </Card>

        <View className="h-6" />
      </ScrollView>

      {/* Promise Detail Modal */}
      <Modal
        visible={selectedPromise !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
            <ScrollView className="flex-1 px-4 py-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <TouchableOpacity onPress={handleClose}>
                  <Text className="text-primary-600 text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-surface-500 text-sm">
                  Promise {selectedPromise?.number}
                </Text>
                <TouchableOpacity onPress={handleSaveReflection}>
                  <Text className="text-primary-600 text-base font-semibold">Save</Text>
                </TouchableOpacity>
              </View>

              {/* Promise Text */}
              <Card variant="elevated" className="mb-6">
                <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 leading-relaxed text-center">
                  "{selectedPromise?.text}"
                </Text>
              </Card>

              {/* Experience Toggle */}
              <TouchableOpacity
                onPress={handleToggleExperienced}
                activeOpacity={0.7}
              >
                <Card 
                  variant="default" 
                  className={`mb-6 ${
                    selectedPromise && isPromiseExperienced(selectedPromise.id)
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      selectedPromise && isPromiseExperienced(selectedPromise.id)
                        ? 'bg-green-500'
                        : 'border-2 border-surface-300 dark:border-surface-600'
                    }`}>
                      {selectedPromise && isPromiseExperienced(selectedPromise.id) && (
                        <Text className="text-white text-lg">✓</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                        I've experienced this promise
                      </Text>
                      <Text className="text-sm text-surface-500">
                        Tap to {selectedPromise && isPromiseExperienced(selectedPromise.id) ? 'unmark' : 'mark'} as experienced
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              {/* Reflection Prompt */}
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
                Reflection
              </Text>
              <Card variant="default" className="mb-4 bg-amber-50/50 dark:bg-surface-800">
                <Text className="text-sm text-amber-800 dark:text-amber-200 italic">
                  {selectedPromise?.reflection}
                </Text>
              </Card>

              {/* Reflection Input */}
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                placeholder={isLoadingReflection ? 'Loading...' : 'Write about your experience with this promise...'}
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 text-base text-surface-900 dark:text-surface-100 min-h-[150px] mb-6"
                editable={!isLoadingReflection}
              />

              <View className="h-6" />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}


