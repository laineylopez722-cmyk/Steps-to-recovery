/**
 * Rich Message Cards
 * Structured content cards for step work, exercises, crisis resources.
 * Renders special card types within the chat stream.
 */

import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

export type CardType = 'crisis_resource' | 'step_prompt' | 'exercise' | 'milestone' | 'insight';

export interface RichCard {
  type: CardType;
  title: string;
  body: string;
  emoji?: string;
  actions?: CardAction[];
}

interface CardAction {
  label: string;
  type: 'link' | 'navigate' | 'callback';
  value: string;
  onPress?: () => void;
}

interface RichMessageCardProps {
  card: RichCard;
  onAction?: (action: CardAction) => void;
}

export function RichMessageCard({ card, onAction }: RichMessageCardProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const handleAction = (action: CardAction): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (action.type === 'link') {
      Linking.openURL(action.value).catch(() => {});
    } else if (action.onPress) {
      action.onPress();
    } else if (onAction) {
      onAction(action);
    }
  };

  const borderColor =
    {
      crisis_resource: ds.colors.error,
      step_prompt: ds.colors.accent,
      exercise: ds.colors.success,
      milestone: ds.colors.warning,
      insight: ds.colors.info,
    }[card.type] || ds.colors.borderSubtle;

  return (
    <View
      style={[styles.card, { borderLeftColor: borderColor }]}
      accessibilityRole="summary"
      accessibilityLabel={`${card.title}: ${card.body}`}
    >
      <View style={styles.header}>
        {card.emoji && <Text style={styles.emoji}>{card.emoji}</Text>}
        <Text style={styles.title}>{card.title}</Text>
      </View>

      <Text style={styles.body}>{card.body}</Text>

      {card.actions && card.actions.length > 0 && (
        <View style={styles.actions}>
          {card.actions.map((action, i) => (
            <Pressable
              key={`${action.label}-${i}`}
              onPress={() => handleAction(action)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text style={styles.actionText}>{action.label}</Text>
              {action.type === 'link' && (
                <Feather name="external-link" size={14} color={ds.colors.accent} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Parse special card markup from AI responses.
 * Format: [CARD:type|title|body|action_label:action_url]
 */
export function parseRichCards(text: string): { cleanText: string; cards: RichCard[] } {
  const cards: RichCard[] = [];
  const cardPattern = /\[CARD:(\w+)\|([^|]+)\|([^|]+)(?:\|([^\]]+))?\]/g;

  let match;
  while ((match = cardPattern.exec(text)) !== null) {
    const [, type, title, body, actionStr] = match;
    const card: RichCard = {
      type: type as CardType,
      title,
      body,
    };

    if (actionStr) {
      const actionParts = actionStr.split(':');
      if (actionParts.length >= 2) {
        card.actions = [
          {
            label: actionParts[0],
            type: actionParts[1].startsWith('http') ? 'link' : 'navigate',
            value: actionParts.slice(1).join(':'),
          },
        ];
      }
    }

    cards.push(card);
  }

  const cleanText = text.replace(cardPattern, '').trim();
  return { cleanText, cards };
}

/**
 * Create common card presets
 */
export function createCrisisCard(): RichCard {
  return {
    type: 'crisis_resource',
    title: 'Crisis Resources',
    body: "You're not alone. Help is available right now.",
    emoji: '🆘',
    actions: [
      { label: '988 Lifeline', type: 'link', value: 'tel:988' },
      { label: 'Crisis Text (741741)', type: 'link', value: 'sms:741741&body=HOME' },
      { label: 'SAMHSA (1-800-662-4357)', type: 'link', value: 'tel:18006624357' },
    ],
  };
}

export function createMilestoneCard(days: number): RichCard {
  const milestoneEmoji: Record<number, string> = {
    1: '🌱',
    7: '🌿',
    14: '🌳',
    30: '⭐',
    60: '🌟',
    90: '💫',
    180: '🏆',
    365: '👑',
  };
  return {
    type: 'milestone',
    title: `${days} Days!`,
    body: `You've made it ${days} days in recovery. Every single day is a victory.`,
    emoji: milestoneEmoji[days] || '🎉',
  };
}

export function createStepCard(stepNumber: number, prompt: string): RichCard {
  return {
    type: 'step_prompt',
    title: `Step ${stepNumber}`,
    body: prompt,
    emoji: '📖',
    actions: [{ label: 'Start Step Work', type: 'navigate', value: `step_work_${stepNumber}` }],
  };
}

const createStyles = (ds: DS) =>
  ({
    card: {
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: ds.colors.accent,
      padding: ds.space[4],
      marginHorizontal: ds.space[4],
      marginVertical: ds.space[2],
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[2],
    },
    emoji: {
      fontSize: 20,
      marginRight: ds.space[2],
    },
    title: {
      ...ds.typography.body,
      fontWeight: '600' as const,
      color: ds.colors.textPrimary,
      flex: 1,
    },
    body: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      lineHeight: 20,
      marginBottom: ds.space[3],
    },
    actions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: ds.space[2],
    },
    actionBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.full,
      gap: ds.space[1],
    },
    actionBtnPressed: {
      opacity: 0.7,
    },
    actionText: {
      ...ds.typography.micro,
      color: ds.colors.accent,
      fontWeight: '500' as const,
    },
  }) as const;
