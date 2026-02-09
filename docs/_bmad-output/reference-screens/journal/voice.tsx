/**
 * Voice Journal Screen
 * Record audio journal entries with mood tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button, Slider } from '../../components/ui';
import { useVoiceRecorder } from '../../lib/hooks/useAudioRecorder';
import { useJournalStore } from '../../lib/store';
import { DEFAULT_EMOTIONS } from '../../lib/constants/emotions';

export default function VoiceJournalScreen() {
  const router = useRouter();
  const {
    recordingState,
    playbackState,
    permissionGranted,
    startRecording,
    stopRecording,
    cancelRecording,
    playAudio,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    formatDuration,
  } = useVoiceRecorder();

  const { createEntry, isLoading } = useJournalStore();

  // Recording result
  const [audioFile, setAudioFile] = useState<{
    id: string;
    uri: string;
    duration: number;
  } | null>(null);

  // Entry metadata
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [step, setStep] = useState<'record' | 'details'>('record');

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation during recording
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  // Waveform animation based on metering
  useEffect(() => {
    if (recordingState.isRecording) {
      // Normalize metering to 0-1 range (metering is typically -160 to 0 dB)
      const normalized = Math.max(0, (recordingState.metering + 60) / 60);
      Animated.timing(waveAnim, {
        toValue: normalized,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [recordingState.metering]);

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      Alert.alert(
        'Permission Required',
        'Please allow microphone access to record voice journals.'
      );
    }
  };

  const handleStopRecording = async () => {
    const file = await stopRecording();
    if (file) {
      setAudioFile(file);
      setStep('details');
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    router.back();
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSave = async () => {
    if (!audioFile) return;

    try {
      await createEntry('voice', title || 'Voice Journal', {
        moodAfter: mood,
        emotionTags: selectedEmotions,
        audioUri: audioFile.uri,
        audioDuration: audioFile.duration,
      });

      Alert.alert('🎙️ Voice Journal Saved!', 'Your recording has been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to save voice journal:', error);
      Alert.alert('Error', 'Failed to save voice journal. Please try again.');
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Recording?',
      'Your recording will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setAudioFile(null);
            setStep('record');
          },
        },
      ]
    );
  };

  const getMoodEmoji = (value: number) => {
    if (value <= 2) return '😢';
    if (value <= 4) return '😔';
    if (value <= 6) return '😐';
    if (value <= 8) return '🙂';
    return '😊';
  };

  // Recording screen
  if (step === 'record') {
    return (
      <SafeAreaView className="flex-1 bg-surface-900">
        <View className="flex-1 px-6 py-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity onPress={handleCancelRecording}>
              <Text className="text-white/70">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white font-semibold">Voice Journal</Text>
            <View className="w-16" />
          </View>

          {/* Recording visualization */}
          <View className="flex-1 items-center justify-center">
            {/* Waveform circles */}
            <View className="relative items-center justify-center">
              {/* Outer pulse ring */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  transform: [{ scale: pulseAnim }],
                }}
              />

              {/* Middle ring - responds to audio */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.6)'],
                  }),
                }}
              />

              {/* Center button */}
              <TouchableOpacity
                onPress={
                  recordingState.isRecording
                    ? handleStopRecording
                    : handleStartRecording
                }
                className="w-32 h-32 rounded-full bg-red-500 items-center justify-center"
                activeOpacity={0.8}
              >
                {recordingState.isRecording ? (
                  <View className="w-12 h-12 bg-white rounded-md" />
                ) : (
                  <Text className="text-5xl">🎙️</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Duration */}
            <Text className="text-4xl font-mono text-white mt-8">
              {formatDuration(recordingState.duration)}
            </Text>

            {/* Status */}
            <Text className="text-white/70 mt-4">
              {recordingState.isRecording
                ? 'Recording... Tap to stop'
                : 'Tap to start recording'}
            </Text>
          </View>

          {/* Tips */}
          <Card variant="default" className="bg-surface-800/50 mt-auto">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">💡</Text>
              <View className="flex-1">
                <Text className="text-white/80 text-sm">
                  Speak freely about your day, feelings, or anything on your mind.
                  Your voice journal is private and encrypted.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // Details screen (after recording)
  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6" keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={handleDiscard}>
              <Text className="text-red-500">Discard</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Voice Journal
            </Text>
            <View className="w-16" />
          </View>

          {/* Audio playback card */}
          <Card variant="elevated" className="mb-6 bg-primary-50 dark:bg-primary-900/30">
            <View className="items-center">
              <Text className="text-4xl mb-2">🎙️</Text>
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Recording Complete
              </Text>
              <Text className="text-surface-500 mb-4">
                Duration: {formatDuration(audioFile?.duration || 0)}
              </Text>

              {/* Playback controls */}
              <View className="flex-row gap-4">
                {playbackState.isPlaying ? (
                  <TouchableOpacity
                    onPress={pausePlayback}
                    className="bg-primary-500 rounded-full px-6 py-3"
                  >
                    <Text className="text-white font-medium">⏸️ Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => audioFile && playAudio(audioFile.uri)}
                    className="bg-primary-500 rounded-full px-6 py-3"
                  >
                    <Text className="text-white font-medium">▶️ Play</Text>
                  </TouchableOpacity>
                )}

                {playbackState.isPlaying && (
                  <TouchableOpacity
                    onPress={stopPlayback}
                    className="bg-surface-200 dark:bg-surface-700 rounded-full px-6 py-3"
                  >
                    <Text className="text-surface-700 dark:text-surface-300 font-medium">
                      ⏹️ Stop
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Playback progress */}
              {playbackState.isPlaying && (
                <Text className="text-surface-500 mt-2">
                  {formatDuration(playbackState.position)} /{' '}
                  {formatDuration(playbackState.duration)}
                </Text>
              )}
            </View>
          </Card>

          {/* Title */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Title (optional)
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your recording a name..."
            placeholderTextColor="#9ca3af"
            className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 mb-6"
          />

          {/* Mood */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-3">
            How do you feel after recording?
          </Text>
          <View className="items-center mb-4">
            <Text className="text-5xl mb-2">{getMoodEmoji(mood)}</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {mood}/10
            </Text>
          </View>
          <Slider
            value={mood}
            onValueChange={setMood}
            min={1}
            max={10}
            step={1}
          />

          {/* Emotions */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mt-6 mb-3">
            Emotions (optional)
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {DEFAULT_EMOTIONS.map((emotion) => (
              <TouchableOpacity
                key={emotion.name}
                onPress={() => toggleEmotion(emotion.name)}
                style={{
                  backgroundColor: selectedEmotions.includes(emotion.name)
                    ? emotion.color
                    : undefined,
                }}
                className={`px-3 py-1.5 rounded-full ${
                  selectedEmotions.includes(emotion.name)
                    ? ''
                    : 'bg-surface-100 dark:bg-surface-800'
                }`}
              >
                <Text
                  className={`text-sm ${
                    selectedEmotions.includes(emotion.name)
                      ? 'text-white'
                      : 'text-surface-700 dark:text-surface-300'
                  }`}
                >
                  {emotion.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="h-8" />
        </ScrollView>

        {/* Save button */}
        <View className="px-4 py-4 border-t border-surface-200 dark:border-surface-700">
          <Button
            title={isLoading ? 'Saving...' : 'Save Voice Journal'}
            onPress={handleSave}
            disabled={isLoading || !audioFile}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

