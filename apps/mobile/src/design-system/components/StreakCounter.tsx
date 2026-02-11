/**
 * StreakCounter Component - Material Design 3
 *
 * Clean time tracker with 120dp circular display, ring animation,
 * context card below with last reset date and next milestone.
 *
 * Features:
 * - 120dp circular display with animated progress ring
 * - Large days number (32px bold) + "Days" label
 * - Hours/minutes in secondary text
 * - Context card with last reset date and next milestone
 * - Level 2 shadow with sage green primary color
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { md3LightColors, md3DarkColors } from '../tokens/md3-colors';
import {
  md3ElevationLight,
  md3ElevationDark,
  md3Shape,
  md3Motion,
  md3Typography,
} from '../tokens/md3-elevation';
import { useTheme } from '../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ============================================================================
// TYPES
// ============================================================================

export interface Milestone {
  days: number;
  title: string;
  icon?: string;
  description?: string;
}

export interface StreakCounterProps {
  /** Current streak in days */
  days: number;
  /** Hours component of streak */
  hours?: number;
  /** Minutes component of streak */
  minutes?: number;
  /** Date of last reset (ISO string or Date) */
  lastResetDate: string | Date;
  /** Next milestone info */
  nextMilestone?: Milestone;
  /** Array of all milestones for progress calculation */
  milestones?: Milestone[];
  /** Called when milestone is reached */
  onMilestoneReached?: (milestone: Milestone) => void;
  /** Additional container styles */
  style?: ViewStyle;
  /** Ring animation duration in ms */
  animationDuration?: number;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ============================================================================
// DEFAULT MILESTONES
// ============================================================================

const DEFAULT_MILESTONES: Milestone[] = [
  {
    days: 1,
    title: 'First Day',
    icon: '🌅',
    description: 'Every journey begins with a single step',
  },
  { days: 7, title: '1 Week', icon: '📅', description: 'Building momentum one day at a time' },
  { days: 30, title: '1 Month', icon: '🏆', description: 'Your dedication is inspiring' },
  { days: 90, title: '90 Days', icon: '💎', description: 'Proving lasting change is possible' },
  { days: 180, title: '6 Months', icon: '🎊', description: 'Half a year of strength' },
  { days: 365, title: '1 Year', icon: '👑', description: 'An inspiration to others' },
];

// ============================================================================
// CIRCULAR RING COMPONENT
// ============================================================================

interface CircularRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  colors: typeof md3LightColors | typeof md3DarkColors;
  isDark: boolean;
  animatedValue: SharedValue<number>;
}

