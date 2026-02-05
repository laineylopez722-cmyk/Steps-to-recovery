/**
 * PATCH: Add Check-In Button to Meeting Finder
 * 
 * This file documents the changes needed to integrate check-in functionality
 * into the existing MeetingFinderScreenModern.tsx
 */

// ============================================
// STEP 1: Add Imports (at top of file)
// ============================================

// Add these imports:
import { CheckInModal } from '../components/CheckInModal';
import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { useMeetingCheckIns } from '../hooks/useMeetingCheckIns';
import { useMeetingCheckInStatus } from '../hooks/useMeetingCheckIns';
import { useAuth } from '../../../contexts/AuthContext';

// ============================================
// STEP 2: Add State (after existing useState declarations)
// ============================================

const { user } = useAuth();
const { checkIn, isCheckingIn, lastCheckInResult } = useMeetingCheckIns();

const [checkInModalVisible, setCheckInModalVisible] = useState(false);
const [selectedMeetingForCheckIn, setSelectedMeetingForCheckIn] = useState<MeetingWithDetails | null>(null);
const [showAchievementModal, setShowAchievementModal] = useState(false);
const [unlockedAchievement, setUnlockedAchievement] = useState<string | null>(null);

// ============================================
// STEP 3: Add Check-In Handler (after handleMeetingPress)
// ============================================

const handleCheckInPress = useCallback((meeting: MeetingWithDetails) => {
  setSelectedMeetingForCheckIn(meeting);
  setCheckInModalVisible(true);
}, []);

const handleCheckInConfirm = useCallback(async (notes?: string) => {
  if (!selectedMeetingForCheckIn || !user) return;

  checkIn({
    meetingId: selectedMeetingForCheckIn.id,
    meetingName: selectedMeetingForCheckIn.name || selectedMeetingForCheckIn.meeting_name,
    meetingAddress: selectedMeetingForCheckIn.address || selectedMeetingForCheckIn.location_name,
    checkInType: 'manual',
    latitude: selectedMeetingForCheckIn.latitude,
    longitude: selectedMeetingForCheckIn.longitude,
    notes,
  });

  // Check for new achievements
  setTimeout(() => {
    if (lastCheckInResult?.newAchievements && lastCheckInResult.newAchievements.length > 0) {
      setUnlockedAchievement(lastCheckInResult.newAchievements[0]);
      setShowAchievementModal(true);
    }
  }, 1000);
}, [selectedMeetingForCheckIn, user, checkIn, lastCheckInResult]);

// ============================================
// STEP 4: Update renderMeetingItem (replace existing function)
// ============================================

const renderMeetingItem = ({ item, index }: { item: MeetingWithDetails; index: number }) => {
  const icon = MEETING_TYPE_ICONS[item.meeting_type] || MEETING_TYPE_ICONS.default;
  const color = MEETING_TYPE_COLORS[item.meeting_type] || MEETING_TYPE_COLORS.default;
  
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
      <GlassCard style={{ marginBottom: spacing[2] }}>
        <Pressable
          onPress={() => handleMeetingPress(item)}
          style={{ padding: spacing[3] }}
          accessibilityLabel={`${item.name} meeting`}
          accessibilityRole="button"
        >
          {/* Meeting Icon */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[2] }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${color}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing[2],
              }}
            >
              <MaterialIcons name={icon as any} size={24} color={color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...typography.body,
                  fontWeight: '600',
                  color: darkAccent.text.primary,
                  marginBottom: spacing[0.5],
                }}
              >
                {item.name || item.meeting_name}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: darkAccent.text.secondary,
                }}
              >
                {item.meeting_type} • {formatTime(item.start_time || item.time)}
              </Text>
            </View>

            {item.is_favorite && (
              <MaterialIcons name="favorite" size={20} color={darkAccent.error} />
            )}
          </View>

          {/* Location */}
          {(item.location_name || item.address) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
              <MaterialIcons
                name="place"
                size={16}
                color={darkAccent.text.secondary}
                style={{ marginRight: spacing[1] }}
              />
              <Text
                style={{
                  ...typography.caption,
                  color: darkAccent.text.secondary,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.location_name || item.address}
                {item.distance && ` • ${formatDistance(item.distance)}`}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Check-In Button */}
        <View style={{ paddingHorizontal: spacing[3], paddingBottom: spacing[3] }}>
          <GradientButton
            title="Check In"
            icon={<MaterialIcons name="check-circle" size={20} color="#FFFFFF" />}
            iconPosition="left"
            variant="success"
            size="sm"
            fullWidth
            onPress={() => handleCheckInPress(item)}
            accessibilityLabel="Check in to this meeting"
            accessibilityHint="Records your attendance and updates your streak"
          />
        </View>
      </GlassCard>
    </Animated.View>
  );
};

// ============================================
// STEP 5: Add Modals (before closing return tag)
// ============================================

// Add these components just before the final </View> closing tag:

<CheckInModal
  visible={checkInModalVisible}
  meeting={selectedMeetingForCheckIn}
  onClose={() => setCheckInModalVisible(false)}
  onConfirm={handleCheckInConfirm}
  isLoading={isCheckingIn}
/>

<AchievementUnlockModal
  visible={showAchievementModal}
  achievementKey={unlockedAchievement}
  onClose={() => setShowAchievementModal(false)}
  onViewAll={() => {
    setShowAchievementModal(false);
    navigation.navigate('Achievements' as never);
  }}
/>

// ============================================
// NOTES FOR IMPLEMENTATION:
// ============================================

/*
1. The GlassListItem component doesn't provide enough flexibility for the check-in button,
   so we're replacing it with a custom card layout using GlassCard and Pressable.

2. The check-in button should appear below the meeting information, taking full width.

3. After successful check-in:
   - Modal closes automatically
   - Check-ins list refreshes (handled by React Query)
   - If achievements unlocked, show celebration modal

4. Consider adding a check to disable the button if user already checked in today
   (use useMeetingCheckInStatus hook)

5. Optional enhancement: Add a small badge showing "Checked In ✓" if already checked in
*/
