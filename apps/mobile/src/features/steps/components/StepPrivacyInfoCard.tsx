import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Text, useTheme } from '../../../design-system';
import { ds } from '../../../design-system/tokens/ds';

export function StepPrivacyInfoCard(): React.ReactElement {
  const theme = useTheme();

  return (
    <Card variant="outlined" style={styles.infoCard}>
      <View style={styles.infoContent}>
        <MaterialCommunityIcons name="lock" size={24} color={ds.colors.accent} accessible={false} />
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginLeft: 12, flex: 1, lineHeight: 18 },
          ]}
        >
          Your answers are encrypted and stored securely on your device. Only you can read them.
          Your progress is private and safe.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    marginTop: 8,
    borderColor: ds.colors.borderSubtle,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
