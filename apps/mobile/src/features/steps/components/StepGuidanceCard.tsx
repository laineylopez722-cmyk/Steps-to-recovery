import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Text, useTheme } from '../../../design-system';
import { ds } from '../../../design-system/tokens/ds';

interface StepGuidanceCardProps {
  showGuidance: boolean;
  description: string;
  onToggle: () => void;
}

export function StepGuidanceCard({
  showGuidance,
  description,
  onToggle,
}: StepGuidanceCardProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Card variant="outlined" style={styles.descriptionCard}>
      <Pressable
        onPress={onToggle}
        style={styles.guidanceToggle}
        accessibilityRole="button"
        accessibilityLabel={showGuidance ? 'Hide step guidance' : 'Show step guidance'}
      >
        <View style={styles.descriptionHeader}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color={ds.colors.accent} />
          <Text style={[theme.typography.label, { color: ds.colors.accent, marginLeft: 8 }]}>
            STEP GUIDANCE
          </Text>
        </View>
        <MaterialCommunityIcons
          name={showGuidance ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </Pressable>
      {showGuidance && (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.text, lineHeight: 24, fontStyle: 'italic' },
          ]}
        >
          "{description}"
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderColor: ds.colors.borderSubtle,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
