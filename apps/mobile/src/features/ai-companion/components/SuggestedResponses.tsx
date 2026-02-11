/**
 * Suggested Responses
 * Contextual follow-up pill buttons shown after AI messages.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import type { ConversationType } from '../types';

interface SuggestedResponsesProps {
  conversationType: ConversationType;
  lastAssistantMessage?: string;
  onSelect: (text: string) => void;
}

const SUGGESTIONS: Record<ConversationType, string[]> = {
  general: [
    'Tell me more about that',
    'What should I do next?',
    "I'm not sure how I feel",
    'Can you help me with my step work?',
  ],
  step_work: [
    'I need help with this question',
    'Can you give me an example?',
    "I'm ready for the next question",
    "I'm struggling with this step",
  ],
  crisis: [
    "I'm feeling a little better",
    'Can you help me calm down?',
    'I want to call my sponsor',
    'Tell me about the grounding exercise',
  ],
  check_in: [
    'I had a good day',
    "I'm struggling today",
    'I want to journal about this',
    'What should I focus on tomorrow?',
  ],
};

export function SuggestedResponses({
  conversationType,
  lastAssistantMessage,
  onSelect,
}: SuggestedResponsesProps): React.ReactElement | null {
  const styles = useThemedStyles(createStyles);

  // Get context-appropriate suggestions
  let suggestions = SUGGESTIONS[conversationType] || SUGGESTIONS.general;

  // Refine based on last message content
  if (lastAssistantMessage) {
    const lower = lastAssistantMessage.toLowerCase();
    if (lower.includes('how are you') || lower.includes('how do you feel')) {
      suggestions = ["I'm doing well", "It's been tough", "I'm grateful today", 'I need to talk'];
    } else if (lower.includes('proud') || lower.includes('congratulat')) {
      suggestions = ['Thank you!', 'It means a lot', 'What should I work on next?'];
    } else if (lower.includes('breathe') || lower.includes('grounding')) {
      suggestions = ["I'll try that", 'Can you walk me through it?', "I'm calming down"];
    }
  }

  const handlePress = (text: string): void => {
    Haptics.selectionAsync().catch(() => {});
    onSelect(text);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((text) => (
          <Pressable
            key={text}
            onPress={() => handlePress(text)}
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
            accessibilityRole="button"
            accessibilityLabel={text}
          >
            <Text style={styles.pillText}>{text}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      paddingVertical: ds.space[2],
    },
    scrollContent: {
      paddingHorizontal: ds.space[4],
      gap: ds.space[2],
    },
    pill: {
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.full,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[2],
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
    },
    pillPressed: {
      backgroundColor: ds.colors.accent,
      borderColor: ds.colors.accent,
    },
    pillText: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
    },
  }) as const;