function CircularRing({
  progress,
  size,
  strokeWidth,
  colors,
  isDark,
  animatedValue,
}: CircularRingProps): React.ReactElement {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const trackColor = isDark ? colors.surfaceContainerHighest : colors.surfaceVariant;
  const progressColor = colors.primary;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedValue.value / 100);
    return { strokeDashoffset };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.tertiary} />
          </LinearGradient>
        </Defs>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {/* Background track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc with gradient */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StreakCounter({
  days,
  hours = 0,
  minutes = 0,
  lastResetDate,
  nextMilestone,
  milestones = DEFAULT_MILESTONES,
  onMilestoneReached,
  style,
  animationDuration = 1500,
  testID,
  accessibilityLabel,
}: StreakCounterProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? md3DarkColors : md3LightColors;
  const elevation = isDark ? md3ElevationDark : md3ElevationLight;

  // Animation values
  const progressValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const opacityValue = useSharedValue(0);

  // Calculate progress to next milestone
  const { progressPercent, actualNextMilestone } = useMemo(() => {
    const sorted = [...milestones].sort((a, b) => a.days - b.days);
    const next = nextMilestone || sorted.find((m) => m.days > days);
    const prev = sorted.reverse().find((m) => m.days <= days);

    if (!next) return { progressPercent: 100, actualNextMilestone: null };

    const prevDays = prev?.days || 0;
    const total = next.days - prevDays;
    const current = days - prevDays;
    const percent = (current / total) * 100;

    return { progressPercent: Math.min(percent, 100), actualNextMilestone: next };
  }, [days, milestones, nextMilestone]);

  // Animate on mount
  useEffect(() => {
    progressValue.value = withTiming(progressPercent, {
      duration: animationDuration,
    });
    scaleValue.value = withSpring(1, md3Motion.spring.gentle);
    opacityValue.value = withTiming(1, { duration: 400 });

    // Check for milestone
    const reached = milestones.find((m) => m.days === days);
    if (reached && onMilestoneReached) {
      onMilestoneReached(reached);
      AccessibilityInfo.announceForAccessibility(
        `Congratulations! You've reached ${reached.title}!`,
      );
    }
  }, [days, progressPercent, animationDuration]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
    transform: [{ scale: scaleValue.value }],
  }));

  // Format last reset date
  const formattedDate = useMemo(() => {
    const date = typeof lastResetDate === 'string' ? new Date(lastResetDate) : lastResetDate;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }, [lastResetDate]);

  // Format time display
  const timeDisplay = useMemo(() => {
    if (hours > 0 || minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return '';
  }, [hours, minutes]);

  // Accessibility label
  const a11yLabel =
    accessibilityLabel ||
    `${days} days clean. ${
      actualNextMilestone
        ? `Next milestone: ${actualNextMilestone.title} in ${actualNextMilestone.days - days} days`
        : 'All milestones completed!'
    }`;

  return (
    <Animated.View
      style={[
        styles.container,
        elevation.level2,
        { backgroundColor: colors.surfaceContainerLow },
        containerAnimatedStyle,
        style,
      ]}
      testID={testID}
      accessible
      accessibilityLabel={a11yLabel}
      accessibilityRole="summary"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="activity" size={20} color={colors.primary} />
        </View>
        <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Clean Time</Text>
      </View>

      {/* Circular Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.ringContainer}>
          <CircularRing
            progress={progressPercent}
            size={120}
            strokeWidth={10}
            colors={colors}
            isDark={isDark}
            animatedValue={progressValue}
          />
          {/* Center Content */}
          <View style={styles.centerContent}>
            <Text style={[styles.daysNumber, { color: colors.onSurface }]}>{days}</Text>
            <Text style={[styles.daysLabel, { color: colors.onSurfaceVariant }]}>Days</Text>
          </View>
        </View>

        {/* Secondary time display */}
        {timeDisplay && (
          <Text style={[styles.timeDisplay, { color: colors.onSurfaceVariant }]}>
            {timeDisplay}
          </Text>
        )}
      </View>

      {/* Context Card */}
      <View style={[styles.contextCard, { backgroundColor: colors.surfaceContainerHighest }]}>
        {/* Last Reset */}
        <View style={styles.contextRow}>
          <Feather name="refresh-ccw" size={14} color={colors.onSurfaceVariant} />
          <Text style={[styles.contextLabel, { color: colors.onSurfaceVariant }]}>Last reset</Text>
          <Text style={[styles.contextValue, { color: colors.onSurface }]}>{formattedDate}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

        {/* Next Milestone */}
        {actualNextMilestone ? (
          <View style={styles.contextRow}>
            <Text style={styles.milestoneIcon}>{actualNextMilestone.icon || '🎯'}</Text>
            <Text style={[styles.contextLabel, { color: colors.onSurfaceVariant }]}>
              Next: {actualNextMilestone.title}
            </Text>
            <View style={[styles.daysBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.daysBadgeText, { color: colors.onPrimaryContainer }]}>
                {actualNextMilestone.days - days}d
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.contextRow}>
            <Feather name="award" size={14} color={colors.primary} />
            <Text style={[styles.allMilestonesText, { color: colors.primary }]}>
              All milestones completed! 🎉
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderRadius: md3Shape.large,
    padding: 16,
    width: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: md3Shape.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    ...md3Typography.titleMedium,
  } as TextStyle,
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ringContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  daysLabel: {
    ...md3Typography.labelMedium,
    textTransform: 'uppercase',
  } as TextStyle,
  timeDisplay: {
    ...md3Typography.bodySmall,
    marginTop: 8,
  },
  contextCard: {
    borderRadius: md3Shape.medium,
    padding: 12,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextLabel: {
    ...md3Typography.bodySmall,
    flex: 1,
  },
  contextValue: {
    ...md3Typography.labelMedium,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  milestoneIcon: {
    fontSize: 14,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: md3Shape.full,
  },
  daysBadgeText: {
    ...md3Typography.labelSmall,
  },
  allMilestonesText: {
    ...md3Typography.bodySmall,
    fontWeight: '600',
  },
});
