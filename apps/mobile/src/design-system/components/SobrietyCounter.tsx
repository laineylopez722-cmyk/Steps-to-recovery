/**
 * SobrietyCounter Component
 * Unified clean time tracker with circular progress, real-time updates, and milestone tracking
 *
 * Features:
 * - Real-time counter (updates every second)
 * - Circular progress visualization
 * - Milestone tracking with callbacks
 * - Share progress functionality
 * - Full accessibility support
 * - Responsive design
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions, AccessibilityInfo } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { Card } from './Card';
import { ds } from '../tokens/ds';

const { width: screenWidth } = Dimensions.get('window');

export interface Milestone {
  days: number;
  title: string;
  icon?: string;
  message?: string;
}

export interface SobrietyCounterProps {
  /**
   * The date when sobriety started (ISO string or Date)
   */
  sobrietyDate: string | Date;
  /**
   * Array of milestones to track progress toward
   * Automatically sorted by days ascending
   */
  milestones?: Milestone[];
  /**
   * Callback when a milestone is reached
   */
  onMilestoneReached?: (milestone: Milestone) => void;
  /**
   * Whether to show the share button
   * @default true
   */
  showShareButton?: boolean;
  /**
   * Additional styles for the container
   */
  style?: any;
  /**
   * Callback when share button is pressed
   * If not provided, uses default share behavior
   */
  onShare?: () => void;
}

interface TimeDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  weeks: number;
  months: number;
  years: number;
}

const DEFAULT_MILESTONES: Milestone[] = [
  { days: 1, title: '24 Hours', icon: '🌟', message: 'The first day is the hardest. You\'re doing great!' },
  { days: 7, title: '1 Week', icon: '🎯', message: 'Building momentum one day at a time.' },
  { days: 30, title: '1 Month', icon: '🏆', message: 'Your dedication is inspiring. Keep going!' },
  { days: 90, title: '90 Days', icon: '💎', message: 'You\'re proving that lasting change is possible.' },
  { days: 180, title: '6 Months', icon: '🎊', message: 'Half a year of strength and growth.' },
  { days: 365, title: '1 Year', icon: '👑', message: 'Your journey is an inspiration to others.' },
  { days: 730, title: '2 Years', icon: '👑', message: 'Two years of incredible transformation.' },
  { days: 1095, title: '3 Years', icon: '👑', message: 'A testament to your commitment.' },
];

