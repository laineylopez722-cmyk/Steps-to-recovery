/**
 * Meeting Stats Screen
 * Dashboard showing meeting attendance stats, streaks, and achievements
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useMeetingCheckIns } from '../hooks/useMeetingCheckIns';
import { useAchievements } from '../hooks/useAchievements';
import { use90In90Progress, get90In90MotivationalMessage } from '../hooks/use90In90Progress';
import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { ACHIEVEMENT_COLORS } from '@recovery/shared';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function MeetingStatsScreen(): React.ReactElement {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [refreshing, setRefreshing] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);

  const {
    checkIns,
    totalMeetings,
    currentStreak,
    longestStreak,
    refetch: refetchCheckIns,
  } = useMeetingCheckIns();

  const { achievements, unlockedCount, totalCount } = useAchievements();

  const {
    progress: ninetyInNinetyProgress,
    percentComplete,
    isOnTrack,
    refetch: refetchProgress,
  } = use90In90Progress();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCheckIns(), refetchProgress()]);
    } catch {
      // Swallow — hooks expose error state for UI
    } finally {
      setRefreshing(false);
    }
  };

  const handleAchievementPress = (achievementKey: string) => {
    setSelectedAchievement(achievementKey);
    setShowAchievementModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const motivationalMessage = get90In90MotivationalMessage(ninetyInNinetyProgress.daysCompleted);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[darkAccent.background, darkAccent.surfaceHigh]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={24} color={darkAccent.text} />
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header">
            My Meeting Journey
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkAccent.primary}
            />
          }
        >
          {/* Stats Cards Row */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
            {/* Total Meetings */}
            <GlassCard
              style={styles.statCard}
              accessible
              accessibilityLabel={`Total Meetings: ${totalMeetings}`}
            >
              <LinearGradient
                colors={[ds.colors.info, ds.semantic.intent.primary.solid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statIconBg}
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialIcons name="event-available" size={24} color={ds.semantic.text.onDark} />
              </LinearGradient>
              <Text style={styles.statValue} importantForAccessibility="no">{totalMeetings}</Text>
              <Text style={styles.statLabel} importantForAccessibility="no">Total Meetings</Text>
            </GlassCard>

            {/* Current Streak */}
            <GlassCard
              style={styles.statCard}
              accessible
              accessibilityLabel={`Current Streak: ${currentStreak} days`}
            >
              <LinearGradient
                colors={[ds.colors.warning, ds.semantic.intent.secondary.solid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statIconBg}
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialIcons
                  name="local-fire-department"
                  size={24}
                  color={ds.semantic.text.onDark}
                />
              </LinearGradient>
              <Text style={styles.statValue} importantForAccessibility="no">{currentStreak}</Text>
              <Text style={styles.statLabel} importantForAccessibility="no">Day Streak</Text>
            </GlassCard>

            {/* Longest Streak */}
            <GlassCard
              style={styles.statCard}
              accessible
              accessibilityLabel={`Best Streak: ${longestStreak} days`}
            >
              <LinearGradient
                colors={[ds.colors.accent, ds.semantic.intent.primary.solid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statIconBg}
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialIcons name="emoji-events" size={24} color={ds.semantic.text.onDark} />
              </LinearGradient>
              <Text style={styles.statValue} importantForAccessibility="no">{longestStreak}</Text>
              <Text style={styles.statLabel} importantForAccessibility="no">Best Streak</Text>
            </GlassCard>
          </Animated.View>

          {/* 90-in-90 Progress Card */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <GlassCard style={styles.ninetyCard}>
              <View style={styles.ninetyHeader}>
                <MaterialIcons
                  name="star"
                  size={32}
                  color={ds.colors.accent}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                />
                <View style={styles.ninetyTitleContainer}>
                  <Text style={styles.ninetyTitle} accessibilityRole="header">
                    90 in 90 Challenge
                  </Text>
                  <Text style={styles.ninetySubtitle}>{motivationalMessage}</Text>
                </View>
              </View>

              {/* Progress Ring/Bar */}
              <View
                style={styles.progressContainer}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={`90 in 90 progress: ${ninetyInNinetyProgress.daysCompleted} of 90 days, ${Math.round(percentComplete)}% complete`}
                accessibilityValue={{
                  min: 0,
                  max: 90,
                  now: ninetyInNinetyProgress.daysCompleted,
                }}
              >
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percentComplete}%` }]}>
                    <LinearGradient
                      colors={ACHIEVEMENT_COLORS.challenge.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressGradient}
                    />
                  </View>
                </View>
                <Text style={styles.progressText}>
                  {ninetyInNinetyProgress.daysCompleted} / 90 days
                </Text>
              </View>

              {/* Status Badges */}
              <View style={styles.statusBadges}>
                {ninetyInNinetyProgress.isComplete ? (
                  <View style={[styles.statusBadge, styles.completeBadge]}>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color={ds.colors.success}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <Text style={styles.completeBadgeText}>Complete! 🎉</Text>
                  </View>
                ) : isOnTrack ? (
                  <View style={[styles.statusBadge, styles.onTrackBadge]}>
                    <MaterialIcons
                      name="trending-up"
                      size={16}
                      color={ds.colors.success}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <Text style={styles.onTrackBadgeText}>On Track!</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.behindBadge]}>
                    <MaterialIcons
                      name="schedule"
                      size={16}
                      color={ds.colors.warning}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <Text style={styles.behindBadgeText}>Keep Going!</Text>
                  </View>
                )}

                {ninetyInNinetyProgress.startDate && (
                  <Text style={styles.startDateText}>
                    Started: {formatDate(ninetyInNinetyProgress.startDate)}
                  </Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Achievements Preview */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Achievements</Text>
              <Pressable
                onPress={() => navigation.navigate('Achievements' as never)}
                accessibilityLabel="View all achievements"
                accessibilityRole="button"
              >
                <Text style={styles.viewAllText}>View All →</Text>
              </Pressable>
            </View>

            <View style={styles.achievementsGrid}>
              {achievements.slice(0, 4).map((achievement) => (
                <Pressable
                  key={achievement.key}
                  onPress={() => achievement.unlocked && handleAchievementPress(achievement.key)}
                  style={[
                    styles.achievementCard,
                    !achievement.unlocked && styles.achievementLocked,
                  ]}
                  accessibilityLabel={`${achievement.title}${
                    achievement.unlocked ? ' - Unlocked' : ' - Locked'
                  }`}
                  accessibilityRole="button"
                >
                  <MaterialIcons
                    name={achievement.icon as IconName}
                    size={32}
                    color={
                      achievement.unlocked
                        ? ACHIEVEMENT_COLORS[achievement.category].primary
                        : darkAccent.textMuted
                    }
                  />
                  {achievement.unlocked && (
                    <View style={styles.achievementBadge}>
                      <MaterialIcons name="check" size={12} color={ds.semantic.text.onDark} />
                    </View>
                  )}
                  {!achievement.unlocked && (
                    <MaterialIcons
                      name="lock"
                      size={16}
                      color={darkAccent.textMuted}
                      style={styles.lockIcon}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            <Text style={styles.achievementCount}>
              {unlockedCount} / {totalCount} Unlocked
            </Text>
          </Animated.View>

          {/* Recent Check-Ins */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Recent Check-Ins</Text>

            {checkIns.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <MaterialIcons
                  name="event-note"
                  size={48}
                  color={darkAccent.textMuted}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                />
                <Text style={styles.emptyText}>No check-ins yet</Text>
                <Text style={styles.emptySubtext}>
                  Start attending meetings to build your streak!
                </Text>
              </GlassCard>
            ) : (
              checkIns.slice(0, 10).map((checkIn) => (
                <GlassCard
                  key={checkIn.id}
                  style={styles.checkInCard}
                  accessible
                  accessibilityLabel={`${checkIn.meetingName}, ${formatDate(checkIn.createdAt)} at ${formatTime(checkIn.createdAt)}`}
                >
                  <View style={styles.checkInIcon} importantForAccessibility="no-hide-descendants">
                    <MaterialIcons name="check-circle" size={20} color={ds.colors.success} />
                  </View>
                  <View style={styles.checkInContent}>
                    <Text style={styles.checkInName}>{checkIn.meetingName}</Text>
                    {checkIn.meetingAddress && (
                      <Text style={styles.checkInAddress} numberOfLines={1}>
                        {checkIn.meetingAddress}
                      </Text>
                    )}
                    <Text style={styles.checkInDate}>
                      {formatDate(checkIn.createdAt)} at {formatTime(checkIn.createdAt)}
                    </Text>
                  </View>
                </GlassCard>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <AchievementUnlockModal
        visible={showAchievementModal}
        achievementKey={selectedAchievement}
        onClose={() => setShowAchievementModal(false)}
        onViewAll={() => navigation.navigate('Achievements' as never)}
      />
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    backButton: {
      padding: spacing.sm,
    },
    headerTitle: {
      ...typography.h2,
      color: darkAccent.text,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
      padding: spacing.lg,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    statIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValue: {
      ...typography.h1,
      color: darkAccent.text,
      fontWeight: '800',
    },
    statLabel: {
      ...typography.caption,
      color: darkAccent.textMuted,
      textAlign: 'center',
    },
    ninetyCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    ninetyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    ninetyTitleContainer: {
      flex: 1,
    },
    ninetyTitle: {
      ...typography.h3,
      color: darkAccent.text,
      fontWeight: '700',
    },
    ninetySubtitle: {
      ...typography.body,
      color: darkAccent.textMuted,
      marginTop: spacing.xs,
    },
    progressContainer: {
      gap: spacing.sm,
    },
    progressTrack: {
      height: 24,
      backgroundColor: darkAccent.surfaceHigh,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressGradient: {
      flex: 1,
    },
    progressText: {
      ...typography.body,
      color: darkAccent.text,
      fontWeight: '600',
      textAlign: 'center',
    },
    statusBadges: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
    },
    completeBadge: {
      backgroundColor: ds.colors.successMuted,
    },
    completeBadgeText: {
      ...typography.caption,
      color: ds.colors.success,
      fontWeight: '600',
    },
    onTrackBadge: {
      backgroundColor: ds.colors.successMuted,
    },
    onTrackBadgeText: {
      ...typography.caption,
      color: ds.colors.success,
      fontWeight: '600',
    },
    behindBadge: {
      backgroundColor: ds.colors.warningMuted,
    },
    behindBadgeText: {
      ...typography.caption,
      color: ds.colors.warning,
      fontWeight: '600',
    },
    startDateText: {
      ...typography.caption,
      color: darkAccent.textMuted,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      color: darkAccent.text,
      fontWeight: '700',
    },
    viewAllText: {
      ...typography.body,
      color: darkAccent.primary,
      fontWeight: '600',
    },
    achievementsGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    achievementCard: {
      width: 72,
      height: 72,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: darkAccent.surfaceHigh,
      borderRadius: radius.lg,
      position: 'relative',
    },
    achievementLocked: {
      opacity: 0.5,
    },
    achievementBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: ds.colors.success,
      justifyContent: 'center',
      alignItems: 'center',
    },
    lockIcon: {
      position: 'absolute',
      bottom: 4,
      right: 4,
    },
    achievementCount: {
      ...typography.body,
      color: darkAccent.textMuted,
      textAlign: 'center',
    },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      ...typography.body,
      color: darkAccent.text,
      fontWeight: '600',
    },
    emptySubtext: {
      ...typography.body,
      color: darkAccent.textMuted,
      textAlign: 'center',
    },
    checkInCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    checkInIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: ds.colors.successMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkInContent: {
      flex: 1,
    },
    checkInName: {
      ...typography.body,
      color: darkAccent.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    checkInAddress: {
      ...typography.caption,
      color: darkAccent.textMuted,
      marginBottom: spacing.xs,
    },
    checkInDate: {
      ...typography.caption,
      color: darkAccent.textMuted,
    },
  }) as const;
