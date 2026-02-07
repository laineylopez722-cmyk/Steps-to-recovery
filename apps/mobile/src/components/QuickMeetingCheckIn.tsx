/**
 * QuickMeetingCheckIn Component
 *
 * Simple button to check in to a meeting and show reflection modals.
 * Use on HomeScreen for quick access.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { MeetingCheckIn } from '../services/meetingCheckInService';
import { darkAccent, spacing, radius, typography } from '../design-system/tokens/modern';
import { GlassCard } from '../design-system/components/GlassCard';
import { GradientButton } from '../design-system/components/GradientButton';
import { PreMeetingReflectionModal } from '../features/meetings/components/PreMeetingReflectionModal';
import { PostMeetingReflectionModal } from '../features/meetings/components/PostMeetingReflectionModal';
import { checkInToMeeting } from '../services/meetingCheckInService';

interface QuickMeetingCheckInProps {
  userId: string;
}

export function QuickMeetingCheckIn({ userId }: QuickMeetingCheckInProps): React.ReactElement {
  const [showCheckInInput, setShowCheckInInput] = useState(false);
  const [meetingName, setMeetingName] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const [showPreModal, setShowPreModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [currentCheckin, setCurrentCheckin] = useState<MeetingCheckIn | null>(null);
  const [_preMood, _setPreMood] = useState<number | undefined>();

  const handleQuickCheckIn = async () => {
    if (!meetingName.trim()) {
      Alert.alert('Meeting Name Required', 'Please enter the meeting name');
      return;
    }

    setIsChecking(true);

    try {
      const result = await checkInToMeeting(userId, {
        meetingName: meetingName.trim(),
        checkInType: 'manual',
      });

      if (result && result.checkIn) {
        setCurrentCheckin(result.checkIn);
        setShowCheckInInput(false);
        setShowPreModal(true);

        // Show achievement if any
        if (result.newAchievements.length > 0) {
          Alert.alert(
            '🎉 Achievement Unlocked!',
            `You earned: ${result.newAchievements.join(', ')}`,
          );
        }
      } else {
        Alert.alert('Error', 'Could not check in. Please try again.');
      }
    } catch (_error) {
      Alert.alert('Error', 'Unexpected error during check-in');
    } finally {
      setIsChecking(false);
    }
  };

  const handlePreComplete = () => {
    setShowPreModal(false);
    // Store pre-mood for post-modal
    // In real implementation, fetch from reflection service
  };

  const handleShowPostModal = () => {
    setShowPostModal(true);
  };

  if (showCheckInInput) {
    return (
      <GlassCard intensity="medium">
        <View style={styles.checkInInputContainer}>
          <Text style={styles.inputLabel}>Meeting Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Thursday Night Group"
            placeholderTextColor={darkAccent.textMuted}
            value={meetingName}
            onChangeText={setMeetingName}
            autoFocus
          />
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setShowCheckInInput(false);
                setMeetingName('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <GradientButton
              title={isChecking ? 'Checking In...' : 'Check In'}
              onPress={handleQuickCheckIn}
              disabled={isChecking || !meetingName.trim()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <View>
      <Pressable
        style={styles.checkInButton}
        onPress={() => setShowCheckInInput(true)}
        accessibilityLabel="Check in to meeting"
        accessibilityRole="button"
      >
        <View style={styles.checkInIcon}>
          <MaterialIcons name="check-circle" size={24} color={darkAccent.success} />
        </View>
        <View style={styles.checkInContent}>
          <Text style={styles.checkInTitle}>Check In to Meeting</Text>
          <Text style={styles.checkInSubtitle}>Track attendance & earn badges</Text>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={darkAccent.textMuted} />
      </Pressable>

      {/* For testing post-modal */}
      {currentCheckin && (
        <Pressable
          style={[styles.checkInButton, { marginTop: spacing[2], opacity: 0.6 }]}
          onPress={handleShowPostModal}
        >
          <Text style={styles.checkInSubtitle}>Test: Show Post-Meeting Modal</Text>
        </Pressable>
      )}

      {/* Pre-Meeting Modal */}
      {currentCheckin && (
        <PreMeetingReflectionModal
          visible={showPreModal}
          userId={userId}
          checkinId={currentCheckin.id}
          meetingName={currentCheckin.meetingName || meetingName}
          onClose={() => setShowPreModal(false)}
          onComplete={handlePreComplete}
        />
      )}

      {/* Post-Meeting Modal */}
      {currentCheckin && (
        <PostMeetingReflectionModal
          visible={showPostModal}
          userId={userId}
          checkinId={currentCheckin.id}
          meetingName={currentCheckin.meetingName || meetingName}
          preMood={_preMood}
          onClose={() => setShowPostModal(false)}
          onComplete={() => {
            setShowPostModal(false);
            setCurrentCheckin(null);
            setMeetingName('');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    gap: spacing[3],
  },
  checkInIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(52,211,153,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInContent: {
    flex: 1,
  },
  checkInTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  checkInSubtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
    fontSize: 14,
  },
  checkInInputContainer: {
    gap: spacing[3],
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkAccent.text,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    padding: spacing[3],
    color: darkAccent.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    ...typography.body,
    color: darkAccent.textMuted,
    fontWeight: '600',
  },
});
