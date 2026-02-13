import React from 'react';
import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Text } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface StepGuidanceCardProps {
  showGuidance: boolean;
  description: string;
  onToggle: () => void;
}

export const StepGuidanceCard = React.memo(function StepGuidanceCard({
  showGuidance,
  description,
  onToggle,
}: StepGuidanceCardProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  return (
    <Card variant="outlined" style={styles.descriptionCard}>
      <Pressable
        onPress={onToggle}
        style={styles.guidanceToggle}
        accessibilityRole="button"
        accessibilityLabel={showGuidance ? 'Hide step guidance' : 'Show step guidance'}
      >
        <View style={styles.descriptionHeader}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={ds.colors.accent} />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[ds.semantic.typography.sectionLabel, styles.label]}>Guidance</Text>
            <Text style={[ds.semantic.typography.sectionLabel, styles.subLabel]}>
              Read this before you answer
            </Text>
          </View>
        </View>

        <MaterialCommunityIcons
          name={showGuidance ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={ds.colors.textSecondary}
        />
      </Pressable>

      {showGuidance && (
        <View style={styles.guidanceContent}>
          <Text style={[ds.semantic.typography.body, styles.guidanceText]}>{description}</Text>
        </View>
      )}
    </Card>
  );
});
StepGuidanceCard.displayName = 'StepGuidanceCard';

const createStyles = (ds: DS) =>
  ({
    descriptionCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      borderColor: ds.colors.borderSubtle,
      backgroundColor: ds.semantic.surface.card,
    },
    descriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.colors.accentMuted,
      marginRight: 10,
    },
    headerTextWrap: {
      flex: 1,
    },
    guidanceToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      color: ds.colors.accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    subLabel: {
      color: ds.colors.textTertiary,
      marginTop: 2,
    },
    guidanceContent: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: ds.colors.borderSubtle,
      paddingTop: 12,
    },
    guidanceText: {
      color: ds.colors.textSecondary,
      lineHeight: 24,
    },
  }) as const;
