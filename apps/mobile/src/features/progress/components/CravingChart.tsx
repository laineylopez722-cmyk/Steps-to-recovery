/**
 * Craving Chart - Hybrid bar + SVG line chart for craving data (0-10 scale)
 * Color inverse: 0=green (no craving) to 10=red (intense)
 * Includes smooth trend line with gradient area fill.
 */

import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useTheme, GlassCard } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import { ds } from '../../../design-system/tokens/ds';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import { SvgLineChart, type DataPoint } from '../../../components/charts/SvgLineChart';
import type { MoodDataPoint } from '../hooks/useMoodTrends';

interface CravingChartProps {
  data: MoodDataPoint[];
  trend: 'decreasing' | 'stable' | 'increasing';
  average: number;
}

function getCravingColor(craving: number): string {
  if (craving <= 2) return ds.palette.sageGreen;
  if (craving <= 4) return ds.colors.success;
  if (craving <= 6) return ds.palette.amberLight;
  if (craving <= 8) return ds.palette.orange;
  return ds.colors.error;
}

function computeCravingRollingAvg(data: MoodDataPoint[], window: number): number[] {
  if (data.length === 0) return [];
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    return slice.reduce((sum, p) => sum + p.craving, 0) / slice.length;
  });
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

  const trendLabel =
    trend === 'decreasing' ? 'improving' : trend === 'increasing' ? 'worsening' : 'stable';

  const chartHeight = 100;
  const barChartHeight = 80;
  const chartWidth = screenWidth - 80;
  const barWidth = Math.max(4, (screenWidth - 120) / Math.max(data.length, 1) - 2);

  const lineData = useMemo((): DataPoint[] => {
    return data.map((p) => ({
      label: p.date.slice(5),
      value: p.craving,
    }));
  }, [data]);

  const rollingAvg = useMemo(() => computeCravingRollingAvg(data, 3), [data]);

  // For cravings, lower is better - use inverse color logic
  const trendLineColor =
    trend === 'decreasing' ? ds.colors.success : trend === 'increasing' ? ds.colors.error : ds.palette.amberLight;

  const accessibilityDescription =
    data.length > 0
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
          {/* SVG Line Chart overlay */}
          {data.length >= 3 && (
            <View style={styles.lineChartContainer}>
              <SvgLineChart
                data={lineData}
                width={chartWidth}
                height={chartHeight}
                maxValue={10}
                minValue={0}
                lineColor={trendLineColor}
                gradientFrom={trendLineColor}
                showDots={data.length <= 30}
                dotRadius={data.length <= 14 ? 3 : 2}
                rollingAverage={rollingAvg}
                rollingAverageColor={ds.palette.amberLight}
                labelColor={theme.colors.textSecondary}
              />
            </View>
          )}

          {/* Bar chart (collapsed when line chart is shown) */}
          <View
            style={[styles.chartContainer, { height: data.length < 3 ? barChartHeight : 40 }]}
            accessibilityLabel={`Bar chart with ${data.length} days of craving data`}
          >
            {data.map((point, index) => {
              const maxBarH = data.length < 3 ? barChartHeight : 40;
              const barHeight = (point.craving / 10) * maxBarH;
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
                      opacity: data.length < 3 ? 0.3 + (point.craving / 10) * 0.7 : 0.25,
                      borderRadius: 3,
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
  lineChartContainer: {
    alignItems: 'center' as const,
    marginBottom: 8,
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
