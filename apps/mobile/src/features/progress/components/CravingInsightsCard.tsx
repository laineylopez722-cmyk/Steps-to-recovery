/**
 * Craving Insights Card - Displays AI-generated insights about craving patterns
 *
 * Each insight is accompanied by a relevant icon and encouraging tone.
 * Uses GlassCard from the design system.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, GlassCard } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';

interface CravingInsightsCardProps {
  insights: string[];
  trend: 'decreasing' | 'stable' | 'increasing';
}

function getInsightIcon(insight: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const lower = insight.toLowerCase();
  if (lower.includes('peak') || lower.includes('time') || lower.includes('morning') || lower.includes('evening')) {
    return 'clock-outline';
  }
  if (lower.includes('decreased') || lower.includes('progress') || lower.includes('amazing')) {
    return 'trending-down';
  }
  if (lower.includes('increased')) {
    return 'trending-up';
  }
  if (lower.includes('surfed') || lower.includes('session')) {
    return 'waves';
  }
  if (lower.includes('routine') || lower.includes('morning')) {
    return 'weather-sunny';
  }
  if (lower.includes('technique') || lower.includes('works best')) {
    return 'star-outline';
  }
  if (lower.includes('stronger') || lower.includes('success')) {
    return 'arm-flex-outline';
  }
  return 'lightbulb-outline';
}

function getInsightColor(insight: string, theme: { colors: { success: string; danger: string; warning: string; primary: string } }): string {
  const lower = insight.toLowerCase();
  if (lower.includes('decreased') || lower.includes('progress') || lower.includes('amazing') || lower.includes('stronger') || lower.includes('rare') || lower.includes('low')) {
    return theme.colors.success;
  }
  if (lower.includes('increased') || lower.includes('reaching out')) {
    return theme.colors.warning;
  }
  return theme.colors.primary;
}

export function CravingInsightsCard({ insights, trend }: CravingInsightsCardProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const headerText =
    trend === 'decreasing'
      ? 'Great progress!'
      : trend === 'increasing'
        ? 'Stay strong'
        : "You're getting stronger";

  const headerColor =
    trend === 'decreasing'
      ? theme.colors.success
      : trend === 'increasing'
        ? theme.colors.warning
        : theme.colors.primary;

  return (
    <GlassCard
      intensity="card"
      style={styles.card}
      accessibilityLabel={`Craving insights: ${insights.join('. ')}`}
      accessibilityRole="summary"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={20}
            color={aestheticColors.gold.DEFAULT}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>Pattern Insights</Text>
        </View>
        <Text style={[styles.headerBadge, { color: headerColor }]}>{headerText}</Text>
      </View>

      {/* Insights List */}
      {insights.map((insight, index) => {
        const icon = getInsightIcon(insight);
        const color = getInsightColor(insight, theme);

        return (
          <View
            key={index}
            style={[styles.insightRow, index < insights.length - 1 && styles.insightBorder]}
            accessibilityLabel={insight}
            accessibilityRole="text"
          >
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
              <MaterialCommunityIcons name={icon} size={16} color={color} />
            </View>
            <Text style={[styles.insightText, { color: theme.colors.text }]}>{insight}</Text>
          </View>
        );
      })}
    </GlassCard>
  );
}

const createStyles = (ds: DS) => ({
  card: {
    marginBottom: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  insightRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    paddingVertical: 10,
  },
  insightBorder: {
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 1,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
