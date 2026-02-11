/**
 * Personal Inventory Screen (Tenth Step)
 *
 * Structured nightly self-assessment with yes/no questions
 * and optional notes. Encrypts all content before storage.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
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
import { Text, AnimatedCheckmark, Toggle } from '../../../design-system/components';
import { hapticSuccess } from '../../../utils/haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useTodayInventory, useSaveInventory } from '../hooks/usePersonalInventory';
import { INVENTORY_QUESTIONS } from '../types';
import type { InventoryAnswer } from '../types';

interface Props {
  userId: string;
}

export function PersonalInventoryScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const { inventory, isLoading } = useTodayInventory(userId);
  const { saveInventory, isPending } = useSaveInventory(userId);

  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Populate from existing inventory
  useEffect(() => {
    if (inventory) {
      const map: Record<string, boolean> = {};
      for (const a of inventory.answers) {
        map[a.questionId] = a.answer;
      }
      setAnswers(map);
      setNotes(inventory.notes ?? '');
    }
  }, [inventory]);

  const handleToggle = useCallback((questionId: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (isPending) return;

    const inventoryAnswers: InventoryAnswer[] = INVENTORY_QUESTIONS.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? false,
    }));

    try {
      await saveInventory({
        answers: inventoryAnswers,
        notes: notes.trim() || undefined,
      });
      hapticSuccess();
      setShowSuccess(true);
    } catch {
      // Error handled by mutation onError
    }
  }, [answers, notes, isPending, saveInventory]);

  const handleDone = useCallback(() => {
    setShowSuccess(false);
    navigation.goBack();
  }, [navigation]);

  const isCompleted = !!inventory;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              size="large"
              color={ds.colors.accent}
              accessibilityLabel="Loading inventory"
            />
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
              accessibilityLabel="Close personal inventory"
              accessibilityHint="Returns to home screen"
            >
              <Feather name="x" size={ds.sizes.iconLg} color={ds.colors.textSecondary} />
            </Pressable>

            <Text style={styles.headerTitle}>Step 10 Inventory</Text>

            <Pressable
              onPress={handleSave}
              disabled={isPending}
              style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel={isCompleted ? 'Update inventory' : 'Save inventory'}
              accessibilityState={{ disabled: isPending }}
              accessibilityHint="Saves your nightly inventory answers"
            >
              <Text style={[styles.saveBtnText, isPending && styles.saveBtnTextDisabled]}>
                {isCompleted ? 'Update' : 'Save'}
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

            {/* Completed badge */}
            {isCompleted && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.completedBadge}>
                <Feather name="check-circle" size={16} color={ds.colors.success} />
                <Text style={styles.completedText}>Completed — you can update your answers</Text>
              </Animated.View>
            )}

            {/* Questions */}
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <Text style={styles.sectionLabel}>SELF-EXAMINATION</Text>

              {INVENTORY_QUESTIONS.map((question, index) => (
                <Animated.View
                  key={question.id}
                  entering={FadeInDown.delay(150 + index * 50).duration(300)}
                  style={styles.questionRow}
                >
                  <Toggle
                    value={answers[question.id] ?? false}
                    onValueChange={(val) => handleToggle(question.id, val)}
                    label={question.text}
                    style={styles.toggle}
                    accessibilityLabel={question.text}
                    accessibilityHint={`Toggle yes or no for: ${question.text}`}
                  />
                </Animated.View>
              ))}
            </Animated.View>

            {/* Notes */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(400)}
              style={styles.notesSection}
            >
              <Text style={styles.sectionLabel}>ADDITIONAL NOTES</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any thoughts, amends to make, or things to discuss with your sponsor..."
                placeholderTextColor={ds.colors.textQuaternary}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                accessibilityLabel="Additional inventory notes"
                accessibilityHint="Optional notes about your day or amends to make"
              />
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
            <Text style={styles.modalTitle}>Inventory Saved</Text>
            <Text style={styles.modalSub}>Keep coming back</Text>
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
    loadingWrap: {
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
    saveBtn: {
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[2],
      backgroundColor: ds.colors.accent,
      borderRadius: ds.radius.sm,
      minWidth: 48,
      minHeight: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
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
      marginBottom: ds.space[4],
    },
    completedBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ds.space[2],
      backgroundColor: ds.colors.bgTertiary,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.md,
      marginBottom: ds.space[6],
    },
    completedText: {
      ...ds.typography.bodySm,
      color: ds.colors.success,
    },

    // Questions
    sectionLabel: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      marginBottom: ds.space[3],
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    questionRow: {
      marginBottom: ds.space[2],
      paddingVertical: ds.space[1],
    },
    toggle: {
      minHeight: 48,
    },

    // Notes
    notesSection: {
      marginTop: ds.space[8],
      paddingTop: ds.space[6],
      borderTopWidth: 1,
      borderTopColor: ds.colors.divider,
    },
    notesInput: {
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      minHeight: 120,
      paddingTop: ds.space[2],
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
