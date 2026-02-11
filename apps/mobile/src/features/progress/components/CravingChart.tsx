/**
 * Craving Chart - View-based sparkline chart for craving data (0-10 scale)
 * Color inverse: 0=green (no craving) to 10=red (intense)
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useTheme, GlassCard } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import type { MoodDataPoint } from '../hooks/useMoodTrends';

interface CravingChartProps {
  data: MoodDataPoint[];
  trend: 'decreasing' | 'stable' | 'increasing';
  average: number;
}

function getCravingColor(craving: number): string {
  // 0 = green, 5 = yellow, 10 = red
  if (craving <= 2) return '#16A34A';
  if (craving <= 4) return '#22C55E';
  if (craving <= 6) return '#EAB308';
  if (craving <= 8) return '#F97316';
  return '#EF4444';
}

const { width: screenWidth } = Dimensions.get('window');

export function CravingChart({ data, trend, average }: CravingChartProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const trendIcon: keyof typeof MaterialCommunityIcons.glyphMap =
    trend === 'decreasing' ? 'trending-down' : trend === 'increasing' ? 'trending-up' : 'minus';

  // For cravings, decreasing is good (success color), increasing is bad (danger)
  const trendColor =
    trend === 'decreasing'
      ? theme.colors.success
      : trend === 'increasing'
        ? theme.colors.danger
        : theme.colors.textSecondary;

  const trendLabel = trend === 'decreasing' ? 'improving' : trend === 'increasing' ? 'worsening' : 'stable';

  const chartHeight = 80;
  const barWidth = Math.max(4, (screenWidth - 120) / Math.max(data.length, 1) - 2);

  const accessibilityDescription = data.length > 0
    ? `Craving chart showing ${trendLabel} trend over ${data.length} days, average ${average.toFixed(1)} out of 10`
    : 'No craving data available yet';

  return (
    <GlassCard
      intensity="card"
      style={styles.card}
      accessibilityLabel={accessibilityDescription}
      accessibilityRole="summary"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={20}
            color={aestheticColors.warning.DEFAULT}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>Craving Levels</Text>
        </View>
        <View style={styles.trendBadge}>
          <MaterialCommunityIcons name={trendIcon} size={16} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      </View>

      {/* Chart */}
      {data.length > 0 ? (
        <>
          <View
            style={[styles.chartContainer, { height: chartHeight }]}
            accessibilityLabel={`Bar chart with ${data.length} days of craving data`}
          >
            {data.map((point, index) => {
              const barHeight = (point.craving / 10) * chartHeight;
              const color = getCravingColor(point.craving);
              return (
                <Animated.View
                  key={point.date}
                  entering={ScreenAnimations.fadeDelayed(index * 20)}
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      height: Math.max(2, barHeight),
                      backgroundColor: color,
                      opacity: 0.3 + (point.craving / 10) * 0.7,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: (point.craving / 10) * 0.4,
                      shadowRadius: 3,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Last {data.length} days
            </Text>
            <Text style={[styles.averageText, { color: theme.colors.text }]}>
              Avg: {average.toFixed(1)}/10
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Log cravings in evening check-ins to track patterns
          </Text>
        </View>
      )}
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
  trendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500' as const,
    textTransform: 'capitalize' as const,
  },
  chartContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-evenly' as const,
    paddingHorizontal: 8,
  },
  bar: {
    borderRadius: 2,
    marginHorizontal: 1,
  },
  legend: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  legendText: {
    fontSize: 12,
  },
  averageText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    height: 80,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
});
