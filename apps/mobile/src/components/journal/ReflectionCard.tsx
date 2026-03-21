/**
 * Reflection Card Component
 * Shows past journal entries for reflection ("Look Back")
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Loading skeleton state
 * - Empty state with CTA
 * - Proper decryption error handling
 * - Accessibility optimized
 * - Haptic feedback on interaction
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouterCompat } from '../../utils/navigationHelper';
import { GlassCard } from '../../design-system/components/GlassCard';
import { useJournalStore } from '@/shared';
import { decryptContent } from '../../utils/encryption';
import type { JournalEntry } from '@/shared';
import { impactAsync, ImpactFeedbackStyle } from '@/platform/haptics';
import { logger } from '../../utils/logger';
import { ds } from '../../design-system/tokens/ds';

interface ReflectionCardProps {
  /** Number of days ago to look back (default: 30) */
  daysAgo?: number;
  /** Delay index for staggered entrance animation */
  enteringDelay?: number;
}

export function ReflectionCard({ daysAgo = 30, enteringDelay = 4 }: ReflectionCardProps) {
  const router = useRouterCompat();
  const { entries } = useJournalStore();
  const [pastEntry, setPastEntry] = useState<JournalEntry | null>(null);
  const [excerpt, setExcerpt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const findPastEntry = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate target date range (within 2 days of the target)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);

      const rangeStart = new Date(targetDate);
      rangeStart.setDate(rangeStart.getDate() - 2);

      const rangeEnd = new Date(targetDate);
      rangeEnd.setDate(rangeEnd.getDate() + 2);

      // Find entries in that range
      const entriesInRange = entries.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= rangeStart && entryDate <= rangeEnd;
      });

      if (entriesInRange.length > 0) {
        // Pick a random entry from that time
        const entry = entriesInRange[Math.floor(Math.random() * entriesInRange.length)];
        setPastEntry(entry);

        // Decrypt and get excerpt
        try {
          const decrypted = await decryptContent(entry.content);
          // Get first 120 characters
          const truncated =
            decrypted.length > 120 ? decrypted.substring(0, 120) + '...' : decrypted;
          setExcerpt(truncated);
        } catch {
          setExcerpt('(Unable to decrypt content)');
          setError('decrypt');
        }
      } else {
        setPastEntry(null);
        setExcerpt('');
      }
    } catch (err) {
      logger.error('Failed to find past entry', err);
      setError('load');
    } finally {
      setIsLoading(false);
    }
  }, [entries, daysAgo]);

  useEffect(() => {
    findPastEntry();
  }, [findPastEntry]);

  const handlePress = useCallback(() => {
    if (!pastEntry) return;
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/journal/${pastEntry.id}`);
  }, [pastEntry, router]);

  const handleWriteEntry = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/journal');
  }, [router]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.skeleton}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLineShort} />
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // Empty state - show CTA to write first entry
  if (!pastEntry) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <TouchableOpacity
          onPress={handleWriteEntry}
          accessibilityRole="button"
          accessibilityLabel={`No journal entry from ${daysAgo} days ago. Tap to write your first entry.`}
          accessibilityHint="Opens journal editor"
        >
          <GlassCard gradient="card" style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyIconContainer}>
                <Feather name="book-open" size={24} color={ds.colors.accent} />
              </View>
              <View style={styles.emptyTextContainer}>
                <Text style={styles.emptyTitle}>Look Back • {daysAgo} days ago</Text>
                <Text style={styles.emptySubtitle}>No journal entry found from this time</Text>
                <Text style={styles.emptyCta}>Write your first entry →</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const entryDate = new Date(pastEntry.createdAt);
  const actualDaysAgo = Math.floor(
    (new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Look back at journal entry from ${actualDaysAgo} days ago. ${error ? 'Content unavailable' : excerpt.substring(0, 50)}...`}
        accessibilityHint="Opens the full journal entry for reflection"
      >
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <Feather name="book-open" size={20} color={ds.colors.accent} />
            </View>

            <View style={styles.content}>
              <Text style={styles.header}>Look Back • {actualDaysAgo} days ago</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Feather name="lock" size={14} color={ds.colors.textSecondary} />
                  <Text style={styles.errorText}>Encrypted content</Text>
                </View>
              ) : (
                <Text style={styles.excerpt} numberOfLines={2}>
                  "{excerpt}"
                </Text>
              )}

              <View style={styles.ctaContainer}>
                <Text style={styles.ctaText}>Read & Reflect</Text>
                <Feather name="arrow-right" size={14} color={ds.colors.accent} />
              </View>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  emptyCard: {
    borderColor: ds.colors.accent,
    borderWidth: 1,
  },
  skeleton: {
    flexDirection: 'row',
    opacity: 0.5,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.bgTertiary,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 16,
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLineShort: {
    height: 16,
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 4,
    width: '60%',
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyTextContainer: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 14,
    color: ds.colors.accent,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: ds.colors.textSecondary,
    marginBottom: 4,
  },
  emptyCta: {
    fontSize: 14,
    color: ds.colors.accent,
    fontWeight: '600',
  },
  container: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    fontSize: 14,
    color: ds.colors.accent,
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 14,
    color: ds.colors.text,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: ds.colors.textSecondary,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  ctaText: {
    fontSize: 14,
    color: ds.colors.accent,
    fontWeight: '600',
  },
});

