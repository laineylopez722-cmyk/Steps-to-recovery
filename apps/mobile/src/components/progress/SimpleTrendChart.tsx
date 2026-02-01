/**
 * Simple Trend Chart Component
 * Displays mood/craving trends over the last 30 days
 * Uses pure React Native - no external charting library needed
 */

import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import type { DailyCheckin } from '@recovery/shared';

interface SimpleTrendChartProps {
  data: DailyCheckin[];
  dataKey: 'mood' | 'cravingLevel';
  title: string;
  color?: string;
  height?: number;
  className?: string;
}

export function SimpleTrendChart({
  data,
  dataKey,
  title,
  color = '#7C3AED', // primary-600
  height = 120,
  className = '',
}: SimpleTrendChartProps) {
  // Get last 30 days of data, sorted by date
  const chartData = useMemo(() => {
    const filtered = data
      .filter((d) => d.isCheckedIn)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    return filtered.map((d) => ({
      date: new Date(d.date),
      value: dataKey === 'mood' ? d.mood : d.cravingLevel,
    }));
  }, [data, dataKey]);

  // Calculate chart dimensions
  const chartWidth = Dimensions.get('window').width - 64; // Account for padding
  const chartHeight = height - 40; // Leave room for labels

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const values = chartData.map((d) => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Get trend (comparing recent week to previous)
    const recentValues = values.slice(-7);
    const previousValues = values.slice(-14, -7);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentValues.length > 0 && previousValues.length > 0) {
      const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length;
      if (recentAvg > previousAvg + 0.5) trend = 'up';
      else if (recentAvg < previousAvg - 0.5) trend = 'down';
    }

    return { avg, min, max, trend };
  }, [chartData]);

  // If no data, show empty state
  if (chartData.length < 2) {
    return (
      <View className={`bg-surface-100 dark:bg-surface-800 rounded-xl p-4 ${className}`}>
        <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">
          {title}
        </Text>
        <View style={{ height }} className="items-center justify-center">
          <Text className="text-surface-400 text-center">
            Check in for a few days to see your trend
          </Text>
        </View>
      </View>
    );
  }

  // Calculate bar positions
  const barWidth = Math.max(4, Math.min(12, (chartWidth - 20) / chartData.length - 2));
  const maxValue = 10; // Mood/craving scale is 0-10

  // Get trend emoji
  const getTrendEmoji = () => {
    if (!stats) return '➡️';
    if (dataKey === 'mood') {
      // Higher mood is better
      return stats.trend === 'up' ? '📈' : stats.trend === 'down' ? '📉' : '➡️';
    } else {
      // Lower craving is better
      return stats.trend === 'down' ? '📈' : stats.trend === 'up' ? '📉' : '➡️';
    }
  };

  return (
    <View
      className={`bg-surface-100 dark:bg-surface-800 rounded-xl p-4 ${className}`}
      accessibilityLabel={`${title}: average ${stats?.avg.toFixed(1)} out of 10`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
          {title}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">{getTrendEmoji()}</Text>
          <Text className="text-sm text-surface-500">avg: {stats?.avg.toFixed(1)}</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={{ height: chartHeight }} className="flex-row items-end justify-center gap-0.5">
        {chartData.map((point, index) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          const isRecent = index >= chartData.length - 7;
          const opacity = isRecent ? 1 : 0.5;

          return (
            <View
              key={index}
              style={{
                width: barWidth,
                height: Math.max(4, barHeight),
                backgroundColor: color,
                opacity,
                borderRadius: barWidth / 2,
              }}
              accessibilityLabel={`Day ${index + 1}: ${point.value}/10`}
            />
          );
        })}
      </View>

      {/* Labels */}
      <View className="flex-row justify-between mt-2">
        <Text className="text-xs text-surface-400">{chartData.length} days ago</Text>
        <Text className="text-xs text-surface-400">Today</Text>
      </View>

      {/* Legend */}
      <View className="flex-row justify-center items-center gap-4 mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center gap-1">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              opacity: 0.5,
            }}
          />
          <Text className="text-xs text-surface-400">Older</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <Text className="text-xs text-surface-400">Last 7 days</Text>
        </View>
      </View>
    </View>
  );
}

export default SimpleTrendChart;
