/**
 * AchievementBadge Component
 * Displays recovery achievements with unlock animations
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Lock, Award, Trophy, Star, Zap, Heart, Target, Flame } from 'lucide-react-native';
import { COLORS, ANIMATION, DIMENSIONS, TYPOGRAPHY, SPACING } from '../constants';
import type { Achievement } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);

// Map icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  award: Award,
  trophy: Trophy,
  star: Star,
  zap: Zap,
  heart: Heart,
  target: Target,
  flame: Flame,
};

export interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  showConfetti?: boolean;
  reducedMotion?: boolean;
  testID?: string;
}

// Confetti particle component
interface ConfettiParticleProps {
  color: string;
  index: number;
  reducedMotion: boolean;
}

function ConfettiParticle({ color, index, reducedMotion }: ConfettiParticleProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  React.useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0;
      return;
    }

    const delay = index * 50;
    const randomX = (Math.random() - 0.5) * 200;
    const randomRotation = (Math.random() - 0.5) * 720;

    translateY.value = withDelay(delay, withTiming(150, { duration: 2000 }));
    translateX.value = withDelay(delay, withTiming(randomX, { duration: 2000 }));
    rotate.value = withDelay(delay, withTiming(randomRotation, { duration: 2000 }));
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(1000, withTiming(0, { duration: 500 })),
      ),
    );
    scale.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [reducedMotion]);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          backgroundColor: color,
          borderRadius: 2,
        },
        particleStyle,
      ]}
    />
  );
}

export function AchievementBadge({
  achievement,
  onPress,
  showConfetti = false,
  reducedMotion = false,
  testID,
}: AchievementBadgeProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const scale = useSharedValue(1);
  const badgeScale = useSharedValue(0.5);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const [showParticles, setShowParticles] = React.useState(showConfetti);

  // Trigger unlock animation
  React.useEffect(() => {
    if (achievement.unlocked && !reducedMotion) {
      // Scale bounce
      badgeScale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 100 }),
        withSpring(1.0, { damping: 12, stiffness: 100 }),
      );

      // Rotation
      rotation.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(360, { damping: 10, stiffness: 50 }),
      );

      // Glow effect
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 500 })),
      );

      // Haptic sequence
      const triggerHaptics = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 100);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 200);
      };

      triggerHaptics();

      // Announce unlock
      AccessibilityInfo.announceForAccessibility(
        `Achievement unlocked! ${achievement.name}. ${achievement.description}`,
      );

      // Show confetti
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 3000);
    } else {
      badgeScale.value = 1;
    }
  }, [achievement.unlocked, achievement.name, achievement.description, reducedMotion]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      {
        scale: interpolate(glowOpacity.value, [0, 1], [1, 1.3], Extrapolate.CLAMP),
      },
    ],
  }));

  // Get icon component
  const IconComponent = ICON_MAP[achievement.icon] || Award;

  // Format unlock date
  const formattedDate = useMemo(() => {
    if (!achievement.unlockedDate) return null;
    return achievement.unlockedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [achievement.unlockedDate]);

  const handlePress = useCallback(() => {
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.95, { duration: ANIMATION.accelerated }),
        withTiming(1, { duration: ANIMATION.standard }),
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(achievement);
  }, [achievement, onPress, reducedMotion, scale]);

  const size = DIMENSIONS.achievementBadgeSize;
  const isLocked = !achievement.unlocked;

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessible
      accessibilityLabel={
        isLocked
          ? `Locked achievement: ${achievement.name}. ${achievement.description}`
          : `Unlocked achievement: ${achievement.name}. ${achievement.description}. Achieved on ${formattedDate}`
      }
      accessibilityRole="button"
      accessibilityHint="Tap to view achievement details"
      testID={testID}
    >
      <AnimatedView
        style={[
          {
            width: size,
            height: size,
            borderRadius: 24,
            backgroundColor: isDark ? COLORS.darkSurface : COLORS.surface,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          },
          containerStyle,
        ]}
      >
        {/* Glow effect for unlocked */}
        {!isLocked && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: 24,
                backgroundColor: achievement.color,
              },
              glowStyle,
            ]}
          />
        )}

        {/* Confetti particles */}
        {showParticles && !reducedMotion && (
          <View
            className="absolute inset-0 items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                color={i % 2 === 0 ? achievement.color : COLORS.secondary}
                index={i}
                reducedMotion={reducedMotion}
              />
            ))}
          </View>
        )}

        {/* Badge content */}
        <AnimatedView
          style={[
            {
              width: size - 8,
              height: size - 8,
              borderRadius: 20,
              backgroundColor: isLocked
                ? isDark
                  ? COLORS.gray700
                  : COLORS.surfaceVariant
                : achievement.color,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLocked ? 0.5 : 1,
              filter: isLocked ? [{ grayscale: 1 }] : undefined,
            },
            badgeStyle,
          ]}
        >
          {isLocked ? (
            <Lock size={32} color={isDark ? COLORS.gray500 : COLORS.gray400} />
          ) : (
            <IconComponent size={36} color={COLORS.white} />
          )}
        </AnimatedView>

        {/* Name label */}
        <Text
          style={{
            fontSize: TYPOGRAPHY.labelSmall.fontSize,
            fontWeight: TYPOGRAPHY.labelSmall.fontWeight,
            color: isLocked
              ? isDark
                ? COLORS.gray500
                : COLORS.gray400
              : isDark
                ? COLORS.white
                : COLORS.gray900,
            marginTop: SPACING.sm,
            textAlign: 'center',
            maxWidth: size + 16,
          }}
          numberOfLines={2}
        >
          {achievement.name}
        </Text>

        {/* Unlock date */}
        {!isLocked && formattedDate && (
          <Text
            style={{
              fontSize: 10,
              color: isDark ? COLORS.gray400 : COLORS.gray500,
              marginTop: 2,
            }}
          >
            {formattedDate}
          </Text>
        )}
      </AnimatedView>
    </TouchableOpacity>
  );
}

export default AchievementBadge;
