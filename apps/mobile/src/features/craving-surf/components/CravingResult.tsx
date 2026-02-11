/**
 * Craving Result Component
 *
 * Shows before/after craving comparison with encouraging message.
 */

import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../../../design-system/components/Text';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';

interface CravingResultProps {
  initialRating: number;
  finalRating: number;
  reductionPercent: number;
  distractionUsed: string | null;
  onDone: () => void;
  testID?: string;
}

function getEncouragingMessage(reduction: number): string {
  if (reduction >= 50) return 'Amazing work! You surfed that craving like a pro.';
  if (reduction >= 25) return 'Great job! Every bit of relief matters.';
  if (reduction > 0) return 'You did it! The craving is passing, one moment at a time.';
  if (reduction === 0) return 'You stayed strong. Cravings always pass eventually.';
  return 'Sometimes cravings are tough. You showed courage by trying. Keep going.';
}

function getResultIcon(
  reduction: number,
): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  if (reduction >= 50) return 'star-circle';
  if (reduction >= 25) return 'thumb-up';
  if (reduction > 0) return 'check-circle';
  return 'heart';
}

const createStyles = (ds: DS) =>
  ({
    container: {
      alignItems: 'center' as const,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[6],
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${ds.colors.accent}20`,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[4],
    },
    title: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: ds.space[2],
    },
    message: {
      fontSize: 16,
      color: ds.semantic.text.muted,
      textAlign: 'center' as const,
      lineHeight: 24,
      marginBottom: ds.space[5],
      paddingHorizontal: ds.space[2],
    },
    comparisonCard: {
      width: '100%' as const,
      padding: ds.space[4],
      marginBottom: ds.space[5],
    },
    comparisonRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
    },
    ratingBlock: {
      alignItems: 'center' as const,
    },
    ratingLabel: {
      fontSize: 13,
      color: ds.semantic.text.muted,
      marginBottom: ds.space[1],
    },
    ratingValue: {
      fontSize: 36,
      fontWeight: '800' as const,
    },
    ratingOutOf: {
      fontSize: 12,
      color: ds.semantic.text.muted,
      marginTop: ds.space[1],
    },
    arrow: {
      marginHorizontal: ds.space[3],
    },
    reductionBadge: {
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      borderRadius: ds.radius.md,
      marginTop: ds.space[3],
      alignSelf: 'center' as const,
    },
    reductionText: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: ds.semantic.text.onAlert,
    },
    buttonContainer: {
      width: '100%' as const,
      paddingHorizontal: ds.space[2],
    },
  }) as const;

export function CravingResult({
  initialRating,
  finalRating,
  reductionPercent,
  onDone,
  testID,
}: CravingResultProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  const isImproved = reductionPercent > 0;
  const badgeColor = isImproved ? ds.colors.success : ds.colors.accent;
  const beforeColor = ds.colors.error;
  const afterColor = isImproved ? ds.colors.success : ds.colors.accentLight;

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel={`Results: craving went from ${initialRating} to ${finalRating}, ${reductionPercent}% reduction`}
      accessibilityRole="summary"
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getResultIcon(reductionPercent)}
          size={40}
          color={ds.colors.accent}
        />
      </View>

      <Text style={styles.title}>Great Job!</Text>
      <Text style={styles.message}>{getEncouragingMessage(reductionPercent)}</Text>

      <Card style={styles.comparisonCard}>
        <View style={styles.comparisonRow}>
          <View
            style={styles.ratingBlock}
            accessibilityLabel={`Before: ${initialRating} out of 10`}
          >
            <Text style={styles.ratingLabel}>Before</Text>
            <Text style={[styles.ratingValue, { color: beforeColor }]}>{initialRating}</Text>
            <Text style={styles.ratingOutOf}>/ 10</Text>
          </View>

          <MaterialCommunityIcons
            name="arrow-right"
            size={28}
            color={ds.semantic.text.muted}
            style={styles.arrow}
          />

          <View style={styles.ratingBlock} accessibilityLabel={`After: ${finalRating} out of 10`}>
            <Text style={styles.ratingLabel}>After</Text>
            <Text style={[styles.ratingValue, { color: afterColor }]}>{finalRating}</Text>
            <Text style={styles.ratingOutOf}>/ 10</Text>
          </View>
        </View>

        <View style={[styles.reductionBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.reductionText}>
            {isImproved ? `${reductionPercent}% reduction` : 'You stayed strong'}
          </Text>
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          onPress={onDone}
          accessibilityLabel="Done, return to previous screen"
          accessibilityRole="button"
          testID={testID ? `${testID}-done` : undefined}
        >
          Done
        </Button>
      </View>
    </View>
  );
}
