/**
 * Daily Reading Screen
 * 
 * Clean reading experience.
 * Focus on the content.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedCheckmark } from '../../../design-system/components';
import { useReading } from '../../../hooks/useReading';
import { ds } from '../../../design-system/tokens/ds';
import type { HomeStackScreenProps } from '../../../navigation/types';

export function DailyReadingScreen(): React.ReactElement {
  const navigation = useNavigation<HomeStackScreenProps<'DailyReading'>['navigation']>();
  const {
    todayReading,
    hasReflectedToday,
    readingStreak,
    formattedDate,
    streakMessage,
    submitReflection,
    isLoading,
  } = useReading();

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleReflect = () => {
    setShowInput(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!text.trim() || saving) return;
    
    try {
      setSaving(true);
      await submitReflection(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowInput(false);
      setText('');
      setShowSuccess(true);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
  };

  if (isLoading || !todayReading) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
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
            <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Feather name="arrow-left" size={ds.sizes.iconLg} color={ds.colors.textSecondary} />
            </Pressable>
            
            <Text style={styles.headerTitle}>Reading</Text>
            
            {readingStreak > 0 ? (
              <View style={styles.streakBadge}>
                <Feather name="zap" size={14} color={ds.palette.warmGold} />
                <Text style={styles.streakText}>{readingStreak}</Text>
              </View>
            ) : (
              <View style={{ width: ds.sizes.touchMin }} />
            )}
          </View>

          <ScrollView 
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Date */}
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.date}>{formattedDate}</Text>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <Text style={styles.title}>{todayReading.title}</Text>
            </Animated.View>

            {/* Content */}
            <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.readingContainer}>
              <View style={styles.readingBar} />
              <Text style={styles.reading}>{todayReading.content}</Text>
            </Animated.View>

            {/* Source */}
            <Animated.View entering={FadeIn.delay(300).duration(400)}>
              <Text style={styles.source}>— Just For Today</Text>
            </Animated.View>

            {/* Reflection */}
            {showInput ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your reflection</Text>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="What does this mean to you?"
                  placeholderTextColor={ds.colors.textQuaternary}
                  multiline
                  autoFocus
                  scrollEnabled={false}
                  textAlignVertical="top"
                />
                
                <View style={styles.inputActions}>
                  <Pressable onPress={() => setShowInput(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  
                  <Pressable 
                    onPress={handleSave}
                    disabled={!text.trim() || saving}
                    style={[styles.saveBtn, (!text.trim() || saving) && styles.saveBtnDisabled]}
                  >
                    <Text style={[styles.saveBtnText, (!text.trim() || saving) && styles.saveBtnTextDisabled]}>
                      {saving ? 'Saving...' : 'Save'}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : hasReflectedToday ? (
              <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.doneContainer}>
                <Feather name="check-circle" size={ds.sizes.iconLg} color={ds.colors.success} />
                <View style={styles.doneContent}>
                  <Text style={styles.doneTitle}>Reflected</Text>
                  <Text style={styles.doneSub}>{streakMessage}</Text>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                <Pressable style={styles.reflectBtn} onPress={handleReflect}>
                  <Feather name="edit-3" size={ds.sizes.iconMd} color={ds.colors.bgPrimary} />
                  <Text style={styles.reflectText}>Add reflection</Text>
                </Pressable>
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
              onAnimationComplete={handleSuccessDone} 
            />
            <Text style={styles.modalTitle}>Saved</Text>
            <Text style={styles.modalSub}>{streakMessage}</Text>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.palette.warmGoldMuted,
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.full,
    gap: ds.space[1],
  },
  streakText: {
    ...ds.typography.caption,
    fontWeight: ds.fontWeight.bold,
    color: ds.palette.warmGold,
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
    marginBottom: ds.space[3],
  },

  title: {
    ...ds.typography.h1,
    color: ds.colors.textPrimary,
    marginBottom: ds.space[8],
  },

  readingContainer: {
    flexDirection: 'row',
    marginBottom: ds.space[6],
  },
  readingBar: {
    width: 3,
    backgroundColor: ds.palette.calmBlue,
    borderRadius: 2,
    marginRight: ds.space[4],
  },
  reading: {
    flex: 1,
    ...ds.typography.body,
    fontSize: 19,
    lineHeight: 32,
    color: ds.colors.textPrimary,
  },

  source: {
    ...ds.typography.bodySm,
    color: ds.colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: ds.space[10],
  },

  // Input
  inputContainer: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.lg,
    padding: ds.space[5],
  },
  inputLabel: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    minHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ds.space[3],
    marginTop: ds.space[4],
    paddingTop: ds.space[4],
    borderTopWidth: 1,
    borderTopColor: ds.colors.divider,
  },
  cancelBtn: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3],
  },
  cancelText: {
    ...ds.typography.bodySm,
    color: ds.colors.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: ds.space[5],
    paddingVertical: ds.space[3],
    backgroundColor: ds.colors.accent,
    borderRadius: ds.radius.sm,
  },
  saveBtnDisabled: {
    backgroundColor: ds.colors.bgQuaternary,
  },
  saveBtnText: {
    ...ds.typography.bodySm,
    fontWeight: ds.fontWeight.semibold,
    color: ds.colors.bgPrimary,
  },
  saveBtnTextDisabled: {
    color: ds.colors.textQuaternary,
  },

  // Done state
  doneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.successMuted,
    borderRadius: ds.radius.md,
    padding: ds.space[4],
    gap: ds.space[3],
  },
  doneContent: {
    flex: 1,
  },
  doneTitle: {
    ...ds.typography.body,
    fontWeight: ds.fontWeight.semibold,
    color: ds.colors.success,
  },
  doneSub: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },

  // Reflect button
  reflectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.accent,
    paddingVertical: ds.space[4],
    borderRadius: ds.radius.md,
    gap: ds.space[2],
  },
  reflectText: {
    ...ds.typography.body,
    fontWeight: ds.fontWeight.semibold,
    color: ds.colors.bgPrimary,
  },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: ds.colors.bgOverlay,
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
