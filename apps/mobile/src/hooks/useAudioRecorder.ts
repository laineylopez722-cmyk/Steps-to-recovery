/**
 * Audio Recorder Hook
 * Handles voice journal recording with expo-audio
 */

import { useState, useCallback, useEffect } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  useAudioPlayer,
  useAudioRecorderState,
  useAudioPlayerStatus,
  AudioModule,
  setAudioModeAsync,
  RecordingPresets,
  type AudioMode,
} from 'expo-audio';
import * as ExpoFileSystem from 'expo-file-system';
import { v4 as uuid } from 'uuid';
import { logger } from '../utils/logger';

// Type workaround for expo-file-system directory constants
const FileSystem = ExpoFileSystem as typeof ExpoFileSystem & {
  documentDirectory: string | null;
  cacheDirectory: string | null;
};

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  metering: number; // Audio level for waveform visualization
}

export interface AudioFile {
  id: string;
  uri: string;
  duration: number;
  createdAt: Date;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  position: number;
  duration: number;
}

// Directory for storing voice journals (use documentDirectory for persistent storage)
const BASE_DIRECTORY = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
const VOICE_JOURNAL_DIR = `${BASE_DIRECTORY}voice-journals/`;

const AUDIO_MODE_BASE: Omit<AudioMode, 'allowsRecording'> = {
  playsInSilentMode: true,
  interruptionMode: 'duckOthers',
  interruptionModeAndroid: 'duckOthers',
  shouldPlayInBackground: false,
  shouldRouteThroughEarpiece: false,
};

const RECORDING_AUDIO_MODE: AudioMode = {
  ...AUDIO_MODE_BASE,
  allowsRecording: true,
};

const PLAYBACK_AUDIO_MODE: AudioMode = {
  ...AUDIO_MODE_BASE,
  allowsRecording: false,
};

