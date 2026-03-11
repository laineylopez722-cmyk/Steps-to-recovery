/**
 * CopingRecommendationsScreen
 *
 * Personalised coping strategies ranked by the user's own historical patterns.
 * "What works for YOU" — not generic tips.
 * Accessible from Home quick actions, CravingSurf, and the RelapseRiskCard CTA.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useCopingRecommendations } from '../hooks/useCopingRecommendations';
import type { CopingStrategy } from '../../ai-companion/services/copingRecommender';
import type { HomeStackScreenProps } from '../../../navigation/types';

type Props = HomeStackScreenProps<'CopingRecommendations'>;

const TREND_LABELS = {
  improving: { label: 'Improving', icon: 'trending-down' as const, color: '#22c55e' },
  stable: { label: 'Stable', icon: 'minus' as const, color: '#f59e0b' },
  worsening: { label: 'Needs attention', icon: 'trending-up' as const, color: '#ef4444' },
};

const TIME_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

function StrategyCard({
  strategy,
  onPress,
}: {
  strategy: CopingStrategy;
  onPress: () => void;
}): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  const confidencePct = Math.round(strategy.confidence * 100);

  return (
    <Pressable
      style={styles.strategyCard}
      onPress={onPress}
      accessibilityLabel={`${strategy.title}. ${strategy.description}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to use this strategy"
    >
      <View style={styles.strategyHeader}>
        <View style={[styles.strategyIconBox, { backgroundColor: ds.semantic.surface.elevated }]}>
          <Feather
            name={strategy.icon as ComponentProps<typeof Feather>['name']}
            size={20}
            color={ds.semantic.intent.primary.solid}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <View style={styles.strategyTitleBlock}>
          <Text style={styles.strategyTitle}>{strategy.title}</Text>
          <Text style={styles.confidenceText} accessibilityLabel={`${confidencePct}% match for your patterns`}>
            {confidencePct}% match for you
          </Text>
        </View>
        <Feather
          name="arrow-right"
          size={16}
          color={ds.semantic.text.tertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      <Text style={styles.strategyDesc}>{strategy.description}</Text>
      <View style={styles.reasonBox}>
        <Feather
          name="info"
          size={12}
          color={ds.semantic.text.tertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={styles.reasonText}>{strategy.reason}</Text>
      </View>
    </Pressable>
  );
}

export function CopingRecommendationsScreen({ navigation, route }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  const userId = route.params?.userId ?? '';

  const { recommendations, isLoading, error, refetch } = useCopingRecommendations(userId);

  const handleStrategyPress = (strategy: CopingStrategy): void => {
    switch (strategy.actionRoute) {
      case 'MindfulnessLibrary':
        navigation.navigate('MindfulnessLibrary');
        break;
      case 'CravingSurf':
        navigation.navigate('CravingSurf');
        break;
      case 'CompanionChat':
        navigation.navigate('CompanionChat');
        break;
      case 'DailyReading':
        navigation.navigate('DailyReading');
        break;
      case 'Gratitude':
        navigation.navigate('Gratitude');
        break;
      case 'Journal':
        navigation.getParent()?.navigate('Journal' as never);
        break;
      case 'Meetings':
        navigation.getParent()?.navigate('Meetings' as never);
        break;
      default:
        break;
    }
  };

  const trendMeta = recommendations
    ? TREND_LABELS[recommendations.currentCravingContext.trend]
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={ds.semantic.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>What Works For You</Text>
        <Pressable
          style={styles.refreshBtn}
          onPress={refetch}
          accessibilityLabel="Refresh recommendations"
          accessibilityRole="button"
        >
          <Feather name="refresh-cw" size={18} color={ds.semantic.text.secondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ds.semantic.intent.primary.solid} />
          <Text style={styles.loadingText}>Analysing your patterns...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={32} color={ds.semantic.intent.alert.solid} />
          <Text style={styles.errorText}>Could not load recommendations.</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={refetch}
            accessibilityRole="button"
            accessibilityLabel="Retry loading recommendations"
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : recommendations ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Context card */}
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Your Current Pattern</Text>
            <View style={styles.contextRow}>
              <View style={styles.contextItem}>
                <Feather
                  name="clock"
                  size={14}
                  color={ds.semantic.text.tertiary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={styles.contextLabel}>
                  {TIME_LABELS[recommendations.currentCravingContext.timeOfDay]}
                </Text>
              </View>
              <View style={styles.contextItem}>
                <Feather
                  name="activity"
                  size={14}
                  color={ds.semantic.text.tertiary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={styles.contextLabel}>
                  Typical craving: {recommendations.currentCravingContext.typicalCravingLevel}/10
                </Text>
              </View>
              {trendMeta && (
                <View style={styles.contextItem}>
                  <Feather
                    name={trendMeta.icon}
                    size={14}
                    color={trendMeta.color}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text style={[styles.contextLabel, { color: trendMeta.color }]}>
                    {trendMeta.label}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.personalNote}>{recommendations.personalNote}</Text>
          </View>

          {/* Strategies */}
          <Text style={styles.sectionLabel}>Recommended for you right now</Text>
          {recommendations.strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onPress={() => handleStrategyPress(strategy)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.borderDefault,
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      ...ds.typography.h2,
      color: ds.semantic.text.primary,
      textAlign: 'center',
    },
    refreshBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: ds.space[3],
    },
    loadingText: {
      ...ds.typography.body,
      color: ds.semantic.text.secondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: ds.space[3],
      paddingHorizontal: ds.space[6],
    },
    errorText: {
      ...ds.typography.body,
      color: ds.semantic.text.secondary,
      textAlign: 'center',
    },
    retryBtn: {
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[2],
      borderRadius: ds.radius.md,
      backgroundColor: ds.semantic.intent.primary.solid,
    },
    retryText: {
      ...ds.typography.h3,
      color: '#fff',
      fontWeight: '600',
    },
    content: {
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[4],
      gap: ds.space[3],
    },
    contextCard: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
      padding: ds.space[4],
      gap: ds.space[2],
      marginBottom: ds.space[1],
    },
    contextTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
      fontWeight: '600',
    },
    contextRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ds.space[3],
    },
    contextItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[1],
    },
    contextLabel: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
    },
    personalNote: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      lineHeight: 18,
      marginTop: ds.space[1],
    },
    sectionLabel: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: ds.space[1],
    },
    strategyCard: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
      padding: ds.space[4],
      gap: ds.space[2],
    },
    strategyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[3],
    },
    strategyIconBox: {
      width: 40,
      height: 40,
      borderRadius: ds.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    strategyTitleBlock: {
      flex: 1,
    },
    strategyTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
      fontWeight: '600',
    },
    confidenceText: {
      ...ds.typography.micro,
      color: ds.semantic.intent.primary.solid,
    },
    strategyDesc: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      lineHeight: 18,
    },
    reasonBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ds.space[1],
      backgroundColor: ds.semantic.surface.elevated,
      borderRadius: ds.radius.sm,
      padding: ds.space[2],
    },
    reasonText: {
      flex: 1,
      ...ds.typography.micro,
      color: ds.semantic.text.tertiary,
      lineHeight: 16,
    },
  });
