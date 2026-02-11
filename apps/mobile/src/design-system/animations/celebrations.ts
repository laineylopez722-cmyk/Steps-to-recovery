/**
 * Celebration Animations
 * Material Design 3 inspired celebration sequences for milestones and achievements
 *
 * @example
 * ```tsx
 * const { triggerMilestone, triggerAchievement } = useCelebrations();
 *
 * // Trigger milestone celebration
 * triggerMilestone({ days: 30, title: '30 Days Clean' });
 *
 * // Trigger achievement unlock
 * triggerAchievement({ title: 'Step 1 Complete' });
 * ```
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  ReduceMotion,
  type SharedValue,
} from 'react-native-reanimated';
import { useCallback, useRef } from 'react';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// MATERIAL DESIGN 3 DURATIONS
// ============================================================================

export const MD3_DURATIONS = {
  /** Quick feedback (100ms) */
  accelerated: 100,
  /** Fast interactions (150ms) */
  decelerated: 150,
  /** Standard transitions (200ms) */
  standard: 200,
  /** Emphasized animations (500ms) */
  emphasized: 500,
  /** Extended celebrations (3000-4000ms) */
  celebration: 3500,
} as const;

// ============================================================================
// WARM COLOR PALETTE FOR CONFETTI
// ============================================================================

export const celebrationColors = {
  /** Sage green - primary brand color */
  sage: ['#8A9A7C', '#9DAD8F', '#6B7B5E'],
  /** Amber/gold - warmth and achievement */
  amber: ['#D4A855', '#E0B860', '#B89440'],
  /** Coral - energy and celebration */
  coral: ['#E07A5F', '#E8917A', '#C46B52'],
  /** Cream - soft accent */
  cream: ['#F5F5DC', '#E8DCC6', '#D4C5A9'],
  /** Teal - complementary balance */
  teal: ['#5A8A8A', '#6B9B9B', '#4A7A7A'],
} as const;

/** Flattened array of all celebration colors */
export const CONFETTI_COLORS: string[] = [
  ...celebrationColors.sage,
  ...celebrationColors.amber,
  ...celebrationColors.coral,
  ...celebrationColors.cream,
  ...celebrationColors.teal,
];

// ============================================================================
// CONFETTI CONFIGURATION
// ============================================================================

export interface ConfettiConfig {
  /** Number of confetti particles */
  particleCount: number;
  /** Duration of animation in ms */
  duration: number;
  /** Origin point (defaults to screen center) */
  origin: { x: number; y: number };
  /** Colors to use (defaults to warm palette) */
  colors: string[];
  /** Gravity strength (0-1) */
  gravity: number;
  /** Spread angle in degrees (0-360) */
  spread: number;
  /** Particle size range [min, max] */
  sizeRange: [number, number];
  /** Shapes to use */
  shapes: Array<'circle' | 'square' | 'triangle'>;
}

export const defaultConfettiConfig: ConfettiConfig = {
  particleCount: 60,
  duration: 2500,
  origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 },
  colors: CONFETTI_COLORS,
  gravity: 0.8,
  spread: 360,
  sizeRange: [8, 16],
  shapes: ['circle', 'square', 'triangle'],
};

/** Predefined confetti presets for different celebration types */
export const confettiPresets = {
  /** Subtle burst for small wins */
  subtle: {
    ...defaultConfettiConfig,
    particleCount: 30,
    duration: 1500,
    sizeRange: [6, 12] as [number, number],
  },
  /** Standard celebration */
  standard: defaultConfettiConfig,
  /** Grand celebration for major milestones */
  grand: {
    ...defaultConfettiConfig,
    particleCount: 100,
    duration: 4000,
    sizeRange: [8, 20] as [number, number],
  },
  /** Center burst from middle of screen */
  centerBurst: {
    ...defaultConfettiConfig,
    origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
    spread: 360,
  },
} as const;

