/**
 * Daily Reading Card Component
 * Displays today's JFT reading on the home screen with reflection actions
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, spacing, radius, typography } from '../../../design-system/tokens/modern';
import { useReading } from '../../../hooks/useReading';
import type { RootStackParamList } from '../../../navigation/types';

interface DailyReadingCardProps {
  userId: string;
}

export function DailyReadingCard({ userId }: DailyReadingCardProps): React.ReactElement {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    todayReading,
    hasReflectedToday,
    readingStreak,
    shortDate,
    readingPreview,
    streakMessage,
    isLoading,
  } = useReading();

  const handleReflect = (): void => {
    if (!todayReading) return;
    
    // Navigate to journal editor with pre-filled content
    navigation.navigate('Journal' as any, {
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
    navigation.navigate('Home' as any, {
      screen: 'DailyReading',
    });
  };

  if (isLoading) {
    return (
      <Animated.View entering={FadeInUp.delay(150).duration(600)}>
        <GlassCard intensity="medium" glow glowColor={darkAccent.primary}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText} accessibilityRole="text" accessibilityLabel="Loading daily reading">
              Loading today's reading...
            </Text>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  if (!todayReading) {
    return null;
  }

  return (
    <Animated.View entering={FadeInUp.delay(150).duration(600)}>
      <GlassCard
        intensity="medium"
        glow
        glowColor={darkAccent.primary}
        style={styles.container}
        accessibilityRole="article"
        accessibilityLabel={`Daily reading: ${todayReading.title}`}
      >
        {/* Gradient border effect */}
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.3)', 'rgba(168, 85, 247, 0.3)', 'rgba(236, 72, 153, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        
        <View style={styles.content}>
          {/* Header with icon and date */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="auto-stories" size={24} color={darkAccent.primary} accessible={false} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.label} accessibilityRole="text">Daily Reading</Text>
              <Text style={styles.date} accessibilityRole="text">{shortDate}</Text>
            </View>
            {readingStreak > 0 && (
              <View 
                style={styles.streakBadge}
                accessibilityLabel={streakMessage}
                accessibilityRole="text"
              >
                <MaterialIcons name="local-fire-department" size={14} color="#FBBF24" accessible={false} />
                <Text style={styles.streakText}>{readingStreak}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={styles.title}
            accessibilityRole="header"
            accessibilityLabel={`Reading title: ${todayReading.title}`}
          >
            {todayReading.title}
          </Text>

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
              <MaterialIcons name="menu-book" size={18} color={darkAccent.text} accessible={false} />
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
              accessibilityLabel={hasReflectedToday ? "Reflection completed" : "Reflect on today's reading"}
              accessibilityRole="button"
              accessibilityHint={
                hasReflectedToday
                  ? "You have already reflected on today's reading"
                  : "Opens journal to write your thoughts about this reading"
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
              <MaterialIcons name="celebration" size={16} color={darkAccent.success} accessible={false} />
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
    borderColor: 'rgba(99, 102, 241, 0.2)',
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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
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
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
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
