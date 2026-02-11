/**
 * Weather-Mood Insight Card
 *
 * Displays correlation insights between weather conditions and mood/craving
 * patterns. Only renders when enough data points (>7) exist.
 *
 * @module features/progress/components/WeatherMoodInsight
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { GlassCard } from '../../../design-system';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import { useTheme } from '../../../design-system';
import { useWeatherMood } from '../../../hooks/useWeatherMood';
import { CONDITION_ICONS } from '../../../services/weatherService';
import type { MoodWeatherCorrelation, WeatherCondition } from '../../../services/weatherService';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_DATA_POINTS = 7;

const CONDITION_LABELS: Record<string, string> = {
  sunny: 'sunny',
  cloudy: 'cloudy',
  rainy: 'rainy',
  snowy: 'snowy',
  stormy: 'stormy',
  foggy: 'foggy',
};

// ============================================================================
// HELPERS
// ============================================================================

function generateInsightText(correlations: MoodWeatherCorrelation[]): string {
  if (correlations.length === 0) return '';

  // Find the condition with highest and lowest mood
  const sorted = [...correlations].sort((a, b) => b.avgMood - a.avgMood);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (sorted.length === 1) {
    const label = CONDITION_LABELS[best.condition] ?? best.condition;
    return `On ${label} days, your average mood is ${best.avgMood.toFixed(1)}/5.`;
  }

  const bestLabel = CONDITION_LABELS[best.condition] ?? best.condition;
  const worstLabel = CONDITION_LABELS[worst.condition] ?? worst.condition;

  if (best.avgMood - worst.avgMood < 0.3) {
    return `Your mood stays consistent across weather conditions. Great resilience!`;
  }

  const cravingNote =
    worst.avgCraving > best.avgCraving + 1
      ? ` ${worstLabel.charAt(0).toUpperCase() + worstLabel.slice(1)} days also correlate with higher cravings.`
      : '';

  return `You tend to feel better on ${bestLabel} days (avg ${best.avgMood.toFixed(1)}/5) compared to ${worstLabel} days (avg ${worst.avgMood.toFixed(1)}/5).${cravingNote}`;
}

function getTrendIcon(trend: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (trend) {
    case 'positive':
      return 'trending-up';
    case 'negative':
      return 'trending-down';
    default:
      return 'trending-neutral';
  }
}

function getTrendColor(
  trend: string,
  theme: { colors: { success: string; danger: string; textSecondary: string } },
): string {
  switch (trend) {
    case 'positive':
      return theme.colors.success;
    case 'negative':
      return theme.colors.danger;
    default:
      return theme.colors.textSecondary;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WeatherMoodInsight(): React.ReactElement | null {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { currentWeather, correlations, dataPointCount, isLoading } = useWeatherMood();

  // Don't render if loading, no data, or insufficient data points
  if (isLoading || dataPointCount < MIN_DATA_POINTS) {
    return null;
  }

  const insightText = generateInsightText(correlations);

  return (
    <Animated.View entering={ScreenAnimations.item(4)}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="weather-partly-cloudy"
          size={20}
          color={aestheticColors.primary[500]}
        />
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text }]}
          accessibilityRole="header"
        >
          Weather & Mood
        </Text>
      </View>

      <GlassCard intensity="subtle" style={styles.card}>
        {/* Current Weather */}
        {currentWeather && (
          <View
            style={styles.currentWeatherRow}
            accessibilityLabel={`Current weather: ${currentWeather.description}, ${currentWeather.temperature} degrees`}
          >
            <Text style={styles.weatherIcon}>
              {CONDITION_ICONS[currentWeather.condition as WeatherCondition] ?? '🌤️'}
            </Text>
            <View style={styles.weatherInfo}>
              <Text style={[styles.weatherTemp, { color: theme.colors.text }]}>
                {currentWeather.temperature}°F
              </Text>
              <Text style={[styles.weatherDesc, { color: theme.colors.textSecondary }]}>
                {currentWeather.description}
              </Text>
            </View>
          </View>
        )}

        {/* Correlation Insight */}
        {correlations.length > 0 && insightText && (
          <View style={styles.insightContainer}>
            <Text
              style={[styles.insightText, { color: theme.colors.textSecondary }]}
              accessibilityLabel={`Weather mood insight: ${insightText}`}
            >
              {insightText}
            </Text>
          </View>
        )}

        {/* Correlation Bars */}
        {correlations.length > 0 && (
          <View style={styles.correlationList}>
            {correlations.slice(0, 4).map((correlation) => (
              <View
                key={correlation.condition}
                style={styles.correlationRow}
                accessibilityLabel={`${CONDITION_LABELS[correlation.condition] ?? correlation.condition} days: average mood ${correlation.avgMood.toFixed(1)} out of 5, ${correlation.sampleSize} data points`}
              >
                <Text style={styles.correlationIcon}>
                  {CONDITION_ICONS[correlation.condition as WeatherCondition] ?? '🌤️'}
                </Text>
                <View style={styles.correlationBarContainer}>
                  <View
                    style={[
                      styles.correlationBar,
                      {
                        width: `${(correlation.avgMood / 5) * 100}%`,
                        backgroundColor: getTrendColor(correlation.trend, theme),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.correlationValue, { color: theme.colors.text }]}>
                  {correlation.avgMood.toFixed(1)}
                </Text>
                <MaterialCommunityIcons
                  name={getTrendIcon(correlation.trend)}
                  size={16}
                  color={getTrendColor(correlation.trend, theme)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Data point count */}
        <Text
          style={[styles.dataPointText, { color: theme.colors.textSecondary }]}
          accessibilityLabel={`Based on ${dataPointCount} data points`}
        >
          Based on {dataPointCount} days of data
        </Text>
      </GlassCard>
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (ds: DS) =>
  ({
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    card: {
      padding: 16,
      marginBottom: 20,
    },
    currentWeatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.borderSubtle,
    },
    weatherIcon: {
      fontSize: 36,
    },
    weatherInfo: {
      flex: 1,
    },
    weatherTemp: {
      fontSize: 24,
      fontWeight: '700',
    },
    weatherDesc: {
      fontSize: 14,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    insightContainer: {
      marginBottom: 16,
    },
    insightText: {
      fontSize: 14,
      lineHeight: 20,
    },
    correlationList: {
      gap: 10,
      marginBottom: 12,
    },
    correlationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    correlationIcon: {
      fontSize: 18,
      width: 28,
      textAlign: 'center',
    },
    correlationBarContainer: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: ds.colors.borderSubtle,
      overflow: 'hidden',
    },
    correlationBar: {
      height: '100%',
      borderRadius: 3,
    },
    correlationValue: {
      fontSize: 13,
      fontWeight: '600',
      width: 28,
      textAlign: 'right',
    },
    dataPointText: {
      fontSize: 11,
      textAlign: 'center',
      marginTop: 8,
    },
  }) as const;
