import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Card, Button, Badge } from '../../../design-system/components';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import type { DailyCheckInDecrypted } from '@recovery/shared';

interface DailyCheckInCardProps {
  morningCheckIn: DailyCheckInDecrypted | null;
  eveningCheckIn: DailyCheckInDecrypted | null;
  isLoading: boolean;
  userId: string;
}

export function DailyCheckInCard({
  morningCheckIn,
  eveningCheckIn,
  isLoading,
  userId,
}: DailyCheckInCardProps): React.ReactElement {
  const navigation = useNavigation();
  const theme = useTheme();

  const handleMorningCheckIn = (): void => {
    (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)(
      'MorningIntention',
      { userId },
    );
  };

  const handleEveningCheckIn = (): void => {
    (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)(
      'EveningPulse',
      { userId },
    );
  };

  if (isLoading) {
    return (
      <Card
        variant="elevated"
        style={styles.card}
        accessibilityRole="none"
        accessibilityLabel="Loading daily check-ins"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </Card>
    );
  }

  return (
    <Card
      variant="elevated"
      style={styles.card}
      accessibilityRole="none"
      accessibilityLabel="Daily check-in card"
    >
      <Text style={[theme.typography.title2, styles.title]}>Daily Check-In</Text>

      <View style={styles.checkInRow}>
        <View style={styles.checkInItem}>
          <View style={styles.checkInHeader}>
            <Text style={styles.checkInEmoji}>🌅</Text>
            <Text
              style={[theme.typography.headline, { fontWeight: '600', color: theme.colors.text }]}
            >
              Morning
            </Text>
          </View>
          {morningCheckIn ? (
            <Badge
              variant="success"
              size="medium"
              accessibilityLabel="Morning check-in completed"
              accessibilityRole="text"
            >
              ✓ Completed
            </Badge>
          ) : (
            <Button
              variant="primary"
              onPress={handleMorningCheckIn}
              title="Start"
              style={styles.checkInButton}
              accessibilityLabel="Start morning intention"
              accessibilityRole="button"
              accessibilityHint="Opens morning intention check-in form"
            />
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.checkInItem}>
          <View style={styles.checkInHeader}>
            <Text style={styles.checkInEmoji}>🌙</Text>
            <Text
              style={[theme.typography.headline, { fontWeight: '600', color: theme.colors.text }]}
            >
              Evening
            </Text>
          </View>
          {eveningCheckIn ? (
            <Badge
              variant="success"
              size="medium"
              accessibilityLabel="Evening check-in completed"
              accessibilityRole="text"
            >
              ✓ Completed
            </Badge>
          ) : (
            <Button
              variant="primary"
              onPress={handleEveningCheckIn}
              title="Start"
              style={styles.checkInButton}
              disabled={!morningCheckIn}
              accessibilityLabel="Start evening pulse check"
              accessibilityRole="button"
              accessibilityHint="Opens evening pulse check-in form"
              accessibilityState={{ disabled: !morningCheckIn }}
            />
          )}
        </View>
      </View>

      {morningCheckIn && morningCheckIn.intention && (
        <View style={[styles.intentionPreview, { backgroundColor: theme.colors.background }]}>
          <Text
            style={[
              theme.typography.caption1,
              { color: theme.colors.textSecondary, marginBottom: 4 },
            ]}
          >
            Today's Intention:
          </Text>
          <Text style={[theme.typography.body, { fontStyle: 'italic', color: theme.colors.text }]}>
            "{morningCheckIn.intention}"
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginTop: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  checkInRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInItem: {
    flex: 1,
    alignItems: 'center',
  },
  checkInHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  checkInEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  checkInButton: {
    minWidth: 100,
  },
  divider: {
    width: 1,
    height: 60,
    marginHorizontal: 16,
  },
  intentionPreview: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
});
