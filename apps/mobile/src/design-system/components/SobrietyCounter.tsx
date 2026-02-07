/**
 * SobrietyCounter Component
 * Real-time counter displaying time since sobriety date with milestone tracking
 */
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { ProgressBar } from './ProgressBar';
import { Card } from './Card';

export interface Milestone {
  days: number;
  title: string;
  icon?: string;
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
   * Update interval in milliseconds
   * @default 1000 (1 second)
   */
  updateInterval?: number;
  /**
   * Whether to show the progress bar to next milestone
   * @default true
   */
  showProgress?: boolean;
}

interface TimeDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const DEFAULT_MILESTONES: Milestone[] = [
  { days: 1, title: '24 Hours', icon: '🌟' },
  { days: 7, title: '1 Week', icon: '🎯' },
  { days: 30, title: '1 Month', icon: '🏆' },
  { days: 90, title: '90 Days', icon: '💎' },
  { days: 180, title: '6 Months', icon: '🎊' },
  { days: 365, title: '1 Year', icon: '👑' },
];

export function SobrietyCounter({
  sobrietyDate,
  milestones = DEFAULT_MILESTONES,
  onMilestoneReached,
  updateInterval = 1000,
  showProgress = true,
}: SobrietyCounterProps) {
  const theme = useTheme();
  const [timeElapsed, setTimeElapsed] = useState<TimeDisplay>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [lastReachedMilestone, setLastReachedMilestone] = useState<number>(-1);

  const calculateTimeElapsed = useCallback((): TimeDisplay => {
    const startDate = typeof sobrietyDate === 'string' ? new Date(sobrietyDate) : sobrietyDate;
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, [sobrietyDate]);

  useEffect(() => {
    // Initial calculation
    setTimeElapsed(calculateTimeElapsed());

    // Update timer
    const interval = setInterval(() => {
      setTimeElapsed(calculateTimeElapsed());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [calculateTimeElapsed, updateInterval]);

  // Check for milestone achievements
  useEffect(() => {
    const sortedMilestones = [...milestones].sort((a, b) => a.days - b.days);
    const currentMilestoneIndex = sortedMilestones.findIndex(
      (m, index) =>
        timeElapsed.days >= m.days &&
        (index === sortedMilestones.length - 1 ||
          timeElapsed.days < sortedMilestones[index + 1].days),
    );

    if (currentMilestoneIndex > lastReachedMilestone && currentMilestoneIndex !== -1) {
      const milestone = sortedMilestones[currentMilestoneIndex];
      setLastReachedMilestone(currentMilestoneIndex);
      onMilestoneReached?.(milestone);
    }
  }, [timeElapsed.days, milestones, lastReachedMilestone, onMilestoneReached]);

  // Find next milestone for progress tracking
  const sortedMilestones = [...milestones].sort((a, b) => a.days - b.days);
  const nextMilestone = sortedMilestones.find((m) => m.days > timeElapsed.days);
  const previousMilestone = sortedMilestones.reverse().find((m) => m.days <= timeElapsed.days);

  const progressToNextMilestone = nextMilestone
    ? (timeElapsed.days - (previousMilestone?.days || 0)) /
      (nextMilestone.days - (previousMilestone?.days || 0))
    : 1;

  return (
    <Card variant="elevated" animate style={styles.card}>
      <View style={styles.header}>
        <Text style={[theme.typography.label, { color: theme.colors.textSecondary }]}>
          Clean Time
        </Text>
      </View>

      <View style={styles.timeContainer}>
        <View style={styles.mainTime}>
          <Text
            style={[
              theme.typography.displayLarge,
              {
                color: theme.colors.primary,
                fontWeight: '800',
                fontSize: 72,
                lineHeight: 80,
              },
            ]}
          >
            {timeElapsed.days}
          </Text>
          <Text style={[theme.typography.h2, { color: theme.colors.text, marginLeft: 8 }]}>
            {timeElapsed.days === 1 ? 'Day' : 'Days'}
          </Text>
        </View>

        <View style={styles.subTime}>
          <View style={styles.timeUnit}>
            <Text style={[theme.typography.h3, { color: theme.colors.text, fontWeight: '600' }]}>
              {String(timeElapsed.hours).padStart(2, '0')}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Hours
            </Text>
          </View>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textSecondary, marginHorizontal: 8 },
            ]}
          >
            :
          </Text>
          <View style={styles.timeUnit}>
            <Text style={[theme.typography.h3, { color: theme.colors.text, fontWeight: '600' }]}>
              {String(timeElapsed.minutes).padStart(2, '0')}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Minutes
            </Text>
          </View>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textSecondary, marginHorizontal: 8 },
            ]}
          >
            :
          </Text>
          <View style={styles.timeUnit}>
            <Text style={[theme.typography.h3, { color: theme.colors.text, fontWeight: '600' }]}>
              {String(timeElapsed.seconds).padStart(2, '0')}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Seconds
            </Text>
          </View>
        </View>
      </View>

      {showProgress && nextMilestone && (
        <View style={styles.progressContainer}>
          <View style={styles.milestoneInfo}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Next Milestone: {nextMilestone.icon} {nextMilestone.title}
            </Text>
            <Text
              style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}
            >
              {nextMilestone.days - timeElapsed.days} days to go
            </Text>
          </View>
          <ProgressBar progress={progressToNextMilestone} height={6} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  timeContainer: {
    alignItems: 'center',
  },
  mainTime: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  subTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 24,
  },
  milestoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});
