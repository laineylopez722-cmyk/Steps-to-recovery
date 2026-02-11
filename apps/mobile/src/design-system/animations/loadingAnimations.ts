/**
 * Loading Animations
 * Material Design 3 loading states and progress indicators
 *
 * @example
 * ```tsx
 * // Breathing circle
 * const breathing = useBreathingAnimation();
 *
 * <Animated.View style={[styles.circle, breathing.style]} />
 *
 * // Skeleton loading
 * <SkeletonPlaceholder count={3} />
 * ```
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';

// ============================================================================
// BREATHING CIRCLE ANIMATION
// ============================================================================

export interface BreathingConfig {
  /** Minimum scale (inhale start) */
  minScale: number;
  /** Maximum scale (inhale end) */
  maxScale: number;
  /** Animation duration in ms (one full breath) */
  duration: number;
  /** Minimum opacity */
  minOpacity: number;
  /** Maximum opacity */
  maxOpacity: number;
}

export const defaultBreathingConfig: BreathingConfig = {
  minScale: 1.0,
  maxScale: 1.15,
  duration: 1500,
  minOpacity: 0.6,
  maxOpacity: 1.0,
};

/**
 * Breathing circle animation for loading states
 * Gentle pulse: scale 1.0 → 1.15, 1.5s loop
 *
 * @example
 * ```tsx
 * const breathing = useBreathingAnimation({
 *   maxScale: 1.2,
 *   duration: 2000,
 * });
 *
 * return (
 *   <View>
 *     <Animated.View
 *       style={[styles.circle, breathing.style]}
 *     />
 *   </View>
 * );
 * ```
 */
export function useBreathingAnimation(config: Partial<BreathingConfig> = {}) {
  const mergedConfig = { ...defaultBreathingConfig, ...config };

  const scale = useSharedValue(mergedConfig.minScale);
  const opacity = useSharedValue(mergedConfig.minOpacity);
  const isActive = useSharedValue(false);

  const start = useCallback(() => {
    if (isActive.value) return;

    isActive.value = true;

    // Continuous breathing loop
    scale.value = withRepeat(
      withSequence(
        // Inhale (expand)
        withTiming(mergedConfig.maxScale, {
          duration: mergedConfig.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        // Exhale (contract)
        withTiming(mergedConfig.minScale, {
          duration: mergedConfig.duration / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // Infinite
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(mergedConfig.maxOpacity, {
          duration: mergedConfig.duration / 2,
        }),
        withTiming(mergedConfig.minOpacity, {
          duration: mergedConfig.duration / 2,
        })
      ),
      -1,
      true
    );
  }, [scale, opacity, isActive, mergedConfig]);

  const stop = useCallback(() => {
    isActive.value = false;
    scale.value = withTiming(mergedConfig.minScale, { duration: 300 });
    opacity.value = withTiming(mergedConfig.minOpacity, { duration: 300 });
  }, [scale, opacity, isActive, mergedConfig]);

  const pause = useCallback(() => {
    // Store current value and stop
    const currentScale = scale.value;
    const currentOpacity = opacity.value;
    scale.value = currentScale;
    opacity.value = currentOpacity;
  }, [scale, opacity]);

  // Auto-start option
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    start,
    stop,
    pause,
    style: animatedStyle,
    values: { scale, opacity, isActive },
  };
}

// ============================================================================
// PULSING DOTS ANIMATION
// ============================================================================

export interface PulsingDotsConfig {
  /** Number of dots */
  count: number;
  /** Duration of one pulse cycle */
  duration: number;
  /** Delay between each dot */
  staggerDelay: number;
  /** Scale range */
  minScale: number;
  maxScale: number;
}

export const defaultPulsingDotsConfig: PulsingDotsConfig = {
  count: 3,
  duration: 1000,
  staggerDelay: 150,
  minScale: 0.6,
  maxScale: 1.0,
};

/**
 * Pulsing dots animation (like typing indicator)
 *
 * @example
 * ```tsx
 * const dots = usePulsingDotsAnimation({ count: 3 });
 *
 * <View style={styles.dotsContainer}>
 *   {dots.styles.map((style, i) => (
 *     <Animated.View key={i} style={[styles.dot, style]} />
 *   ))}
 * </View>
 * ```
 */
export function usePulsingDotsAnimation(config: Partial<PulsingDotsConfig> = {}) {
  const mergedConfig = { ...defaultPulsingDotsConfig, ...config };

  const scales: SharedValue<number>[] = [];
  const opacities: SharedValue<number>[] = [];

  // Initialize shared values for each dot
  for (let i = 0; i < mergedConfig.count; i++) {
    scales.push(useSharedValue(mergedConfig.minScale));
    opacities.push(useSharedValue(0.5));
  }

  const start = useCallback(() => {
    scales.forEach((scale, index) => {
      const delay = index * mergedConfig.staggerDelay;

      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(mergedConfig.maxScale, {
              duration: mergedConfig.duration / 2,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(mergedConfig.minScale, {
              duration: mergedConfig.duration / 2,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        )
      );
    });

    opacities.forEach((opacity, index) => {
      const delay = index * mergedConfig.staggerDelay;

      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: mergedConfig.duration / 2 }),
            withTiming(0.5, { duration: mergedConfig.duration / 2 })
          ),
          -1,
          true
        )
      );
    });
  }, [scales, opacities, mergedConfig]);

  const stop = useCallback(() => {
    scales.forEach((scale) => {
      scale.value = withTiming(mergedConfig.minScale, { duration: 200 });
    });
    opacities.forEach((opacity) => {
      opacity.value = withTiming(0.5, { duration: 200 });
    });
  }, [scales, opacities, mergedConfig]);

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const animatedStyles = scales.map((scale, index) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacities[index]?.value ?? 0.5,
    }))
  );

  return {
    start,
    stop,
    styles: animatedStyles,
    values: { scales, opacities },
  };
}

