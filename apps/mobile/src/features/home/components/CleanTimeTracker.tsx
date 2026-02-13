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
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { useCleanTime } from '../hooks/useCleanTime';

export function CleanTimeTracker(): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { days, hours, minutes, seconds, nextMilestone, isLoading } = useCleanTime(userId);
  const [displayDays, setDisplayDays] = useState(0);

  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    statsOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

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
          <ActivityIndicator size="large" color={ds.semantic.intent.primary.solid} />
        </View>
      </Card>
    );
  }

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
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.iconText, { color: ds.semantic.intent.success.solid }]}>⚡</Text>
            <Text style={styles.title}>Clean Time Streak</Text>
          </View>
          {isStreakIntact && (
            <Animated.View entering={FadeIn.delay(500)}>
              <Badge variant="success" size="medium" accessibilityLabel="Streak intact" accessibilityRole="text">
                STREAK INTACT
              </Badge>
            </Animated.View>
          )}
        </View>

        <View style={styles.circularContainer}>
          <CircularProgress
            progress={Math.min(progress, 100)}
            size={180}
            strokeWidth={12}
            progressColor={ds.semantic.intent.success.solid}
            trackColor={ds.semantic.surface.overlay}
            animated
            duration={1200}
            centerContent={
              <View style={styles.centerContent}>
                <Text style={[styles.daysNumber, { color: ds.semantic.intent.success.solid }]}>
                  {displayDays}
                </Text>
                <Text style={styles.daysLabel}>DAYS CLEAN</Text>
              </View>
            }
          />
        </View>

        {days > 0 && (
          <Animated.Text
            entering={FadeInUp.delay(600).springify()}
            style={styles.motivationalText}
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

        <Animated.View style={[styles.statsRow, statsAnimatedStyle]}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}><Text style={{ fontSize: 20 }}>🔄</Text></View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>RELAPSES</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIcon}><Text style={{ fontSize: 20 }}>🤝</Text></View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>SPONSOR EST</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIcon}><Text style={{ fontSize: 20 }}>📅</Text></View>
            <Text style={styles.statNumber}>{days}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>
        </Animated.View>

        {nextMilestone && (
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.milestoneContainer}>
            <View style={styles.milestoneHeader}>
              <View style={styles.milestoneLeft}>
                <Text style={styles.milestoneEmoji}>{nextMilestone.icon}</Text>
                <View style={styles.milestoneTextContainer}>
                  <Text style={styles.milestoneTitle}>Next Milestone</Text>
                  <Text style={styles.milestoneSubtitle}>
                    {nextMilestone.title} • {daysUntilNext} days to go
                  </Text>
                </View>
              </View>
            </View>
            <ProgressBar
              progress={progress / 100}
              style={styles.progressBar}
              color={ds.semantic.intent.success.solid}
              backgroundColor={ds.semantic.surface.overlay}
              accessibilityLabel={`Progress to ${nextMilestone.title}: ${Math.round(progress)}%`}
              accessibilityRole="progressbar"
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.timeBreakdown}>
          <View style={styles.timeItem}>
            <Text style={styles.timeNumber}>{hours}</Text>
            <Text style={styles.timeLabel}>Hours</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeNumber}>{minutes}</Text>
            <Text style={styles.timeLabel}>Minutes</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeNumber}>{seconds}</Text>
            <Text style={styles.timeLabel}>Seconds</Text>
          </View>
        </Animated.View>
      </Card>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  ({
    card: {
      marginHorizontal: ds.space[4],
      marginTop: ds.space[2],
      padding: ds.space[5],
    },
    loadingContainer: {
      padding: ds.space[10],
      alignItems: 'center' as const,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[5],
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ds.space[2],
    },
    iconText: {
      fontSize: 20,
    },
    title: {
      fontWeight: '700' as const,
      fontSize: 18,
      color: ds.semantic.text.primary,
    },
    circularContainer: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginVertical: ds.space[4],
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
      marginTop: ds.space[1],
      color: ds.semantic.text.secondary,
    },
    motivationalText: {
      textAlign: 'center' as const,
      fontSize: 14,
      fontStyle: 'italic' as const,
      marginTop: ds.space[3],
      marginBottom: ds.space[5],
      color: ds.semantic.text.tertiary,
    },
    statsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
      paddingVertical: ds.space[4],
      paddingHorizontal: ds.space[2],
    },
    statItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    statIcon: {
      marginBottom: ds.space[2],
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700' as const,
      marginBottom: ds.space[1],
      color: ds.semantic.text.primary,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      color: ds.semantic.text.secondary,
    },
    statDivider: {
      width: 1,
      height: 48,
      backgroundColor: ds.semantic.surface.overlay,
    },
    milestoneContainer: {
      marginTop: ds.space[4],
      paddingTop: ds.space[4],
      borderTopWidth: 1,
      borderTopColor: ds.colors.borderSubtle,
    },
    milestoneHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: ds.space[3],
    },
    milestoneLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    milestoneEmoji: {
      fontSize: 28,
      marginRight: ds.space[3],
    },
    milestoneTextContainer: {
      flex: 1,
    },
    milestoneTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      marginBottom: 2,
      color: ds.semantic.text.primary,
    },
    milestoneSubtitle: {
      fontSize: 12,
      color: ds.semantic.text.secondary,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    timeBreakdown: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      marginTop: ds.space[5],
      paddingTop: ds.space[4],
      borderTopWidth: 1,
      borderTopColor: ds.colors.borderSubtle,
    },
    timeItem: {
      alignItems: 'center' as const,
    },
    timeNumber: {
      fontSize: 20,
      fontWeight: '600' as const,
      marginBottom: ds.space[1],
      color: ds.semantic.text.primary,
    },
    timeLabel: {
      fontSize: 11,
      color: ds.semantic.text.secondary,
    },
  }) as const;
