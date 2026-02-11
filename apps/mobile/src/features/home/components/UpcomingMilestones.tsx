/**
 * UpcomingMilestones
 * Shows the next 3 predicted milestones with countdowns on the home screen.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useMilestonePredictions } from '../hooks/useMilestonePredictions';
import type { MilestonePrediction } from '../hooks/useMilestonePredictions';

interface UpcomingMilestonesProps {
  userId: string;
}

function MilestoneRow({
  prediction,
  index,
}: {
  prediction: MilestonePrediction;
  index: number;
}): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const countdownText =
    prediction.daysAway !== undefined && prediction.daysAway !== null
      ? prediction.daysAway === 1
        ? '1 day away!'
        : `${prediction.daysAway} days away`
      : 'In progress';

  return (
    <Animated.View entering={FadeInUp.delay(200 + index * 80)}>
      <Pressable
        style={({ pressed }) => [styles.milestoneRow, pressed && styles.milestoneRowPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${prediction.title}, ${countdownText}`}
        accessibilityHint={prediction.description}
      >
        <Text style={styles.milestoneEmoji}>{prediction.emoji}</Text>
        <View style={styles.milestoneContent}>
          <Text style={styles.milestoneTitle}>{prediction.title}</Text>
          <Text style={styles.milestoneDesc}>{prediction.description}</Text>
        </View>
        <View style={styles.countdownBadge}>
          <Text
            style={[
              styles.countdownText,
              prediction.daysAway !== undefined &&
                prediction.daysAway <= 3 && { color: ds.semantic.intent.primary.solid },
            ]}
          >
            {countdownText}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function UpcomingMilestones({ userId }: UpcomingMilestonesProps): React.ReactElement | null {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { predictions, isLoading } = useMilestonePredictions(userId);

  if (isLoading || predictions.length === 0) {
    return null;
  }

  const topThree = predictions.slice(0, 3);

  return (
    <Animated.View entering={FadeInUp.delay(150)} style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Upcoming milestones</Text>
        <Feather name="award" size={14} color={ds.semantic.text.muted} />
      </View>

      <View style={styles.card} accessibilityRole="list" accessibilityLabel="Upcoming milestones">
        {topThree.map((prediction, index) => (
          <MilestoneRow
            key={`${prediction.type}-${prediction.title}`}
            prediction={prediction}
            index={index}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      marginBottom: ds.space[5],
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: ds.space[3],
      marginLeft: ds.space[1],
    },
    sectionTitle: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    card: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
    },
    milestoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      gap: ds.space[3],
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.borderDefault,
    },
    milestoneRowPressed: {
      backgroundColor: ds.semantic.surface.interactive,
    },
    milestoneEmoji: {
      fontSize: 24,
      width: 32,
      textAlign: 'center',
    },
    milestoneContent: {
      flex: 1,
    },
    milestoneTitle: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      fontWeight: '600',
    },
    milestoneDesc: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      marginTop: 2,
    },
    countdownBadge: {
      backgroundColor: ds.semantic.intent.primary.muted,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[1],
      borderRadius: ds.radius.full,
    },
    countdownText: {
      ...ds.typography.micro,
      color: ds.semantic.text.secondary,
      fontWeight: '700',
    },
  }) as const;
