/**
 * useVoiceJournal Hook
 *
 * Manages the voice recording lifecycle for journal entries.
 * Audio is encrypted before storage — never stored as plaintext.
 *
 * Flow:
 *   Request permission → Record → Stop → Encrypt → Store in SQLite
 *   (Playback: Decrypt → Write to temp file → Play → Delete temp file)
 */

import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'stopped' | 'playing' | 'error';

export interface UseVoiceJournalReturn {
  recordingState: RecordingState;
  durationMs: number;
  hasRecording: boolean;
  errorMessage: string | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>; // Returns encrypted audio string
  playEncryptedAudio: (encryptedAudio: string) => Promise<void>;
  stopPlayback: () => void;
  discardRecording: () => void;

  // Encrypted output (set after stopRecording)
  encryptedAudio: string | null;
}

export function useVoiceJournal(): UseVoiceJournalReturn {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer('');

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [encryptedAudio, setEncryptedAudio] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempPlaybackUri = useRef<string | null>(null);

  const clearDurationInterval = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const startRecording = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') {
      setErrorMessage('Voice recording is not supported on web');
      return;
    }

    try {
      setRecordingState('requesting');
      setErrorMessage(null);

      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setErrorMessage('Microphone permission is required for voice notes');
        setRecordingState('error');
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();

      setDurationMs(0);
      setRecordingState('recording');

      durationIntervalRef.current = setInterval(() => {
        setDurationMs((prev) => prev + 100);
      }, 100);
    } catch (error) {
      logger.error('Failed to start voice recording', error);
      setErrorMessage('Could not start recording. Please try again.');
      setRecordingState('error');
    }
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    clearDurationInterval();

    try {
      await recorder.stop();
      const uri = recorder.uri;

      if (!uri) {
        setErrorMessage('Recording failed — no audio captured');
        setRecordingState('error');
        return null;
      }

      setRecordingState('stopped');

      // Read audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Encrypt before storing — never store plaintext audio
      const encrypted = await encryptContent(base64Audio);
      setEncryptedAudio(encrypted);

      // Clean up the unencrypted temp file immediately
      await FileSystem.deleteAsync(uri, { idempotent: true });

      logger.info('Voice journal recorded and encrypted', {
        durationMs,
        encryptedLength: encrypted.length,
      });

      return encrypted;
    } catch (error) {
      logger.error('Failed to stop voice recording', error);
      setErrorMessage('Could not save recording. Please try again.');
      setRecordingState('error');
      return null;
    }
  }, [recorder, durationMs]);

  const playEncryptedAudio = useCallback(async (encrypted: string): Promise<void> => {
    try {
      setRecordingState('playing');

      // Decrypt to base64
      const base64Audio = await decryptContent(encrypted);

      // Write to temporary file for playback
      const tempUri = `${FileSystem.cacheDirectory}voice_journal_playback_${Date.now()}.m4a`;
      await FileSystem.writeAsStringAsync(tempUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });
      tempPlaybackUri.current = tempUri;

      player.replace({ uri: tempUri });
      player.play();

      // Clean up temp file when playback finishes
      const checkFinished = setInterval(async () => {
        if (!player.playing) {
          clearInterval(checkFinished);
          setRecordingState('stopped');
          if (tempPlaybackUri.current) {
            await FileSystem.deleteAsync(tempPlaybackUri.current, { idempotent: true });
            tempPlaybackUri.current = null;
          }
        }
      }, 500);
    } catch (error) {
      logger.error('Failed to play voice journal', error);
      setErrorMessage('Could not play recording.');
      setRecordingState('stopped');
    }
  }, [player]);

  const stopPlayback = useCallback((): void => {
    player.pause();
    setRecordingState('stopped');
  }, [player]);

  const discardRecording = useCallback((): void => {
    clearDurationInterval();
    setEncryptedAudio(null);
    setDurationMs(0);
    setRecordingState('idle');
    setErrorMessage(null);
  }, []);

  return {
    recordingState,
    durationMs,
    hasRecording: encryptedAudio !== null,
    errorMessage,
    startRecording,
    stopRecording,
    playEncryptedAudio,
    stopPlayback,
    discardRecording,
    encryptedAudio,
  };
}
