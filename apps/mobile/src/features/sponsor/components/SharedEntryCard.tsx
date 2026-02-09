/**
 * SharedEntryCard - Card component for displaying shared journal entries
 * Shows entry preview with mood indicator and unread badge
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { ds } from '../../../design-system/tokens/ds';
import type { SharedEntryView } from '../hooks/useSponsorSharedEntries';

interface SharedEntryCardProps {
  entry: SharedEntryView;
  onPress: (entry: SharedEntryView) => void;
  index?: number;
}

export function SharedEntryCard({
  entry,
  onPress,
  index = 0,
}: SharedEntryCardProps): React.ReactElement {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getMoodColor = (mood: number | null) => {
    if (!mood) return darkAccent.textSubtle;
    const colors = [ds.semantic.intent.alert.solid, ds.colors.warning, ds.colors.textTertiary, ds.colors.success, ds.colors.info];
    return colors[mood - 1] || darkAccent.textSubtle;
  };

  const getMoodLabel = (mood: number | null) => {
    if (!mood) return null;
    const labels = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'];
    return labels[mood - 1] || null;
  };

  const getPreviewText = (body: string) => {
    return body.replace(/\n/g, ' ').slice(0, 100) + (body.length > 100 ? '...' : '');
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
      <Pressable
        onPress={() => onPress(entry)}
        accessibilityRole="button"
        accessibilityLabel={`Shared entry: ${entry.title || 'Untitled'}`}
        accessibilityHint="Tap to view full entry details"
      >
        <GlassCard intensity="medium" style={styles.card} pressable>
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(entry.mood) }]} />
              <Text style={styles.title} numberOfLines={1}>
                {entry.title || 'Untitled Entry'}
              </Text>
            </View>
            <Text style={styles.date}>{formatDate(entry.sharedAt)}</Text>
          </View>

          {/* Body Preview */}
          <Text style={styles.body} numberOfLines={3}>
            {getPreviewText(entry.body)}
          </Text>

          {/* Footer with Mood & Tags */}
          <View style={styles.footer}>
            {entry.mood && (
              <View style={styles.moodChip}>
                <MaterialIcons name="mood" size={14} color={getMoodColor(entry.mood)} />
                <Text style={[styles.moodText, { color: getMoodColor(entry.mood) }]}>
                  {getMoodLabel(entry.mood)}
                </Text>
              </View>
            )}

            {entry.craving !== null && entry.craving > 3 && (
              <View style={[styles.cravingChip, styles.highCraving]}>
                <MaterialIcons name="warning" size={14} color={ds.colors.warning} />
                <Text style={styles.cravingText}>High Craving</Text>
              </View>
            )}

            {entry.tags.length > 0 && (
              <View style={styles.tagContainer}>
                <MaterialIcons name="label" size={12} color={darkAccent.textSubtle} />
                <Text style={styles.tagText} numberOfLines={1}>
                  {entry.tags.slice(0, 2).join(', ')}
                  {entry.tags.length > 2 && ` +${entry.tags.length - 2}`}
                </Text>
              </View>
            )}

            <View style={styles.spacer} />

            <MaterialIcons name="chevron-right" size={20} color={darkAccent.textSubtle} />
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[1.5],
  },
  moodIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    ...typography.h4,
    color: darkAccent.text,
    flex: 1,
  },
  date: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginLeft: spacing[2],
  },
  body: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    flexWrap: 'wrap',
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: `${darkAccent.primary}10`,
  },
  moodText: {
    ...typography.caption,
    fontWeight: '600',
  },
  cravingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  highCraving: {
    backgroundColor: ds.colors.warningMuted,
  },
  cravingText: {
    ...typography.caption,
    color: ds.colors.warning,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    ...typography.caption,
    color: darkAccent.textSubtle,
    maxWidth: 100,
  },
  spacer: {
    flex: 1,
  },
});
