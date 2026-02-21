/**
 * Review Card
 * Display card for 10th step nightly reviews
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Visual indicators for each question type
 * - Today/Yesterday highlighting
 * - Progress dots for quick visual scan
 * - Full accessibility support
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import * as Haptics from '@/platform/haptics';
import { ds } from '../../design-system/tokens/ds';

interface ReviewCardProps {
  date: Date;
  hasResentful?: boolean;
  hasSelfish?: boolean;
  hasDishonest?: boolean;
  hasAfraid?: boolean;
  hasApology?: boolean;
  hasBetter?: boolean;
  hasGratitude?: boolean;
  onPress?: () => void;
  enteringDelay?: number;
}

const REVIEW_ITEMS = [
  { key: 'resentful', color: ds.semantic.intent.alert.solid, label: 'Resentful' },
  { key: 'selfish', color: ds.colors.warning, label: 'Selfish' },
  { key: 'dishonest', color: ds.colors.warning, label: 'Dishonest' },
  { key: 'afraid', color: ds.colors.accent, label: 'Afraid' },
  { key: 'apology', color: ds.colors.info, label: 'Apology' },
  { key: 'better', color: ds.colors.info, label: 'Better' },
  { key: 'gratitude', color: ds.colors.success, label: 'Gratitude' },
] as const;

export function ReviewCard({
  date,
  hasResentful,
  hasSelfish,
  hasDishonest,
  hasAfraid,
  hasApology,
  hasBetter,
  hasGratitude,
  onPress,
  enteringDelay = 0,
}: ReviewCardProps) {
  const answeredStatuses = {
    resentful: hasResentful,
    selfish: hasSelfish,
    dishonest: hasDishonest,
    afraid: hasAfraid,
    apology: hasApology,
    better: hasBetter,
    gratitude: hasGratitude,
  };

  const answeredCount = Object.values(answeredStatuses).filter(Boolean).length;
  const totalQuestions = 7;

  const isToday = date.toDateString() === new Date().toDateString();
  const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).getTime().toString();

  const getDateLabel = () => {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }, [onPress]);

  const accessibilityLabel = `Nightly review for ${getDateLabel()}, ${answeredCount} of ${totalQuestions} questions answered`;

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 30)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens review details"
      >
        <GlassCard
          gradient={isToday ? 'elevated' : 'card'}
          style={[styles.card, isToday && styles.todayCard]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.dateCircle,
                  isToday ? styles.dateCircleToday : styles.dateCircleDefault,
                ]}
              >
                {isToday ? (
                  <Feather name="check" size={18} color={ds.semantic.text.onDark} />
                ) : (
                  <Text style={styles.dateNumber}>{date.getDate()}</Text>
                )}
              </View>
              <View>
                <Text style={[styles.dateLabel, isToday && styles.dateLabelToday]}>
                  {getDateLabel()}
                </Text>
                <Text style={styles.answeredText}>
                  {answeredCount}/{totalQuestions} questions
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ds.colors.textSecondary} />
          </View>

          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {REVIEW_ITEMS.map((item, _index) => {
              const isAnswered = answeredStatuses[item.key as keyof typeof answeredStatuses];
              return (
                <View
                  key={item.key}
                  style={[
                    styles.dot,
                    { backgroundColor: isAnswered ? item.color : ds.colors.bgTertiary },
                  ]}
                  accessibilityLabel={`${item.label}: ${isAnswered ? 'answered' : 'not answered'}`}
                />
              );
            })}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.success,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dateCircleDefault: {
    backgroundColor: ds.colors.bgTertiary,
  },
  dateCircleToday: {
    backgroundColor: ds.colors.success,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: ds.colors.textTertiary,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
  },
  dateLabelToday: {
    color: ds.colors.success,
  },
  answeredText: {
    fontSize: 14,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flex: 1,
  },
});

