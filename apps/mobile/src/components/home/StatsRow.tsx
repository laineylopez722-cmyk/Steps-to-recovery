/**
 * StatsRow Component
 * Horizontal row of quick stats for the home page
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Loading skeleton state
 * - Haptic feedback on press
 * - Accessibility optimized
 * - Micro-interactions
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouterCompat } from '../../utils/navigationHelper';
import { GlassCard } from '../../design-system/components/GlassCard';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../design-system/hooks/useThemedStyles';
import { useDs } from '../../design-system/DsProvider';

interface StatItemProps {
  value: string | number;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  color?: 'primary' | 'amber' | 'green' | 'blue';
  onPress?: () => void;
  isLoading?: boolean;
  delay?: number;
}

function StatItem({
  value,
  label,
  icon,
  color = 'primary',
  onPress,
  isLoading,
  delay = 0,
}: StatItemProps) {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }, [onPress]);

  const colorMap = {
    primary: ds.colors.info,
    amber: ds.colors.warning,
    green: ds.colors.success,
    blue: ds.colors.info,
  };

  const iconColor = colorMap[color];

  // Loading skeleton
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn.delay(delay)} style={styles.statContainer}>
        <GlassCard gradient="card" style={styles.statCard}>
          <View style={styles.skeleton}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonValue} />
            <View style={styles.skeletonLabel} />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  const content = (
    <Animated.View style={[animatedStyle]}>
      <GlassCard gradient="card" style={styles.statCard}>
        <View style={styles.statContent}>
          <Feather name={icon} size={20} color={iconColor} style={styles.statIcon} />
          <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Animated.View entering={FadeIn.delay(delay)} style={styles.statContainer}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}. Tap to view details.`}
          accessibilityHint={`Opens ${label} details`}
          style={styles.touchable}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={styles.statContainer}>
      {content}
    </Animated.View>
  );
}

interface StatsRowProps {
  meetingCount?: number;
  checkinStreak?: number;
  averageMood?: number;
  /** Loading state - shows skeletons */
  isLoading?: boolean;
  /** Base delay for staggered entrance animation */
  enteringDelay?: number;
}

export function StatsRow({
  meetingCount = 0,
  checkinStreak = 0,
  averageMood = 0,
  isLoading = false,
  enteringDelay = 2,
}: StatsRowProps) {
  const styles = useThemedStyles(createStyles);
  const router = useRouterCompat();

  return (
    <View style={styles.container}>
      <StatItem
        value={isLoading ? '...' : meetingCount}
        label="meetings"
        icon="users"
        color="primary"
        onPress={() => router.push('/meetings')}
        isLoading={isLoading}
        delay={enteringDelay * 100}
      />
      <StatItem
        value={isLoading ? '...' : checkinStreak}
        label="day streak"
        icon="zap"
        color="amber"
        onPress={() => router.push('/checkin')}
        isLoading={isLoading}
        delay={enteringDelay * 100 + 50}
      />
      <StatItem
        value={isLoading ? '...' : averageMood.toFixed(1)}
        label="avg mood"
        icon="smile"
        color="green"
        onPress={() => router.push('/report')}
        isLoading={isLoading}
        delay={enteringDelay * 100 + 100}
      />
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      marginVertical: 8,
    },
    statContainer: {
      flex: 1,
    },
    touchable: {
      width: '100%',
    },
    statCard: {
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statContent: {
      alignItems: 'center',
    },
    statIcon: {
      marginBottom: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
      color: ds.colors.textSecondary,
      marginTop: 2,
    },
    skeleton: {
      alignItems: 'center',
      opacity: 0.5,
    },
    skeletonIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: ds.colors.bgTertiary,
      marginBottom: 4,
    },
    skeletonValue: {
      width: 40,
      height: 28,
      borderRadius: 4,
      backgroundColor: ds.colors.bgTertiary,
      marginBottom: 4,
    },
    skeletonLabel: {
      width: 50,
      height: 14,
      borderRadius: 4,
      backgroundColor: ds.colors.bgTertiary,
    },
  }) as const;
