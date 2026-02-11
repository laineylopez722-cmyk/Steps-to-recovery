/**
 * AchievementBadge Component - Material Design 3
 *
 * Achievement badge with unlock animation and states.
 *
 * Features:
 * - 96dp square, rounded 24dp
 * - Locked: Grayscale 50% opacity
 * - Unlocked: Full color with gradient
 * - Unlock animation ready (scale bounce)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  type SharedValue,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { md3LightColors, md3DarkColors } from '../tokens/md3-colors';
import {
  md3ElevationLight,
  md3ElevationDark,
  md3Shape,
  md3Typography,
  md3Motion,
} from '../tokens/md3-elevation';
import { useTheme } from '../hooks/useTheme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const _AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ============================================================================
// TYPES
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  emoji?: string;
  unlockedAt?: Date | string;
  points?: number;
}

export interface AchievementBadgeProps {
  /** Achievement data */
  achievement: Achievement;
  /** Whether the achievement is unlocked */
  isUnlocked: boolean;
  /** Called when badge is pressed */
  onPress?: (achievement: Achievement) => void;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Whether to show unlock animation on mount */
  animateUnlock?: boolean;
  /** Gradient colors for unlocked state */
  gradientColors?: [string, string];
}

// ============================================================================
// ANIMATION HOOK
// ============================================================================

function useUnlockAnimation(
  isUnlocked: boolean,
  animateOnMount: boolean,
): {
  scale: SharedValue<number>;
  rotation: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  glowStyle: ReturnType<typeof useAnimatedStyle>;
} {
  const scale = useSharedValue(isUnlocked ? 1 : 0.95);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isUnlocked) {
      if (animateOnMount) {
        // Unlock animation sequence
        scale.value = withSequence(
          withTiming(0.8, { duration: 100 }),
          withSpring(1.15, { ...md3Motion.spring.bouncy, damping: 8 }),
          withSpring(1, md3Motion.spring.gentle),
        );

        rotation.value = withSequence(
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(0, { duration: 100 }),
        );

        glowOpacity.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 500 }),
        );
      } else {
        scale.value = withSpring(1, md3Motion.spring.gentle);
      }
    } else {
      scale.value = withTiming(0.95, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isUnlocked, animateOnMount]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return { scale, rotation, glowOpacity, glowStyle };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AchievementBadge({
  achievement,
  isUnlocked,
  onPress,
  style,
  testID,
  accessibilityLabel,
  animateUnlock = true,
  gradientColors = ['#6B9B8D', '#8AB8A8'],
}: AchievementBadgeProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? md3DarkColors : md3LightColors;
  const _elevation = isDark ? md3ElevationDark : md3ElevationLight;

  const { scale, rotation, glowStyle } = useUnlockAnimation(isUnlocked, animateUnlock);

  // Press animation
  const pressScale = useSharedValue(1);

  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, md3Motion.spring.quick);
  };

  const _pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Combine animations
  const combinedStyle = useAnimatedStyle(() => {
    const unlockScale = scale.value;
    const unlockRotate = rotation.value;
    const pressS = pressScale.value;

    return {
      transform: [{ scale: unlockScale * pressS }, { rotate: `${unlockRotate}deg` }],
    };
  });

  const a11yLabel =
    accessibilityLabel ||
    `${achievement.title}. ${achievement.description}. ${isUnlocked ? 'Unlocked' : 'Locked'}`;

  return (
    <AnimatedTouchable
      style={[styles.container, combinedStyle, style]}
      onPress={() => onPress?.(achievement)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      testID={testID}
      accessible
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isUnlocked }}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: gradientColors[0],
              shadowColor: gradientColors[0],
            },
            glowStyle,
          ]}
        />
      )}

      {/* Badge Content */}
      {isUnlocked ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.badge, styles.unlockedBadge]}
        >
          {achievement.emoji ? (
            <Text style={styles.emoji}>{achievement.emoji}</Text>
          ) : (
            <Feather name={achievement.icon} size={32} color="#FFFFFF" />
          )}

          {/* Points badge */}
          {achievement.points && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{achievement.points}</Text>
            </View>
          )}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.badge,
            styles.lockedBadge,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        >
          <Feather name="lock" size={24} color={colors.onSurfaceVariant} />
        </View>
      )}

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: isUnlocked ? colors.onSurface : colors.onSurfaceVariant,
          },
        ]}
        numberOfLines={1}
      >
        {achievement.title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
        {isUnlocked ? 'Unlocked!' : achievement.description}
      </Text>
    </AnimatedTouchable>
  );
}

// ============================================================================
// ACHIEVEMENT GRID COMPONENT
// ============================================================================

export interface AchievementGridProps {
  achievements: Achievement[];
  unlockedIds: string[];
  onAchievementPress?: (achievement: Achievement) => void;
  style?: ViewStyle;
}

export function AchievementGrid({
  achievements,
  unlockedIds,
  onAchievementPress,
  style,
}: AchievementGridProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const _colors = isDark ? md3DarkColors : md3LightColors;

  return (
    <View style={[styles.gridContainer, style]}>
      {achievements.map((achievement, _index) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          isUnlocked={unlockedIds.includes(achievement.id)}
          onPress={onAchievementPress}
          style={styles.gridItem}
        />
      ))}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 96,
  },
  glow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: md3Shape.extraLarge,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: md3Shape.extraLarge,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  unlockedBadge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedBadge: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 40,
  },
  pointsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: md3Shape.small,
  },
  pointsText: {
    ...md3Typography.labelSmall,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    ...md3Typography.labelMedium,
    fontSize: 12,
    textAlign: 'center',
    width: 96,
  },
  description: {
    ...md3Typography.labelSmall,
    fontSize: 10,
    textAlign: 'center',
    width: 96,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  gridItem: {
    marginBottom: 8,
  },
});