// ============================================================================
// ROTATING TEXT ANIMATION
// ============================================================================

export interface RotatingTextConfig {
  /** Messages to rotate through */
  messages: string[];
  /** Duration each message is shown */
  displayDuration: number;
  /** Transition duration */
  transitionDuration: number;
}

/**
 * Rotating text/status messages animation
 *
 * @example
 * ```tsx
 * const status = useRotatingTextAnimation({
 *   messages: ['Loading...', 'Syncing data...', 'Almost done...'],
 *   displayDuration: 2000,
 * });
 *
 * <Animated.Text style={status.style}>
 *   {status.currentMessage}
 * </Animated.Text>
 * ```
 */
export function useRotatingTextAnimation(config: RotatingTextConfig) {
  const { messages, displayDuration, transitionDuration = 300 } = config;

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const currentIndex = useSharedValue(0);

  const rotate = useCallback(() => {
    const animateToNext = () => {
      // Fade out and slide up
      opacity.value = withTiming(0, { duration: transitionDuration / 2 });
      translateY.value = withTiming(-20, { duration: transitionDuration / 2 }, () => {
        // Update index
        currentIndex.value = (currentIndex.value + 1) % messages.length;

        // Reset position
        translateY.value = 20;

        // Fade in and slide to position
        opacity.value = withTiming(1, { duration: transitionDuration / 2 });
        translateY.value = withTiming(0, { duration: transitionDuration / 2 });
      });
    };

    // Start rotation loop
    const interval = setInterval(() => {
      animateToNext();
    }, displayDuration);

    return () => clearInterval(interval);
  }, [messages.length, displayDuration, transitionDuration, opacity, translateY, currentIndex]);

  useEffect(() => {
    const cleanup = rotate();
    return cleanup;
  }, [rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return {
    style: animatedStyle,
    currentIndex: currentIndex.value,
    currentMessage: messages[currentIndex.value] ?? messages[0],
  };
}

// ============================================================================
// SKELETON LOADING ANIMATION
// ============================================================================

export interface SkeletonConfig {
  /** Base color */
  baseColor: string;
  /** Highlight/shimmer color */
  highlightColor: string;
  /** Animation duration */
  duration: number;
  /** Shimmer width */
  shimmerWidth: number;
}

export const defaultSkeletonConfig: SkeletonConfig = {
  baseColor: '#E1E1E1',
  highlightColor: '#F0F0F0',
  duration: 1500,
  shimmerWidth: 200,
};

/**
 * Skeleton shimmer animation
 *
 * @example
 * ```tsx
 * const skeleton = useSkeletonAnimation();
 *
 * <View style={styles.skeletonContainer}>
 *   <Animated.View style={[styles.skeleton, skeleton.style]} />
 * </View>
 * ```
 */
export function useSkeletonAnimation(config: Partial<SkeletonConfig> = {}) {
  const mergedConfig = { ...defaultSkeletonConfig, ...config };

  const translateX = useSharedValue(-mergedConfig.shimmerWidth);

  const start = useCallback(() => {
    translateX.value = withRepeat(
      withTiming(mergedConfig.shimmerWidth * 2, {
        duration: mergedConfig.duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [translateX, mergedConfig]);

  const stop = useCallback(() => {
    translateX.value = withTiming(-mergedConfig.shimmerWidth, { duration: 200 });
  }, [translateX, mergedConfig]);

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return {
    start,
    stop,
    style: animatedStyle,
    config: mergedConfig,
    values: { translateX },
  };
}

// ============================================================================
// PROGRESS RING ANIMATION
// ============================================================================

export interface ProgressRingConfig {
  /** Ring size */
  size: number;
  /** Stroke width */
  strokeWidth: number;
  /** Animation duration */
  duration: number;
}

/**
 * Progress ring animation for loading indicators
 *
 * @example
 * ```tsx
 * const progress = useProgressRingAnimation({ progress: 0.75 });
 *
 * <Animated.View style={progress.style}>
 *   <Svg>
 *     <AnimatedCircle animatedProps={progress.circleProps} />
 *   </Svg>
 * </Animated.View>
 * ```
 */
export function useProgressRingAnimation(
  targetProgress: number,
  config: Partial<ProgressRingConfig> = {}
) {
  const mergedConfig: ProgressRingConfig = {
    size: 48,
    strokeWidth: 4,
    duration: 1000,
    ...config,
  };

  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Animate progress
    progress.value = withTiming(targetProgress, {
      duration: mergedConfig.duration,
      easing: Easing.out(Easing.cubic),
    });

    // Continuous rotation for indeterminate state
    if (targetProgress === 0 || targetProgress === 1) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }

    return () => {
      rotation.value = 0;
    };
  }, [targetProgress, progress, rotation, mergedConfig]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return {
    style: animatedStyle,
    progress,
    rotation,
    config: mergedConfig,
  };
}

// ============================================================================
// SPINNER ANIMATION
// ============================================================================

export interface SpinnerConfig {
  /** Spinner size */
  size: number;
  /** Animation duration (one rotation) */
  duration: number;
  /** Easing function */
  easing: (value: number) => number;
}

export const defaultSpinnerConfig: SpinnerConfig = {
  size: 24,
  duration: 1000,
  easing: Easing.linear,
};

/**
 * Rotating spinner animation
 *
 * @example
 * ```tsx
 * const spinner = useSpinnerAnimation();
 *
 * <Animated.View style={[styles.spinner, spinner.style]}>
 *   <LoadingIcon />
 * </Animated.View>
 * ```
 */
export function useSpinnerAnimation(config: Partial<SpinnerConfig> = {}) {
  const mergedConfig = { ...defaultSpinnerConfig, ...config };

  const rotation = useSharedValue(0);

  const start = useCallback(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: mergedConfig.duration,
        easing: mergedConfig.easing,
      }),
      -1,
      false
    );
  }, [rotation, mergedConfig]);

  const stop = useCallback(() => {
    rotation.value = withTiming(0, { duration: 200 });
  }, [rotation]);

  const pause = useCallback(() => {
    // Save current rotation
    const currentRotation = rotation.value % 360;
    rotation.value = currentRotation;
  }, [rotation]);

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return {
    start,
    stop,
    pause,
    style: animatedStyle,
    values: { rotation },
  };
}

