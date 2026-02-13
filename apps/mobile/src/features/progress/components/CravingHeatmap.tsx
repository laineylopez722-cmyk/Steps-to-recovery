/**
 * Craving Heatmap - 7×24 grid showing craving intensity by day and hour
 *
 * Color scale: green (low) → yellow → orange → red (high)
 * Peak cells highlighted with border accent.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import { ds } from '../../../design-system/tokens/ds';
import type { CravingHeatmapData } from '../types';

interface CravingHeatmapProps {
  data: CravingHeatmapData[];
  peakHour: number;
  peakDay: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = [
  { hour: 0, label: '12A' },
  { hour: 6, label: '6A' },
  { hour: 12, label: '12P' },
  { hour: 18, label: '6P' },
];

const CELL_SIZE = 14;
const GAP = 2;

function getCellColor(intensity: number, hasData: boolean): string {
  if (!hasData || intensity === 0) return 'transparent';
  if (intensity <= 2) return ds.palette.sageGreen;
  if (intensity <= 4) return ds.colors.success;
  if (intensity <= 5) return ds.palette.amberLight;
  if (intensity <= 7) return ds.palette.orange;
  return ds.colors.error;
}

function getCellOpacity(intensity: number, hasData: boolean): number {
  if (!hasData || intensity === 0) return 0.1;
  return 0.3 + (intensity / 10) * 0.7;
}

function getDayName(dayIndex: number): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[dayIndex];
}

function formatHourForA11y(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function CravingHeatmap({
  data,
  peakHour,
  peakDay,
}: CravingHeatmapProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);

  const getCellData = (day: number, hour: number): CravingHeatmapData | undefined =>
    data.find((d) => d.dayOfWeek === day && d.hourOfDay === hour);

  const hasAnyData = data.some((d) => d.count > 0);

  const accessibilityDescription = hasAnyData
    ? `Craving heatmap showing intensity patterns. Peak: ${peakDay} around ${formatHourForA11y(peakHour)}`
    : 'No craving pattern data available yet';

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
          <MaterialCommunityIcons name="grid" size={20} color={aestheticColors.warning.DEFAULT} />
          <Text style={[styles.title, { color: ds.semantic.text.primary }]}>Craving Heatmap</Text>
        </View>
        {hasAnyData && (
          <Text style={[styles.subtitle, { color: ds.semantic.text.secondary }]}>
            Peak: {peakDay} {formatHourForA11y(peakHour)}
          </Text>
        )}
      </View>

      {hasAnyData ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Hour labels */}
            <View style={styles.hourLabelRow}>
              <View style={styles.dayLabelSpacer} />
              {Array.from({ length: 24 }, (_, hour) => {
                const labelEntry = HOUR_LABELS.find((h) => h.hour === hour);
                return (
                  <View key={hour} style={[styles.cell, styles.hourLabelCell]}>
                    {labelEntry && (
                      <Text style={[styles.hourLabel, { color: ds.semantic.text.secondary }]}>
                        {labelEntry.label}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Grid rows */}
            {DAY_LABELS.map((dayLabel, dayIndex) => (
              <View key={dayLabel} style={styles.row}>
                <View style={styles.dayLabelContainer}>
                  <Text style={[styles.dayLabel, { color: ds.semantic.text.secondary }]}>
                    {dayLabel}
                  </Text>
                </View>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cellData = getCellData(dayIndex, hour);
                  const intensity = cellData?.averageIntensity ?? 0;
                  const count = cellData?.count ?? 0;
                  const isPeak = peakHour === hour && peakDay === getDayName(dayIndex) && count > 0;

                  return (
                    <View
                      key={hour}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: getCellColor(intensity, count > 0),
                          opacity: getCellOpacity(intensity, count > 0),
                        },
                        isPeak && styles.peakCell,
                      ]}
                      accessibilityLabel={`${getDayName(dayIndex)} at ${formatHourForA11y(hour)}, average craving intensity ${intensity.toFixed(1)} out of 10`}
                      accessibilityRole="text"
                    />
                  );
                })}
              </View>
            ))}

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={[styles.legendText, { color: ds.semantic.text.secondary }]}>Low</Text>
              <View style={styles.legendScale}>
                {[0, 2, 4, 6, 8, 10].map((v) => (
                  <View
                    key={v}
                    style={[
                      styles.legendCell,
                      {
                        backgroundColor: getCellColor(v, v > 0),
                        opacity: getCellOpacity(v, v > 0),
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.legendText, { color: ds.semantic.text.secondary }]}>High</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: ds.semantic.text.secondary }]}>
            Log cravings in check-ins to see your patterns here
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
  subtitle: {
    fontSize: 12,
  },
  hourLabelRow: {
    flexDirection: 'row' as const,
    marginBottom: 2,
  },
  hourLabelCell: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
  },
  hourLabel: {
    fontSize: 9,
  },
  dayLabelSpacer: {
    width: 32,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: GAP,
  },
  dayLabelContainer: {
    width: 32,
    paddingRight: 4,
  },
  dayLabel: {
    fontSize: 10,
    textAlign: 'right' as const,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    marginHorizontal: GAP / 2,
  },
  peakCell: {
    borderWidth: 1.5,
    borderColor: aestheticColors.gold.DEFAULT,
  },
  legend: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  legendText: {
    fontSize: 10,
  },
  legendScale: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
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
