/**
 * Breathing Exercise Hook
 *
 * Interactive breathing exercise with customizable phases for the emergency toolkit.
 * Supports box breathing (4-4-4-4), relaxing breath (4-7-8), and custom patterns.
 *
 * **Crisis Support**:
 * - Quick access during cravings or anxiety
 * - Guided phases with haptic feedback
 * - Progress tracking per session
 *
 * @example
 * ```ts
 * const {
 *   phase,
 *   progress,
 *   cycleCount,
 *   isRunning,
 *   start,
 *   pause,
 *   reset,
 * } = useBreathingExercise({ pattern: 'box' });
 *
 * // Display: "Inhale..." with progress animation
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { logger } from '../utils/logger';

type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out' | 'idle';

type BreathingPattern = 'box' | 'relaxing' | '478' | 'calming' | 'custom';

interface PatternConfig {
  /** Inhale duration in seconds */
  inhale: number;
  /** Hold after inhale in seconds */
  holdIn: number;
  /** Exhale duration in seconds */
  exhale: number;
  /** Hold after exhale in seconds */
  holdOut: number;
  /** Human-readable name */
  name: string;
  /** Description of the pattern */
  description: string;
}

const PATTERNS: Record<Exclude<BreathingPattern, 'custom'>, PatternConfig> = {
  box: {
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    name: 'Box Breathing',
    description: 'Equal 4-count phases. Navy SEAL technique for calm focus.',
  },
  relaxing: {
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    name: 'Relaxing Breath',
    description: '4-7-8 pattern. Activates parasympathetic nervous system.',
  },
  '478': {
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    name: '4-7-8 Breath',
    description: 'Dr. Andrew Weil technique for anxiety and sleep.',
  },
  calming: {
    inhale: 4,
    holdIn: 2,
    exhale: 6,
    holdOut: 0,
    name: 'Calming Breath',
    description: 'Longer exhale activates relaxation response.',
  },
};

const PHASE_LABELS: Record<BreathingPhase, string> = {
  'inhale': 'Breathe In',
  'hold-in': 'Hold',
  'exhale': 'Breathe Out',
  'hold-out': 'Hold',
  'idle': 'Ready',
};

interface BreathingExerciseOptions {
  /** Predefined pattern or 'custom' */
  pattern?: BreathingPattern;
  /** Custom timing (required if pattern is 'custom') */
  customTiming?: Omit<PatternConfig, 'name' | 'description'>;
  /** Number of cycles to complete (0 = infinite) */
  targetCycles?: number;
  /** Enable haptic feedback on phase transitions */
  hapticFeedback?: boolean;
  /** Callback when a cycle completes */
  onCycleComplete?: (cycleNumber: number) => void;
  /** Callback when all target cycles complete */
  onComplete?: () => void;
}

interface BreathingExerciseState {
  /** Current breathing phase */
  phase: BreathingPhase;
  /** Human-readable phase label */
  phaseLabel: string;
  /** Progress within current phase (0-1) */
  progress: number;
  /** Seconds remaining in current phase */
  secondsRemaining: number;
  /** Completed cycle count */
  cycleCount: number;
  /** Exercise is running */
  isRunning: boolean;
  /** Exercise is paused (can resume) */
  isPaused: boolean;
  /** Current pattern configuration */
  config: PatternConfig;
  /** Total exercise duration in seconds */
  totalDuration: number;
}

interface BreathingExerciseActions {
  /** Start the exercise */
  start: () => void;
  /** Pause the exercise (can resume) */
  pause: () => void;
  /** Resume from pause */
  resume: () => void;
  /** Reset to beginning */
  reset: () => void;
  /** Toggle between running and paused */
  toggle: () => void;
  /** Change the breathing pattern */
  setPattern: (pattern: BreathingPattern, customTiming?: Omit<PatternConfig, 'name' | 'description'>) => void;
}

