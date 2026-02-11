/**
 * ChallengeProgress Component
 *
 * Displays a progress bar with label showing current / target and days remaining.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { ProgressBar } from '../../../design-system/components/ProgressBar';
import type { Challenge } from '../types';

export interface ChallengeProgressProps {
  challenge: Challenge;
}

export function ChallengeProgress({ challenge }: ChallengeProgressProps): React.ReactElement {
  const theme = useTheme();
  const progress = challenge.target > 0 ? challenge.currentProgress / challenge.target : 0;
  const pct = Math.round(progress * 100);

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Progress: ${challenge.currentProgress} of ${challenge.target}, ${pct} percent complete`}
      accessibilityRole="text"
    >
      <View style={styles.labelRow}>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {challenge.currentProgress} / {challenge.target}
        </Text>
        <Text style={[styles.daysText, { color: theme.colors.textSecondary }]}>
          {challenge.status === 'active'
            ? `${challenge.daysRemaining}d left`
            : challenge.status === 'completed'
              ? 'Completed'
              : 'Expired'}
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        height={8}
        color={
          challenge.status === 'completed'
            ? theme.colors.success
            : challenge.status === 'failed'
              ? theme.colors.danger
              : theme.colors.primary
        }
        accessibilityLabel={`${pct}% complete`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  daysText: {
    fontSize: 12,
    fontWeight: '400',
  },
});
