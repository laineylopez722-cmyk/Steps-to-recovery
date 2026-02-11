/**
 * UpcomingMeetingWidget Component
 * Shows the next scheduled meeting on the home page
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Loading skeleton state
 * - Empty state CTA
 * - Today meeting highlight
 * - Share prep quick action
 * - Accessibility optimized
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouterCompat } from '../../utils/navigationHelper';
import { GlassCard } from '../../design-system/components/GlassCard';
import { useRegularMeetings } from '../../hooks/useRegularMeetings';
import { useThemedStyles, type DS } from '../../design-system/hooks/useThemedStyles';
import { useDs } from '../../design-system/DsProvider';
import * as Haptics from 'expo-haptics';

interface UpcomingMeetingWidgetProps {
  /** Delay index for staggered entrance animation */
  enteringDelay?: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function UpcomingMeetingWidget({ enteringDelay = 2 }: UpcomingMeetingWidgetProps) {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const router = useRouterCompat();
  const { nextMeeting, todayMeetings, meetings, isLoading, loadMeetings, getDaysUntil } =
    useRegularMeetings();

  useEffect(() => {
    if (meetings.length === 0 && !isLoading) {
      loadMeetings();
    }
  }, [meetings.length, isLoading, loadMeetings]);

  const handleViewAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/my-meetings');
  }, [router]);

  const handlePrepareShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/share-prep');
  }, [router]);

  const handleLogAttendance = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/meetings/new');
  }, [router]);

  const handleAddMeeting = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/my-meetings/add');
  }, [router]);

  const handleMeetingPress = useCallback(
    (meetingId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      router.push(`/my-meetings/${meetingId}`);
    },
    [router],
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.skeleton}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonContent} />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // Empty state - no meetings
  if (meetings.length === 0) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <TouchableOpacity
          onPress={handleAddMeeting}
          accessibilityRole="button"
          accessibilityLabel="No meetings scheduled. Tap to add your first meeting."
          accessibilityHint="Opens add meeting screen"
        >
          <GlassCard gradient="card" style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyIconContainer}>
                <Feather name="calendar" size={24} color={ds.colors.info} />
              </View>
              <Text style={styles.emptyTitle}>No Meetings Scheduled</Text>
              <Text style={styles.emptySubtitle}>
                Finding your people is part of recovery. Add your home group to get started.
              </Text>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>Add Meeting →</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Show today's meetings if any
  if (todayMeetings.length > 0) {
    const nextTodayMeeting = todayMeetings[0];

    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="elevated" style={[styles.card, styles.todayCard]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.todayIconContainer}>
                <Feather name="calendar" size={20} color={ds.colors.success} />
              </View>
              <Text style={styles.todayHeaderTitle}>Meeting Today!</Text>
            </View>
            <TouchableOpacity
              onPress={handleViewAll}
              accessibilityRole="button"
              accessibilityLabel="View all meetings"
            >
              <Text style={styles.viewAllText}>All Meetings →</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Meeting */}
          <TouchableOpacity
            onPress={() => handleMeetingPress(nextTodayMeeting.id)}
            style={styles.todayMeetingContainer}
            accessibilityRole="button"
            accessibilityLabel={`${nextTodayMeeting.name} today at ${formatTime(nextTodayMeeting.time)}${nextTodayMeeting.isHomeGroup ? ', Home Group' : ''}`}
            accessibilityHint="Tap to view meeting details"
          >
            <View style={styles.todayMeetingContent}>
              <View style={styles.todayMeetingHeader}>
                <Text style={styles.todayMeetingName} numberOfLines={1}>
                  {nextTodayMeeting.name}
                </Text>
                {nextTodayMeeting.isHomeGroup && (
                  <View style={styles.todayHomeBadge}>
                    <Feather name="home" size={10} color={ds.colors.warning} />
                    <Text style={styles.todayHomeText}>Home</Text>
                  </View>
                )}
              </View>
              <Text style={styles.todayMeetingMeta}>
                {formatTime(nextTodayMeeting.time)}
                {nextTodayMeeting.location ? ` • ${nextTodayMeeting.location}` : ''}
              </Text>
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          </TouchableOpacity>

          {/* More meetings today */}
          {todayMeetings.length > 1 && (
            <Text style={styles.moreMeetingsText}>
              + {todayMeetings.length - 1} more meeting{todayMeetings.length > 2 ? 's' : ''} today
            </Text>
          )}

          {/* Quick Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handlePrepareShare}
              style={styles.shareButton}
              accessibilityRole="button"
              accessibilityLabel="Prepare to share"
              accessibilityHint="Opens share preparation screen"
            >
              <Feather
                name="edit-3"
                size={16}
                color={ds.semantic.text.onDark}
                style={styles.buttonIcon}
              />
              <Text style={styles.shareButtonText}>Prepare to Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogAttendance}
              style={styles.logButton}
              accessibilityRole="button"
              accessibilityLabel="Log attendance"
              accessibilityHint="Opens attendance logging screen"
            >
              <Text style={styles.logButtonText}>Log Attendance</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // Show next upcoming meeting
  if (nextMeeting) {
    const daysUntil = getDaysUntil(nextMeeting);

    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="calendar" size={20} color={ds.colors.info} />
              <Text style={styles.headerTitle}>Next Meeting</Text>
            </View>
            <TouchableOpacity
              onPress={handleViewAll}
              accessibilityRole="button"
              accessibilityLabel="View all meetings"
            >
              <Text style={styles.viewAllText}>All Meetings →</Text>
            </TouchableOpacity>
          </View>

          {/* Next Meeting */}
          <TouchableOpacity
            onPress={() => handleMeetingPress(nextMeeting.id)}
            style={styles.nextMeetingContainer}
            accessibilityRole="button"
            accessibilityLabel={`${nextMeeting.name}, ${DAY_NAMES[nextMeeting.dayOfWeek]} at ${formatTime(nextMeeting.time)}, ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`}
            accessibilityHint="Tap to view meeting details"
          >
            <View style={styles.nextMeetingContent}>
              <View style={styles.nextMeetingHeader}>
                <Text style={styles.nextMeetingName} numberOfLines={1}>
                  {nextMeeting.name}
                </Text>
                {nextMeeting.isHomeGroup && (
                  <View style={styles.nextHomeBadge}>
                    <Feather name="home" size={10} color={ds.colors.warning} />
                  </View>
                )}
              </View>
              <Text style={styles.nextMeetingMeta}>
                {DAY_NAMES[nextMeeting.dayOfWeek]} at {formatTime(nextMeeting.time)}
              </Text>
            </View>
            <View style={styles.daysUntilBadge}>
              <Text style={styles.daysUntilText}>
                {daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
              </Text>
            </View>
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    );
  }

  return null;
}

