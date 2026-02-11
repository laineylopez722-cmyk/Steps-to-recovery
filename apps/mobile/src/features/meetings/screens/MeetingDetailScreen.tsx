/**
 * MeetingDetailScreen
 * Detailed view of a single meeting with favorite toggle and personal notes
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Linking,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { Button } from '../../../design-system/components/Button';
import { Badge } from '../../../design-system/components/Badge';
import { TextArea } from '../../../design-system/components/TextArea';
import { Card } from '../../../design-system/components/Card';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useFavoriteMeetings } from '../hooks/useFavoriteMeetings';
import { useMeetingCheckIns, useMeetingCheckInStatus } from '../hooks/useMeetingCheckIns';
import { CheckInModal } from '../components/CheckInModal';
import { PreMeetingReflectionModal } from '../components/PreMeetingReflectionModal';
import { PostMeetingReflectionModal } from '../components/PostMeetingReflectionModal';
import { getCachedMeetingById } from '../services/meetingCacheService';
import {
  savePreMeetingReflection,
  type PreMeetingPrompts,
} from '../../../services/meetingReflectionService';
import type { CachedMeeting } from '../types/meeting';
import { formatMeetingTime, formatDayOfWeek, getMeetingTypeLabel } from '../types/meeting';
import type { MeetingsStackScreenProps } from '../../../navigation/types';

type MeetingDetailScreenProps = MeetingsStackScreenProps<'MeetingDetail'>;

export function MeetingDetailScreen({
  route,
  navigation,
}: MeetingDetailScreenProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { db } = useDatabase();
  const { user } = useAuth();
  const { meetingId } = route.params;
  const { checkInAsync, isCheckingIn } = useMeetingCheckIns();
  const { hasCheckedIn, isLoading: isCheckInStatusLoading } = useMeetingCheckInStatus(meetingId);

  const { isFavorite, addFavorite, removeFavorite, updateNotes, getFavoriteNotes } =
    useFavoriteMeetings();

  const [meeting, setMeeting] = useState<CachedMeeting | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isPreReflectionVisible, setIsPreReflectionVisible] = useState<boolean>(false);
  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState<boolean>(false);
  const [isPostReflectionVisible, setIsPostReflectionVisible] = useState<boolean>(false);
  const [pendingPrePrompts, setPendingPrePrompts] = useState<PreMeetingPrompts | null>(null);
  const [latestCheckInId, setLatestCheckInId] = useState<string | null>(null);
  const [preMeetingMood, setPreMeetingMood] = useState<number | undefined>(undefined);
  const [shouldOpenPostReflection, setShouldOpenPostReflection] = useState<boolean>(false);

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

  const handleOpenDirections = useCallback(async (): Promise<void> => {
    if (!meeting) return;

    const query = [meeting.address, meeting.city, meeting.state, meeting.postal_code]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!query) {
      Alert.alert('Unavailable', 'Address details are missing for this meeting.');
      return;
    }

    const encoded = encodeURIComponent(query);
    const url = `https://maps.google.com/?q=${encoded}`;

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unavailable', 'Could not open maps on this device.');
      return;
    }

    await Linking.openURL(url);
  }, [meeting]);

  const handleShareMeeting = useCallback(async (): Promise<void> => {
    if (!meeting) return;

    const summary = [
      meeting.name,
      meeting.address,
      [meeting.city, meeting.state].filter(Boolean).join(', '),
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({
      message: `Meeting details:\n${summary}`,
    });
  }, [meeting]);

  const meetingForCheckIn = useMemo(() => {
    if (!meeting) {
      return null;
    }

    return {
      ...meeting,
      is_favorite: isFavorited,
      distance_miles: null as number | null,
    };
  }, [meeting, isFavorited]);

  const handleOpenFavorites = useCallback((): void => {
    navigation.navigate('FavoriteMeetings');
  }, [navigation]);

  const handleStartCheckInFlow = useCallback((): void => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to check in to meetings.');
      return;
    }

    if (hasCheckedIn) {
      Alert.alert('Already checked in', 'You have already checked in to this meeting today.');
      return;
    }

    setPendingPrePrompts(null);
    setLatestCheckInId(null);
    setPreMeetingMood(undefined);
    setShouldOpenPostReflection(false);
    setIsPreReflectionVisible(true);
  }, [user, hasCheckedIn]);

  const handlePreReflectionComplete = useCallback((prompts: PreMeetingPrompts): void => {
    setPendingPrePrompts(prompts);
    setPreMeetingMood(prompts.mood);
    setIsPreReflectionVisible(false);
    setIsCheckInModalVisible(true);
  }, []);

  const handlePreReflectionSkip = useCallback((): void => {
    setPendingPrePrompts(null);
    setPreMeetingMood(undefined);
    setIsPreReflectionVisible(false);
    setIsCheckInModalVisible(true);
  }, []);

  const handleCheckInConfirm = useCallback(
    async (checkInNotes?: string): Promise<boolean> => {
      if (!meeting || !user) {
        Alert.alert('Unable to check in', 'Meeting data is unavailable right now.');
        return false;
      }

      try {
        const checkInResult = await checkInAsync({
          meetingId: meeting.id,
          meetingName: meeting.name?.trim() || 'Recovery meeting',
          meetingAddress: meeting.address || undefined,
          checkInType: 'manual',
          notes: checkInNotes,
        });

        if (!checkInResult?.checkIn?.id) {
          Alert.alert('Check-in failed', 'Please try again.');
          return false;
        }

        setLatestCheckInId(checkInResult.checkIn.id);
        setShouldOpenPostReflection(true);

        if (pendingPrePrompts) {
          const preSaveResult = await savePreMeetingReflection(
            user.id,
            checkInResult.checkIn.id,
            pendingPrePrompts,
          );

          if (!preSaveResult.success) {
            Alert.alert(
              'Partial save',
              'Check-in was saved, but we could not save your pre-meeting reflection.',
            );
          }
        }

        if (checkInResult.newAchievements.length > 0) {
          const achievementCount = checkInResult.newAchievements.length;
          Alert.alert(
            'Achievement unlocked',
            `You unlocked ${achievementCount} achievement${achievementCount === 1 ? '' : 's'}!`,
          );
        }

        setPendingPrePrompts(null);
        return true;
      } catch (_error) {
        Alert.alert('Check-in failed', 'Please try again.');
        return false;
      }
    },
    [checkInAsync, meeting, pendingPrePrompts, user],
  );

  const handleCheckInModalClose = useCallback((): void => {
    setIsCheckInModalVisible(false);

    if (shouldOpenPostReflection && latestCheckInId) {
      setShouldOpenPostReflection(false);
      setIsPostReflectionVisible(true);
      return;
    }

    setShouldOpenPostReflection(false);
  }, [latestCheckInId, shouldOpenPostReflection]);

  const handlePostReflectionComplete = useCallback((): void => {
    setIsPostReflectionVisible(false);
    setLatestCheckInId(null);
    Alert.alert('Reflection saved', 'Great work showing up for your recovery today.');
  }, []);

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
  const meetingName = meeting.name?.trim() || 'Unnamed meeting';
  const meetingLocation = meeting.location?.trim() || 'Location details unavailable';
  const meetingAddress = meeting.address?.trim() || 'Address unavailable';
  const meetingCityState = [meeting.city, meeting.state, meeting.postal_code]
    .filter(Boolean)
    .join(' ');
  const meetingCityStateLine = meetingCityState || 'City details unavailable';

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Meeting Name */}
        <View style={styles.header}>
          <Text style={[theme.typography.h1, { color: theme.colors.text, flex: 1 }]}>
            {meetingName}
          </Text>
          <Pressable
            onPress={() => void handleToggleFavorite()}
            accessibilityRole="button"
            accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityHint={
              isFavorited
                ? 'Removes this meeting from your favorites list'
                : 'Adds this meeting to your favorites list'
            }
            accessibilityState={{ selected: isFavorited }}
            style={({ pressed }) => [
              styles.favoriteIconButton,
              {
                backgroundColor: isFavorited ? theme.colors.danger : theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialIcons
              name={isFavorited ? 'favorite' : 'favorite-border'}
              size={22}
              color={isFavorited ? ds.semantic.text.onDark : theme.colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Button
            variant="primary"
            onPress={() => void handleOpenDirections()}
            style={styles.actionButton}
            accessibilityLabel="Get directions"
            accessibilityHint="Opens maps with directions to this meeting location"
          >
            Directions
          </Button>
          <Button
            variant="outline"
            onPress={() => void handleShareMeeting()}
            style={styles.actionButton}
            accessibilityLabel="Share meeting"
            accessibilityHint="Opens share sheet to share meeting details with others"
          >
            Share
          </Button>
        </View>

        <View style={styles.actionRow}>
          <Button
            variant="outline"
            onPress={handleOpenFavorites}
            style={styles.actionButton}
            accessibilityLabel="View favorite meetings"
            accessibilityHint="Opens your saved meetings list"
          >
            Favorites
          </Button>
          <Button
            variant="primary"
            onPress={handleStartCheckInFlow}
            disabled={isCheckInStatusLoading || hasCheckedIn || isCheckingIn}
            style={styles.actionButton}
            accessibilityLabel={hasCheckedIn ? 'Already checked in today' : 'Check in to meeting'}
            accessibilityHint={
              hasCheckedIn
                ? 'You have already checked in to this meeting today'
                : 'Start pre-meeting reflection and check in flow'
            }
            accessibilityState={{
              disabled: isCheckInStatusLoading || hasCheckedIn || isCheckingIn,
            }}
          >
            {isCheckingIn ? 'Checking In...' : hasCheckedIn ? 'Checked In Today' : 'Check In'}
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
                {meetingLocation}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                {meetingAddress}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                {meetingCityStateLine}
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

      <PreMeetingReflectionModal
        visible={isPreReflectionVisible}
        meetingName={meetingName}
        onClose={() => setIsPreReflectionVisible(false)}
        onSkip={handlePreReflectionSkip}
        onComplete={handlePreReflectionComplete}
      />

      <CheckInModal
        visible={isCheckInModalVisible}
        meeting={meetingForCheckIn}
        onClose={handleCheckInModalClose}
        onConfirm={handleCheckInConfirm}
        isLoading={isCheckingIn}
      />

      <PostMeetingReflectionModal
        visible={isPostReflectionVisible && !!latestCheckInId}
        userId={user?.id ?? ''}
        checkinId={latestCheckInId ?? ''}
        meetingName={meetingName}
        preMood={preMeetingMood}
        onClose={() => {
          setIsPostReflectionVisible(false);
          setLatestCheckInId(null);
        }}
        onComplete={handlePostReflectionComplete}
      />
    </>
  );
}

const createStyles = (ds: DS) =>
  ({
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
      marginBottom: 12,
      gap: 12,
    },
    favoriteIconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
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
  }) as const;