export function useBreathingExercise(
  options: BreathingExerciseOptions = {},
): BreathingExerciseState & BreathingExerciseActions {
  const {
    pattern = 'box',
    customTiming,
    targetCycles = 0,
    hapticFeedback = true,
    onCycleComplete,
    onComplete,
  } = options;

  const [config, setConfig] = useState<PatternConfig>(() => {
    if (pattern === 'custom' && customTiming) {
      return { ...customTiming, name: 'Custom', description: 'Custom breathing pattern' };
    }
    return PATTERNS[pattern] || PATTERNS.box;
  });

  const [state, setState] = useState<Omit<BreathingExerciseState, 'config'>>({
    phase: 'idle',
    phaseLabel: PHASE_LABELS['idle'],
    progress: 0,
    secondsRemaining: 0,
    cycleCount: 0,
    isRunning: false,
    isPaused: false,
    totalDuration: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartRef = useRef<number>(0);
  const currentPhaseIndexRef = useRef<number>(0);
  const elapsedInPhaseRef = useRef<number>(0);

  // Get phases based on config (skip phases with 0 duration)
  const getPhases = useCallback((): Array<{ phase: BreathingPhase; duration: number }> => {
    const phases: Array<{ phase: BreathingPhase; duration: number }> = [];

    if (config.inhale > 0) phases.push({ phase: 'inhale', duration: config.inhale });
    if (config.holdIn > 0) phases.push({ phase: 'hold-in', duration: config.holdIn });
    if (config.exhale > 0) phases.push({ phase: 'exhale', duration: config.exhale });
    if (config.holdOut > 0) phases.push({ phase: 'hold-out', duration: config.holdOut });

    return phases;
  }, [config]);

  const triggerHaptic = useCallback(async () => {
    if (!hapticFeedback) return;

    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (Platform.OS === 'android') {
        Vibration.vibrate(50);
      }
    } catch {
      // Haptics not available, silently fail
    }
  }, [hapticFeedback]);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    currentPhaseIndexRef.current = 0;
    elapsedInPhaseRef.current = 0;
    phaseStartRef.current = 0;
    setState({
      phase: 'idle',
      phaseLabel: PHASE_LABELS['idle'],
      progress: 0,
      secondsRemaining: 0,
      cycleCount: 0,
      isRunning: false,
      isPaused: false,
      totalDuration: 0,
    });
  }, [cleanup]);

  const pause = useCallback(() => {
    cleanup();
    setState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
    logger.info('Breathing exercise paused', { cycleCount: state.cycleCount });
  }, [cleanup, state.cycleCount]);

  const tick = useCallback(() => {
    const phases = getPhases();
    if (phases.length === 0) return;

    elapsedInPhaseRef.current += 0.1; // 100ms tick

    const currentPhase = phases[currentPhaseIndexRef.current];
    const phaseDuration = currentPhase.duration;
    const progress = Math.min(elapsedInPhaseRef.current / phaseDuration, 1);
    const secondsRemaining = Math.max(0, Math.ceil(phaseDuration - elapsedInPhaseRef.current));

    setState((prev) => ({
      ...prev,
      progress,
      secondsRemaining,
      totalDuration: prev.totalDuration + 0.1,
    }));

    // Phase complete
    if (elapsedInPhaseRef.current >= phaseDuration) {
      currentPhaseIndexRef.current++;
      elapsedInPhaseRef.current = 0;

      // Cycle complete
      if (currentPhaseIndexRef.current >= phases.length) {
        currentPhaseIndexRef.current = 0;

        setState((prev) => {
          const newCycleCount = prev.cycleCount + 1;

          onCycleComplete?.(newCycleCount);

          // Check if target cycles reached
          if (targetCycles > 0 && newCycleCount >= targetCycles) {
            cleanup();
            onComplete?.();
            logger.info('Breathing exercise complete', { cycles: newCycleCount });
            return {
              ...prev,
              cycleCount: newCycleCount,
              isRunning: false,
              isPaused: false,
              phase: 'idle',
              phaseLabel: 'Complete',
              progress: 1,
            };
          }

          return { ...prev, cycleCount: newCycleCount };
        });
      }

      // Move to next phase
      if (currentPhaseIndexRef.current < phases.length) {
        const nextPhase = phases[currentPhaseIndexRef.current];
        void triggerHaptic();
        setState((prev) => ({
          ...prev,
          phase: nextPhase.phase,
          phaseLabel: PHASE_LABELS[nextPhase.phase],
          progress: 0,
          secondsRemaining: nextPhase.duration,
        }));
      }
    }
  }, [getPhases, targetCycles, cleanup, triggerHaptic, onCycleComplete, onComplete]);

  const start = useCallback(() => {
    const phases = getPhases();
    if (phases.length === 0) {
      logger.warn('Cannot start breathing exercise: no valid phases');
      return;
    }

    cleanup();
    currentPhaseIndexRef.current = 0;
    elapsedInPhaseRef.current = 0;
    phaseStartRef.current = Date.now();

    const firstPhase = phases[0];
    void triggerHaptic();

    setState({
      phase: firstPhase.phase,
      phaseLabel: PHASE_LABELS[firstPhase.phase],
      progress: 0,
      secondsRemaining: firstPhase.duration,
      cycleCount: 0,
      isRunning: true,
      isPaused: false,
      totalDuration: 0,
    });

    intervalRef.current = setInterval(tick, 100);
    logger.info('Breathing exercise started', { pattern: config.name });
  }, [getPhases, cleanup, triggerHaptic, tick, config.name]);

  const resume = useCallback(() => {
    if (!state.isPaused) return;

    intervalRef.current = setInterval(tick, 100);
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
    logger.info('Breathing exercise resumed');
  }, [state.isPaused, tick]);

  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else if (state.isPaused) {
      resume();
    } else {
      start();
    }
  }, [state.isRunning, state.isPaused, pause, resume, start]);

  const setPattern = useCallback(
    (newPattern: BreathingPattern, newCustomTiming?: Omit<PatternConfig, 'name' | 'description'>) => {
      reset();

      if (newPattern === 'custom' && newCustomTiming) {
        setConfig({ ...newCustomTiming, name: 'Custom', description: 'Custom breathing pattern' });
      } else if (newPattern !== 'custom') {
        setConfig(PATTERNS[newPattern] || PATTERNS.box);
      }
    },
    [reset],
  );

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    config,
    start,
    pause,
    resume,
    reset,
    toggle,
    setPattern,
  };
}

// Export pattern presets for UI
export const BREATHING_PATTERNS = PATTERNS;
export type { BreathingPhase, BreathingPattern, PatternConfig };