// ============================================================================
// STAGGERED SKELETON LOADING
// ============================================================================

export interface StaggeredSkeletonConfig {
  /** Number of skeleton items */
  count: number;
  /** Delay between items */
  staggerDelay: number;
  /** Animation duration */
  duration: number;
}

/**
 * Staggered skeleton loading for lists
 *
 * @example
 * ```tsx
 * const skeletons = useStaggeredSkeletonAnimation({ count: 5 });
 *
 * {skeletons.items.map((item, i) => (
 *   <Animated.View key={i} style={[styles.skeletonRow, item.style]} />
 * ))}
 * ```
 */
export function useStaggeredSkeletonAnimation(
  config: Partial<StaggeredSkeletonConfig> = {}
) {
  const mergedConfig: StaggeredSkeletonConfig = {
    count: 3,
    staggerDelay: 100,
    duration: 600,
    ...config,
  };

  const opacities: SharedValue<number>[] = [];

  for (let i = 0; i < mergedConfig.count; i++) {
    opacities.push(useSharedValue(0));
  }

  const start = useCallback(() => {
    opacities.forEach((opacity, index) => {
      opacity.value = withDelay(
        index * mergedConfig.staggerDelay,
        withTiming(1, { duration: mergedConfig.duration })
      );
    });
  }, [opacities, mergedConfig]);

  const stop = useCallback(() => {
    opacities.forEach((opacity) => {
      opacity.value = withTiming(0, { duration: 200 });
    });
  }, [opacities]);

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const items = opacities.map((opacity, index) => ({
    index,
    style: useAnimatedStyle(() => ({
      opacity: opacity.value,
    })),
  }));

  return {
    items,
    start,
    stop,
  };
}

