import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Card } from '../../../design-system/components';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { ds } from '../../../design-system/tokens/ds';
import { categoryColors } from '../../../design-system/tokens/colors';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface QuickActionsProps {
  userId: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  screen: string;
}

// Colors will be theme-based, defined inside component
const QUICK_ACTIONS_BASE: Omit<QuickAction, 'color'>[] = [
  {
    id: 'reading',
    title: 'Daily Reading',
    icon: 'book-open-page-variant',
    screen: 'DailyReading',
  },
  {
    id: 'progress',
    title: 'My Progress',
    icon: 'chart-line',
    screen: 'ProgressDashboard',
  },
  {
    id: 'journal',
    title: 'Journal',
    icon: 'book-open-variant',
    screen: 'JournalList',
  },
  {
    id: 'steps',
    title: 'Step Work',
    icon: 'stairs',
    screen: 'StepsOverview',
  },
  {
    id: 'emergency',
    title: 'Emergency',
    icon: 'phone-alert',
    screen: 'Emergency',
  },
  {
    id: 'meetings',
    title: 'Meetings',
    icon: 'map-marker-multiple',
    screen: 'MeetingFinder',
  },
];

export function QuickActions({ userId }: QuickActionsProps): React.ReactElement {
  const navigation = useNavigation();
  const theme = useTheme();

  // Map colors to theme
  const actionColors = [
    theme.colors.warning, // Daily Reading - orange (spiritual)
    theme.colors.success, // My Progress - green (growth)
    theme.colors.primary, // Journal - blue
    categoryColors['self-care'], // Step Work - purple
    theme.colors.danger, // Emergency - red
    theme.colors.secondary, // Meetings - teal
  ];

  const QUICK_ACTIONS: QuickAction[] = QUICK_ACTIONS_BASE.map((action, index) => ({
    ...action,
    color: actionColors[index],
  }));

  const handleActionPress = (screen: string): void => {
    (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)(screen, {
      userId,
    });
  };

  return (
    <Card
      variant="elevated"
      style={styles.card}
      accessibilityRole="menu"
      accessibilityLabel="Quick actions menu"
    >
      <Text style={[theme.typography.title2, styles.title]}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
            onPress={() => handleActionPress(action.screen)}
            accessibilityLabel={action.title}
            accessibilityRole="button"
            accessibilityHint={`Navigate to ${action.title}`}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
              <MaterialCommunityIcons name={action.icon} size={28} color={ds.semantic.text.onDark} />
            </View>
            <Text
              style={[
                theme.typography.body,
                { fontWeight: '600', color: theme.colors.text, textAlign: 'center' },
              ]}
            >
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginTop: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
});
