/**
 * MeetingCard Component
 * Display card for regular meetings
 * Memoized for FlatList performance
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useRouterCompat } from '../../utils/navigationHelper';
import { LegacyCard as Card } from '../ui';
import type { RegularMeeting, RegularMeetingType } from '@recovery/shared';

interface MeetingCardProps {
  meeting: RegularMeeting;
  onToggleReminder?: (id: string, enabled: boolean) => void;
  showDaysUntil?: boolean;
  daysUntil?: number;
  compact?: boolean;
  className?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getTypeIcon(type: RegularMeetingType): string {
  switch (type) {
    case 'in-person':
      return '📍';
    case 'online':
      return '💻';
    case 'hybrid':
      return '🔄';
    default:
      return '📍';
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
  className = '',
}: MeetingCardProps) {
  const router = useRouterCompat();

  const handlePress = useCallback(() => {
    router.push(`/my-meetings/${meeting.id}`);
  }, [router, meeting.id]);

  const getDaysUntilText = useCallback(() => {
    if (daysUntil === undefined) return null;
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  }, [daysUntil]);

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className={`bg-surface-100 dark:bg-surface-800 rounded-xl p-3 ${className}`}
        accessibilityRole="button"
        accessibilityLabel={`${meeting.name} on ${DAY_NAMES[meeting.dayOfWeek]} at ${formatTime(meeting.time)}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Text className="text-lg mr-2">{getTypeIcon(meeting.type)}</Text>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text
                  className="font-semibold text-surface-900 dark:text-surface-100"
                  numberOfLines={1}
                >
                  {meeting.name}
                </Text>
                {meeting.isHomeGroup && (
                  <Text className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded">
                    Home
                  </Text>
                )}
              </View>
              <Text className="text-sm text-surface-500">
                {SHORT_DAY_NAMES[meeting.dayOfWeek]} • {formatTime(meeting.time)}
              </Text>
            </View>
          </View>
          {showDaysUntil && daysUntil !== undefined && (
            <View className="bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-primary-700 dark:text-primary-300">
                {getDaysUntilText()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card variant="default" className={className}>
        {/* Header Row */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mr-3">
              <Text className="text-xl">{getTypeIcon(meeting.type)}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-lg font-semibold text-surface-900 dark:text-surface-100"
                  numberOfLines={1}
                >
                  {meeting.name}
                </Text>
                {meeting.isHomeGroup && (
                  <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    <Text className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      🏠 Home Group
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-surface-500">{getTypeLabel(meeting.type)}</Text>
            </View>
          </View>

          {showDaysUntil && daysUntil !== undefined && (
            <View
              className={`px-3 py-1.5 rounded-full ${
                daysUntil === 0
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-surface-100 dark:bg-surface-700'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  daysUntil === 0
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-surface-600 dark:text-surface-400'
                }`}
              >
                {getDaysUntilText()}
              </Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View className="ml-13 space-y-1">
          <View className="flex-row items-center">
            <Text className="text-surface-500 w-20">When</Text>
            <Text className="text-surface-900 dark:text-surface-100 font-medium">
              {DAY_NAMES[meeting.dayOfWeek]} at {formatTime(meeting.time)}
            </Text>
          </View>

          {meeting.location && (
            <View className="flex-row items-center">
              <Text className="text-surface-500 w-20">Where</Text>
              <Text className="text-surface-900 dark:text-surface-100">{meeting.location}</Text>
            </View>
          )}
        </View>

        {/* Reminder Toggle */}
        {onToggleReminder && (
          <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
            <View className="flex-row items-center">
              <Text className="text-surface-700 dark:text-surface-300">
                🔔 Reminder ({meeting.reminderMinutesBefore} min before)
              </Text>
            </View>
            <Switch
              value={meeting.reminderEnabled}
              onValueChange={(value) => onToggleReminder(meeting.id, value)}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={meeting.reminderEnabled ? '#3b82f6' : '#f4f4f5'}
            />
          </View>
        )}
      </Card>
    </TouchableOpacity>
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
