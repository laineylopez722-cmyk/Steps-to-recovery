/**
 * ChallengeCard Component
 *
 * Displays a single challenge with title, description, difficulty badge,
 * progress bar and action button.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../design-system/components/Card';
import { Badge } from '../../../design-system/components/Badge';
import { Button } from '../../../design-system/components/Button';
import { ChallengeProgress } from './ChallengeProgress';
import type { Challenge, ChallengeTemplate, ChallengeDifficulty } from '../types';
import { useDs } from '../../../design-system';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_VARIANT: Record<ChallengeDifficulty, 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

const TYPE_ICON: Record<string, string> = {
  meeting: 'account-group',
  journal: 'book-open-variant',
  checkin: 'check-circle-outline',
  step: 'stairs',
  gratitude: 'heart-outline',
};

// ---------------------------------------------------------------------------
// Active challenge card
// ---------------------------------------------------------------------------

export interface ActiveChallengeCardProps {
  challenge: Challenge;
  onAbandon?: (id: string) => void;
}

export function ActiveChallengeCard({
  challenge,
  onAbandon,
}: ActiveChallengeCardProps): React.ReactElement {
  const ds = useDs();
  const iconName = (TYPE_ICON[challenge.type] ??
    'star-outline') as keyof typeof MaterialCommunityIcons.glyphMap;

  return (
    <Card
      variant="elevated"
      style={styles.card}
      accessibilityLabel={`${challenge.title}, ${challenge.currentProgress} of ${challenge.target} complete`}
      accessibilityRole="summary"
    >
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name={iconName} size={24} color={ds.semantic.intent.primary.solid} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: ds.semantic.text.primary }]} numberOfLines={1}>
            {challenge.title}
          </Text>
          <Badge variant={DIFFICULTY_VARIANT[challenge.difficulty]} size="small">
            {challenge.difficulty}
          </Badge>
        </View>
      </View>

      <Text style={[styles.description, { color: ds.semantic.text.secondary }]} numberOfLines={2}>
        {challenge.description}
      </Text>

      <ChallengeProgress challenge={challenge} />

      {challenge.status === 'active' && onAbandon && (
        <Button
          variant="outline"
          size="small"
          title="Abandon"
          onPress={() => onAbandon(challenge.id)}
          accessibilityLabel={`Abandon ${challenge.title}`}
          accessibilityRole="button"
          style={styles.abandonBtn}
        />
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Template card (not started)
// ---------------------------------------------------------------------------

export interface TemplateChallengeCardProps {
  template: ChallengeTemplate;
  onStart: (template: ChallengeTemplate) => void;
  disabled?: boolean;
}

export function TemplateChallengeCard({
  template,
  onStart,
  disabled,
}: TemplateChallengeCardProps): React.ReactElement {
  const ds = useDs();
  const iconName = (TYPE_ICON[template.type] ??
    'star-outline') as keyof typeof MaterialCommunityIcons.glyphMap;

  return (
    <Card
      variant="outlined"
      style={styles.card}
      accessibilityLabel={`${template.title}, ${template.difficulty} difficulty, ${template.duration} days`}
      accessibilityRole="summary"
    >
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name={iconName} size={24} color={ds.semantic.intent.primary.solid} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: ds.semantic.text.primary }]} numberOfLines={1}>
            {template.title}
          </Text>
          <Badge variant={DIFFICULTY_VARIANT[template.difficulty]} size="small">
            {template.difficulty}
          </Badge>
        </View>
      </View>

      <Text style={[styles.description, { color: ds.semantic.text.secondary }]} numberOfLines={2}>
        {template.description}
      </Text>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: ds.semantic.text.secondary }]}>
          {template.target} {template.type === 'step' ? 'questions' : 'days'} · {template.duration}{' '}
          day{template.duration > 1 ? 's' : ''}
        </Text>
      </View>

      <Button
        variant="primary"
        size="medium"
        title="Start Challenge"
        onPress={() => onStart(template)}
        disabled={disabled}
        accessibilityLabel={`Start ${template.title}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        style={styles.startBtn}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Completed challenge card
// ---------------------------------------------------------------------------

export interface CompletedChallengeCardProps {
  challenge: Challenge;
}

export function CompletedChallengeCard({
  challenge,
}: CompletedChallengeCardProps): React.ReactElement {
  const ds = useDs();
  const iconName = (TYPE_ICON[challenge.type] ??
    'star-outline') as keyof typeof MaterialCommunityIcons.glyphMap;

  return (
    <Card
      variant="flat"
      style={[styles.card, { opacity: 0.85 }]}
      accessibilityLabel={`Completed: ${challenge.title}`}
      accessibilityRole="summary"
    >
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name={iconName} size={24} color={ds.semantic.intent.success.solid} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: ds.semantic.text.primary }]} numberOfLines={1}>
            {challenge.title}
          </Text>
          <Badge variant="success" size="small">
            ✓ Done
          </Badge>
        </View>
      </View>

      <ChallengeProgress challenge={challenge} />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
  startBtn: {
    marginTop: 4,
  },
  abandonBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});
