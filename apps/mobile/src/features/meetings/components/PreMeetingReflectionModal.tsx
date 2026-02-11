/**
 * PreMeetingReflectionModal
 *
 * Modal shown before attending a meeting.
 * Captures intention, mood, and hopes for the meeting.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { darkAccent, spacing, radius, typography } from '../../../design-system/tokens/modern';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { ds } from '../../../design-system/tokens/ds';
import { GradientButton } from '../../../design-system/components/GradientButton';
import {
  getRandomPrePrompt,
  type PreMeetingPrompts,
} from '../../../services/meetingReflectionService';

// ========================================
// Types
// ========================================

interface PreMeetingReflectionModalProps {
  visible: boolean;
  meetingName: string;
  onClose: () => void;
  onSkip?: () => void;
  onComplete: (prompts: PreMeetingPrompts) => void | Promise<void>;
}

// ========================================
// Component
// ========================================

export function PreMeetingReflectionModal({
  visible,
  meetingName,
  onClose,
  onSkip,
  onComplete,
}: PreMeetingReflectionModalProps): React.ReactElement {
  const [intention, setIntention] = useState('');
  const [mood, setMood] = useState(3);
  const [hope, setHope] = useState('');

  const intentionPrompt = getRandomPrePrompt();

  const handleSave = (): void => {
    const prompts: PreMeetingPrompts = {
      intention,
      mood,
      hope,
    };

    void onComplete(prompts);
  };

  const handleSkip = (): void => {
    if (onSkip) {
      onSkip();
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <Animated.View entering={SlideInDown.duration(400)} style={styles.modalContainer}>
          <GlassCard intensity="heavy" style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="psychology" size={32} color={darkAccent.primary} />
                </View>
                <Text style={styles.title}>Before You Go</Text>
                <Text style={styles.subtitle}>Set an intention for {meetingName}</Text>
              </View>

              {/* Mood */}
              <View style={styles.section}>
                <Text style={styles.label}>How are you feeling right now?</Text>
                <View style={styles.moodButtons}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable
                      key={value}
                      style={[styles.moodButton, mood === value && styles.moodButtonSelected]}
                      onPress={() => setMood(value)}
                      accessibilityLabel={`Mood ${value} out of 5`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.moodEmoji}>{getMoodEmoji(value)}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.moodLabels}>
                  <Text style={styles.moodLabel}>Low</Text>
                  <Text style={styles.moodLabel}>Great</Text>
                </View>
              </View>

              {/* Intention */}
              <View style={styles.section}>
                <Text style={styles.label}>{intentionPrompt}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="I want to..."
                  placeholderTextColor={darkAccent.textMuted}
                  value={intention}
                  onChangeText={setIntention}
                  multiline
                  numberOfLines={3}
                  accessibilityLabel="Intention for meeting"
                />
              </View>

              {/* Hope */}
              <View style={styles.section}>
                <Text style={styles.label}>What would make this meeting meaningful?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Connection, perspective, hope..."
                  placeholderTextColor={darkAccent.textMuted}
                  value={hope}
                  onChangeText={setHope}
                  multiline
                  numberOfLines={2}
                  accessibilityLabel="Hope for meeting"
                />
              </View>

              {/* Buttons */}
              <View style={styles.buttons}>
                <GradientButton
                  title="Save & Continue"
                  onPress={handleSave}
                  disabled={!intention.trim()}
                  accessibilityLabel="Save reflection and continue"
                />

                <Pressable
                  style={styles.skipButton}
                  onPress={handleSkip}
                  accessibilityLabel="Skip reflection"
                  accessibilityRole="button"
                >
                  <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ========================================
// Helper Functions
// ========================================

function getMoodEmoji(mood: number): string {
  const emojis = ['😔', '😕', '😐', '🙂', '😊'];
  return emojis[mood - 1] || '😐';
}

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: ds.colors.bgOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalCard: {
    padding: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ds.colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing[5],
  },
  label: {
    ...typography.label,
    color: darkAccent.text,
    marginBottom: spacing[3],
    fontWeight: '600',
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ds.colors.bgSecondary,
    borderWidth: 2,
    borderColor: ds.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: {
    backgroundColor: darkAccent.primary,
    borderColor: darkAccent.primary,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  moodLabel: {
    ...typography.caption,
    color: darkAccent.textMuted,
  },
  input: {
    backgroundColor: ds.colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing[3],
    color: darkAccent.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttons: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
  skipButton: {
    padding: spacing[3],
    alignItems: 'center',
  },
  skipText: {
    ...typography.body,
    color: darkAccent.textMuted,
    textDecorationLine: 'underline',
  },
});
