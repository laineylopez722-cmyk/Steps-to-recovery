import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { DailyReadingScreen as ReadingsDailyReadingScreen } from '../../readings/screens/DailyReadingScreen';
import { ds } from '../../../design-system/tokens/ds';

export function DailyReadingScreen(): React.ReactElement {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Sign in to access daily readings.</Text>
      </View>
    );
  }

  return <ReadingsDailyReadingScreen userId={user.id} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ds.colors.bgPrimary,
    paddingHorizontal: ds.space[6],
  },
  message: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
});
