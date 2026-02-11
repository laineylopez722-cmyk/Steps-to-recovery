/**
 * DailyReadingCard Component
 * Home page widget showing today's JFT reading preview
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Loading skeleton state
 * - Error state with retry
 * - Accessibility optimized
 * - Streak celebration
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouterCompat } from '../../utils/navigationHelper';
import { GlassCard } from '../../design-system/components/GlassCard';
import { useReading } from '../../hooks/useReading';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../design-system/hooks/useThemedStyles';
import { useDs } from '../../design-system/DsProvider';

interface DailyReadingCardProps {
  /** Delay index for staggered entrance animation */
  enteringDelay?: number;
}

export function DailyReadingCard({ enteringDelay = 1 }: DailyReadingCardProps) {
  const router = useRouterCompat();
  const { todayReading, hasReflectedToday, readingStreak, shortDate, readingPreview, isLoading, error } =
    useReading();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/reading');
  }, [router]);

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // TODO: Implement refetch when useReading hook supports it
  }, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.skeleton}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // Error state
  if (error || !todayReading) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <TouchableOpacity
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Failed to load today's reading. Tap to retry."
          accessibilityHint="Attempts to reload the daily reading"
        >
          <GlassCard gradient="card" style={[styles.card, styles.errorCard]}>
            <View style={styles.errorContent}>
              <Feather name="alert-circle" size={24} color={ds.semantic.intent.alert.solid} />
              <Text style={styles.errorTitle}>Couldn't load reading</Text>
              <Text style={styles.errorSubtitle}>Tap to retry</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Today's reading: ${todayReading.title}${hasReflectedToday ? ', already reflected' : ', tap to read and reflect'}`}
        accessibilityHint="Opens the full daily reading"
      >
        <GlassCard gradient="card" style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text accessibilityElementsHidden>📖</Text>
              <Text style={styles.headerLabel}>Today's Reading</Text>
            </View>
            <Text style={styles.dateText}>{shortDate}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            "{todayReading.title}"
          </Text>

          {/* Preview */}
          <Text style={styles.preview} numberOfLines={3}>
            {readingPreview}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {hasReflectedToday ? (
                <View style={styles.reflectedBadge}>
                  <Feather name="check-circle" size={14} color={ds.colors.success} />
                  <Text style={styles.reflectedText}>Reflected</Text>
                </View>
              ) : (
                <Text style={styles.tapHint}>Tap to read & reflect</Text>
              )}
            </View>

            <View style={styles.footerRight}>
              {readingStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Text accessibilityElementsHidden>🔥</Text>
                  <Text style={styles.streakText}>
                    {readingStreak} day{readingStreak !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              <Feather name="arrow-right" size={16} color={ds.colors.info} style={styles.arrow} />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (ds: DS) => ({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  errorCard: {
    borderColor: ds.semantic.intent.alert.solid,
    borderWidth: 1,
  },
  errorContent: {
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    color: ds.semantic.intent.alert.solid,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtitle: {
    color: ds.colors.textTertiary,
    fontSize: 14,
    marginTop: 4,
  },
  skeleton: {
    opacity: 0.5,
  },
  skeletonHeader: {
    height: 16,
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 4,
    width: '30%',
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 4,
    width: '70%',
    marginBottom: 12,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 4,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: ds.colors.textSecondary,
  },
  dateText: {
    fontSize: 14,
    color: ds.colors.textSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ds.semantic.text.onDark,
    marginBottom: 8,
    lineHeight: 28,
  },
  preview: {
    fontSize: 16,
    color: ds.colors.textTertiary,
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reflectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reflectedText: {
    color: ds.colors.success,
    fontSize: 14,
  },
  tapHint: {
    color: ds.colors.textSecondary,
    fontSize: 14,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.warningMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    color: ds.colors.warning,
    fontSize: 12,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 4,
  },
} as const);
