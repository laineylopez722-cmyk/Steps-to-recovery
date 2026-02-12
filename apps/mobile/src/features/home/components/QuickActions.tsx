import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Card } from '../../../design-system/components';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
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
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

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
            style={[styles.actionButton, { backgroundColor: ds.semantic.surface.interactive }]}
            onPress={() => handleActionPress(action.screen)}
            accessibilityLabel={action.title}
            accessibilityRole="button"
            accessibilityHint={`Navigate to ${action.title}`}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
              <MaterialCommunityIcons
                name={action.icon}
                size={28}
                color={ds.semantic.text.onDark}
              />
            </View>
            <Text
              style={[
                theme.typography.body,
                { fontWeight: '600', color: ds.semantic.text.primary, textAlign: 'center' },
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

const createStyles = (_ds: DS) =>
  ({
    card: {
      margin: 16,
      marginTop: 8,
    },
    title: {
      fontWeight: 'bold' as const,
      marginBottom: 16,
    },
    actionsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
    },
    actionButton: {
      width: '48%' as const,
      alignItems: 'center' as const,
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
  }) as const;
