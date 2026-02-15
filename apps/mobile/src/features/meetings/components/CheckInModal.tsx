/**
 * Check-In Modal Component
 * Modal that appears when checking in to a meeting
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { ds } from '../../../design-system/tokens/ds';
import type { MeetingWithDetails } from '../types/meeting';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CheckInModalProps {
  visible: boolean;
  meeting: MeetingWithDetails | null;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<boolean | void>;
  isLoading?: boolean;
}

export function CheckInModal({
  visible,
  meeting,
  onClose,
  onConfirm,
  isLoading = false,
}: CheckInModalProps): React.ReactElement {
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const success = await onConfirm(notes.trim() || undefined);
      if (success === false) {
        return;
      }
      setNotes('');

      // Show success animation briefly
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Check-In Failed', 'Something went wrong. Please try again.');
    }
  };

  const handleClose = () => {
    setNotes('');
    setShowSuccess(false);
    onClose();
  };

  if (!meeting) return <></>;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
          onPress={!showSuccess ? handleClose : undefined}
        />

        {showSuccess ? (
          <Animated.View
            entering={ZoomIn.springify().damping(15)}
            style={styles.successContainer}
            accessibilityRole="alert"
            accessibilityLabel="Checked in successfully. Keep up the great work!"
          >
            <View style={styles.successIcon} importantForAccessibility="no-hide-descendants">
              <MaterialIcons name="check-circle" size={80} color={ds.colors.success} />
            </View>
            <Text style={styles.successText}>Checked In! 🎉</Text>
            <Text style={styles.successSubtext}>Keep up the great work!</Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContent}
          >
            <GlassCard style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer} importantForAccessibility="no-hide-descendants">
                  <MaterialIcons name="check-circle-outline" size={32} color={ds.colors.success} />
                </View>
                <Text style={styles.title} accessibilityRole="header">Check In to Meeting</Text>
                <Pressable
                  onPress={handleClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close modal"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="close" size={24} color={darkAccent.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Meeting Details */}
                <View style={styles.meetingInfo}>
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="event"
                      size={20}
                      color={darkAccent.textMuted}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <Text style={styles.meetingName}>{meeting.name}</Text>
                  </View>

                  {meeting.address && (
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="place"
                        size={20}
                        color={darkAccent.textMuted}
                        importantForAccessibility="no"
                        accessibilityElementsHidden
                      />
                      <Text style={styles.meetingAddress}>{meeting.address}</Text>
                    </View>
                  )}

                  {meeting.time && (
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="access-time"
                        size={20}
                        color={darkAccent.textMuted}
                        importantForAccessibility="no"
                        accessibilityElementsHidden
                      />
                      <Text style={styles.meetingTime}>{meeting.time}</Text>
                    </View>
                  )}
                </View>

                {/* Optional Notes */}
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Add Notes (Optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="How was the meeting? Any reflections?"
                    placeholderTextColor={darkAccent.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    textAlignVertical="top"
                    accessibilityLabel="Meeting notes"
                    accessibilityHint="Optional notes about your experience at this meeting"
                  />
                  <Text style={styles.charCount}>{notes.length} / 500</Text>
                </View>

                {/* Impact Preview */}
                <View style={styles.impactSection}>
                  <Text style={styles.impactTitle}>This check-in will:</Text>
                  <View style={styles.impactItem}>
                    <MaterialIcons
                      name="trending-up"
                      size={18}
                      color={ds.colors.success}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <Text style={styles.impactText}>Update your meeting streak</Text>
                  </View>
                  <View style={styles.impactItem}>
                    <MaterialIcons
                      name="emoji-events"
                      size={18}
                      color={ds.colors.warning}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <Text style={styles.impactText}>Count toward achievements</Text>
                  </View>
                  <View style={styles.impactItem}>
                    <MaterialIcons
                      name="star"
                      size={18}
                      color={ds.colors.accent}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <Text style={styles.impactText}>Progress your 90-in-90 challenge</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <GradientButton
                  title={isLoading ? 'Checking In...' : 'Confirm Check-In'}
                  variant="success"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                  onPress={handleConfirm}
                  accessibilityLabel="Confirm check-in"
                  accessibilityHint="Records your attendance at this meeting"
                />
                <Pressable
                  onPress={handleClose}
                  style={styles.cancelButton}
                  disabled={isLoading}
                  accessibilityLabel="Cancel check-in"
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.bgOverlay,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  card: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  title: {
    ...typography.h3,
    color: darkAccent.text,
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  scrollView: {
    maxHeight: 400,
  },
  meetingInfo: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meetingName: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
    flex: 1,
  },
  meetingAddress: {
    ...typography.body,
    color: darkAccent.textMuted,
    flex: 1,
  },
  meetingTime: {
    ...typography.body,
    color: darkAccent.textMuted,
    flex: 1,
  },
  notesSection: {
    marginBottom: spacing.xl,
  },
  notesLabel: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.md,
    color: darkAccent.text,
    ...typography.body,
    minHeight: 100,
    borderWidth: 1,
    borderColor: darkAccent.border,
  },
  charCount: {
    ...typography.caption,
    color: darkAccent.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  impactSection: {
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  impactTitle: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  impactText: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    color: darkAccent.textMuted,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successText: {
    ...typography.h2,
    color: darkAccent.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successSubtext: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
  },
});
