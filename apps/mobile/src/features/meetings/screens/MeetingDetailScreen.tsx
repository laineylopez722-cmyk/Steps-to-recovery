/**
 * MeetingDetailScreen
 * Detailed view of a single meeting with favorite toggle and personal notes
 */

import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { Button } from '../../../design-system/components/Button';
import { Badge } from '../../../design-system/components/Badge';
import { TextArea } from '../../../design-system/components/TextArea';
import { Card } from '../../../design-system/components/Card';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useFavoriteMeetings } from '../hooks/useFavoriteMeetings';
import { getCachedMeetingById } from '../services/meetingCacheService';
import type { CachedMeeting } from '../types/meeting';
import { formatMeetingTime, formatDayOfWeek, getMeetingTypeLabel } from '../types/meeting';
import type { MeetingsStackScreenProps } from '../../../navigation/types';

type MeetingDetailScreenProps = MeetingsStackScreenProps<'MeetingDetail'>;

export function MeetingDetailScreen({ route }: MeetingDetailScreenProps): React.ReactElement {
  const theme = useTheme();
  const { db } = useDatabase();
  const { meetingId } = route.params;

  const { isFavorite, addFavorite, removeFavorite, updateNotes, getFavoriteNotes } =
    useFavoriteMeetings();

  const [meeting, setMeeting] = useState<CachedMeeting | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  // Load meeting details
  useEffect(() => {
    const loadMeeting = async (): Promise<void> => {
      if (!db) return;

      try {
        const meetingData = await getCachedMeetingById(db, meetingId);
        setMeeting(meetingData);

        // Check if favorited and load notes
        const favorited = isFavorite(meetingId);
        setIsFavorited(favorited);

        if (favorited) {
          const savedNotes = await getFavoriteNotes(meetingId);
          if (savedNotes) {
            setNotes(savedNotes);
          }
        }
      } catch (_error) {
        Alert.alert('Error', 'Failed to load meeting details');
      } finally {
        setIsLoading(false);
      }
    };

    loadMeeting();
  }, [db, meetingId, isFavorite, getFavoriteNotes]);

  const handleToggleFavorite = useCallback(async (): Promise<void> => {
    try {
      if (isFavorited) {
        await removeFavorite(meetingId);
        setIsFavorited(false);
        setNotes('');
      } else {
        await addFavorite(meetingId, notes || undefined);
        setIsFavorited(true);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update favorite');
    }
  }, [isFavorited, meetingId, notes, addFavorite, removeFavorite]);

  const handleSaveNotes = useCallback(async (): Promise<void> => {
    if (!isFavorited) {
      Alert.alert('Info', 'Please favorite this meeting first to save notes');
      return;
    }

    setIsSavingNotes(true);
    try {
      await updateNotes(meetingId, notes);
      Alert.alert('Success', 'Notes saved');
    } catch (_error) {
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  }, [isFavorited, meetingId, notes, updateNotes]);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!meeting) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>Meeting not found</Text>
      </View>
    );
  }

  // Parse meeting types
  let meetingTypes: string[] = [];
  try {
    meetingTypes = JSON.parse(meeting.types);
  } catch {
    meetingTypes = [];
  }

  const timeText = meeting.time ? formatMeetingTime(meeting.time) : 'Time varies';
  const dayText = meeting.day_of_week !== null ? formatDayOfWeek(meeting.day_of_week) : 'Daily';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Meeting Name */}
      <View style={styles.header}>
        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>{meeting.name}</Text>
        <Button
          variant={isFavorited ? 'danger' : 'primary'}
          onPress={handleToggleFavorite}
          accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          style={styles.favoriteButton}
        >
          <MaterialIcons
            name={isFavorited ? 'favorite' : 'favorite-border'}
            size={24}
            color="#FFFFFF"
          />
        </Button>
      </View>

      {/* Time and Day */}
      <Card style={styles.section}>
        <View style={styles.infoRow}>
          <MaterialIcons name="schedule" size={24} color={theme.colors.primary} />
          <View style={styles.infoText}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              When
            </Text>
            <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
              {dayText} at {timeText}
            </Text>
          </View>
        </View>
      </Card>

      {/* Location */}
      <Card style={styles.section}>
        <View style={styles.infoRow}>
          <MaterialIcons name="place" size={24} color={theme.colors.primary} />
          <View style={styles.infoText}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Where
            </Text>
            <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
              {meeting.location}
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              {meeting.address}
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              {meeting.city}, {meeting.state} {meeting.postal_code}
            </Text>
          </View>
        </View>
      </Card>

      {/* Meeting Types */}
      {meetingTypes.length > 0 && (
        <Card style={styles.section}>
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 12 }]}>
            Meeting Type
          </Text>
          <View style={styles.typesContainer}>
            {meetingTypes.map((type, index) => (
              <Badge key={`${type}-${index}`} variant="primary" size="medium">
                {getMeetingTypeLabel(type)}
              </Badge>
            ))}
          </View>
        </Card>
      )}

      {/* Notes */}
      {meeting.notes && (
        <Card style={styles.section}>
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 8 }]}>
            Meeting Notes
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            {meeting.notes}
          </Text>
        </Card>
      )}

      {/* Personal Notes */}
      <Card style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 12 }]}>
          Personal Notes
        </Text>
        <TextArea
          label="Personal Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder={
            isFavorited
              ? 'Add your personal notes about this meeting...'
              : 'Favorite this meeting to add personal notes'
          }
          editable={isFavorited}
          accessibilityLabel="Personal notes"
          accessibilityHint={
            isFavorited
              ? 'Enter your thoughts about this meeting'
              : 'Favorite this meeting first to add notes'
          }
        />
        {isFavorited && notes.trim() !== '' && (
          <Button
            variant="primary"
            onPress={handleSaveNotes}
            disabled={isSavingNotes}
            style={styles.saveButton}
            accessibilityLabel="Save notes"
          >
            {isSavingNotes ? 'Saving...' : 'Save Notes'}
          </Button>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  favoriteButton: {
    marginLeft: 12,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  saveButton: {
    marginTop: 12,
  },
});
