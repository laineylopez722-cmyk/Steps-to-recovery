/**
 * MeetingFilters Component
 * Filter UI for day, time of day, and meeting type
 */

import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Button } from '../../../design-system/components/Button';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type {
  MeetingFilters as MeetingFiltersType,
  DayOfWeek,
  TimeOfDay,
  MeetingType,
} from '../types/meeting';
import { getMeetingTypeLabel } from '../types/meeting';

export interface MeetingFiltersProps {
  currentFilters: MeetingFiltersType;
  onApplyFilters: (filters: Partial<MeetingFiltersType>) => void;
  onClearFilters: () => void;
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIMES_OF_DAY: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning (5am-12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm-5pm)' },
  { value: 'evening', label: 'Evening (5pm-10pm)' },
  { value: 'late_night', label: 'Late Night (10pm-5am)' },
];

const MEETING_TYPES: MeetingType[] = [
  'O', // Open
  'C', // Closed
  'BB', // Big Book
  'SP', // Speaker
  'D', // Discussion
  'W', // Women
  'M', // Men
  'Y', // Young People
  'LGBTQ',
  'BE', // Beginners
];

export function MeetingFilters({
  currentFilters,
  onApplyFilters,
  onClearFilters,
}: MeetingFiltersProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(currentFilters.day_of_week);
  const [selectedTime, setSelectedTime] = useState<TimeOfDay | null>(currentFilters.time_of_day);
  const [selectedTypes, setSelectedTypes] = useState<MeetingType[]>(currentFilters.meeting_types);

  const handleApply = (): void => {
    onApplyFilters({
      day_of_week: selectedDay,
      time_of_day: selectedTime,
      meeting_types: selectedTypes,
    });
  };

  const handleClear = (): void => {
    setSelectedDay(null);
    setSelectedTime(null);
    setSelectedTypes([]);
    onClearFilters();
  };

  const toggleMeetingType = (type: MeetingType): void => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const hasActiveFilters =
    selectedDay !== null || selectedTime !== null || selectedTypes.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: ds.semantic.surface.card }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[ds.typography.h2, { color: ds.semantic.text.primary }]} accessibilityRole="header">
            Filter Meetings
          </Text>
          {hasActiveFilters && (
            <Pressable
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              accessibilityHint="Removes all active filters"
            >
              <Text style={[ds.semantic.typography.body, { color: ds.semantic.intent.primary.solid }]}>
                Clear All
              </Text>
            </Pressable>
          )}
        </View>

        {/* Day of Week */}
        <View style={styles.section}>
          <Text
            style={[ds.typography.h3, { color: ds.semantic.text.primary, marginBottom: 12 }]}
            accessibilityRole="header"
          >
            Day of Week
          </Text>
          <View style={styles.chipContainer}>
            {DAYS_OF_WEEK.map((day) => (
              <Pressable
                key={day.value}
                onPress={() => setSelectedDay(selectedDay === day.value ? null : day.value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor:
                      selectedDay === day.value ? ds.semantic.intent.primary.solid : ds.semantic.surface.card,
                    borderColor: ds.colors.borderDefault,
                  },
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${day.label}`}
                accessibilityState={{ selected: selectedDay === day.value }}
              >
                <Text
                  style={[
                    ds.semantic.typography.body,
                    {
                      color:
                        selectedDay === day.value ? ds.semantic.text.onDark : ds.semantic.text.primary,
                    },
                  ]}
                >
                  {day.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Time of Day */}
        <View style={styles.section}>
          <Text
            style={[ds.typography.h3, { color: ds.semantic.text.primary, marginBottom: 12 }]}
            accessibilityRole="header"
          >
            Time of Day
          </Text>
          <View style={styles.chipContainer}>
            {TIMES_OF_DAY.map((time) => (
              <Pressable
                key={time.value}
                onPress={() => setSelectedTime(selectedTime === time.value ? null : time.value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor:
                      selectedTime === time.value ? ds.semantic.intent.primary.solid : ds.semantic.surface.card,
                    borderColor: ds.colors.borderDefault,
                  },
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${time.label}`}
                accessibilityState={{ selected: selectedTime === time.value }}
              >
                <Text
                  style={[
                    ds.semantic.typography.body,
                    {
                      color:
                        selectedTime === time.value ? ds.semantic.text.onDark : ds.semantic.text.primary,
                    },
                  ]}
                >
                  {time.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Meeting Types */}
        <View style={styles.section}>
          <Text
            style={[ds.typography.h3, { color: ds.semantic.text.primary, marginBottom: 12 }]}
            accessibilityRole="header"
          >
            Meeting Type
          </Text>
          <View style={styles.chipContainer}>
            {MEETING_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => toggleMeetingType(type)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: selectedTypes.includes(type)
                      ? ds.semantic.intent.primary.solid
                      : ds.semantic.surface.card,
                    borderColor: ds.colors.borderDefault,
                  },
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${getMeetingTypeLabel(type)}`}
                accessibilityState={{ selected: selectedTypes.includes(type) }}
              >
                <Text
                  style={[
                    ds.semantic.typography.body,
                    {
                      color: selectedTypes.includes(type)
                        ? ds.semantic.text.onDark
                        : ds.semantic.text.primary,
                    },
                  ]}
                >
                  {getMeetingTypeLabel(type)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: ds.semantic.surface.card,
            borderTopColor: ds.colors.borderDefault,
          },
        ]}
      >
        <Button
          variant="primary"
          onPress={handleApply}
          accessibilityLabel="Apply filters"
          accessibilityHint="Apply selected filters to meeting search"
        >
          Apply Filters
        </Button>
      </View>
    </View>
  );
}

const createStyles = (_ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    section: {
      marginBottom: 24,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      minHeight: 48, // WCAG minimum touch target
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
    },
  }) as const;
