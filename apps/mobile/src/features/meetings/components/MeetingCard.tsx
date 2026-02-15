/**
 * MeetingCard Component
 * Displays meeting information in a card format with distance and type badges
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { ds } from '../../../design-system/tokens/ds';
import { Badge } from '../../../design-system/components/Badge';
import type { MeetingWithDetails } from '../types/meeting';
import { formatMeetingTime, formatDayOfWeek, getMeetingTypeLabel } from '../types/meeting';

export interface MeetingCardProps {
  meeting: MeetingWithDetails;
  onPress: () => void;
  showFavoriteIcon?: boolean;
}

export const MeetingCard = React.memo(function MeetingCard({
  meeting,
  onPress,
  showFavoriteIcon = true,
}: MeetingCardProps): React.ReactElement {
  const theme = useTheme();

  // Parse meeting types
  let meetingTypes: string[] = [];
  try {
    meetingTypes = JSON.parse(meeting.types);
  } catch {
    meetingTypes = [];
  }

  // Format distance
  const distanceText =
    meeting.distance_miles !== null && Number.isFinite(meeting.distance_miles)
      ? `${meeting.distance_miles.toFixed(1)} mi`
      : '';

  // Format time
  const timeText = meeting.time ? formatMeetingTime(meeting.time) : 'Time varies';

  // Format day
  const dayText = meeting.day_of_week !== null ? formatDayOfWeek(meeting.day_of_week) : 'Daily';

  const meetingName = meeting.name?.trim() || 'Unnamed meeting';
  const locationName = meeting.location?.trim() || 'Location details unavailable';
  const addressLine =
    [meeting.address, meeting.city].filter(Boolean).join(', ') || 'Address unavailable';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: ds.semantic.surface.card,
          borderRadius: theme.radius.card,
          borderColor: ds.semantic.surface.overlay,
        },
        pressed && { opacity: 0.6 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${meetingName}, ${dayText} at ${timeText}${distanceText ? `, ${distanceText} away` : ''}`}
      accessibilityHint="Tap to view meeting details"
    >
      {/* Header Row: Name and Distance */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[ds.typography.h3, { color: ds.semantic.text.primary }, styles.title]}
            numberOfLines={1}
          >
            {meetingName}
          </Text>
          {showFavoriteIcon && meeting.is_favorite && (
            <MaterialIcons
              name="favorite"
              size={18}
              color={ds.semantic.intent.alert.solid}
              style={styles.favoriteIcon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
          )}
        </View>
        {distanceText && (
          <Badge variant="muted" size="small">
            {distanceText}
          </Badge>
        )}
      </View>

      {/* Time and Day */}
      <View style={styles.timeRow}>
        <MaterialIcons
          name="schedule"
          size={16}
          color={ds.semantic.text.secondary}
          style={styles.icon}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <Text style={[ds.semantic.typography.body, { color: ds.semantic.text.secondary }]}>
          {dayText} • {timeText}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <MaterialIcons
          name="place"
          size={16}
          color={ds.semantic.text.secondary}
          style={styles.icon}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <View style={styles.locationText}>
          <Text
            style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.secondary }]}
            numberOfLines={1}
          >
            {locationName}
          </Text>
          <Text
            style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.secondary }]}
            numberOfLines={1}
          >
            {addressLine}
          </Text>
        </View>
      </View>

      {/* Meeting Types */}
      {meetingTypes.length > 0 && (
        <View style={styles.typesRow}>
          {meetingTypes.slice(0, 3).map((type, index) => (
            <Badge key={`${type}-${index}`} variant="primary" size="small" style={styles.typeBadge}>
              {getMeetingTypeLabel(type)}
            </Badge>
          ))}
          {meetingTypes.length > 3 && (
            <Text style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.secondary }]}>
              +{meetingTypes.length - 3} more
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
});
MeetingCard.displayName = 'MeetingCard';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    // Shadow for iOS
    shadowColor: ds.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
  },
  favoriteIcon: {
    marginLeft: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    marginRight: 6,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    marginRight: 4,
    marginBottom: 4,
  },
});
