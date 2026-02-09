/**
 * MeetingCard Component
 * Display card for regular meetings with design system integration
 * Memoized for FlatList performance
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Compact and full variants
 * - Reminder toggle with accessibility
 * - Meeting type icons
 * - Days until indicator
 * - Home group badge
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouterCompat } from '../../utils/navigationHelper';
import { GlassCard } from '../../design-system/components/GlassCard';
import type { RegularMeeting, RegularMeetingType } from '@recovery/shared';
import * as Haptics from 'expo-haptics';
import { ds } from '../../design-system/tokens/ds';

interface MeetingCardProps {
  meeting: RegularMeeting;
  onToggleReminder?: (id: string, enabled: boolean) => void;
  showDaysUntil?: boolean;
  daysUntil?: number;
  compact?: boolean;
  enteringDelay?: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getTypeIcon(type: RegularMeetingType): React.ComponentProps<typeof Feather>['name'] {
  switch (type) {
    case 'in-person':
      return 'map-pin';
    case 'online':
      return 'video';
    case 'hybrid':
      return 'refresh-cw';
    default:
      return 'map-pin';
  }
}

function getTypeColor(type: RegularMeetingType): string {
  switch (type) {
    case 'in-person':
      return ds.colors.success;
    case 'online':
      return ds.colors.info;
    case 'hybrid':
      return ds.colors.accent;
    default:
      return ds.colors.success;
  }
}

function getTypeLabel(type: RegularMeetingType): string {
  switch (type) {
    case 'in-person':
      return 'In Person';
    case 'online':
      return 'Online';
    case 'hybrid':
      return 'Hybrid';
    default:
      return type;
  }
}

function MeetingCardComponent({
  meeting,
  onToggleReminder,
  showDaysUntil = false,
  daysUntil,
  compact = false,
  enteringDelay = 0,
}: MeetingCardProps) {
  const router = useRouterCompat();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/my-meetings/${meeting.id}`);
  }, [router, meeting.id]);

  const handleToggleReminder = useCallback((value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleReminder?.(meeting.id, value);
  }, [onToggleReminder, meeting.id]);

  const getDaysUntilText = useCallback(() => {
    if (daysUntil === undefined) return null;
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  }, [daysUntil]);

  const typeIcon = getTypeIcon(meeting.type);
  const typeColor = getTypeColor(meeting.type);

  // Accessibility label
  const accessibilityLabel = `${meeting.name}, ${getTypeLabel(meeting.type)}, ${DAY_NAMES[meeting.dayOfWeek]} at ${formatTime(meeting.time)}${meeting.isHomeGroup ? ', Home Group' : ''}${daysUntil !== undefined ? `, ${getDaysUntilText()}` : ''}`;

  if (compact) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 50)} style={animatedStyle}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.compactContainer}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Tap to view meeting details"
          activeOpacity={0.8}
        >
          <View style={styles.compactContent}>
            <View style={[styles.typeIconContainer, meeting.type === 'in-person' ? styles.typeIconInPerson : meeting.type === 'online' ? styles.typeIconOnline : styles.typeIconHybrid]}>
              <Feather name={typeIcon} size={18} color={typeColor} />
            </View>
            <View style={styles.compactInfo}>
              <View style={styles.compactHeader}>
                <Text style={styles.compactName} numberOfLines={1}>
                  {meeting.name}
                </Text>
                {meeting.isHomeGroup && (
                  <View style={styles.homeBadge}>
                    <Text style={styles.homeBadgeText}>Home</Text>
                  </View>
                )}
              </View>
              <Text style={styles.compactMeta}>
                {SHORT_DAY_NAMES[meeting.dayOfWeek]} • {formatTime(meeting.time)}
              </Text>
            </View>
          </View>
          {showDaysUntil && daysUntil !== undefined && (
            <View style={[styles.daysBadge, daysUntil === 0 && styles.daysBadgeToday]}>
              <Text style={[styles.daysText, daysUntil === 0 && styles.daysTextToday]}>
                {getDaysUntilText()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 50)}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Tap to view meeting details"
      >
        <GlassCard gradient="card" style={styles.card}>
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, meeting.type === 'in-person' ? styles.iconInPerson : meeting.type === 'online' ? styles.iconOnline : styles.iconHybrid]}>
                <Feather name={typeIcon} size={20} color={typeColor} />
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.meetingName} numberOfLines={1}>
                    {meeting.name}
                  </Text>
                  {meeting.isHomeGroup && (
                    <View style={styles.homeGroupBadge}>
                      <Feather name="home" size={10} color={ds.colors.warning} />
                      <Text style={styles.homeGroupText}>Home</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.typeLabel}>{getTypeLabel(meeting.type)}</Text>
              </View>
            </View>

            {showDaysUntil && daysUntil !== undefined && (
              <View style={[styles.daysUntilBadge, daysUntil === 0 && styles.daysUntilBadgeToday]}>
                <Text style={[styles.daysUntilText, daysUntil === 0 && styles.daysUntilTextToday]}>
                  {getDaysUntilText()}
                </Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Feather name="clock" size={14} color={ds.colors.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>When</Text>
              <Text style={styles.detailValue}>
                {DAY_NAMES[meeting.dayOfWeek]} at {formatTime(meeting.time)}
              </Text>
            </View>

            {meeting.location && (
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color={ds.colors.textSecondary} style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Where</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {meeting.location}
                </Text>
              </View>
            )}
          </View>

          {/* Reminder Toggle */}
          {onToggleReminder && (
            <View style={styles.reminderContainer}>
              <View style={styles.reminderLeft}>
                <Feather name="bell" size={16} color={ds.colors.textSecondary} />
                <Text style={styles.reminderText}>
                  Reminder ({meeting.reminderMinutesBefore} min before)
                </Text>
              </View>
              <Switch
                value={meeting.reminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: ds.colors.bgTertiary, true: ds.colors.bgSecondary }}
                thumbColor={meeting.reminderEnabled ? ds.colors.info : ds.colors.textSecondary}
                accessibilityLabel={`Toggle reminder for ${meeting.name}`}
                accessibilityHint={`Sets a reminder ${meeting.reminderMinutesBefore} minutes before the meeting`}
                accessibilityRole="switch"
                accessibilityState={{ checked: meeting.reminderEnabled }}
              />
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Memoize to prevent unnecessary re-renders in FlatList
export const MeetingCard = memo(MeetingCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.meeting.id === nextProps.meeting.id &&
    prevProps.meeting.name === nextProps.meeting.name &&
    prevProps.meeting.reminderEnabled === nextProps.meeting.reminderEnabled &&
    prevProps.daysUntil === nextProps.daysUntil &&
    prevProps.showDaysUntil === nextProps.showDaysUntil &&
    prevProps.compact === nextProps.compact
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ds.colors.bgSecondary,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIconInPerson: {
    backgroundColor: ds.colors.successMuted,
  },
  typeIconOnline: {
    backgroundColor: ds.colors.bgSecondary,
  },
  typeIconHybrid: {
    backgroundColor: ds.colors.bgSecondary,
  },
  compactInfo: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
    flex: 1,
  },
  homeBadge: {
    backgroundColor: ds.colors.warningMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  homeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: ds.colors.warning,
  },
  compactMeta: {
    fontSize: 13,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  daysBadge: {
    backgroundColor: ds.colors.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  daysBadgeToday: {
    backgroundColor: ds.colors.successMuted,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
    color: ds.colors.info,
  },
  daysTextToday: {
    color: ds.colors.success,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconInPerson: {
    backgroundColor: ds.colors.successMuted,
  },
  iconOnline: {
    backgroundColor: ds.colors.bgSecondary,
  },
  iconHybrid: {
    backgroundColor: ds.colors.bgSecondary,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meetingName: {
    fontSize: 17,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
    flex: 1,
  },
  homeGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.warningMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  homeGroupText: {
    fontSize: 11,
    fontWeight: '500',
    color: ds.colors.warning,
  },
  typeLabel: {
    fontSize: 13,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  daysUntilBadge: {
    backgroundColor: ds.colors.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  daysUntilBadgeToday: {
    backgroundColor: ds.colors.successMuted,
  },
  daysUntilText: {
    fontSize: 13,
    fontWeight: '500',
    color: ds.colors.info,
  },
  daysUntilTextToday: {
    color: ds.colors.success,
  },
  details: {
    marginLeft: 56,
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    width: 50,
  },
  detailValue: {
    fontSize: 14,
    color: ds.colors.text,
    fontWeight: '500',
    flex: 1,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderText: {
    fontSize: 14,
    color: ds.colors.textTertiary,
  },
});