// ============================================================================
// MILESTONE CELEBRATION SEQUENCE
// ============================================================================

export interface MilestoneData {
  /** Number of days clean */
  days: number;
  /** Milestone title */
  title: string;
  /** Optional custom message */
  message?: string;
  /** Emoji/icon to display */
  icon?: string;
}

export interface MilestoneAnimationState {
  /** Scale animation for card entrance */
  cardScale: SharedValue<number>;
  /** Opacity animation */
  cardOpacity: SharedValue<number>;
  /** Icon scale animation */
  iconScale: SharedValue<number>;
  /** Text animation values */
  titleOpacity: SharedValue<number>;
  messageOpacity: SharedValue<number>;
  /** Pulse animation for emphasis */
  pulseScale: SharedValue<number>;
}

/**
 * Hook for milestone celebration animations
 * Sequence: Card scale in → Icon bounce → Title fade → Message fade → Gentle pulse
 *
 * @example
 * ```tsx
 * const milestone = useMilestoneAnimation();
 *
 * // Start celebration
 * milestone.trigger({ days: 30, title: '30 Days' });
 *
 * // Access animated styles
 * <Animated.View style={milestone.cardStyle} />
 * ```
 */
export function useMilestoneAnimation(onComplete?: () => void) {
  const cardScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmerTranslate = useSharedValue(-SCREEN_WIDTH);

  const trigger = useCallback(
    (data: MilestoneData) => {
      // Reset values
      cardScale.value = 0;
      cardOpacity.value = 0;
      iconScale.value = 0;
      iconRotation.value = 0;
      titleOpacity.value = 0;
      messageOpacity.value = 0;
      pulseScale.value = 1;
      shimmerTranslate.value = -SCREEN_WIDTH;

      // Card entrance (0-400ms)
      cardScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.05, { damping: 12, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 }),
      );
      cardOpacity.value = withTiming(1, { duration: 300 });

      // Icon bounce (300-800ms)
      iconScale.value = withDelay(
        300,
        withSequence(
          withSpring(1.3, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 12, stiffness: 200 }),
        ),
      );
      iconRotation.value = withDelay(
        300,
        withSequence(
          withTiming(-15, { duration: 200 }),
          withTiming(15, { duration: 200 }),
          withTiming(0, { duration: 200 }),
        ),
      );

      // Title fade in (600-900ms)
      titleOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));

      // Message fade in (900-1200ms)
      messageOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));

      // Gentle pulse loop (1200ms+)
      pulseScale.value = withDelay(
        1200,
        withRepeat(
          withSequence(
            withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          ),
          3,
          true,
          (finished) => {
            if (finished && onComplete) {
              runOnJS(onComplete)();
            }
          },
        ),
      );

      // Shimmer effect
      shimmerTranslate.value = withDelay(
        400,
        withRepeat(
          withTiming(SCREEN_WIDTH * 2, { duration: 2000, easing: Easing.linear }),
          2,
          false,
        ),
      );
    },
    [
      cardScale,
      cardOpacity,
      iconScale,
      iconRotation,
      titleOpacity,
      messageOpacity,
      pulseScale,
      shimmerTranslate,
      onComplete,
    ],
  );

  const dismiss = useCallback(() => {
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.9, { duration: 200 });
  }, [cardOpacity, cardScale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }, { rotate: `${iconRotation.value}deg` }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: (1 - titleOpacity.value) * 10 }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: (1 - messageOpacity.value) * 10 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  return {
    trigger,
    dismiss,
    styles: {
      card: cardStyle,
      icon: iconStyle,
      title: titleStyle,
      message: messageStyle,
      pulse: pulseStyle,
      shimmer: shimmerStyle,
    },
    values: {
      cardScale,
      cardOpacity,
      iconScale,
      titleOpacity,
      messageOpacity,
    },
  };
}

// ============================================================================
// ACHIEVEMENT UNLOCK ANIMATION
// ============================================================================

