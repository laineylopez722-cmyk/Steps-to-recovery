import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Card, ProgressBar, Badge, CircularProgress } from '../../../design-system/components';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useAuth } from '../../../contexts/AuthContext';
import { useCleanTime } from '../hooks/useCleanTime';

export function CleanTimeTracker(): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { days, hours, minutes, seconds, nextMilestone, isLoading } = useCleanTime(userId);
  const [displayDays, setDisplayDays] = useState(0);

  // Animation values
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);

  // Entrance animation
  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    statsOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    // Animate day counter
    if (days > 0) {
      const duration = Math.min(1500, days * 50);
      const startTime = Date.now();
      const animateCount = (): void => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayDays(Math.round(days * eased));
        if (progress < 1) {
          requestAnimationFrame(animateCount);
        }
      };
      requestAnimationFrame(animateCount);
    }
  }, [days]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  if (isLoading) {
    return (
      <Card
        variant="elevated"
        style={styles.card}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading clean time"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Card>
    );
  }

  // Calculate progress for milestone
  const progress = nextMilestone ? (days / nextMilestone.days) * 100 : 100;
  const daysUntilNext = nextMilestone ? nextMilestone.days - days : 0;
  const isStreakIntact = days > 0;

  return (
    <Animated.View style={cardAnimatedStyle}>
      <Card
        variant="elevated"
        style={styles.card}
        accessibilityRole="none"
        accessibilityLabel={`Clean time: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`}
      >
        {/* Header with title and streak badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.iconText, { color: theme.colors.success }]}>⚡</Text>
            <Text style={[theme.typography.title2, styles.title, { color: theme.colors.text }]}>
              Clean Time Streak
            </Text>
          </View>
          {isStreakIntact && (
            <Animated.View entering={FadeIn.delay(500)}>
              <Badge
                variant="success"
                size="medium"
                accessibilityLabel="Streak intact"
                accessibilityRole="text"
              >
                STREAK INTACT
              </Badge>
            </Animated.View>
          )}
        </View>

        {/* Circular progress tracker with animated count */}
        <View style={styles.circularContainer}>
          <CircularProgress
            progress={Math.min(progress, 100)}
            size={180}
            strokeWidth={12}
            progressColor={theme.colors.success}
            trackColor={theme.colors.surfaceVariant}
            animated
            duration={1200}
            centerContent={
              <View style={styles.centerContent}>
                <Text style={[styles.daysNumber, { color: theme.colors.success }]}>
                  {displayDays}
                </Text>
                <Text style={[styles.daysLabel, { color: theme.colors.textSecondary }]}>
                  DAYS CLEAN
                </Text>
              </View>
            }
          />
        </View>

        {/* Motivational text */}
        {days > 0 && (
          <Animated.Text
            entering={FadeInUp.delay(600).springify()}
            style={[styles.motivationalText, { color: theme.colors.textSecondary }]}
          >
            {days < 7
              ? 'Great start! Keep going!'
              : days < 30
                ? 'Another week stronger. Keep going!'
                : days < 90
                  ? "Amazing progress! You're doing it!"
                  : "Incredible! You're an inspiration!"}
          </Animated.Text>
        )}

        {/* Stats row */}
        <Animated.View style={[styles.statsRow, statsAnimatedStyle]}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Text style={{ fontSize: 20 }}>🔄</Text>
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>RELAPSES</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Text style={{ fontSize: 20 }}>🤝</Text>
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              SPONSOR EST
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Text style={{ fontSize: 20 }}>📅</Text>
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{days}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              DAY STREAK
            </Text>
          </View>
        </Animated.View>

        {/* Milestone progress */}
        {nextMilestone && (
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.milestoneContainer}
          >
            <View style={styles.milestoneHeader}>
              <View style={styles.milestoneLeft}>
                <Text style={styles.milestoneEmoji}>{nextMilestone.icon}</Text>
                <View style={styles.milestoneTextContainer}>
                  <Text style={[styles.milestoneTitle, { color: theme.colors.text }]}>
                    Next Milestone
                  </Text>
                  <Text style={[styles.milestoneSubtitle, { color: theme.colors.textSecondary }]}>
                    {nextMilestone.title} • {daysUntilNext} days to go
                  </Text>
                </View>
              </View>
            </View>
            <ProgressBar
              progress={progress / 100}
              style={styles.progressBar}
              color={theme.colors.success}
              backgroundColor={theme.colors.surfaceVariant}
              accessibilityLabel={`Progress to ${nextMilestone.title}: ${Math.round(progress)}%`}
              accessibilityRole="progressbar"
            />
          </Animated.View>
        )}

        {/* Time breakdown */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.timeBreakdown}>
          <View style={styles.timeItem}>
            <Text style={[styles.timeNumber, { color: theme.colors.text }]}>{hours}</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Hours</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={[styles.timeNumber, { color: theme.colors.text }]}>{minutes}</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Minutes</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={[styles.timeNumber, { color: theme.colors.text }]}>{seconds}</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Seconds</Text>
          </View>
        </Animated.View>
      </Card>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  ({
    card: {
      margin: 16,
      marginTop: 8,
      padding: 20,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center' as const,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 20,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    iconText: {
      fontSize: 20,
    },
    title: {
      fontWeight: '700' as const,
      fontSize: 18,
    },
    circularContainer: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginVertical: 16,
    },
    centerContent: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    daysNumber: {
      fontSize: 56,
      fontWeight: '700' as const,
      lineHeight: 64,
    },
    daysLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 1,
      marginTop: 4,
    },
    motivationalText: {
      textAlign: 'center' as const,
      fontSize: 14,
      fontStyle: 'italic' as const,
      marginTop: 12,
      marginBottom: 20,
    },
    statsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    statItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    statIcon: {
      marginBottom: 8,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700' as const,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
    statDivider: {
      width: 1,
      height: 48,
    },
    milestoneContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: ds.colors.borderSubtle,
    },
    milestoneHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 12,
    },
    milestoneLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    milestoneEmoji: {
      fontSize: 28,
      marginRight: 12,
    },
    milestoneTextContainer: {
      flex: 1,
    },
    milestoneTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      marginBottom: 2,
    },
    milestoneSubtitle: {
      fontSize: 12,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    timeBreakdown: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: ds.colors.borderSubtle,
    },
    timeItem: {
      alignItems: 'center' as const,
    },
    timeNumber: {
      fontSize: 20,
      fontWeight: '600' as const,
      marginBottom: 4,
    },
    timeLabel: {
      fontSize: 11,
    },
  }) as const;