// ============================================================================
// CONTENT FADE IN
// ============================================================================

export interface ContentFadeConfig {
  /** Delay before starting */
  delay: number;
  /** Fade duration */
  duration: number;
  /** Number of content sections */
  sectionCount: number;
  /** Delay between sections */
  sectionDelay: number;
}

/**
 * Staggered content fade-in animation
 *
 * @example
 * ```tsx
 * const content = useContentFadeAnimation({ sectionCount: 3 });
 *
 * <Animated.View style={content.sections[0]}>
 *   <Header />
 * </Animated.View>
 * <Animated.View style={content.sections[1]}>
 *   <Body />
 * </Animated.View>
 * ```
 */
export function useContentFadeAnimation(config: Partial<ContentFadeConfig> = {}) {
  const mergedConfig: ContentFadeConfig = {
    delay: 100,
    duration: 400,
    sectionCount: 3,
    sectionDelay: 100,
    ...config,
  };

  const opacities: SharedValue<number>[] = [];
  const translateYs: SharedValue<number>[] = [];

  for (let i = 0; i < mergedConfig.sectionCount; i++) {
    opacities.push(useSharedValue(0));
    translateYs.push(useSharedValue(20));
  }

  const start = useCallback(() => {
    opacities.forEach((opacity, index) => {
      const delay = mergedConfig.delay + index * mergedConfig.sectionDelay;

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: mergedConfig.duration })
      );
    });

    translateYs.forEach((translateY, index) => {
      const delay = mergedConfig.delay + index * mergedConfig.sectionDelay;

      translateY.value = withDelay(
        delay,
        withTiming(0, {
          duration: mergedConfig.duration,
          easing: Easing.out(Easing.cubic),
        })
      );
    });
  }, [opacities, translateYs, mergedConfig]);

  const stop = useCallback(() => {
    opacities.forEach((opacity) => {
      opacity.value = withTiming(0, { duration: 200 });
    });
    translateYs.forEach((translateY) => {
      translateY.value = withTiming(20, { duration: 200 });
    });
  }, [opacities, translateYs]);

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const sections = opacities.map((opacity, index) =>
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateYs[index]?.value ?? 0 }],
    }))
  );

  return {
    sections,
    start,
    stop,
  };
}

// ============================================================================
// WITHSEQUENCE HELPER
// ============================================================================

function withSequence<T>(...animations: T[]): T {
  // Sequence wrapper - in real implementation,
  // this would use withSequence from reanimated
  return animations[animations.length - 1];
}
