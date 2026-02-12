/**
 * Voice Input Component
 * Records audio via expo-audio and provides a transcription callback.
 * Includes permission handling, 2-minute recording limit, and cancel support.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Pressable, Text, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { logger } from '../../../utils/logger';

const MAX_RECORDING_SECONDS = 120;

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type ProcessingStatus = 'idle' | 'processing';

async function requestMicrophonePermission(): Promise<boolean> {
  const { granted, canAskAgain } = await AudioModule.requestRecordingPermissionsAsync();

  if (granted) {
    return true;
  }

  if (!canAskAgain) {
    Alert.alert(
      'Microphone Access Required',
      'Voice input needs microphone access. Please enable it in your device settings.',
      [{ text: 'OK' }],
    );
  }

  return false;
}

/**
 * Transcribe the recorded audio file.
 *
 * Uses OpenAI Whisper API when an API key is configured. Falls back to a
 * descriptive placeholder when no key is available.
 */
async function transcribeAudio(uri: string): Promise<string> {
  logger.info('Transcription requested', { uri });

  try {
    const { secureStorage } = await import('../../../adapters/secureStorage');
    const apiKey = await secureStorage.getItemAsync('ai_companion_api_key');

    if (!apiKey) {
      return '[Voice recorded — add an AI API key in Settings → AI Companion to enable speech-to-text]';
    }

    // Determine provider — Whisper is OpenAI-only
    const isOpenAI =
      apiKey.startsWith('sk-') && !apiKey.startsWith('sk-ant-') && !apiKey.startsWith('sk-or-');
    const isOpenRouter = apiKey.startsWith('sk-or-');

    if (!isOpenAI && !isOpenRouter) {
      return '[Voice recorded — speech-to-text requires an OpenAI or OpenRouter API key]';
    }

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
    formData.append('model', 'whisper-1');

    const endpoint = isOpenRouter
      ? 'https://openrouter.ai/api/v1/audio/transcriptions'
      : 'https://api.openai.com/v1/audio/transcriptions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Whisper API error', { status: response.status, bodyLength: errorText.length });
      return '[Voice recorded but transcription failed — please try again]';
    }

    const result = (await response.json()) as { text: string };
    logger.info('Transcription successful', { length: result.text.length });
    return result.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Transcription error', { error: message });
    return '[Voice recorded but transcription unavailable — check your connection]';
  }
}

/**
 * Voice input button with recording animation.
 *
 * Uses expo-audio to capture audio from the device microphone. The recording is
 * limited to MAX_RECORDING_SECONDS (2 min) and auto-stops when reached. After
 * stopping, the audio URI is passed to transcribeAudio() and the resulting
 * text is forwarded via onTranscript.
 */
