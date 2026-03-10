/**
 * VoiceRecorder Component
 *
 * Inline voice note recorder for the journal editor.
 * Shows animated waveform bars during recording, playback controls when stopped.
 * All audio is encrypted before leaving this component.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useVoiceJournal } from '../hooks/useVoiceJournal';

interface VoiceRecorderProps {
  /** Called with encrypted audio string when recording is finalised */
  onRecordingComplete: (encryptedAudio: string) => void;
  /** Currently stored encrypted audio (for playback mode) */
  existingEncryptedAudio?: string | null;
  /** Called when the user discards the recording */
  onDiscard: () => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Animated waveform bar */
function WaveBar({ delay }: { delay: number }): React.ReactElement {
  const height = useSharedValue(4);

  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(4 + Math.random() * 20, { duration: 300 + delay * 50, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 300 + delay * 50, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.waveBar, animStyle]} />;
}

export function VoiceRecorder({
  onRecordingComplete,
  existingEncryptedAudio,
  onDiscard,
}: VoiceRecorderProps): React.ReactElement {
  const ds = useDs();
  const themedStyles = useThemedStyles(createStyles);
  const {
    recordingState,
    durationMs,
    hasRecording,
    errorMessage,
    startRecording,
    stopRecording,
    playEncryptedAudio,
    stopPlayback,
    discardRecording,
    encryptedAudio,
  } = useVoiceJournal();

  const isRecording = recordingState === 'recording';
  const isPlaying = recordingState === 'playing';
  const isStopped = recordingState === 'stopped';
  const isRequesting = recordingState === 'requesting';

  const displayEncrypted = encryptedAudio ?? existingEncryptedAudio ?? null;

  const handleStopAndSave = async (): Promise<void> => {
    const encrypted = await stopRecording();
    if (encrypted) {
      onRecordingComplete(encrypted);
    }
  };

  const handlePlay = (): void => {
    if (displayEncrypted) {
      playEncryptedAudio(displayEncrypted).catch(() => {});
    }
  };

  const handleDiscard = (): void => {
    discardRecording();
    onDiscard();
  };

  return (
    <View
      style={themedStyles.container}
      accessible
      accessibilityLabel="Voice note recorder"
      accessibilityRole="none"
    >
      {/* Waveform / status area */}
      <View style={themedStyles.visualArea}>
        {isRecording ? (
          <View style={themedStyles.waveform} accessibilityLabel="Recording in progress" accessibilityRole="text">
            {Array.from({ length: 20 }).map((_, i) => (
              <WaveBar key={i} delay={i} />
            ))}
          </View>
        ) : isPlaying ? (
          <View style={themedStyles.playingRow}>
            <ActivityIndicator size="small" color={ds.semantic.intent.primary.solid} />
            <Text style={themedStyles.statusText}>Playing...</Text>
          </View>
        ) : isRequesting ? (
          <View style={themedStyles.playingRow}>
            <ActivityIndicator size="small" color={ds.semantic.text.tertiary} />
            <Text style={themedStyles.statusText}>Requesting permission...</Text>
          </View>
        ) : displayEncrypted ? (
          <View style={themedStyles.readyRow}>
            <Feather
              name="check-circle"
              size={16}
              color={ds.semantic.intent.success.solid}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[themedStyles.statusText, { color: ds.semantic.intent.success.solid }]}>
              Voice note recorded
            </Text>
          </View>
        ) : (
          <Text style={themedStyles.statusText}>Tap to record a voice note</Text>
        )}
      </View>

      {/* Duration */}
      {(isRecording || (isStopped && durationMs > 0)) && (
        <Text style={themedStyles.duration} accessibilityLabel={`Duration: ${formatDuration(durationMs)}`}>
          {formatDuration(durationMs)}
        </Text>
      )}

      {/* Error */}
      {errorMessage && (
        <Text style={themedStyles.errorText} accessibilityRole="alert">
          {errorMessage}
        </Text>
      )}

      {/* Controls */}
      <View style={themedStyles.controls}>
        {!isRecording && !displayEncrypted && (
          <Pressable
            style={[themedStyles.recordBtn, { backgroundColor: ds.semantic.intent.alert.solid }]}
            onPress={startRecording}
            accessibilityLabel="Start recording voice note"
            accessibilityRole="button"
          >
            <Feather name="mic" size={20} color="#fff" accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        )}

        {isRecording && (
          <Pressable
            style={[themedStyles.recordBtn, { backgroundColor: ds.semantic.intent.alert.muted }]}
            onPress={handleStopAndSave}
            accessibilityLabel="Stop recording and save"
            accessibilityRole="button"
          >
            <Feather name="square" size={20} color={ds.semantic.intent.alert.solid} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        )}

        {displayEncrypted && !isPlaying && (
          <Pressable
            style={[themedStyles.controlBtn, { backgroundColor: ds.semantic.surface.card }]}
            onPress={handlePlay}
            accessibilityLabel="Play voice note"
            accessibilityRole="button"
          >
            <Feather name="play" size={18} color={ds.semantic.intent.primary.solid} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        )}

        {isPlaying && (
          <Pressable
            style={[themedStyles.controlBtn, { backgroundColor: ds.semantic.surface.card }]}
            onPress={stopPlayback}
            accessibilityLabel="Stop playback"
            accessibilityRole="button"
          >
            <Feather name="pause" size={18} color={ds.semantic.intent.primary.solid} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        )}

        {(displayEncrypted || isRecording) && !isPlaying && (
          <Pressable
            style={[themedStyles.controlBtn, { backgroundColor: ds.semantic.surface.card }]}
            onPress={handleDiscard}
            accessibilityLabel="Discard voice note"
            accessibilityRole="button"
            accessibilityHint="Permanently removes this voice recording"
          >
            <Feather name="trash-2" size={18} color={ds.semantic.intent.alert.solid} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  waveBar: {
    width: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginHorizontal: 1,
  },
});

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      borderRadius: ds.radius.lg,
      backgroundColor: ds.semantic.surface.card,
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
      padding: ds.space[4],
      marginTop: ds.space[3],
    },
    visualArea: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: ds.space[2],
    },
    waveform: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
    },
    playingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
    },
    readyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
    },
    statusText: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
    },
    duration: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: ds.space[2],
      letterSpacing: 1,
    },
    errorText: {
      ...ds.typography.caption,
      color: ds.semantic.intent.alert.solid,
      textAlign: 'center',
      marginBottom: ds.space[2],
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: ds.space[3],
      marginTop: ds.space[1],
    },
    recordBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
    },
  });
