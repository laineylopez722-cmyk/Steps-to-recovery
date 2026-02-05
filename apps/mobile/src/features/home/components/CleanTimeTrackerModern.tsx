import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import type { MilestoneDefinition } from '@recovery/shared/src/types/models';

interface CleanTimeTrackerModernProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  nextMilestone: MilestoneDefinition | null;
  isLoading: boolean;
}

export function CleanTimeTrackerModern({
  days,
  hours,
  minutes,
  seconds,
  nextMilestone,
  isLoading,
}: CleanTimeTrackerModernProps): React.ReactElement {
  const [displayDays, setDisplayDays] = useState(0);
  const progress = nextMilestone ? (days / nextMilestone.days) * 100 : 100;

  // Animate day counter
  useEffect(() => {
    if (days > 0) {
      const duration = Math.min(1500, days * 50);
      const startTime = Date.now();
      const animateCount = (): void => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayDays(Math.round(days * eased));
        if (progress < 1) requestAnimationFrame(animateCount);
      };
      requestAnimationFrame(animateCount);
    }
  }, [days]);

  if (isLoading) {
    return (
      <GlassCard intensity="heavy" style={styles.loadingCard}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(600)}>
      <GlassCard intensity="heavy" glow glowColor={darkAccent.success}>
        {/* Header Badge */}
        <View style={styles.header}>
          <Animated.View entering={FadeIn.delay(300)} style={styles.streakBadge}>
            <MaterialIcons name="local-fire-department" size={16} color="#FBBF24" accessible={false} />
            <Text style={styles.streakText}>STREAK ACTIVE</Text>
          </Animated.View>
        </View>

        {/* Main Counter */}
        <View style={styles.counterSection}>
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.daysContainer}
          >
            {/* Progress Ring Background */}
            <View style={styles.ringContainer} accessible={false}>
              <LinearGradient
                colors={[`${darkAccent.success}30`, 'transparent']}
                style={[styles.progressRing, { transform: [{ rotate: `${(progress / 100) * 360}deg` }] }]}
              />
            </View>
            
            <Text 
              style={styles.daysNumber}
              accessibilityLabel={`${displayDays} days clean`}
              accessibilityRole="text"
            >
              {displayDays}
            </Text>
            <Text style={styles.daysLabel}>DAYS CLEAN</Text>
          </Animated.View>

          {/* Motivational Text */}
          <Animated.Text entering={FadeIn.delay(400)} style={styles.motivationalText}>
            {getMotivationalText(days)}
          </Animated.Text>
        </View>

        {/* Time Breakdown */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.timeSection}>
          <TimeUnit value={hours} label="Hours" />
          <TimeDivider />
          <TimeUnit value={minutes} label="Minutes" />
          <TimeDivider />
          <TimeUnit value={seconds} label="Seconds" />
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.statsSection}>
          <StatItem icon="replay" value="0" label="Relapses" />
          <StatDivider />
          <StatItem icon="verified" value={String(days)} label="Day Streak" />
          <StatDivider />
          <StatItem icon="emoji-events" value={nextMilestone ? String(nextMilestone.days - days) : '0'} label="To Next" />
        </Animated.View>

        {/* Next Milestone */}
        {nextMilestone && (
          <Animated.View entering={FadeInUp.delay(500)} style={styles.milestoneSection}>
            <View style={styles.milestoneHeader}>
              <Text 
                style={styles.milestoneEmoji}
                accessible={false}
              >
                {nextMilestone.icon}
              </Text>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Next: {nextMilestone.title}</Text>
                <Text style={styles.milestoneSubtitle}>
                  {nextMilestone.days - days} days to go
                </Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View 
                style={styles.progressTrack}
                accessibilityLabel={`${Math.round(progress)}% progress toward ${nextMilestone.title}`}
                accessibilityRole="progressbar"
              >
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progress, 100)}%` }
                  ]} 
                  accessible={false}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </Animated.View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// Sub-components
function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.timeUnit}>
      <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );
}

function TimeDivider() {
  return (
    <View style={styles.timeDivider}>
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  );
}

function StatItem({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View 
      style={styles.statItem}
      accessibilityLabel={`${value} ${label}`}
      accessibilityRole="text"
    >
      <MaterialIcons name={icon as any} size={20} color={darkAccent.textMuted} accessible={false} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

function getMotivationalText(days: number): string {
  if (days < 7) return 'Great start! Every day counts. 💪';
  if (days < 30) return 'Another week stronger. Keep going! 🌟';
  if (days < 90) return "Amazing progress! You're doing it! 🎉";
  if (days < 365) return "Incredible! You're an inspiration! 🔥";
  return "Legendary! You're living proof it works! 👑";
}

const styles = StyleSheet.create({
  loadingCard: {
    padding: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  counterSection: {
    alignItems: 'center',
    marginVertical: spacing[3],
  },
  daysContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  ringContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressRing: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  daysNumber: {
    fontSize: 80,
    fontWeight: '800',
    color: darkAccent.text,
    letterSpacing: -2,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: darkAccent.success,
    letterSpacing: 3,
    marginTop: -8,
  },
  motivationalText: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
    marginTop: spacing[2],
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 70,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: darkAccent.text,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 11,
    color: darkAccent.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  timeDivider: {
    height: 24,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkAccent.textSubtle,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: darkAccent.text,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: darkAccent.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: darkAccent.border,
  },
  milestoneSection: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  milestoneEmoji: {
    fontSize: 32,
    marginRight: spacing[2],
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    ...typography.h4,
    color: darkAccent.text,
  },
  milestoneSubtitle: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkAccent.success,
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.caption,
    color: darkAccent.textMuted,
    minWidth: 35,
    textAlign: 'right',
  },
});
