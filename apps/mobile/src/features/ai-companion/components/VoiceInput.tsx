/**
 * Voice Input Component
 * Speech-to-text for chat input using expo-speech for accessibility.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Pressable, Text, type FontVariant } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { logger } from '../../../utils/logger';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

/**
 * Voice input button with recording animation.
 *
 * NOTE: Full speech-to-text requires expo-av for recording + a transcription API
 * (Whisper, Google Speech, etc.). This component provides the UI shell and
 * fallback behavior. When a recording library is available, swap in the actual
 * recording logic in handleStartRecording/handleStopRecording.
 */
export function VoiceInput({ onTranscript, disabled }: VoiceInputProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleStartRecording = useCallback(async (): Promise<void> => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsRecording(true);
      setRecordingDuration(0);
      startPulse();

      // Start duration counter
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      logger.info('Voice recording started');
      // TODO: Integrate expo-av Recording when available
    } catch (error) {
      logger.error('Failed to start recording', error);
      setIsRecording(false);
      stopPulse();
    }
  }, [startPulse, stopPulse]);

  const handleStopRecording = useCallback(async (): Promise<void> => {
    try {
      setIsRecording(false);
      stopPulse();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      logger.info('Voice recording stopped', { duration: recordingDuration });

      // TODO: Send audio to transcription API and call onTranscript(text)
      // For now, provide a placeholder message
      onTranscript('[Voice message - transcription pending]');
    } catch (error) {
      logger.error('Failed to stop recording', error);
    }
  }, [recordingDuration, stopPulse, onTranscript]);

  const handlePress = useCallback((): void => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [isRecording, handleStartRecording, handleStopRecording]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {isRecording && <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>}
      <View style={styles.buttonWrapper}>
        <Animated.View style={[styles.pulse, pulseStyle]} />
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.button,
            isRecording && styles.buttonRecording,
            disabled && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
          accessibilityState={{ disabled, busy: isRecording }}
          accessibilityHint="Records your voice and converts to text"
        >
          <Feather
            name={isRecording ? 'square' : 'mic'}
            size={20}
            color={isRecording ? ds.colors.textPrimary : ds.colors.textSecondary}
          />
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
  buttonWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pulse: {
    position: 'absolute' as const,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ds.colors.error,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
