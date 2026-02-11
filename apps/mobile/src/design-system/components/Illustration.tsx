/**
 * Illustration System
 *
 * Premium illustration handling with:
 * - Lottie animation support
 * - Fallback for static images
 * - Themed color integration
 * - Accessibility support
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

interface LottiePlayerRef {
  play: () => void;
}

interface LottieViewProps {
  source: object;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: StyleProp<ViewStyle>;
  onAnimationFinish?: () => void;
}

// Lottie is an optional dependency - gracefully degrade if not available.
let LottieView: React.ComponentType<LottieViewProps & React.RefAttributes<LottiePlayerRef>> | null =
  null;
try {
  LottieView = require('lottie-react-native').default;
} catch {
  // Lottie not installed - will show fallback
}
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { aestheticColors } from '../tokens/aesthetic';
import { ds } from '../tokens/ds';

// ============================================================================
// TYPES
// ============================================================================

export interface IllustrationProps {
  /** Lottie JSON source or require() */
  source: object | string;
  /** Animation type */
  variant?: 'lottie' | 'static' | 'animated';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Custom dimensions */
  width?: number;
  /** Custom height */
  height?: number;
  /** Auto play animation */
  autoPlay?: boolean;
  /** Loop animation */
  loop?: boolean;
  /** Animation speed (1 = normal) */
  speed?: number;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Background style */
  background?: 'none' | 'circle' | 'square' | 'glass' | 'gradient';
  /** Background tint color */
  tintColor?: string;
  /** Play animation on mount with delay */
  playOnMount?: boolean;
  /** Delay before playing (ms) */
  playDelay?: number;
  /** Called when animation completes */
  onAnimationFinish?: () => void;
  /** Accessibility label */
  accessibilityLabel?: string;
}

// ============================================================================
// SIZE PRESETS
// ============================================================================

const sizePresets = {
  sm: { width: 80, height: 80 },
  md: { width: 120, height: 120 },
  lg: { width: 180, height: 180 },
  xl: { width: 240, height: 240 },
  full: { width: '100%' as const, height: 200 },
};

// ============================================================================
// LOTTIE ILLUSTRATION
// ============================================================================

