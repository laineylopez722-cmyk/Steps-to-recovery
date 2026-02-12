/**
 * ChallengesScreen
 *
 * Main screen for the streak & challenge system. Shows three sections:
 * 1. Active Challenges — with live progress bars
 * 2. Available Challenges — templates the user can start
 * 3. Completed Challenges — past wins with badges
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { ActiveChallenges } from '../components/ActiveChallenges';
import { TemplateChallengeCard, CompletedChallengeCard } from '../components/ChallengeCard';
import { useChallenges, useStartChallenge, useAbandonChallenge } from '../hooks/useChallenges';
import { logger } from '../../../utils/logger';
import type { ChallengeTemplate } from '../types';

export interface ChallengesScreenProps {
  userId: string;
}

export function ChallengesScreen({ userId }: ChallengesScreenProps): React.ReactElement {
  const theme = useTheme();
  const { activeChallenges, completedChallenges, availableTemplates, isLoading, refetch } =
    useChallenges(userId);

  const { startChallenge, isPending: isStarting } = useStartChallenge(userId);
  const { abandonChallenge, isPending: isAbandoning } = useAbandonChallenge(userId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      logger.error('Failed to refresh challenges', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleStart = useCallback(
    (template: ChallengeTemplate) => {
      Alert.alert(
        'Start Challenge',
        `Begin "${template.title}"?\n\nYou have ${template.duration} days to complete this challenge.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              try {
                await startChallenge(template);
              } catch (err) {
                logger.error('Failed to start challenge', err);
              }
            },
          },
        ],
      );
    },
    [startChallenge],
  );

  const handleAbandon = useCallback(
    (challengeId: string) => {
      Alert.alert('Abandon Challenge', 'Are you sure? Your progress will be lost.', [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            try {
              await abandonChallenge(challengeId);
            } catch (err) {
              logger.error('Failed to abandon challenge', err);
            }
          },
        },
      ]);
    },
    [abandonChallenge],
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.semantic.surface.app }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          accessibilityLabel="Pull to refresh challenges"
        />
      }
      accessibilityLabel="Challenges screen"
      accessibilityRole="scrollbar"
    >
      {/* ---- Active Challenges ---- */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="fire" size={20} color={theme.colors.warning} />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.text }]}
            accessibilityRole="header"
          >
            Active Challenges
          </Text>
        </View>
        <ActiveChallenges challenges={activeChallenges} onAbandon={handleAbandon} />
      </View>

      {/* ---- Available Challenges ---- */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="trophy-outline" size={20} color={theme.colors.primary} />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.text }]}
            accessibilityRole="header"
          >
            Available Challenges
          </Text>
        </View>
        {availableTemplates.length === 0 ? (
          <Text
            style={[styles.emptyNote, { color: theme.colors.textSecondary }]}
            accessibilityLabel="All challenges are active"
            accessibilityRole="text"
          >
            You have started all available challenges!
          </Text>
        ) : (
          availableTemplates.map((t) => (
            <TemplateChallengeCard
              key={t.id}
              template={t}
              onStart={handleStart}
              disabled={isStarting || isAbandoning || isLoading}
            />
          ))
        )}
      </View>

      {/* ---- Completed Challenges ---- */}
      {completedChallenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="medal" size={20} color={theme.colors.success} />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.text }]}
              accessibilityRole="header"
            >
              Completed
            </Text>
          </View>
          {completedChallenges.map((c) => (
            <CompletedChallengeCard key={c.id} challenge={c} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyNote: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