// Circular progress ring component
function CircularProgress({
  progress,
  size = 180,
  strokeWidth = 12,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - Math.min(progress, 1) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={ds.colors.accent} />
            <Stop offset="100%" stopColor={ds.colors.success} />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ds.colors.bgTertiary}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

// Stat item component
function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string | number;
  label: string;
}) {
  return (
    <View
      style={styles.statItem}
      accessible
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <View style={styles.statIconContainer}>
        <Feather name={icon} size={14} color={ds.colors.textSecondary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Get dynamic encouragement message based on days
function getEncouragementMessage(days: number): string {
  if (days === 0) return "Today is a new beginning. You can do this.";
  if (days === 1) return "The first day is the hardest. You're doing great!";
  if (days < 7) return "Building momentum one day at a time.";
  if (days < 30) return "Your dedication is inspiring. Keep going!";
  if (days < 90) return "You're proving that lasting change is possible.";
  if (days < 180) return "Your journey is an inspiration to others.";
  if (days < 365) return "Half a year of strength and growth.";
  return "Your commitment is truly remarkable.";
}

export function SobrietyCounter({
  sobrietyDate,
  milestones = DEFAULT_MILESTONES,
  onMilestoneReached,
  showShareButton = true,
  style,
  onShare,
}: SobrietyCounterProps) {
  const theme = useTheme();
  const [lastReachedMilestone, setLastReachedMilestone] = useState<number>(-1);

  const calculateTimeElapsed = useCallback((): TimeDisplay => {
    const startDate = typeof sobrietyDate === 'string' ? new Date(sobrietyDate) : sobrietyDate;
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    return { days, hours, minutes, seconds, weeks, months, years };
  }, [sobrietyDate]);

  const [timeElapsed, setTimeElapsed] = useState<TimeDisplay>(calculateTimeElapsed);

  // Update timer every second
  useEffect(() => {
    setTimeElapsed(calculateTimeElapsed());
    const interval = setInterval(() => {
      setTimeElapsed(calculateTimeElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeElapsed]);

  // Check for milestone achievements
  useEffect(() => {
    const sortedMilestones = [...milestones].sort((a, b) => a.days - b.days);
    const currentMilestoneIndex = sortedMilestones.findIndex(
      (m) => timeElapsed.days >= m.days
    );

    if (currentMilestoneIndex > lastReachedMilestone && currentMilestoneIndex !== -1) {
      const milestone = sortedMilestones[currentMilestoneIndex];
      setLastReachedMilestone(currentMilestoneIndex);
      onMilestoneReached?.(milestone);
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(
        `Congratulations! You've reached ${milestone.title} clean!`
      );
    }
  }, [timeElapsed.days, milestones, lastReachedMilestone, onMilestoneReached]);

  // Calculate progress for circular indicator
  const progress = useMemo(() => {
    const milestoneDays = milestones.map(m => m.days).sort((a, b) => a - b);
    const nextMilestone = milestoneDays.find((m) => m > timeElapsed.days) || timeElapsed.days + 30;
    const prevMilestone = [...milestoneDays].reverse().find((m) => m <= timeElapsed.days) || 0;
    return (timeElapsed.days - prevMilestone) / (nextMilestone - prevMilestone);
  }, [timeElapsed.days, milestones]);

  // Find next milestone
  const nextMilestone = useMemo(() => {
    return milestones
      .sort((a, b) => a.days - b.days)
      .find((m) => m.days > timeElapsed.days);
  }, [milestones, timeElapsed.days]);

  // Build accessibility label
  const accessibilityLabel = useMemo(() => {
    let label = `${timeElapsed.days} ${timeElapsed.days === 1 ? 'day' : 'days'} clean`;
    if (timeElapsed.weeks > 0) label += `, ${timeElapsed.weeks} ${timeElapsed.weeks === 1 ? 'week' : 'weeks'}`;
    if (timeElapsed.months > 0) label += `, approximately ${timeElapsed.months} ${timeElapsed.months === 1 ? 'month' : 'months'}`;
    if (nextMilestone) {
      const daysToGo = nextMilestone.days - timeElapsed.days;
      label += `. ${daysToGo} days until ${nextMilestone.title}`;
    }
    return label;
  }, [timeElapsed, nextMilestone]);

  const circleSize = Math.min(screenWidth - 80, 200);

  // Handle share
  const handleShare = useCallback(async () => {
    if (onShare) {
      onShare();
      return;
    }

    try {
      const message = `I've been clean for ${timeElapsed.days} days! Every day is a victory worth celebrating. 🎉`;
      await Share.share({
        message,
        title: 'My Recovery Progress',
      });
    } catch (error) {
      // User cancelled or error occurred
    }
  }, [onShare, timeElapsed.days]);

  const encouragementMessage = getEncouragementMessage(timeElapsed.days);

  return (
    <Card
      variant="elevated"
      animate
      style={[styles.card, style]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="clock" size={18} color={ds.colors.info} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Clean Time Streak</Text>
            <Text style={styles.headerSubtitle}>Continuous, from your last reset</Text>
          </View>
        </View>

        {/* Streak Badge */}
        <View style={styles.streakBadge}>
          <Feather name="zap" size={14} color={ds.colors.success} />
          <Text style={styles.streakText}>Streak Intact</Text>
        </View>
      </View>

      {/* Circular Progress with Days */}
      <View style={styles.progressContainer}>
        <View style={styles.circleContainer}>
          <CircularProgress progress={progress} size={circleSize} strokeWidth={12} />
          <View style={styles.circleContent}>
            <Feather name="award" size={24} color={ds.colors.accent} style={styles.awardIcon} />
            <Text style={styles.daysNumber}>{timeElapsed.days}</Text>
            <Text style={styles.daysLabel}>Days Clean</Text>
          </View>
        </View>

        {/* Encouraging message */}
        <Text style={styles.encouragementText}>{encouragementMessage}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <StatItem icon="heart" value={timeElapsed.weeks} label="Weeks" />
        <View style={styles.statDivider} />
        <StatItem icon="crosshair" value={`${timeElapsed.months}`} label="Months est." />
        <View style={styles.statDivider} />
        <StatItem icon="zap" value={timeElapsed.days} label="Day streak" />
      </View>

      {/* Next Milestone */}
      {nextMilestone && (
        <View style={styles.milestoneContainer} accessible accessibilityLabel={`Next milestone: ${nextMilestone.title} in ${nextMilestone.days - timeElapsed.days} days`}>
          <Text style={styles.milestoneText}>
            Next: {nextMilestone.icon} {nextMilestone.title} ({nextMilestone.days - timeElapsed.days} days)
          </Text>
        </View>
      )}

      {/* Share Button */}
      {showShareButton && (
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareButton}
          accessibilityLabel="Share your progress"
          accessibilityRole="button"
          accessibilityHint="Opens share dialog to celebrate your achievement"
        >
          <Feather name="share-2" size={16} color={ds.colors.info} />
          <Text style={styles.shareText}>Share Progress</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: ds.colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    marginLeft: 4,
  },
  headerTitle: {
    color: ds.semantic.text.onDark,
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: ds.colors.textSecondary,
    fontSize: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ds.colors.successMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  awardIcon: {
    marginBottom: 4,
  },
  daysNumber: {
    color: ds.semantic.text.onDark,
    fontSize: 48,
    fontWeight: 'bold',
  },
  daysLabel: {
    color: ds.colors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  encouragementText: {
    color: ds.colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statValue: {
    color: ds.semantic.text.onDark,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: ds.colors.textSecondary,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: ds.colors.borderSubtle,
  },
  milestoneContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  milestoneText: {
    color: ds.colors.textSecondary,
    fontSize: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: ds.colors.infoMuted,
    borderRadius: 20,
    alignSelf: 'center',
  },
  shareText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
