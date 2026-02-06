/**
 * Daily Reading Screen
 * Full-screen display of today's daily reading with reflection capability
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, spacing, radius, typography } from '../../../design-system/tokens/modern';
import { useReading } from '../../../hooks/useReading';
import { logger } from '../../../utils/logger';
import type { HomeStackScreenProps } from '../../../navigation/types';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

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

  const [reflectionText, setReflectionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showReflectionInput, setShowReflectionInput] = useState(false);

  const handleReflect = (): void => {
    if (!todayReading) return;

    // Navigate to journal with pre-filled content
    // Cross-tab navigation requires casting the route name
    (navigation as { navigate: (screen: string, params?: Record<string, unknown>) => void }).navigate('Journal', {
      screen: 'JournalEditor',
      params: {
        mode: 'create',
        initialTitle: `Reflection: ${todayReading.title}`,
        initialContent: `Today's Reading: "${todayReading.title}"\n\n"${todayReading.content}"\n\nMy Reflection:\n`,
        tags: ['JFT Reflection'],
      },
    });
  };

  const handleQuickReflection = (): void => {
    setShowReflectionInput(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveReflection = async (): Promise<void> => {
    if (!reflectionText.trim()) return;

    try {
      setIsSaving(true);
      await submitReflection(reflectionText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowReflectionInput(false);
      setReflectionText('');
    } catch (error) {
      logger.error('Failed to save reflection', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = (): void => {
    navigation.goBack();
  };

  if (isLoading || !todayReading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText} accessibilityRole="text">
              Loading today's reading...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative glow */}
      <View style={styles.glowOrb} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Returns to home screen"
          >
            <MaterialIcons name="arrow-back" size={24} color={darkAccent.text} accessible={false} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Daily Reading
            </Text>
            <Text style={styles.headerSubtitle} accessibilityRole="text">
              {formattedDate}
            </Text>
          </View>
          {readingStreak > 0 && (
            <View
              style={styles.headerStreak}
              accessibilityLabel={streakMessage}
              accessibilityRole="text"
            >
              <MaterialIcons name="local-fire-department" size={16} color="#FBBF24" accessible={false} />
              <Text style={styles.headerStreakText}>{readingStreak}</Text>
            </View>
          )}
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <AnimatedScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Reading Card */}
            <Animated.View entering={FadeInUp.delay(100).duration(600)}>
              <GlassCard intensity="medium" glow glowColor={darkAccent.primary} style={styles.readingCard}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <MaterialIcons name="auto-stories" size={32} color={darkAccent.primary} accessible={false} />
                </View>

                {/* Title */}
                <Text style={styles.title} accessibilityRole="header">
                  {todayReading.title}
                </Text>

                {/* Source */}
                <Text style={styles.source} accessibilityRole="text">
                  Just For Today
                </Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Content */}
                <Text style={styles.content} accessibilityRole="text">
                  {todayReading.content}
                </Text>

                {/* Reflection Prompt */}
                {todayReading.reflectionPrompt && (
                  <View style={styles.promptCard}>
                    <Text style={styles.promptLabel} accessibilityRole="text">
                      💭 Reflection Prompt
                    </Text>
                    <Text style={styles.promptText} accessibilityRole="text">
                      {todayReading.reflectionPrompt}
                    </Text>
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            {/* Quick Reflection Input */}
            {showReflectionInput && !hasReflectedToday && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <GlassCard intensity="light" style={styles.reflectionCard}>
                  <Text style={styles.reflectionLabel} accessibilityRole="header">
                    Your Reflection
                  </Text>
                  <TextInput
                    style={styles.reflectionInput}
                    value={reflectionText}
                    onChangeText={setReflectionText}
                    placeholder="Write your thoughts about today's reading..."
                    placeholderTextColor={darkAccent.textSubtle}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    autoFocus
                    accessibilityLabel="Reflection text input"
                    accessibilityHint="Enter your thoughts about today's reading"
                  />
                  <View style={styles.reflectionActions}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => setShowReflectionInput(false)}
                      accessibilityLabel="Cancel reflection"
                      accessibilityRole="button"
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <GradientButton
                      title={isSaving ? 'Saving...' : 'Save'}
                      onPress={handleSaveReflection}
                      disabled={!reflectionText.trim() || isSaving}
                      size="sm"
                      accessibilityLabel="Save reflection"
                      accessibilityRole="button"
                    />
                  </View>
                </GlassCard>
              </Animated.View>
            )}

            {/* Completion Message */}
            {hasReflectedToday && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <GlassCard intensity="light" style={styles.completionCard}>
                  <MaterialIcons name="check-circle" size={32} color={darkAccent.success} accessible={false} />
                  <Text style={styles.completionTitle} accessibilityRole="text">
                    Reflection Complete
                  </Text>
                  <Text style={styles.completionText} accessibilityRole="text">
                    {streakMessage}
                  </Text>
                </GlassCard>
              </Animated.View>
            )}

            <View style={{ height: 40 }} />
          </AnimatedScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Actions */}
        {!showReflectionInput && (
          <Animated.View entering={FadeIn.delay(300)} style={styles.bottomActions}>
            {!hasReflectedToday ? (
              <>
                <GradientButton
                  title="Quick Reflection"
                  icon={<MaterialIcons name="edit" size={20} color="#fff" accessible={false} />}
                  onPress={handleQuickReflection}
                  variant="primary"
                  size="lg"
                  style={styles.actionButton}
                  accessibilityLabel="Write quick reflection"
                  accessibilityRole="button"
                />
                <GradientButton
                  title="Journal Entry"
                  icon={<MaterialIcons name="book" size={20} color="#fff" accessible={false} />}
                  onPress={handleReflect}
                  variant="secondary"
                  size="lg"
                  style={styles.actionButton}
                  accessibilityLabel="Create full journal entry"
                  accessibilityRole="button"
                />
              </>
            ) : (
              <GradientButton
                title="View in Journal"
                icon={<MaterialIcons name="book" size={20} color="#fff" accessible={false} />}
                onPress={() => (navigation as { navigate: (screen: string, params?: Record<string, unknown>) => void }).navigate('Journal', { screen: 'JournalList' })}
                variant="secondary"
                size="lg"
                style={styles.actionButton}
                accessibilityLabel="View journal entries"
                accessibilityRole="button"
              />
            )}
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: darkAccent.primary,
    opacity: 0.08,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: darkAccent.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  headerStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  headerStreakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[3],
    gap: spacing[3],
  },
  readingCard: {
    padding: spacing[4],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  source: {
    fontSize: 13,
    fontWeight: '600',
    color: darkAccent.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: darkAccent.border,
    marginVertical: spacing[3],
  },
  content: {
    ...typography.body,
    fontSize: 18,
    lineHeight: 28,
    color: darkAccent.text,
    marginBottom: spacing[3],
  },
  promptCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkAccent.primary,
    marginBottom: spacing[1],
  },
  promptText: {
    fontSize: 15,
    lineHeight: 22,
    color: darkAccent.text,
    fontStyle: 'italic',
  },
  reflectionCard: {
    padding: spacing[3],
  },
  reflectionLabel: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  reflectionInput: {
    ...typography.body,
    color: darkAccent.text,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.lg,
    padding: spacing[3],
    minHeight: 150,
    borderWidth: 1,
    borderColor: darkAccent.border,
  },
  reflectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkAccent.text,
  },
  completionCard: {
    padding: spacing[4],
    alignItems: 'center',
  },
  completionTitle: {
    ...typography.h3,
    color: darkAccent.success,
    marginTop: spacing[2],
  },
  completionText: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginTop: spacing[1],
  },
  bottomActions: {
    padding: spacing[3],
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  actionButton: {
    width: '100%',
  },
});
