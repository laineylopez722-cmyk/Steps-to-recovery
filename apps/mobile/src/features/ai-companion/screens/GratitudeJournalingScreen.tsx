/**
 * AI-Guided Gratitude Journaling Screen
 * Quick gratitude exercise with AI-generated prompts.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

const GRATITUDE_PROMPTS = [
  "What's one small thing that went well today?",
  'Who made a positive difference in your life recently?',
  "What's something about your recovery you're grateful for?",
  "What's a simple pleasure you enjoyed today?",
  'What strength have you discovered in yourself recently?',
  "What's one thing you can do today that you couldn't a month ago?",
  "Who believed in you when you couldn't believe in yourself?",
  'What part of today would you want to relive?',
  'What challenge has taught you something valuable?',
  'What about this moment right now are you grateful for?',
];

export function GratitudeJournalingScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const navigation = useNavigation();
  const [entries, setEntries] = useState<string[]>(['', '', '']);
  const [currentPromptIndex] = useState(() => Math.floor(Math.random() * GRATITUDE_PROMPTS.length));
  const [completed, setCompleted] = useState(false);

  const prompt = GRATITUDE_PROMPTS[currentPromptIndex];

  const updateEntry = useCallback((index: number, text: string): void => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  }, []);

  const handleComplete = useCallback((): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCompleted(true);
  }, []);

  const filledCount = entries.filter((e) => e.trim().length > 0).length;
  const canComplete = filledCount >= 1;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Feather name="chevron-left" size={26} color={ds.colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Gratitude</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {completed ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.completedSection}>
                <Text style={styles.completedEmoji}>🙏</Text>
                <Text style={styles.completedTitle}>Beautiful</Text>
                <Text style={styles.completedBody}>
                  Gratitude rewires your brain for positivity. You just took a powerful step in your
                  recovery by focusing on what's good.
                </Text>

                <View style={styles.entrySummary}>
                  {entries
                    .filter((e) => e.trim())
                    .map((entry, i) => (
                      <Text key={`summary-${i}`} style={styles.summaryItem}>
                        ✦ {entry}
                      </Text>
                    ))}
                </View>

                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                <Animated.View entering={FadeInDown.duration(300)} style={styles.promptSection}>
                  <Text style={styles.promptEmoji}>✨</Text>
                  <Text style={styles.promptText}>{prompt}</Text>
                </Animated.View>

                <Text style={styles.instructions}>
                  List 3 things you're grateful for today. Even small things count.
                </Text>

                {[0, 1, 2].map((i) => (
                  <Animated.View key={i} entering={FadeInDown.delay((i + 1) * 100).duration(300)}>
                    <View style={styles.entryRow}>
                      <Text style={styles.entryNumber}>{i + 1}</Text>
                      <TextInput
                        value={entries[i]}
                        onChangeText={(text) => updateEntry(i, text)}
                        placeholder={i === 0 ? 'I am grateful for...' : 'Another thing...'}
                        placeholderTextColor={ds.colors.textQuaternary}
                        style={styles.entryInput}
                        multiline
                        accessibilityLabel={`Gratitude entry ${i + 1}`}
                      />
                    </View>
                  </Animated.View>
                ))}

                <Animated.View entering={FadeInDown.delay(400).duration(300)}>
                  <Pressable
                    onPress={handleComplete}
                    disabled={!canComplete}
                    style={({ pressed }) => [
                      styles.completeBtn,
                      !canComplete && styles.completeBtnDisabled,
                      pressed && styles.completeBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Save gratitude entries"
                    accessibilityState={{ disabled: !canComplete }}
                  >
                    <Text style={styles.completeBtnText}>
                      {filledCount === 3 ? 'Save All Three 🎉' : `Save (${filledCount}/3)`}
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: { flex: 1, backgroundColor: ds.colors.bgPrimary },
    safe: { flex: 1 },
    keyboardView: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
    },
    backBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    headerTitle: {
      ...ds.typography.body,
      fontWeight: '600' as const,
      color: ds.colors.textPrimary,
    },
    headerSpacer: { width: 44 },

    scroll: { flex: 1 },
    content: { paddingHorizontal: ds.space[5], paddingTop: ds.space[4] },

    promptSection: { alignItems: 'center' as const, marginBottom: ds.space[5] },
    promptEmoji: { fontSize: 40, marginBottom: ds.space[3] },
    promptText: {
      ...ds.typography.h3,
      color: ds.colors.textPrimary,
      textAlign: 'center' as const,
      lineHeight: 28,
    },

    instructions: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      textAlign: 'center' as const,
      marginBottom: ds.space[5],
    },

    entryRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: ds.space[3],
    },
    entryNumber: {
      ...ds.typography.h2,
      color: ds.colors.accent,
      marginRight: ds.space[3],
      marginTop: ds.space[2],
      width: 28,
      textAlign: 'center' as const,
    },
    entryInput: {
      flex: 1,
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.md,
      padding: ds.space[3],
      minHeight: 48,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
    },

    completeBtn: {
      backgroundColor: ds.colors.accent,
      paddingVertical: ds.space[4],
      borderRadius: ds.radius.full,
      alignItems: 'center' as const,
      marginTop: ds.space[4],
    },
    completeBtnPressed: { opacity: 0.8 },
    completeBtnDisabled: { opacity: 0.4 },
    completeBtnText: { ...ds.typography.body, fontWeight: '600' as const, color: ds.colors.text },

    completedSection: { alignItems: 'center' as const, paddingTop: ds.space[6] },
    completedEmoji: { fontSize: 64, marginBottom: ds.space[4] },
    completedTitle: {
      ...ds.typography.h1,
      color: ds.colors.textPrimary,
      marginBottom: ds.space[3],
    },
    completedBody: {
      ...ds.typography.body,
      color: ds.colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: ds.space[6],
      lineHeight: 24,
    },
    entrySummary: {
      width: '100%' as const,
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      marginBottom: ds.space[6],
    },
    summaryItem: {
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      marginBottom: ds.space[2],
      lineHeight: 22,
    },

    doneBtn: {
      backgroundColor: ds.colors.accent,
      paddingHorizontal: ds.space[10],
      paddingVertical: ds.space[4],
      borderRadius: ds.radius.full,
    },
    doneBtnPressed: { opacity: 0.8 },
    doneBtnText: { ...ds.typography.body, fontWeight: '600' as const, color: ds.colors.text },
  }) as const;
