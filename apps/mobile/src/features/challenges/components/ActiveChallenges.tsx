/**
 * ActiveChallenges Component
 *
 * Section that lists all currently active challenges with progress bars.
 * Renders an empty-state prompt when no challenges are active.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { ActiveChallengeCard } from './ChallengeCard';
import type { Challenge } from '../types';

export interface ActiveChallengesProps {
  challenges: Challenge[];
  onAbandon: (id: string) => void;
}

export function ActiveChallenges({
  challenges,
  onAbandon,
}: ActiveChallengesProps): React.ReactElement {
  const theme = useTheme();

  if (challenges.length === 0) {
    return (
      <View style={styles.empty}>
        <Text
          style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          accessibilityLabel="No active challenges. Start one below."
          accessibilityRole="text"
        >
          No active challenges yet. Pick one below to get started!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {challenges.map((c) => (
        <ActiveChallengeCard key={c.id} challenge={c} onAbandon={onAbandon} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
