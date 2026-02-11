/**
 * Gratitude Journal Screen
 *
 * Daily "3 things I'm grateful for" with streak tracking.
 * Shows input form or completed state with past entries.
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useGratitude } from '../hooks/useGratitude';
import { AnimatedCheckmark } from '../../../design-system/components';
import { hapticSuccess } from '../../../utils/haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type { GratitudeEntry } from '../types';

interface Props {
  userId: string;
}

export function GratitudeScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const { todayEntry, todayLoading, streak, history, historyLoading, saveGratitude, isSaving } =
    useGratitude();

  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [item3, setItem3] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const canSubmit =
    item1.trim().length > 0 && item2.trim().length > 0 && item3.trim().length > 0 && !isSaving;

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!canSubmit) return;

    try {
      await saveGratitude([item1.trim(), item2.trim(), item3.trim()]);
      hapticSuccess();
      setShowSuccess(true);
    } catch {
      // Error handled by React Query
    }
  }, [canSubmit, item1, item2, item3, saveGratitude]);

  const handleDone = useCallback((): void => {
    setShowSuccess(false);
  }, []);

  // Past entries excluding today
  const today = new Date().toISOString().split('T')[0];
  const pastEntries = history.filter((e) => e.entryDate !== today);

  if (todayLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ds.colors.accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
              accessibilityLabel="Close gratitude journal"
              accessibilityHint="Returns to home screen"
            >
              <Feather name="x" size={ds.sizes.iconLg} color={ds.colors.textSecondary} />
            </Pressable>

            <Text style={styles.headerTitle}>Gratitude</Text>

            {!todayEntry && (
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Save gratitude entry"
                accessibilityState={{ disabled: !canSubmit }}
                accessibilityHint="Saves your three gratitude items for today"
              >
                <Text style={[styles.saveBtnText, !canSubmit && styles.saveBtnTextDisabled]}>
                  Save
                </Text>
              </Pressable>
            )}

            {todayEntry && <View style={styles.headerPlaceholder} />}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Streak Counter */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.streakSection}>
              <View style={styles.streakRow}>
                <View style={styles.streakBadge}>
                  <Feather name="zap" size={16} color={ds.colors.accent} />
                  <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
                </View>
                <Text style={styles.streakLabel}>
                  {streak.currentStreak === 1 ? 'day streak' : 'day streak'}
                </Text>
              </View>
              <View style={styles.streakMeta}>
                <Text style={styles.streakMetaText}>
                  Best: {streak.longestStreak} · Total: {streak.totalEntries}
                </Text>
              </View>
            </Animated.View>

            {/* Date */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </Animated.View>

            {/* Today: Completed State */}
            {todayEntry && (
              <Animated.View entering={FadeIn.delay(200).duration(400)}>
                <View style={styles.completedHeader}>
                  <AnimatedCheckmark
                    size={32}
                    color={ds.colors.success}
                    animate={false}
                    hapticFeedback={false}
                  />
                  <Text style={styles.completedTitle}>Today's gratitude</Text>
                </View>

                {todayEntry.items.map((item, index) => (
                  <View
                    key={`today-${index}`}
                    style={styles.completedItem}
                    accessible
                    accessibilityLabel={`Gratitude item ${index + 1}: ${item}`}
                    accessibilityRole="text"
                  >
                    <Text style={styles.completedItemNumber}>{index + 1}</Text>
                    <Text style={styles.completedItemText}>{item}</Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Today: Input State */}
            {!todayEntry && (
              <Animated.View entering={FadeIn.delay(200).duration(400)}>
                <Text style={styles.prompt}>What are 3 things you're grateful for today?</Text>

                <GratitudeInput
                  index={1}
                  value={item1}
                  onChangeText={setItem1}
                  placeholder="Something that made you smile..."
                  ds={ds}
                  styles={styles}
                  autoFocus
                />
                <GratitudeInput
                  index={2}
                  value={item2}
                  onChangeText={setItem2}
                  placeholder="Someone you appreciate..."
                  ds={ds}
                  styles={styles}
                />
                <GratitudeInput
                  index={3}
                  value={item3}
                  onChangeText={setItem3}
                  placeholder="A moment of peace..."
                  ds={ds}
                  styles={styles}
                />
              </Animated.View>
            )}

            {/* Past Entries */}
            {pastEntries.length > 0 && (
              <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                <View style={styles.historySeparator} />
                <Text style={styles.historyTitle}>Past Entries</Text>

                {historyLoading && (
                  <ActivityIndicator
                    size="small"
                    color={ds.colors.textTertiary}
                    style={styles.historyLoading}
                  />
                )}

                {pastEntries.map((entry) => (
                  <PastEntryCard key={entry.id} entry={entry} styles={styles} />
                ))}
              </Animated.View>
            )}

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
            <Text style={styles.modalSub}>Gratitude recorded ✨</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface GratitudeInputProps {
  index: number;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  ds: ReturnType<typeof useDs>;
  styles: ReturnType<typeof useThemedStyles<ReturnType<typeof createStyles>>>;
  autoFocus?: boolean;
}

function GratitudeInput({
  index,
  value,
  onChangeText,
  placeholder,
  ds,
  styles,
  autoFocus,
}: GratitudeInputProps): React.ReactElement {
  return (
    <View style={styles.inputRow}>
      <View style={styles.inputNumber}>
        <Text style={styles.inputNumberText}>{index}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ds.colors.textQuaternary}
        multiline
        scrollEnabled={false}
        textAlignVertical="top"
        autoFocus={autoFocus}
        accessibilityLabel={`Gratitude item ${index}`}
        accessibilityHint={`Enter thing number ${index} you are grateful for`}
      />
    </View>
  );
}

interface PastEntryCardProps {
  entry: GratitudeEntry;
  styles: ReturnType<typeof useThemedStyles<ReturnType<typeof createStyles>>>;
}

function PastEntryCard({ entry, styles }: PastEntryCardProps): React.ReactElement {
  const dateLabel = new Date(entry.entryDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View
      style={styles.historyCard}
      accessible
      accessibilityLabel={`Gratitude entry from ${dateLabel}`}
      accessibilityRole="summary"
    >
      <Text style={styles.historyDate}>{dateLabel}</Text>
      {entry.items.map((item, i) => (
        <View key={`${entry.id}-${i}`} style={styles.historyItem}>
          <Text style={styles.historyBullet}>•</Text>
          <Text style={styles.historyItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
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
    headerPlaceholder: {
      width: ds.sizes.touchMin,
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

    // Streak
    streakSection: {
      alignItems: 'center' as const,
      marginBottom: ds.space[6],
    },
    streakRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ds.space[2],
    },
    streakBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ds.space[1],
      backgroundColor: ds.colors.bgTertiary,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[1],
      borderRadius: ds.radius.full,
    },
    streakNumber: {
      ...ds.typography.h3,
      color: ds.colors.accent,
      fontWeight: ds.fontWeight.bold,
    },
    streakLabel: {
      ...ds.typography.bodySm,
      color: ds.colors.textSecondary,
    },
    streakMeta: {
      marginTop: ds.space[1],
    },
    streakMetaText: {
      ...ds.typography.micro,
      color: ds.colors.textTertiary,
    },

    // Date
    date: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      marginBottom: ds.space[6],
    },

    // Prompt
    prompt: {
      ...ds.typography.h3,
      color: ds.colors.textPrimary,
      marginBottom: ds.space[6],
    },

    // Input
    inputRow: {
      flexDirection: 'row' as const,
      marginBottom: ds.space[4],
      gap: ds.space[3],
    },
    inputNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: ds.colors.bgTertiary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginTop: ds.space[1],
    },
    inputNumberText: {
      ...ds.typography.bodySm,
      fontWeight: ds.fontWeight.semibold,
      color: ds.colors.textSecondary,
    },
    input: {
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      flex: 1,
      minHeight: 48,
      paddingVertical: ds.space[2],
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.divider,
    },

    // Completed
    completedHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ds.space[3],
      marginBottom: ds.space[5],
    },
    completedTitle: {
      ...ds.typography.h3,
      color: ds.colors.success,
      fontWeight: ds.fontWeight.semibold,
    },
    completedItem: {
      flexDirection: 'row' as const,
      gap: ds.space[3],
      marginBottom: ds.space[3],
      paddingVertical: ds.space[2],
    },
    completedItemNumber: {
      ...ds.typography.bodySm,
      fontWeight: ds.fontWeight.semibold,
      color: ds.colors.textTertiary,
      width: 20,
      textAlign: 'center' as const,
    },
    completedItemText: {
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      flex: 1,
    },

    // History
    historySeparator: {
      height: 1,
      backgroundColor: ds.colors.divider,
      marginTop: ds.space[8],
      marginBottom: ds.space[6],
    },
    historyTitle: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginBottom: ds.space[4],
    },
    historyLoading: {
      marginVertical: ds.space[4],
    },
    historyCard: {
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.md,
      padding: ds.space[4],
      marginBottom: ds.space[3],
    },
    historyDate: {
      ...ds.typography.micro,
      color: ds.colors.textTertiary,
      marginBottom: ds.space[2],
    },
    historyItem: {
      flexDirection: 'row' as const,
      gap: ds.space[2],
      marginBottom: ds.space[1],
    },
    historyBullet: {
      ...ds.typography.bodySm,
      color: ds.colors.textTertiary,
    },
    historyItemText: {
      ...ds.typography.bodySm,
      color: ds.colors.textSecondary,
      flex: 1,
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
  }) as const;
