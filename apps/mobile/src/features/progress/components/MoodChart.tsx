/**
 * Mood Chart - View-based sparkline chart for mood data (1-5 scale)
 * Color coded: 1=red, 2=orange, 3=yellow, 4=green, 5=bright green
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useTheme, GlassCard } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import { ds } from '../../../design-system/tokens/ds';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import type { MoodDataPoint } from '../hooks/useMoodTrends';

interface MoodChartProps {
  data: MoodDataPoint[];
  trend: 'improving' | 'stable' | 'declining';
  average: number;
}

const MOOD_COLORS: Record<number, string> = {
  1: ds.colors.error,
  2: ds.colors.warning,
  3: ds.palette.amberLight,
  4: ds.palette.sageGreen,
  5: ds.colors.success,
};

function getMoodColor(mood: number): string {
  const rounded = Math.round(Math.min(5, Math.max(1, mood)));
  return MOOD_COLORS[rounded] ?? MOOD_COLORS[3];
}

const { width: screenWidth } = Dimensions.get('window');

export function MoodChart({ data, trend, average }: MoodChartProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const trendIcon: keyof typeof MaterialCommunityIcons.glyphMap =
    trend === 'improving' ? 'trending-up' : trend === 'declining' ? 'trending-down' : 'minus';

  const trendColor =
    trend === 'improving'
      ? theme.colors.success
      : trend === 'declining'
        ? theme.colors.danger
        : theme.colors.textSecondary;

  const chartHeight = 80;
  const barWidth = Math.max(4, (screenWidth - 120) / Math.max(data.length, 1) - 2);

  const accessibilityDescription =
    data.length > 0
      ? `Mood chart showing ${trend} trend over ${data.length} days, average ${average.toFixed(1)} out of 5`
      : 'No mood data available yet';

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
            name="emoticon-outline"
            size={20}
            color={aestheticColors.primary[500]}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>Mood Trend</Text>
        </View>
        <View style={styles.trendBadge}>
          <MaterialCommunityIcons name={trendIcon} size={16} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>{trend}</Text>
        </View>
      </View>

      {/* Chart */}
      {data.length > 0 ? (
        <>
          <View
            style={[styles.chartContainer, { height: chartHeight }]}
            accessibilityLabel={`Bar chart with ${data.length} days of mood data`}
          >
            {data.map((point, index) => {
              const barHeight = (point.mood / 5) * chartHeight;
              const color = getMoodColor(point.mood);
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
                      opacity: 0.4 + (point.mood / 5) * 0.6,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: (point.mood / 5) * 0.4,
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
              Avg: {average.toFixed(1)}/5
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Complete check-ins to see your mood trend
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
