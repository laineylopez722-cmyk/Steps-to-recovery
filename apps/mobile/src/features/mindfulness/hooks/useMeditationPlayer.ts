/**
 * useMeditationPlayer Hook
 *
 * Manages audio playback for guided meditations.
 * Uses expo-audio for playback of bundled asset files.
 * Tracks elapsed time and completion state.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { logger } from '../../../utils/logger';
import type { Meditation } from '../data/meditations';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'finished' | 'error';

export interface UseMeditationPlayerReturn {
  playerState: PlayerState;
  elapsedSeconds: number;
  progressRatio: number; // 0–1
  errorMessage: string | null;
  play: (meditation: Meditation) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  currentMeditation: Meditation | null;
}

export function useMeditationPlayer(): UseMeditationPlayerReturn {
  const player = useAudioPlayer(null);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentMeditation, setCurrentMeditation] = useState<Meditation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Poll elapsed time while playing
  useEffect(() => {
    if (playerState === 'playing') {
      timerRef.current = setInterval(() => {
        if (!player.playing && playerState === 'playing') {
          // Playback finished naturally
          clearTimer();
          setPlayerState('finished');
          return;
        }
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [playerState, player]);

  const play = useCallback(
    async (meditation: Meditation): Promise<void> => {
      try {
        setPlayerState('loading');
        setErrorMessage(null);
        setElapsedSeconds(0);
        setCurrentMeditation(meditation);

        player.replace(meditation.audioAsset);
        player.play();

        setPlayerState('playing');
        logger.info('Meditation started', { id: meditation.id, title: meditation.title });
      } catch (error) {
        logger.error('Failed to play meditation', error);
        setErrorMessage('Could not play this meditation. Please try again.');
        setPlayerState('error');
      }
    },
    [player],
  );

  const pause = useCallback((): void => {
    player.pause();
    setPlayerState('paused');
  }, [player]);

  const resume = useCallback((): void => {
    player.play();
    setPlayerState('playing');
  }, [player]);

  const stop = useCallback((): void => {
    player.pause();
    clearTimer();
    setPlayerState('idle');
    setElapsedSeconds(0);
    setCurrentMeditation(null);
  }, [player]);

  const progressRatio =
    currentMeditation && currentMeditation.durationSeconds > 0
      ? Math.min(elapsedSeconds / currentMeditation.durationSeconds, 1)
      : 0;

  return {
    playerState,
    elapsedSeconds,
    progressRatio,
    errorMessage,
    play,
    pause,
    resume,
    stop,
    currentMeditation,
  };
}
