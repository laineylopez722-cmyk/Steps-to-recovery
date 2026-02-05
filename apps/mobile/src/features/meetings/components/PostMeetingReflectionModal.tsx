/**
 * PostMeetingReflectionModal
 * 
 * Modal shown after attending a meeting.
 * Captures key takeaway, mood change, gratitude, and application plans.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { darkAccent, spacing, radius, typography } from '../../../design-system/tokens/modern';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import {
  savePostMeetingReflection,
  getRandomPostPrompt,
  type PostMeetingPrompts,
} from '../../../services/meetingReflectionService';

// ========================================
// Types
// ========================================

interface PostMeetingReflectionModalProps {
  visible: boolean;
  userId: string;
  checkinId: string;
  meetingName: string;
  preMood?: number; // For showing mood lift
  onClose: () => void;
  onComplete: () => void;
}

// ========================================
// Component
// ========================================

export function PostMeetingReflectionModal({
  visible,
  userId,
  checkinId,
  meetingName,
  preMood,
  onClose,
  onComplete,
}: PostMeetingReflectionModalProps): React.ReactElement {
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [mood, setMood] = useState(3);
  const [gratitude, setGratitude] = useState('');
  const [willApply, setWillApply] = useState('');
  const [saving, setSaving] = useState(false);
  
  const takeawayPrompt = getRandomPostPrompt();
  
  const moodLift = preMood ? mood - preMood : null;
  
  const handleSave = async (): Promise<void> => {
    setSaving(true);
    
    const prompts: PostMeetingPrompts = {
      keyTakeaway,
      mood,
      gratitude,
      willApply,
    };
    
    const result = await savePostMeetingReflection(userId, checkinId, prompts);
    
    setSaving(false);
    
    if (result.success) {
      onComplete();
    }
  };
  
  const handleSkip = (): void => {
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        
        <Animated.View
          entering={SlideInDown.duration(400)}
          style={styles.modalContainer}
        >
          <GlassCard intensity="heavy" style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="favorite" size={32} color={darkAccent.success} />
                </View>
                <Text style={styles.title}>How Was It?</Text>
                <Text style={styles.subtitle}>
                  Reflect on {meetingName}
                </Text>
              </View>
              
              {/* Mood */}
              <View style={styles.section}>
                <Text style={styles.label}>How are you feeling now?</Text>
                <View style={styles.moodButtons}>
                  {[1, 2, 3, 4, 5].map(value => (
                    <Pressable
                      key={value}
                      style={[
                        styles.moodButton,
                        mood === value && styles.moodButtonSelected,
                      ]}
                      onPress={() => setMood(value)}
                      accessibilityLabel={`Mood ${value} out of 5`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.moodEmoji}>
                        {getMoodEmoji(value)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.moodLabels}>
                  <Text style={styles.moodLabel}>Low</Text>
                  <Text style={styles.moodLabel}>Great</Text>
                </View>
                
                {/* Mood Lift Indicator */}
                {moodLift !== null && moodLift !== 0 && (
                  <View style={styles.moodLiftContainer}>
                    <MaterialIcons
                      name={moodLift > 0 ? 'trending-up' : 'trending-down'}
                      size={20}
                      color={moodLift > 0 ? darkAccent.success : darkAccent.error}
                    />
                    <Text
                      style={[
                        styles.moodLiftText,
                        { color: moodLift > 0 ? darkAccent.success : darkAccent.error },
                      ]}
                    >
                      {moodLift > 0 ? '+' : ''}{moodLift} from before meeting
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Key Takeaway */}
              <View style={styles.section}>
                <Text style={styles.label}>{takeawayPrompt}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="The main thing I'm taking away is..."
                  placeholderTextColor={darkAccent.text.secondary}
                  value={keyTakeaway}
                  onChangeText={setKeyTakeaway}
                  multiline
                  numberOfLines={3}
                  accessibilityLabel="Key takeaway from meeting"
                />
              </View>
              
              {/* Gratitude */}
              <View style={styles.section}>
                <Text style={styles.label}>What are you grateful for?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="I'm grateful for..."
                  placeholderTextColor={darkAccent.text.secondary}
                  value={gratitude}
                  onChangeText={setGratitude}
                  multiline
                  numberOfLines={2}
                  accessibilityLabel="Gratitude"
                />
              </View>
              
              {/* Application */}
              <View style={styles.section}>
                <Text style={styles.label}>What will you apply this week?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="One thing I'll try..."
                  placeholderTextColor={darkAccent.text.secondary}
                  value={willApply}
                  onChangeText={setWillApply}
                  multiline
                  numberOfLines={2}
                  accessibilityLabel="What you will apply"
                />
              </View>
              
              {/* Buttons */}
              <View style={styles.buttons}>
                <GradientButton
                  title={saving ? 'Saving...' : 'Save Reflection'}
                  onPress={handleSave}
                  disabled={saving || !keyTakeaway.trim()}
                  accessibilityLabel="Save post-meeting reflection"
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    backgroundColor: 'rgba(52,211,153,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    ...typography.h2,
    color: darkAccent.text.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.body,
    color: darkAccent.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing[5],
  },
  label: {
    ...typography.label,
    color: darkAccent.text.primary,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: {
    backgroundColor: darkAccent.success,
    borderColor: darkAccent.success,
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
    color: darkAccent.text.secondary,
  },
  moodLiftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[2],
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderRadius: radius.md,
  },
  moodLiftText: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    padding: spacing[3],
    color: darkAccent.text.primary,
    ...typography.body,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: darkAccent.text.secondary,
    textDecorationLine: 'underline',
  },
});
