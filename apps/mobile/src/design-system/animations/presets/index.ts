/**
 * Animation Presets
 *
 * Duration constants, easings, and motion presets.
 *
 * @example
 * ```tsx
 * import { Durations, Easings, Springs } from '@/design-system/animations/presets';
 *
 * const duration = Durations.STANDARD;
 * const easing = Easings.easeOut;
 * ```
 */

export {
  // Durations
  Durations,
  MD3Durations,

  // Easings
  Easings,
  MD3Easings,

  // Springs
  Springs,

  // Reduced motion
  ReducedMotionDurations,
  getReducedMotionDuration,
  getReducedMotionSpring,

  // Motion presets
  MotionPresets,
  ReducedMotionPresets,
  getMotionPreset,

  // Types
  type MotionPreset,
  type DurationKey,
  type EasingKey,
  type SpringKey,
  type MotionPresetKey,
} from './motion';

// Re-export legacy tokens for compatibility
export {
  md3Duration,
  md3Easing,
  md3Motion,
  md3Spring,
  md3Transitions,
  motionDuration,
  motionSpring,
  motionScale,
  motionTiming,
  MotionTransitions,
  motionShimmer,
  motionSystem,
  type MD3DurationKey,
  type MD3EasingKey,
  type MD3MotionKey,
  type MD3SpringKey,
  type MD3TransitionKey,
  type MotionDurationKey,
  type MotionSpringKey,
} from '../../tokens/motion';
