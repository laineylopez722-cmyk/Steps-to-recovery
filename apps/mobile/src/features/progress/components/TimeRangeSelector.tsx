/**
 * Time Range Selector - Segmented control for 7d / 30d / 90d views
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useDs } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import type { TimeRange } from '../hooks/useMoodTrends';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
}

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export function TimeRangeSelector({
  selected,
  onSelect,
}: TimeRangeSelectorProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel="Time range selector"
    >
      {RANGES.map((range) => {
        const isSelected = selected === range.value;
        return (
          <Pressable
            key={range.value}
            onPress={() => onSelect(range.value)}
            style={[
              styles.segment,
              isSelected && {
                backgroundColor: aestheticColors.primary[500] + '20',
                borderColor: aestheticColors.primary[500],
              },
            ]}
            accessibilityRole="tab"
            accessibilityLabel={`Show ${range.label} of data`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: isSelected ? aestheticColors.primary[500] : ds.semantic.text.secondary,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {range.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    flexDirection: 'row' as const,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    overflow: 'hidden' as const,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    minHeight: 48,
  },
  segmentText: {
    fontSize: 13,
  },
});
