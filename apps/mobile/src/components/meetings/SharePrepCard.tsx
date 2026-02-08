/**
 * SharePrepCard Component
 * Quick access card to prepare for sharing at meetings
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Progress indicator for filled sections
 * - Topic preview
 * - Compact and full variants
 * - Full accessibility support
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouterCompat } from '../../utils/navigationHelper';
import { GlassCard } from '../../design-system/components/GlassCard';
import { useSharePrepStore } from '@recovery/shared';
import * as Haptics from 'expo-haptics';

interface SharePrepCardProps {
  compact?: boolean;
  enteringDelay?: number;
}

export function SharePrepCard({ compact = false, enteringDelay = 0 }: SharePrepCardProps) {
  const router = useRouterCompat();
  const { hasContent, notes } = useSharePrepStore();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/share-prep');
  }, [router]);

  // Count how many sections have content
  const filledSections = [
    notes.topic,
    notes.gratitude,
    notes.struggle,
    notes.experience,
    notes.other,
  ].filter((n) => n.trim()).length;

  const totalSections = 5;
  const progressPercent = (filledSections / totalSections) * 100;

  // Compact variant
  if (compact) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <TouchableOpacity
          onPress={handlePress}
          style={styles.compactContainer}
          accessibilityRole="button"
          accessibilityLabel={`Prepare to share at a meeting. ${filledSections} of ${totalSections} sections filled`}
          accessibilityHint="Opens share preparation screen"
        >
          <View style={styles.compactIconContainer}>
            <Feather name="edit-3" size={20} color="#fbbf24" />
          </View>
          <View style={styles.compactContent}>
            <Text style={styles.compactTitle}>Prepare to Share</Text>
            {hasContent() && (
              <Text style={styles.compactSubtitle}>
                {filledSections} section{filledSections !== 1 ? 's' : ''} ready
              </Text>
            )}
          </View>
          {hasContent() && <View style={styles.readyIndicator} />}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Full variant
  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Prepare to share at a meeting. ${filledSections} of ${totalSections} sections filled`}
        accessibilityHint="Opens share preparation screen"
      >
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Feather name="edit-3" size={22} color="#fbbf24" />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.title}>Prepare to Share</Text>
                <Text style={styles.subtitle}>
                  {hasContent()
                    ? `${filledSections} of ${totalSections} sections ready`
                    : 'Jot down notes for your share'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {hasContent() && <View style={styles.readyIndicatorLarge} />}
              <Feather name="chevron-right" size={20} color="#60a5fa" />
            </View>
          </View>

          {/* Progress bar */}
          {hasContent() && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          )}

          {/* Preview of content if exists */}
          {hasContent() && notes.topic.trim() && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Topic:</Text>
              <Text style={styles.previewText} numberOfLines={2}>
                {notes.topic.trim()}
              </Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  compactSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  readyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  // Full styles
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readyIndicatorLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  progressContainer: {
    marginTop: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
  previewContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  previewLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#e2e8f0',
  },
});
