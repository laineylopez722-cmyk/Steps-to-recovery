import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { JournalEntryDecrypted } from '@recovery/shared';
import { useTheme, Card, Badge } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

// Constants
const MAX_BODY_LENGTH = 100;
const MAX_VISIBLE_TAGS = 2;
const MOOD_RANGE = { min: 1, max: 5 } as const;
const CRAVING_RANGE = { min: 0, max: 10 } as const;

interface JournalCardProps {
  entry: JournalEntryDecrypted;
  onPress: () => void;
  accessibilityHint?: string;
}

const MOOD_EMOJI: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
} as const;

// Helper function to safely get mood emoji with bounds checking
const getMoodEmoji = (mood: number | null): string => {
  if (mood === null) return '';
  const clampedMood = Math.max(MOOD_RANGE.min, Math.min(MOOD_RANGE.max, mood));
  return MOOD_EMOJI[clampedMood];
};

// Helper function to get craving color based on level with bounds checking
const getCravingColor = (craving: number | null, theme: ReturnType<typeof useTheme>): string => {
  if (craving === null) return theme.colors.textSecondary;

  const clampedCraving = Math.max(CRAVING_RANGE.min, Math.min(CRAVING_RANGE.max, craving));

  if (clampedCraving <= 2) return theme.colors.success;
  if (clampedCraving <= 4) return theme.colors.successMuted;
  if (clampedCraving <= 6) return theme.colors.warning;
  return theme.colors.danger;
};

export const JournalCard = React.memo(function JournalCard({
  entry,
  onPress,
  accessibilityHint,
}: JournalCardProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      if (hours < 48) return 'Yesterday';
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }, []);

  const truncateBody = useCallback((text: string, maxLength: number = MAX_BODY_LENGTH): string => {
    if (!text || text.length <= maxLength) return text || '';
    return `${text.substring(0, maxLength)}...`;
  }, []);

  return (
    <Card
      variant="interactive"
      onPress={onPress}
      animate
      style={styles.cardContainer}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {entry.title && (
            <Text
              style={[theme.typography.h3, { color: theme.colors.text, fontWeight: '600' }]}
              numberOfLines={1}
            >
              {entry.title}
            </Text>
          )}
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}
          >
            {formatDate(entry.created_at)}
          </Text>
        </View>
        <MaterialCommunityIcons name="lock" size={16} color={theme.colors.textSecondary} />
      </View>

      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.text, marginBottom: 12, lineHeight: 20 },
        ]}
        numberOfLines={3}
      >
        {truncateBody(entry.body)}
      </Text>

      <View style={styles.footer}>
        <View style={styles.indicators}>
          {entry.mood !== null && (
            <View
              style={styles.indicator}
              accessibilityLabel={`Mood level: ${entry.mood} out of 5`}
              accessibilityRole="text"
            >
              <Text style={styles.emoji}>{getMoodEmoji(entry.mood)}</Text>
            </View>
          )}
          {entry.craving !== null && (
            <View
              style={[
                styles.cravingIndicator,
                { backgroundColor: getCravingColor(entry.craving, theme) },
              ]}
              accessibilityLabel={`Craving level: ${entry.craving} out of 10`}
              accessibilityRole="text"
            >
              <Text
                style={[
                  styles.cravingText,
                  { color: theme.colors.textInverse || ds.semantic.text.onDark },
                ]}
              >
                {entry.craving}
              </Text>
            </View>
          )}
        </View>

        {entry.tags.length > 0 && (
          <View style={styles.tags}>
            {entry.tags.slice(0, MAX_VISIBLE_TAGS).map((tag, index) => (
              <Badge key={`${tag}-${index}`} variant="primary" size="small">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > MAX_VISIBLE_TAGS && (
              <Text
                style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
                accessibilityLabel={`${entry.tags.length - MAX_VISIBLE_TAGS} more tags`}
              >
                +{entry.tags.length - MAX_VISIBLE_TAGS}
              </Text>
            )}
          </View>
        )}
      </View>
    </Card>
  );
});
JournalCard.displayName = 'JournalCard';

const createStyles = (_ds: DS) =>
  ({
    cardContainer: {
      marginHorizontal: 16,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 8,
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    footer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    indicators: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    indicator: {
      padding: 4,
    },
    emoji: {
      fontSize: 20,
    },
    cravingIndicator: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    cravingText: {
      fontSize: 12,
      fontWeight: 'bold' as const,
      color: 'white' as const,
    },
    tags: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
  }) as const;
