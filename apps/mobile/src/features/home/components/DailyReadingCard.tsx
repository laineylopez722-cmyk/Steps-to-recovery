/**
 * Daily Reading Card Component
 * Displays today's JFT reading on the home screen with reflection actions
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, spacing, radius, typography } from '../../../design-system/tokens/modern';
import { ds } from '../../../design-system/tokens/ds';
import { useReading } from '../../../hooks/useReading';
import type { HomeStackScreenProps } from '../../../navigation/types';

interface DailyReadingCardProps {
  userId: string;
}

export function DailyReadingCard({ userId: _userId }: DailyReadingCardProps): React.ReactElement {
  const navigation = useNavigation<HomeStackScreenProps<'HomeMain'>['navigation']>();
  const {
    todayReading,
    hasReflectedToday,
    readingStreak,
    readingPreview,
    streakMessage,
    isLoading,
  } = useReading();

  const handleReflect = (): void => {
    if (!todayReading) return;

    // Cross-tab navigation requires casting the route name
    (
      navigation as { navigate: (screen: string, params?: Record<string, unknown>) => void }
    ).navigate('Journal', {
      screen: 'JournalEditor',
      params: {
        mode: 'create',
        initialTitle: `Reflection: ${todayReading.title}`,
        initialContent: `Today's Reading: "${todayReading.title}"\n\n"${todayReading.content}"\n\nMy Reflection:\n`,
        tags: ['JFT Reflection'],
      },
    });
  };

  const handleReadMore = (): void => {
    navigation.navigate('DailyReading');
  };

  if (isLoading) {
    return (
      <Animated.View entering={FadeInUp.delay(150).duration(600)}>
        <GlassCard intensity="medium" glow glowColor={darkAccent.primary}>
          <View style={styles.loadingContainer}>
            <Text
              style={styles.loadingText}
              accessibilityRole="text"
              accessibilityLabel="Loading daily reading"
            >
              Loading today's reading...
            </Text>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  if (!todayReading) {
    return <></>;
  }

  return (
    <Animated.View entering={FadeInUp.delay(150).duration(600)}>
      {' '}
      <GlassCard
        style={styles.container}
        accessibilityValue={{ text: `Daily reading: ${todayReading.title}` }}
        accessibilityLabel={`Daily reading: ${todayReading.title}`}
      >
        <View style={styles.content}>
          {/* Reading preview */}
          <Text
            style={styles.preview}
            numberOfLines={3}
            accessibilityRole="text"
            accessibilityLabel={`Reading preview: ${readingPreview}`}
          >
            {readingPreview}
          </Text>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.readButton]}
              onPress={handleReadMore}
              accessibilityLabel="Read full daily reading"
              accessibilityRole="button"
              accessibilityHint="Opens the complete daily reading"
            >
              <MaterialIcons
                name="menu-book"
                size={18}
                color={darkAccent.text}
                accessible={false}
              />
              <Text style={styles.readButtonText}>Read More</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.reflectButton,
                hasReflectedToday && styles.reflectButtonCompleted,
              ]}
              onPress={handleReflect}
              disabled={hasReflectedToday}
              accessibilityLabel={
                hasReflectedToday ? 'Reflection completed' : "Reflect on today's reading"
              }
              accessibilityRole="button"
              accessibilityHint={
                hasReflectedToday
                  ? "You have already reflected on today's reading"
                  : 'Opens journal to write your thoughts about this reading'
              }
              accessibilityState={{ disabled: hasReflectedToday }}
            >
              <MaterialIcons
                name={hasReflectedToday ? 'check-circle' : 'create'}
                size={18}
                color={hasReflectedToday ? darkAccent.success : '#fff'}
                accessible={false}
              />
              <Text
                style={[
                  styles.reflectButtonText,
                  hasReflectedToday && styles.reflectButtonTextCompleted,
                ]}
              >
                {hasReflectedToday ? 'Reflected' : 'Reflect'}
              </Text>
            </Pressable>
          </View>

          {/* Reflection prompt hint */}
          {!hasReflectedToday && todayReading.reflectionPrompt && (
            <Text
              style={styles.promptHint}
              numberOfLines={2}
              accessibilityRole="text"
              accessibilityLabel={`Reflection prompt: ${todayReading.reflectionPrompt}`}
            >
              💭 {todayReading.reflectionPrompt}
            </Text>
          )}

          {/* Streak message */}
          {hasReflectedToday && readingStreak > 0 && (
            <View style={styles.streakMessage}>
              <MaterialIcons
                name="celebration"
                size={16}
                color={darkAccent.success}
                accessible={false}
              />
              <Text style={styles.streakMessageText} accessibilityRole="text">
                {streakMessage}
              </Text>
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: ds.colors.borderSubtle,
  },
  content: {
    padding: spacing[3],
    gap: spacing[2],
  },
  loadingContainer: {
    padding: spacing[4],
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: ds.colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: darkAccent.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    color: darkAccent.text,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ds.colors.warningMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: ds.colors.warning,
  },
  title: {
    ...typography.h3,
    color: darkAccent.text,
    marginTop: spacing[1],
  },
  preview: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: darkAccent.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  readButton: {
    backgroundColor: ds.colors.bgSecondary,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  readButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: darkAccent.text,
  },
  reflectButton: {
    backgroundColor: darkAccent.primary,
  },
  reflectButtonCompleted: {
    backgroundColor: ds.colors.successMuted,
    borderWidth: 1,
    borderColor: ds.colors.success,
  },
  reflectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reflectButtonTextCompleted: {
    color: darkAccent.success,
  },
  promptHint: {
    fontSize: 13,
    lineHeight: 18,
    color: darkAccent.textSubtle,
    fontStyle: 'italic',
    paddingTop: spacing[1],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  streakMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  streakMessageText: {
    fontSize: 13,
    fontWeight: '600',
    color: darkAccent.success,
  },
});