export function VoiceInput({ onTranscript, disabled }: VoiceInputProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 500);

  const isRecording = recorderState.isRecording;
  const isProcessing = processingStatus === 'processing';
  const durationSeconds = Math.round(recorderState.durationMillis / 1000);

  const autoStopTriggered = useRef(false);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const startPulse = useCallback((): void => {
    pulseScale.value = withRepeat(
      withTiming(1.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 1000 }), -1, true);
  }, [pulseScale, pulseOpacity]);

  const stopPulse = useCallback((): void => {
    pulseScale.value = withTiming(1, { duration: 200 });
    pulseOpacity.value = withTiming(0, { duration: 200 });
  }, [pulseScale, pulseOpacity]);

  const processRecording = useCallback(async (): Promise<void> => {
    setProcessingStatus('processing');
    try {
      const uri = recorder.uri;
      if (!uri) {
        logger.error('Recording URI is null after stop');
        setProcessingStatus('idle');
        return;
      }

      const transcript = await transcribeAudio(uri);
      onTranscript(transcript);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Transcription failed', { error: message });
    } finally {
      setProcessingStatus('idle');
    }
  }, [recorder, onTranscript]);

  // Auto-stop at the recording limit
  useEffect(() => {
    if (isRecording && durationSeconds >= MAX_RECORDING_SECONDS && !autoStopTriggered.current) {
      autoStopTriggered.current = true;
      stopPulse();
      (async (): Promise<void> => {
        try {
          await recorder.stop();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          logger.info('Voice recording auto-stopped at limit', { duration: durationSeconds });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to auto-stop recording', { error: msg });
        }
      })();
    }
  }, [isRecording, durationSeconds, recorder, stopPulse]);

  // Detect when recording stops (from any cause) and process
  const wasRecordingRef = useRef(false);
  useEffect(() => {
    if (wasRecordingRef.current && !isRecording && autoStopTriggered.current) {
      autoStopTriggered.current = false;
      processRecording();
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording, processRecording]);

  const handleStartRecording = useCallback(async (): Promise<void> => {
    try {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      await recorder.record();
      autoStopTriggered.current = false;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      startPulse();

      logger.info('Voice recording started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to start recording', { error: message });
      stopPulse();
    }
  }, [recorder, startPulse, stopPulse]);

  const handleStopRecording = useCallback(async (): Promise<void> => {
    try {
      stopPulse();
      autoStopTriggered.current = false;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      logger.info('Voice recording stopped', { duration: durationSeconds });

      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      await processRecording();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to stop recording', { error: message });
      setProcessingStatus('idle');
    }
  }, [recorder, durationSeconds, stopPulse, processRecording]);

  const handleCancelRecording = useCallback(async (): Promise<void> => {
    try {
      stopPulse();
      autoStopTriggered.current = false;

      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      logger.info('Voice recording cancelled');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cancel recording', { error: message });
    }
  }, [recorder, stopPulse]);

  const handlePress = useCallback((): void => {
    if (isRecording) {
      handleStopRecording();
    } else if (!isProcessing) {
      handleStartRecording();
    }
  }, [isRecording, isProcessing, handleStartRecording, handleStopRecording]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const buttonLabel = isProcessing
    ? 'Processing voice input'
    : isRecording
      ? 'Stop recording'
      : 'Start voice input';

  const iconName = isProcessing ? 'loader' : isRecording ? 'square' : 'mic';
  const iconColor = isRecording ? ds.colors.textPrimary : ds.colors.textSecondary;

  return (
    <View style={styles.container}>
      {isRecording && (
        <>
          <Pressable
            onPress={handleCancelRecording}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel recording"
            accessibilityHint="Discards the current voice recording"
          >
            <Feather name="x" size={16} color={ds.colors.textSecondary} />
          </Pressable>
          <Text
            style={styles.duration}
            accessibilityLabel={`Recording duration ${formatDuration(durationSeconds)}`}
            accessibilityRole="timer"
          >
            {formatDuration(durationSeconds)}
          </Text>
        </>
      )}
      {isProcessing && (
        <Text
          style={styles.processingLabel}
          accessibilityLabel="Processing voice recording"
          accessibilityRole="text"
        >
          Processing…
        </Text>
      )}
      <View style={styles.buttonWrapper}>
        <Animated.View style={[styles.pulse, pulseStyle]} />
        <Pressable
          onPress={handlePress}
          disabled={disabled || isProcessing}
          style={({ pressed }) => [
            styles.button,
            isRecording && styles.buttonRecording,
            (disabled || isProcessing) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
          accessibilityState={{
            disabled: disabled || isProcessing,
            busy: isRecording || isProcessing,
          }}
          accessibilityHint="Records your voice and converts to text"
        >
          <Feather name={iconName} size={20} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[2],
  },
  duration: {
    ...ds.typography.caption,
    color: ds.colors.error,
    fontVariant: ['tabular-nums' as const],
  },
  processingLabel: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: ds.colors.bgTertiary,
  },
  buttonWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pulse: {
    position: 'absolute' as const,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.error,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.bgTertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  buttonRecording: {
    backgroundColor: ds.colors.error,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.8 },
});