const createStyles = (ds: DS) =>
  ({
    card: {
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
    },
    todayCard: {
      borderColor: ds.colors.success,
      borderWidth: 1,
    },
    emptyCard: {
      borderColor: ds.colors.borderSubtle,
      borderWidth: 1,
    },
    skeleton: {
      opacity: 0.5,
    },
    skeletonHeader: {
      height: 20,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: 4,
      width: '40%',
      marginBottom: 12,
    },
    skeletonContent: {
      height: 60,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: 8,
    },
    emptyContent: {
      alignItems: 'center',
      padding: 8,
    },
    emptyIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: ds.colors.bgSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: ds.semantic.text.onDark,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 14,
      color: ds.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: ds.colors.bgSecondary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    addButtonText: {
      color: ds.colors.info,
      fontWeight: '600',
      fontSize: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: ds.semantic.text.onDark,
    },
    todayHeaderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: ds.colors.success,
    },
    todayIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ds.colors.successMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewAllText: {
      fontSize: 14,
      color: ds.colors.info,
    },
    todayMeetingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    todayMeetingContent: {
      flex: 1,
    },
    todayMeetingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    todayMeetingName: {
      fontSize: 16,
      fontWeight: '600',
      color: ds.semantic.text.onDark,
      flex: 1,
    },
    todayHomeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.colors.warningMuted,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
    },
    todayHomeText: {
      fontSize: 10,
      fontWeight: '500',
      color: ds.colors.warning,
    },
    todayMeetingMeta: {
      fontSize: 14,
      color: ds.colors.textTertiary,
      marginTop: 2,
    },
    todayBadge: {
      backgroundColor: ds.colors.successMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginLeft: 8,
    },
    todayBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: ds.colors.success,
    },
    moreMeetingsText: {
      fontSize: 14,
      color: ds.colors.success,
      marginBottom: 12,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    shareButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.colors.success,
      paddingVertical: 12,
      borderRadius: 10,
    },
    buttonIcon: {
      marginRight: 8,
    },
    shareButtonText: {
      color: ds.semantic.text.onDark,
      fontWeight: '600',
      fontSize: 14,
    },
    logButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.colors.bgTertiary,
      borderWidth: 1,
      borderColor: ds.colors.success,
      paddingVertical: 12,
      borderRadius: 10,
    },
    logButtonText: {
      color: ds.colors.success,
      fontWeight: '600',
      fontSize: 14,
    },
    nextMeetingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: 12,
      padding: 12,
    },
    nextMeetingContent: {
      flex: 1,
    },
    nextMeetingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nextMeetingName: {
      fontSize: 16,
      fontWeight: '600',
      color: ds.semantic.text.onDark,
      flex: 1,
    },
    nextHomeBadge: {
      backgroundColor: ds.colors.warningMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    nextMeetingMeta: {
      fontSize: 14,
      color: ds.colors.textTertiary,
      marginTop: 2,
    },
    daysUntilBadge: {
      backgroundColor: ds.colors.bgSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginLeft: 8,
    },
    daysUntilText: {
      fontSize: 13,
      fontWeight: '500',
      color: ds.colors.info,
    },
  }) as const;
