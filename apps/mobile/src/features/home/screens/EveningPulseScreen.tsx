/**
 * Evening Reflection Screen
 *
 * End of day check-in.
 * Reflection, gratitude, mood, craving.
 */

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation as useTypedNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/types';
import { useCreateCheckIn, useTodayCheckIns } from '../hooks/useCheckIns';
import { AnimatedCheckmark } from '../../../design-system/components';
import { hapticSuccess, hapticSelection, hapticWarning } from '../../../utils/haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { extractMemories } from '../../journal/utils/memoryExtraction';
import { useMemoryStore } from '../../../hooks/useMemoryStore';

interface Props {
  userId: string;
}

export function EveningPulseScreen({ userId }: Props): React.ReactElement {
  const navigation = useTypedNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { createCheckIn, isPending } = useCreateCheckIn(userId);
  const { morning } = useTodayCheckIns(userId);
  const memoryStore = useMemoryStore(userId);

  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [mood, setMood] = useState(3);
  const [craving, setCraving] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCravingSupport, setShowCravingSupport] = useState(false);

  const handleMood = useCallback(
    (val: number) => {
      if (val !== mood) {
        hapticSelection();
        setMood(val);
      }
    },
    [mood],
  );

  const handleCraving = useCallback(
    (val: number) => {
      if (val !== craving) {
        hapticSelection();
        if (val >= 7 && craving < 7) hapticWarning();
        setCraving(val);
      }
    },
    [craving],
  );

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

      // High craving → show gentle support nudge instead of generic success
      if (craving >= 7) {
        setShowCravingSupport(true);
      } else {
        setShowSuccess(true);
      }

      // Extract memories for AI companion (async)
      const content = [reflection.trim(), gratitude.trim()].filter(Boolean).join(' ');
      extractMemories(content, userId)
        .then((memories) => {
          if (memories.length > 0) {
            memoryStore.addMemories(memories);
          }
        })
        .catch(() => {});
    } catch {
      Alert.alert('Couldn\u2019t save', 'Your reflection wasn\u2019t saved. Please try again.');
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  const handleSupportDismiss = () => {
    setShowCravingSupport(false);
    navigation.goBack();
  };

  const handleCravingSurf = () => {
    setShowCravingSupport(false);
    navigation.replace('CravingSurf');
  };

  const handleEmergency = () => {
    setShowCravingSupport(false);
    navigation.replace('Emergency');
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
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Close evening reflection"
              accessibilityHint="Returns to home screen"
            >
              <Feather name="x" size={ds.sizes.iconLg} color={ds.colors.textSecondary} />
            </Pressable>

            <Text style={styles.headerTitle}>Evening</Text>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Save evening reflection"
              accessibilityState={{ disabled: !canSubmit }}
              accessibilityHint="Saves your reflection, gratitude, mood, and craving level"
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
                  day: 'numeric',
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
                accessibilityLabel="Evening reflection input"
                accessibilityHint="Describe how your day went"
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
                accessibilityLabel="Gratitude input"
                accessibilityHint="Optional: What are you grateful for today?"
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
                    style={[styles.moodDot, mood >= m && styles.moodDotActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Set mood level ${m} of 5`}
                    accessibilityState={{ selected: mood === m }}
                    accessibilityHint="Tap to select this mood level"
                  />
                ))}
              </View>
              <View style={styles.trackLabels}>
                <Text style={styles.trackLabelText}>Low</Text>
                <Text style={styles.trackLabelText}>Great</Text>
              </View>
            </Animated.View>

            {/* Craving */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(400)}
              style={styles.cravingSection}
            >
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
                    accessibilityRole="button"
                    accessibilityLabel={`Set craving level ${i} of 10`}
                    accessibilityState={{ selected: craving === i }}
                    accessibilityHint={
                      i >= 7
                        ? 'High craving level - consider emergency support'
                        : 'Tap to select this craving level'
                    }
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

      {/* High Craving Support Modal */}
      <Modal visible={showCravingSupport} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.supportCard}>
            <View style={styles.supportIconRow}>
              <Feather name="heart" size={28} color={ds.colors.accent} />
            </View>
            <Text style={styles.supportTitle}>Saved</Text>
            <Text style={styles.supportSub}>
              Your craving is high right now.{'\n'}Support is here if you need it.
            </Text>

            <Pressable
              onPress={handleCravingSurf}
              style={styles.supportBtn}
              accessibilityRole="button"
              accessibilityLabel="Try craving surf exercise"
            >
              <Feather name="wind" size={18} color={ds.colors.bgPrimary} />
              <Text style={styles.supportBtnText}>Craving Surf</Text>
            </Pressable>

            <Pressable
              onPress={handleEmergency}
              style={styles.supportBtnSecondary}
              accessibilityRole="button"
              accessibilityLabel="Get emergency support"
            >
              <Feather name="phone" size={18} color={ds.colors.accent} />
              <Text style={styles.supportBtnSecondaryText}>Emergency Support</Text>
            </Pressable>

            <Pressable
              onPress={handleSupportDismiss}
              style={styles.supportDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss and go back"
            >
              <Text style={styles.supportDismissText}>I'm okay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
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
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      height: ds.sizes.headerHeight,
      paddingHorizontal: ds.sizes.contentPadding,
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.divider,
    },
    headerBtn: {
      width: ds.sizes.touchMin,
      height: ds.sizes.touchMin,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
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
      fontStyle: 'italic' as const,
    },

    label: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      marginBottom: ds.space[3],
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    labelRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
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
      flexDirection: 'row' as const,
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
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
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
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[3],
    },
    cravingValue: {
      ...ds.typography.h2,
      fontWeight: ds.fontWeight.bold,
    },
    cravingTrack: {
      flexDirection: 'row' as const,
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
      backgroundColor: ds.semantic.surface.overlayModal,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    modalCard: {
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.xl,
      paddingVertical: ds.space[12],
      paddingHorizontal: ds.space[10],
      alignItems: 'center' as const,
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

    // Support Modal (high craving)
    supportCard: {
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.xl,
      paddingVertical: ds.space[8],
      paddingHorizontal: ds.space[6],
      alignItems: 'center' as const,
      minWidth: 280,
      maxWidth: 320,
    },
    supportIconRow: {
      marginBottom: ds.space[3],
    },
    supportTitle: {
      ...ds.typography.h2,
      color: ds.colors.textPrimary,
    },
    supportSub: {
      ...ds.typography.bodySm,
      color: ds.colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: ds.space[2],
      marginBottom: ds.space[6],
      lineHeight: 20,
    },
    supportBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: ds.space[2],
      backgroundColor: ds.colors.accent,
      borderRadius: ds.radius.md,
      paddingVertical: ds.space[3],
      paddingHorizontal: ds.space[5],
      width: '100%' as unknown as number,
      marginBottom: ds.space[3],
    },
    supportBtnText: {
      ...ds.typography.body,
      fontWeight: ds.fontWeight.semibold,
      color: ds.colors.bgPrimary,
    },
    supportBtnSecondary: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: ds.space[2],
      backgroundColor: 'transparent',
      borderRadius: ds.radius.md,
      borderWidth: 1,
      borderColor: ds.colors.accent,
      paddingVertical: ds.space[3],
      paddingHorizontal: ds.space[5],
      width: '100%' as unknown as number,
      marginBottom: ds.space[4],
    },
    supportBtnSecondaryText: {
      ...ds.typography.body,
      fontWeight: ds.fontWeight.semibold,
      color: ds.colors.accent,
    },
    supportDismiss: {
      paddingVertical: ds.space[2],
    },
    supportDismissText: {
      ...ds.typography.bodySm,
      color: ds.colors.textTertiary,
    },
  }) as const;
