/**
 * Evening Reflection Screen
 * 
 * End of day check-in.
 * Reflection, gratitude, mood, craving.
 */

import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useCreateCheckIn, useTodayCheckIns } from '../hooks/useCheckIns';
import { AnimatedCheckmark } from '../../../design-system/components';
import { hapticSuccess, hapticSelection, hapticWarning } from '../../../utils/haptics';
import { ds, palette } from '../../../design-system/tokens/ds';

interface Props {
  userId: string;
}

export function EveningPulseScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation();
  const { createCheckIn, isPending } = useCreateCheckIn(userId);
  const { morning } = useTodayCheckIns(userId);

  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [mood, setMood] = useState(3);
  const [craving, setCraving] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleMood = useCallback((val: number) => {
    if (val !== mood) {
      hapticSelection();
      setMood(val);
    }
  }, [mood]);

  const handleCraving = useCallback((val: number) => {
    if (val !== craving) {
      hapticSelection();
      if (val >= 7 && craving < 7) hapticWarning();
      setCraving(val);
    }
  }, [craving]);

  const handleSubmit = async () => {
    if (!reflection.trim() || isPending) return;
    
    try {
      await createCheckIn({
        type: 'evening',
        reflection: reflection.trim(),
        gratitude: gratitude.trim() || undefined,
        mood,
        craving,
      });
      hapticSuccess();
      setShowSuccess(true);
    } catch {}
  };

  const handleDone = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  const getCravingColor = (v: number) => {
    if (v <= 3) return ds.colors.success;
    if (v <= 6) return ds.colors.warning;
    return ds.colors.error;
  };

  const canSubmit = reflection.trim().length > 0 && !isPending;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Feather name="x" size={ds.sizes.iconLg} color={ds.colors.textSecondary} />
            </Pressable>
            
            <Text style={styles.headerTitle}>Evening</Text>
            
            <Pressable 
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
            >
              <Text style={[styles.saveBtnText, !canSubmit && styles.saveBtnTextDisabled]}>
                Save
              </Text>
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </Animated.View>

            {/* Morning Reminder */}
            {morning?.intention && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.reminder}>
                <Text style={styles.reminderLabel}>This morning:</Text>
                <Text style={styles.reminderText}>"{morning.intention}"</Text>
              </Animated.View>
            )}

            {/* Reflection */}
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <Text style={styles.label}>How did today go?</Text>
              <TextInput
                style={styles.input}
                value={reflection}
                onChangeText={setReflection}
                placeholder="Today was..."
                placeholderTextColor={ds.colors.textQuaternary}
                multiline
                autoFocus
                scrollEnabled={false}
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Gratitude */}
            <Animated.View entering={FadeIn.delay(150).duration(400)}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Gratitude</Text>
                <Text style={styles.optional}>optional</Text>
              </View>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                value={gratitude}
                onChangeText={setGratitude}
                placeholder="I'm grateful for..."
                placeholderTextColor={ds.colors.textQuaternary}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Mood */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Text style={styles.label}>Mood</Text>
              <View style={styles.moodTrack}>
                {[1, 2, 3, 4, 5].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => handleMood(m)}
                    style={[
                      styles.moodDot,
                      mood >= m && styles.moodDotActive,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.trackLabels}>
                <Text style={styles.trackLabelText}>Low</Text>
                <Text style={styles.trackLabelText}>Great</Text>
              </View>
            </Animated.View>

            {/* Craving */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.cravingSection}>
              <View style={styles.cravingHeader}>
                <Text style={styles.label}>Craving</Text>
                <Text style={[styles.cravingValue, { color: getCravingColor(craving) }]}>
                  {craving}
                </Text>
              </View>
              <View style={styles.cravingTrack}>
                {[...Array(11)].map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handleCraving(i)}
                    style={[
                      styles.cravingDot,
                      craving >= i && { backgroundColor: getCravingColor(i) },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.trackLabels}>
                <Text style={styles.trackLabelText}>None</Text>
                <Text style={styles.trackLabelText}>Intense</Text>
              </View>
            </Animated.View>

            <View style={{ height: ds.space[16] }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <AnimatedCheckmark 
              size={64} 
              color={ds.colors.success} 
              onAnimationComplete={handleDone} 
            />
            <Text style={styles.modalTitle}>Day complete</Text>
            <Text style={styles.modalSub}>Rest well</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ds.sizes.headerHeight,
    paddingHorizontal: ds.sizes.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.divider,
  },
  headerBtn: {
    width: ds.sizes.touchMin,
    height: ds.sizes.touchMin,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -ds.space[2],
  },
  headerTitle: {
    ...ds.typography.body,
    fontWeight: ds.fontWeight.semibold,
    color: ds.colors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    backgroundColor: ds.colors.accent,
    borderRadius: ds.radius.sm,
  },
  saveBtnDisabled: {
    backgroundColor: ds.colors.bgTertiary,
  },
  saveBtnText: {
    ...ds.typography.bodySm,
    fontWeight: ds.fontWeight.semibold,
    color: ds.colors.bgPrimary,
  },
  saveBtnTextDisabled: {
    color: ds.colors.textQuaternary,
  },

  // Content
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.sizes.contentPadding,
    paddingTop: ds.space[6],
  },

  date: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginBottom: ds.space[6],
  },

  reminder: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.md,
    padding: ds.space[4],
    marginBottom: ds.space[6],
  },
  reminderLabel: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginBottom: ds.space[1],
  },
  reminderText: {
    ...ds.typography.bodySm,
    color: ds.colors.textSecondary,
    fontStyle: 'italic',
  },

  label: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.space[3],
  },
  optional: {
    ...ds.typography.micro,
    color: ds.colors.textQuaternary,
  },

  input: {
    ...ds.typography.h3,
    color: ds.colors.textPrimary,
    minHeight: 100,
    marginBottom: ds.space[6],
  },

  divider: {
    height: 1,
    backgroundColor: ds.colors.divider,
    marginVertical: ds.space[4],
  },

  // Mood
  moodTrack: {
    flexDirection: 'row',
    gap: ds.space[2],
    marginBottom: ds.space[2],
  },
  moodDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.bgTertiary,
  },
  moodDotActive: {
    backgroundColor: ds.colors.accent,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ds.space[6],
  },
  trackLabelText: {
    ...ds.typography.micro,
    color: ds.colors.textQuaternary,
  },

  // Craving
  cravingSection: {
    marginTop: ds.space[2],
  },
  cravingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.space[3],
  },
  cravingValue: {
    ...ds.typography.h2,
    fontWeight: ds.fontWeight.bold,
  },
  cravingTrack: {
    flexDirection: 'row',
    gap: ds.space[1],
    marginBottom: ds.space[2],
  },
  cravingDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.bgTertiary,
  },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.xl,
    paddingVertical: ds.space[12],
    paddingHorizontal: ds.space[10],
    alignItems: 'center',
    minWidth: 240,
  },
  modalTitle: {
    ...ds.typography.h2,
    color: ds.colors.textPrimary,
    marginTop: ds.space[6],
  },
  modalSub: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    marginTop: ds.space[2],
  },
});
