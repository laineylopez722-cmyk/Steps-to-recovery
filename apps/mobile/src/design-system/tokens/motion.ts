import { Easing } from 'react-native-reanimated';
import { FadeIn, FadeInDown, FadeInRight, FadeInUp, LinearTransition } from 'react-native-reanimated';

/**
 * Motion foundations for consistent, low-jank UI animations.
 * Keep durations short and curves predictable.
 */
export const motionDuration = {
  instant: 0,
  micro: 120,
  fast: 180,
  standard: 260,
  emphasized: 340,
  slow: 480,
} as const;

export const motionSpring = {
  gentle: { damping: 18, stiffness: 180, mass: 0.9 },
  smooth: { damping: 20, stiffness: 220, mass: 0.9 },
  snappy: { damping: 22, stiffness: 300, mass: 0.8 },
  press: { damping: 24, stiffness: 360, mass: 0.7 },
} as const;

export const motionScale = {
  pressCard: 0.985,
  pressButton: 0.965,
  resting: 1,
} as const;

export const motionTiming = {
  standard: {
    duration: motionDuration.standard,
    easing: Easing.out(Easing.cubic),
  },
  quick: {
    duration: motionDuration.fast,
    easing: Easing.out(Easing.cubic),
  },
  emphasize: {
    duration: motionDuration.emphasized,
    easing: Easing.out(Easing.cubic),
  },
} as const;

const cappedStagger = (index: number, step: number, max: number): number => Math.min(index * step, max);

export const MotionTransitions = {
  screenEnter: () => FadeInDown.duration(motionDuration.emphasized).springify().damping(18),
  cardEnter: (index = 0) =>
    FadeInDown.duration(motionDuration.standard).delay(cappedStagger(index, 40, 280)).springify().damping(20),
  listItemEnter: (index = 0) =>
    FadeInRight.duration(motionDuration.standard).delay(cappedStagger(index, 28, 220)).springify().damping(20),
  modalEnter: () => FadeInUp.duration(motionDuration.standard).springify().damping(18),
  fade: () => FadeIn.duration(motionDuration.standard),
  fadeDelayed: (delayMs: number) => FadeIn.duration(motionDuration.standard).delay(delayMs),
  accordionLayout: () => LinearTransition.springify().damping(22).stiffness(260),
  skeletonEnter: (index = 0) => FadeIn.duration(motionDuration.fast).delay(cappedStagger(index, 70, 280)),
} as const;

export const motionShimmer = {
  duration: 1400,
  travelX: 220,
  initialX: -220,
} as const;

export type MotionDurationKey = keyof typeof motionDuration;
export type MotionSpringKey = keyof typeof motionSpring;
