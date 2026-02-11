/**
 * Micro-Animations System
 * Subtle, purposeful animations for premium feel
 *
 * Principles:
 * - Fast (150-300ms) for feedback
 * - Gentle (spring, ease-out) for comfort
 * - Purposeful (every animation serves UX)
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useCallback } from 'react';

// ============================================================================
// PRESS ANIMATIONS
// ============================================================================

export const pressAnimation = {
  // Standard button press
  standard: {
    scale: { from: 1, to: 0.96 },
    duration: 100,
    spring: { damping: 15, stiffness: 400 },
  },
  // Card press (more subtle)
  card: {
    scale: { from: 1, to: 0.98 },
    duration: 150,
    spring: { damping: 20, stiffness: 300 },
  },
  // Premium press (slight lift then press)
  premium: {
    scale: { from: 1, to: 0.97 },
    lift: { y: -2 },
    duration: 200,
    spring: { damping: 12, stiffness: 200 },
  },
};

// Hook for press animation
export function usePressAnimation(variant: 'standard' | 'card' | 'premium' = 'standard') {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const config = pressAnimation[variant];
  // Type guard for lift property
  const hasLift = 'lift' in config && config.lift !== undefined;

  const onPressIn = useCallback(() => {
    scale.value = withSpring(config.scale.to, config.spring);
    if (hasLift && 'lift' in config) {
      translateY.value = withSpring(config.lift.y, config.spring);
    }
  }, [scale, translateY, config, hasLift]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(config.scale.from, config.spring);
    translateY.value = withSpring(0, config.spring);
  }, [scale, translateY, config]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return { onPressIn, onPressOut, style };
}

// ============================================================================
// HOVER ANIMATIONS (for cards, list items)
// ============================================================================

export const hoverAnimation = {
  // Gentle lift on hover
  lift: {
    translateY: -4,
    shadowOpacity: 0.3,
    duration: 200,
  },
  // Scale up slightly
  scale: {
    scale: 1.02,
    duration: 200,
  },
  // Glow effect
  glow: {
    shadowRadius: 20,
    shadowOpacity: 0.4,
    duration: 300,
  },
};

export function useHoverAnimation() {
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.1);

  const onHoverIn = useCallback(() => {
    translateY.value = withTiming(hoverAnimation.lift.translateY, {
      duration: hoverAnimation.lift.duration,
      easing: Easing.out(Easing.cubic),
    });
    shadowOpacity.value = withTiming(hoverAnimation.lift.shadowOpacity, {
      duration: hoverAnimation.lift.duration,
    });
  }, [translateY, shadowOpacity]);

  const onHoverOut = useCallback(() => {
    translateY.value = withTiming(0, {
      duration: hoverAnimation.lift.duration,
      easing: Easing.out(Easing.cubic),
    });
    shadowOpacity.value = withTiming(0.1, {
      duration: hoverAnimation.lift.duration,
    });
  }, [translateY, shadowOpacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  return { onHoverIn, onHoverOut, style };
}

// ============================================================================
// SUCCESS ANIMATIONS
// ============================================================================

export const successAnimation = {
  // Checkmark pop
  checkmark: {
    scale: [0, 1.2, 1],
    duration: 500,
  },
  // Confetti burst
  confetti: {
    duration: 1000,
    particles: 30,
  },
  // Celebration pulse
  pulse: {
    scale: [1, 1.1, 1],
    duration: 400,
  },
};

export function useSuccessAnimation() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const trigger = useCallback(() => {
    scale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 300 }),
    );
    opacity.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 200 }));
  }, [scale, opacity]);

  const reset = useCallback(() => {
    scale.value = 0;
    opacity.value = 0;
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { trigger, reset, style };
}

// ============================================================================
// ATTENTION ANIMATIONS
// ============================================================================

export const attentionAnimation = {
  // Subtle bounce to draw attention
  bounce: {
    translateY: [0, -6, 0],
    duration: 600,
  },
  // Gentle shake for alerts
  shake: {
    translateX: [0, -4, 4, -4, 4, 0],
    duration: 400,
  },
  // Pulse for badges
  pulse: {
    scale: [1, 1.15, 1],
    duration: 800,
  },
};

export function useAttentionAnimation(type: 'bounce' | 'shake' | 'pulse' = 'bounce') {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const trigger = useCallback(() => {
    switch (type) {
      case 'bounce':
        translateY.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-6, { duration: 200, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 400, easing: Easing.out(Easing.bounce) }),
        );
        break;
      case 'shake':
        translateX.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
        break;
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1.15, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          ),
          2,
          false,
        );
        break;
    }
  }, [type, translateX, translateY, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return { trigger, style };
}

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const loadingAnimation = {
  // Skeleton shimmer
  shimmer: {
    translateX: [-200, 200],
    duration: 1500,
  },
  // Pulse for loading dots
  pulse: {
    scale: [1, 0.8, 1],
    duration: 1000,
  },
  // Spin for icons
  spin: {
    rotate: '360deg',
    duration: 1000,
  },
};

export function useShimmerAnimation() {
  const translateX = useSharedValue(-200);

  const start = useCallback(() => {
    translateX.value = withRepeat(
      withTiming(200, {
        duration: loadingAnimation.shimmer.duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [translateX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { start, style };
}

// ============================================================================
// BREATHING ANIMATION (for mindfulness)
// ============================================================================

export const breathingAnimation = {
  inhale: 4000,
  hold: 4000,
  exhale: 4000,
};

export function useBreathingAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  const start = useCallback(() => {
    // Inhale
    scale.value = withSequence(
      withTiming(1.3, {
        duration: breathingAnimation.inhale,
        easing: Easing.inOut(Easing.ease),
      }),
      // Hold
      withTiming(1.3, {
        duration: breathingAnimation.hold,
      }),
      // Exhale
      withTiming(1, {
        duration: breathingAnimation.exhale,
        easing: Easing.inOut(Easing.ease),
      }),
    );

    opacity.value = withSequence(
      withTiming(0.8, { duration: breathingAnimation.inhale }),
      withTiming(0.8, { duration: breathingAnimation.hold }),
      withTiming(0.5, { duration: breathingAnimation.exhale }),
    );
  }, [scale, opacity]);

  const stop = useCallback(() => {
    scale.value = withTiming(1, { duration: 500 });
    opacity.value = withTiming(0.5, { duration: 500 });
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { start, stop, style };
}

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

export function useStaggerAnimation(itemCount: number, baseDelay: number = 50) {
  const getDelay = useCallback(
    (index: number) => {
      return index * baseDelay;
    },
    [baseDelay],
  );

  return { getDelay };
}