export interface AchievementData {
  /** Achievement title */
  title: string;
  /** Achievement description */
  description?: string;
  /** Badge/icon character */
  badge?: string;
  /** Tier level (affects animation intensity) */
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Achievement unlock animation
 * Sequence: Scale 0.5 → 1.1 → 1.0 with rotation
 *
 * @example
 * ```tsx
 * const achievement = useAchievementAnimation();
 *
 * achievement.trigger({ title: 'First Step', tier: 'gold' });
 *
 * <Animated.View style={achievement.styles.container}>
 *   <Animated.View style={achievement.styles.badge} />
 * </Animated.View>
 * ```
 */
export function useAchievementAnimation(onComplete?: () => void) {
  const containerScale = useSharedValue(0.5);
  const containerOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeRotation = useSharedValue(-180);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);

  const trigger = useCallback(
    (data: AchievementData) => {
      // Reset
      containerScale.value = 0.5;
      containerOpacity.value = 0;
      badgeScale.value = 0;
      badgeRotation.value = -180;
      glowOpacity.value = 0;
      glowScale.value = 0.8;
      ringScale.value = 0;
      ringOpacity.value = 1;
      sparkleOpacity.value = 0;

      const intensity = {
        bronze: 1,
        silver: 1.1,
        gold: 1.2,
        platinum: 1.3,
      }[data.tier ?? 'gold'];

      // Container entrance
      containerScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      containerOpacity.value = withTiming(1, { duration: 300 });

      // Badge scale: 0.5 → 1.1 → 1.0 with rotation
      badgeScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.1 * intensity, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 }),
      );

      badgeRotation.value = withSequence(
        withTiming(-180, { duration: 0 }),
        withTiming(10, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
      );

      // Glow effect
      glowOpacity.value = withDelay(200, withTiming(0.6, { duration: 400 }));
      glowScale.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1.2 * intensity, { duration: 1000 }),
            withTiming(1, { duration: 1000 }),
          ),
          3,
          true,
        ),
      );

      // Expanding ring
      ringScale.value = withDelay(
        100,
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(2 * intensity, { duration: 800, easing: Easing.out(Easing.cubic) }),
        ),
      );
      ringOpacity.value = withDelay(
        100,
        withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }),
      );

      // Sparkle effect
      sparkleOpacity.value = withDelay(
        400,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0.3, { duration: 400 }),
          withTiming(0, { duration: 300 }, (finished) => {
            if (finished && onComplete) {
              runOnJS(onComplete)();
            }
          }),
        ),
      );
    },
    [
      containerScale,
      containerOpacity,
      badgeScale,
      badgeRotation,
      glowOpacity,
      glowScale,
      ringScale,
      ringOpacity,
      sparkleOpacity,
      onComplete,
    ],
  );

  const reset = useCallback(() => {
    containerScale.value = 0.5;
    containerOpacity.value = 0;
    badgeScale.value = 0;
    badgeRotation.value = -180;
    glowOpacity.value = 0;
    ringOpacity.value = 1;
    sparkleOpacity.value = 0;
  }, [
    containerScale,
    containerOpacity,
    badgeScale,
    badgeRotation,
    glowOpacity,
    ringOpacity,
    sparkleOpacity,
  ]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }, { rotate: `${badgeRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  return {
    trigger,
    reset,
    styles: {
      container: containerStyle,
      badge: badgeStyle,
      glow: glowStyle,
      ring: ringStyle,
      sparkle: sparkleStyle,
    },
    values: {
      containerScale,
      badgeScale,
      badgeRotation,
      glowOpacity,
    },
  };
}

// ============================================================================
// CHECK-IN COMPLETION ANIMATION
// ============================================================================

export interface CheckInCompletionConfig {
  /** Whether to show confetti */
  showConfetti: boolean;
  /** Whether to trigger haptic feedback */
  hapticFeedback: boolean;
  /** Duration of celebration */
  duration: number;
}

/**
 * Check-in completion celebration
 * Combines checkmark animation with subtle confetti burst
 *
 * @example
 * ```tsx
 * const checkIn = useCheckInAnimation({
 *   showConfetti: true,
 *   hapticFeedback: true,
 * });
 *
 * // On check-in complete
 * checkIn.trigger();
 * ```
 */
export function useCheckInAnimation(
  config: Partial<CheckInCompletionConfig> = {},
  onComplete?: () => void,
) {
  const { showConfetti = true, hapticFeedback = true, duration = 2000 } = config;

  const checkmarkProgress = useSharedValue(0);
  const circleProgress = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const glowPulse = useSharedValue(1);
  const confettiOpacity = useSharedValue(0);

  const trigger = useCallback(() => {
    // Reset
    checkmarkProgress.value = 0;
    circleProgress.value = 0;
    scale.value = 0.8;
    glowPulse.value = 1;
    confettiOpacity.value = 0;

    // Circle draw (0-300ms)
    circleProgress.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });

    // Checkmark draw (200-600ms)
    checkmarkProgress.value = withDelay(
      200,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      }),
    );

    // Scale bounce (400-800ms)
    scale.value = withDelay(
      400,
      withSequence(
        withSpring(1.15, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 }, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        }),
      ),
    );

    // Glow pulse
    glowPulse.value = withDelay(
      600,
      withSequence(withTiming(1.2, { duration: 300 }), withTiming(1, { duration: 300 })),
    );

    // Confetti burst
    if (showConfetti) {
      confettiOpacity.value = withDelay(
        200,
        withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: duration - 500 }),
          withTiming(0, { duration: 300 }),
        ),
      );
    }
  }, [
    checkmarkProgress,
    circleProgress,
    scale,
    glowPulse,
    confettiOpacity,
    showConfetti,
    duration,
    onComplete,
  ]);

  const reset = useCallback(() => {
    checkmarkProgress.value = 0;
    circleProgress.value = 0;
    scale.value = 0.8;
    glowPulse.value = 1;
    confettiOpacity.value = 0;
  }, [checkmarkProgress, circleProgress, scale, glowPulse, confettiOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkProgress.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
    opacity: 0.3 + (glowPulse.value - 1) * 0.3,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  return {
    trigger,
    reset,
    styles: {
      container: containerStyle,
      checkmark: checkmarkStyle,
      glow: glowStyle,
      confetti: confettiStyle,
    },
    values: {
      checkmarkProgress,
      circleProgress,
      scale,
    },
    config: {
      showConfetti,
      hapticFeedback,
      duration,
    },
  };
}

// ============================================================================
// CONFETTI PARTICLE TYPE
// ============================================================================

export interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
  rotation: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  delay: number;
}

/**
 * Generate confetti particles for celebration
 */
export function generateConfettiParticles(
  config: Partial<ConfettiConfig> = {},
): ConfettiParticle[] {
  const {
    particleCount = 60,
    origin = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 },
    colors = CONFETTI_COLORS,
    sizeRange = [8, 16],
    shapes = ['circle', 'square', 'triangle'],
    spread = 360,
  } = config;

  const [minSize, maxSize] = sizeRange;

  return Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const velocity = Math.random() * 300 + 200;
    const spreadRad = (spread * Math.PI) / 180;
    const angleOffset = (Math.random() - 0.5) * spreadRad;

    return {
      id: i,
      x: origin.x,
      y: origin.y,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * (maxSize - minSize) + minSize,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      velocityX: Math.cos(angle + angleOffset) * velocity,
      velocityY: Math.sin(angle + angleOffset) * velocity - 200,
      rotationSpeed: (Math.random() - 0.5) * 720,
      delay: Math.random() * 200,
    };
  });
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CelebrationType = 'milestone' | 'achievement' | 'checkin';

export interface CelebrationTrigger {
  type: CelebrationType;
  data?: MilestoneData | AchievementData;
}