export function Illustration({
  source,
  variant = 'lottie',
  size = 'lg',
  width,
  height,
  autoPlay = true,
  loop = true,
  speed = 1,
  style,
  background = 'none',
  tintColor = aestheticColors.primary[500],
  playOnMount = true,
  playDelay = 0,
  onAnimationFinish,
  accessibilityLabel,
}: IllustrationProps) {
  const lottieRef = useRef<LottiePlayerRef | null>(null);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const dimensions = {
    width: width ?? sizePresets[size].width,
    height: height ?? sizePresets[size].height,
  };

  // Entrance animation
  useEffect(() => {
    if (playOnMount) {
      opacity.value = withTiming(1, { duration: 600 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });

      if (playDelay > 0) {
        const timer = setTimeout(() => {
          lottieRef.current?.play();
        }, playDelay);
        return () => clearTimeout(timer);
      } else {
        lottieRef.current?.play();
        return undefined;
      }
    }
    return undefined;
  }, [playOnMount, playDelay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Background variants
  const renderBackground = () => {
    switch (background) {
      case 'circle':
        return (
          <View
            style={[
              styles.backgroundCircle,
              {
                backgroundColor: `${tintColor}15`,
                width: typeof dimensions.width === 'number' ? dimensions.width * 1.2 : '120%',
                height: typeof dimensions.height === 'number' ? dimensions.height * 1.2 : 240,
              },
            ]}
          />
        );
      case 'square':
        return (
          <View
            style={[
              styles.backgroundSquare,
              {
                backgroundColor: `${tintColor}10`,
                width: typeof dimensions.width === 'number' ? dimensions.width * 1.3 : '120%',
                height: typeof dimensions.height === 'number' ? dimensions.height * 1.3 : 260,
              },
            ]}
          />
        );
      case 'glass':
        return (
          <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark">
            <LinearGradient
              colors={[`${tintColor}10`, 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </BlurView>
        );
      case 'gradient':
        return (
          <LinearGradient
            colors={[`${tintColor}20`, `${tintColor}05`]}
            style={[
              styles.gradientBackground,
              {
                width: typeof dimensions.width === 'number' ? dimensions.width * 1.5 : '150%',
                height: typeof dimensions.height === 'number' ? dimensions.height * 1.5 : 300,
              },
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.container, dimensions, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {renderBackground()}
      <Animated.View style={[styles.animationContainer, animatedStyle, dimensions]}>
        {variant === 'lottie' && LottieView && (
          <LottieView
            ref={lottieRef}
            source={source as object}
            autoPlay={autoPlay && playDelay === 0}
            loop={loop}
            speed={speed}
            style={dimensions}
            onAnimationFinish={onAnimationFinish}
          />
        )}
        {variant === 'lottie' && !LottieView && (
          <View style={[styles.fallbackView, dimensions]}>
            <View style={[styles.fallbackIcon, { backgroundColor: tintColor }]} />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// ============================================================================
// ONBOARDING ILLUSTRATION
// ============================================================================

interface OnboardingIllustrationProps {
  step: 'welcome' | 'privacy' | 'ready' | 'custom';
  customSource?: object;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
}

// Pre-configured illustrations for onboarding
const onboardingSources = {
  welcome: require('../../../assets/animations/onboarding-welcome.json'),
  privacy: require('../../../assets/animations/onboarding-privacy.json'),
  ready: require('../../../assets/animations/onboarding-ready.json'),
};

const onboardingTints = {
  welcome: aestheticColors.primary[500],
  privacy: aestheticColors.secondary[500],
  ready: aestheticColors.success.DEFAULT,
  custom: aestheticColors.gold.DEFAULT,
};

export function OnboardingIllustration({
  step,
  customSource,
  size = 'xl',
  style,
}: OnboardingIllustrationProps) {
  const source = step === 'custom' ? customSource : onboardingSources[step];
  const tintColor = onboardingTints[step];

  return (
    <Illustration
      source={source!}
      size={size}
      variant="lottie"
      background="circle"
      tintColor={tintColor}
      autoPlay
      loop={step === 'welcome'}
      playDelay={300}
      style={style}
      accessibilityLabel={`${step} illustration`}
    />
  );
}

// ============================================================================
// PREMIUM BADGE ILLUSTRATION
// ============================================================================

interface BadgeIllustrationProps {
  type: 'milestone' | 'achievement' | 'streak' | 'completion';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const badgeAnimations = {
  milestone: require('../../../assets/animations/badge-milestone.json'),
  achievement: require('../../../assets/animations/badge-achievement.json'),
  streak: require('../../../assets/animations/badge-streak.json'),
  completion: require('../../../assets/animations/badge-completion.json'),
};

const badgeColors = {
  milestone: aestheticColors.gold.DEFAULT,
  achievement: aestheticColors.accent[500],
  streak: aestheticColors.primary[500],
  completion: aestheticColors.success.DEFAULT,
};

export function BadgeIllustration({ type, size = 'md', style }: BadgeIllustrationProps) {
  return (
    <Illustration
      source={badgeAnimations[type]}
      size={size}
      background="circle"
      tintColor={badgeColors[type]}
      loop={false}
      playOnMount
      style={style}
      accessibilityLabel={`${type} badge`}
    />
  );
}

// ============================================================================
// EMPTY STATE ILLUSTRATION
// ============================================================================

interface EmptyStateIllustrationProps {
  type: 'search' | 'journal' | 'meetings' | 'notifications' | 'offline' | 'error';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const emptyStateAnimations = {
  search: require('../../../assets/animations/empty-search.json'),
  journal: require('../../../assets/animations/empty-journal.json'),
  meetings: require('../../../assets/animations/empty-meetings.json'),
  notifications: require('../../../assets/animations/empty-notifications.json'),
  offline: require('../../../assets/animations/empty-offline.json'),
  error: require('../../../assets/animations/empty-error.json'),
};

const emptyStateColors = {
  search: aestheticColors.secondary[500],
  journal: aestheticColors.primary[500],
  meetings: aestheticColors.success.DEFAULT,
  notifications: aestheticColors.accent[500],
  offline: aestheticColors.navy[300],
  error: ds.semantic.intent.alert.solid,
};

export function EmptyStateIllustration({ type, size = 'lg', style }: EmptyStateIllustrationProps) {
  return (
    <Illustration
      source={emptyStateAnimations[type]}
      size={size}
      background="none"
      tintColor={emptyStateColors[type]}
      loop={type === 'offline' || type === 'search'}
      playOnMount
      style={style}
      accessibilityLabel={`Empty ${type} illustration`}
    />
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  backgroundSquare: {
    position: 'absolute',
    borderRadius: 24,
  },
  gradientBackground: {
    position: 'absolute',
    borderRadius: 999,
  },
  fallbackView: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.bgSecondary,
    opacity: 0.05,
    borderRadius: 20,
  },
  fallbackIcon: {
    width: '40%',
    height: '40%',
    borderRadius: 12,
    opacity: 0.5,
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default Illustration;
