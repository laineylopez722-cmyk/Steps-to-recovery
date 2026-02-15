/**
 * Morning Intention Screen
 *
 * Clean journaling interface.
 * No distractions, just writing.
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
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useCreateCheckIn } from '../hooks/useCheckIns';
import { AnimatedCheckmark } from '../../../design-system/components';
import { hapticSuccess, hapticSelection } from '../../../utils/haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { extractMemories } from '../../journal/utils/memoryExtraction';
import { useMemoryStore } from '../../../hooks/useMemoryStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/types';

interface Props {
  userId: string;
}

export function MorningIntentionScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { createCheckIn, isPending } = useCreateCheckIn(userId);
  const memoryStore = useMemoryStore(userId);

  const [text, setText] = useState('');
  const [mood, setMood] = useState(3);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLowMoodSupport, setShowLowMoodSupport] = useState(false);

  const handleMood = useCallback(
    (val: number) => {
      if (val !== mood) {
        hapticSelection();
        setMood(val);
      }
    },
    [mood],
  );

  const handleSubmit = async () => {
    if (!text.trim() || isPending) return;

    try {
      await createCheckIn({ type: 'morning', intention: text.trim(), mood });
      hapticSuccess();

      // Low mood (1 = Struggling) → offer gentle support
      if (mood <= 1) {
        setShowLowMoodSupport(true);
      } else {
        setShowSuccess(true);
      }

      // Extract memories for AI companion (async)
      extractMemories(text.trim(), userId)
        .then((memories) => {
          if (memories.length > 0) {
            memoryStore.addMemories(memories);
          }
        })
        .catch(() => {});
    } catch {
      Alert.alert('Couldn\u2019t save', 'Your intention wasn\u2019t saved. Please try again.');
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  const handleSupportDismiss = () => {
    setShowLowMoodSupport(false);
    navigation.goBack();
  };

  const handleCompanionChat = () => {
    setShowLowMoodSupport(false);
    navigation.replace('CompanionChat');
  };

  const handleEmergency = () => {
    setShowLowMoodSupport(false);
    navigation.replace('Emergency');
  };

  const moods = [
    { val: 1, label: 'Struggling' },
    { val: 2, label: 'Low' },
    { val: 3, label: 'Okay' },
    { val: 4, label: 'Good' },
    { val: 5, label: 'Great' },
  ];

  const canSubmit = text.trim().length > 0 && !isPending;

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
              accessibilityLabel="Close morning intention"
              accessibilityHint="Returns to home screen"
            >
              <Feather name="x" size={ds.sizes.iconLg} color={ds.colors.textSecondary} />
            </Pressable>

            <Text style={styles.headerTitle}>Morning</Text>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Save morning intention"
              accessibilityState={{ disabled: !canSubmit }}
              accessibilityHint="Saves your intention and mood for today"
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

            {/* Main Input */}
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <Text style={styles.label}>What's your intention for today?</Text>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="I will..."
                placeholderTextColor={ds.colors.textQuaternary}
                multiline
                autoFocus
                scrollEnabled={false}
                textAlignVertical="top"
                accessibilityLabel="Morning intention input"
                accessibilityHint="Type your intention for today"
              />
            </Animated.View>

            {/* Mood */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.moodSection}
            >
              <Text style={styles.label}>How are you feeling?</Text>
              <Text style={styles.moodValue}>{moods.find((m) => m.val === mood)?.label}</Text>

              <View style={styles.moodTrack}>
                {moods.map((m) => (
                  <Pressable
                    key={m.val}
                    onPress={() => handleMood(m.val)}
                    style={[styles.moodDot, mood >= m.val && styles.moodDotActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Set mood to ${m.label}`}
                    accessibilityState={{ selected: mood === m.val }}
                    accessibilityHint={`Tap to select ${m.label} mood`}
                  />
                ))}
              </View>

              <View style={styles.moodLabels}>
                <Text style={styles.moodLabelText}>Struggling</Text>
                <Text style={styles.moodLabelText}>Great</Text>
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
            <Text style={styles.modalTitle}>Saved</Text>
            <Text style={styles.modalSub}>Have a good day</Text>
          </View>
        </View>
      </Modal>

      {/* Low Mood Support Modal */}
      <Modal visible={showLowMoodSupport} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.supportCard}>
            <View style={styles.supportIconRow}>
              <Feather name="heart" size={28} color={ds.colors.accent} />
            </View>
            <Text style={styles.supportTitle}>Saved</Text>
            <Text style={styles.supportSub}>
              Tough mornings are part of recovery.{'\n'}You don't have to face it alone.
            </Text>

            <Pressable
              onPress={handleCompanionChat}
              style={styles.supportBtn}
              accessibilityRole="button"
              accessibilityLabel="Talk to your companion"
            >
              <Feather name="message-circle" size={18} color={ds.colors.bgPrimary} />
              <Text style={styles.supportBtnText}>Talk to Companion</Text>
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
              accessibilityLabel="Dismiss and continue"
            >
              <Text style={styles.supportDismissText}>I've got this</Text>
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
      marginBottom: ds.space[8],
    },

    label: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      marginBottom: ds.space[3],
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },

    input: {
      ...ds.typography.h3,
      color: ds.colors.textPrimary,
      minHeight: 160,
      marginBottom: ds.space[10],
    },

    // Mood
    moodSection: {
      paddingTop: ds.space[6],
      borderTopWidth: 1,
      borderTopColor: ds.colors.divider,
    },
    moodValue: {
      ...ds.typography.h2,
      color: ds.colors.textPrimary,
      marginBottom: ds.space[6],
    },
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
    moodLabels: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    moodLabelText: {
      ...ds.typography.micro,
      color: ds.colors.textQuaternary,
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

    // Support Modal (low mood)
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
