import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Text, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

export function StepPrivacyInfoCard(): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

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

const createStyles = (ds: DS) => ({
  infoCard: {
    marginTop: 8,
    borderColor: ds.colors.borderSubtle,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
} as const);