export function useVoiceRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    metering: 0,
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    position: 0,
    duration: 0,
  });

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [playbackSource, setPlaybackSource] = useState<string | null>(null);

  // Create audio recorder instance
  const audioRecorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Create audio player - source is managed via state
  const audioPlayer = useAudioPlayer(playbackSource);
  const playerState = useAudioPlayerStatus(audioPlayer);

  // Initialize directory and permissions
  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  // Sync recorder state
  useEffect(() => {
    setRecordingState((prev) => ({
      ...prev,
      isRecording: recorderState.isRecording,
      duration: Math.floor((recorderState.durationMillis ?? 0) / 1000),
      metering: recorderState.metering ?? 0,
    }));
  }, [recorderState.isRecording, recorderState.durationMillis, recorderState.metering]);

  // Sync player state
  useEffect(() => {
    if (playerState && playbackSource) {
      setPlaybackState({
        isPlaying: playerState.playing,
        isPaused: !playerState.playing && (playerState.currentTime ?? 0) > 0,
        position: Math.floor((playerState.currentTime ?? 0) / 1000),
        duration: Math.floor((playerState.duration ?? 0) / 1000),
      });

      // Reset when finished
      if (playerState.didJustFinish) {
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: false,
          position: 0,
        }));
      }
    }
  }, [
    playerState?.playing,
    playerState?.currentTime,
    playerState?.duration,
    playerState?.didJustFinish,
    playbackSource,
  ]);

  const initializeAudio = async () => {
    try {
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(VOICE_JOURNAL_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(VOICE_JOURNAL_DIR, {
          intermediates: true,
        });
      }

      // Request permissions
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);

      // Configure audio mode
      await setAudioModeAsync(RECORDING_AUDIO_MODE);
    } catch (error) {
      logger.error('Failed to initialize audio', error);
    }
  };

  const cleanup = async () => {
    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      }
      if (playbackSource) {
        setPlaybackSource(null);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  // Start recording
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!permissionGranted) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) return false;
      setPermissionGranted(status.granted);
    }

    try {
      // Stop any existing recording
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      }

      // Configure for recording
      await setAudioModeAsync(RECORDING_AUDIO_MODE);

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();

      return true;
    } catch (error) {
      logger.error('Failed to start recording', error);
      return false;
    }
  }, [permissionGranted, audioRecorder, recorderState.isRecording]);

  // Pause recording
  const pauseRecording = useCallback(async () => {
    if (recorderState.isRecording) {
      try {
        await audioRecorder.pause();
        setRecordingState((prev) => ({ ...prev, isPaused: true }));
      } catch (error) {
        logger.error('Failed to pause recording', error);
      }
    }
  }, [audioRecorder, recorderState.isRecording]);

  // Resume recording
  const resumeRecording = useCallback(async () => {
    if (recordingState.isPaused) {
      try {
        await audioRecorder.record();
        setRecordingState((prev) => ({ ...prev, isPaused: false }));
      } catch (error) {
        logger.error('Failed to resume recording', error);
      }
    }
  }, [audioRecorder, recordingState.isPaused]);

  // Stop recording and save
  const stopRecording = useCallback(async (): Promise<AudioFile | null> => {
    if (!recorderState.isRecording) return null;

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.getStatus().url ?? audioRecorder.uri;

      if (!uri) return null;

      // Generate unique filename
      const id = uuid();
      const newUri = `${VOICE_JOURNAL_DIR}${id}.m4a`;

      // Move file to permanent location
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      const duration = Math.floor((recorderState.durationMillis ?? 0) / 1000);
      const audioFile: AudioFile = {
        id,
        uri: newUri,
        duration,
        createdAt: new Date(),
      };

      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        metering: 0,
      });

      // Reset audio mode for playback
      await setAudioModeAsync(PLAYBACK_AUDIO_MODE);

      return audioFile;
    } catch (error) {
      logger.error('Failed to stop recording', error);
      return null;
    }
  }, [audioRecorder, recorderState.isRecording, recorderState.durationMillis]);

  // Cancel recording without saving
  const cancelRecording = useCallback(async () => {
    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
        const uri = audioRecorder.getStatus().url ?? audioRecorder.uri;
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      }
    } catch (error) {
      // Ignore errors
    }

    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      metering: 0,
    });
  }, [audioRecorder, recorderState.isRecording]);

  // Play audio file
  const playAudio = useCallback(
    async (uri: string): Promise<boolean> => {
      try {
        // Stop any existing playback
        if (playbackSource) {
          audioPlayer.pause();
          setPlaybackSource(null);
        }

        // Configure for playback
        await setAudioModeAsync(PLAYBACK_AUDIO_MODE);

        // Set the source to trigger player to load
        setPlaybackSource(uri);

        // Wait a bit for the player to load, then play
        setTimeout(() => {
          audioPlayer.play();
        }, 100);
        return true;
      } catch (error) {
        logger.error('Failed to play audio', error);
        return false;
      }
    },
    [audioPlayer, playbackSource],
  );

  // Pause playback
  const pausePlayback = useCallback(async () => {
    if (playbackSource) {
      audioPlayer.pause();
    }
  }, [audioPlayer, playbackSource]);

  // Resume playback
  const resumePlayback = useCallback(async () => {
    if (playbackSource) {
      audioPlayer.play();
    }
  }, [audioPlayer, playbackSource]);

  // Stop playback
  const stopPlayback = useCallback(async () => {
    if (playbackSource) {
      audioPlayer.pause();
      audioPlayer.seekTo(0);
      setPlaybackSource(null);
    }
    setPlaybackState({
      isPlaying: false,
      isPaused: false,
      position: 0,
      duration: 0,
    });
  }, [audioPlayer, playbackSource]);

  // Seek to position
  const seekTo = useCallback(
    async (seconds: number) => {
      if (playbackSource) {
        audioPlayer.seekTo(seconds * 1000);
      }
    },
    [audioPlayer, playbackSource],
  );

  // Delete audio file
  const deleteAudioFile = useCallback(async (uri: string): Promise<boolean> => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      logger.error('Failed to delete audio file', error);
      return false;
    }
  }, []);

  // Format duration as mm:ss
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // Recording
    recordingState,
    permissionGranted,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,

    // Playback
    playbackState,
    playAudio,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    seekTo,

    // Utilities
    deleteAudioFile,
    formatDuration,
  };
}
