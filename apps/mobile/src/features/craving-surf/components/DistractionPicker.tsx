/**
 * Distraction Picker Component
 *
 * Displays a grid of distraction technique cards for the user to choose from.
 */

import React from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../../../design-system/components/Text';
import { Card } from '../../../design-system/components/Card';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { DISTRACTION_TECHNIQUES } from '../types';
import type { DistractionTechnique } from '../types';

interface DistractionPickerProps {
  onSelect: (techniqueId: string) => void;
  testID?: string;
}

const createStyles = (ds: DS) =>
  ({
    container: {
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[4],
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: ds.space[2],
    },
    subtitle: {
      fontSize: 15,
      color: ds.semantic.text.muted,
      textAlign: 'center' as const,
      marginBottom: ds.space[5],
    },
    grid: {
      paddingBottom: ds.space[4],
    },
    cardWrapper: {
      flex: 1,
      margin: ds.space[1],
    },
    card: {
      padding: ds.space[3],
      alignItems: 'center' as const,
      minHeight: 130,
      justifyContent: 'center' as const,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${ds.colors.accent}20`,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[2],
    },
    techniqueTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: ds.space[1],
    },
    techniqueDescription: {
      fontSize: 12,
      color: ds.semantic.text.muted,
      textAlign: 'center' as const,
      lineHeight: 16,
    },
    duration: {
      fontSize: 11,
      color: ds.colors.accent,
      fontWeight: '500' as const,
      marginTop: ds.space[1],
    },
  }) as const;

function DistractionCard({
  technique,
  onSelect,
  testID,
}: {
  technique: DistractionTechnique;
  onSelect: (id: string) => void;
  testID?: string;
}): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        onPress={() => onSelect(technique.id)}
        activeOpacity={0.7}
        accessibilityLabel={`${technique.title}: ${technique.description}, ${technique.durationMinutes} minutes`}
        accessibilityRole="button"
        accessibilityHint={`Select ${technique.title} as your distraction technique`}
        testID={testID}
      >
        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={technique.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
              size={24}
              color={ds.colors.accent}
            />
          </View>
          <Text style={styles.techniqueTitle}>{technique.title}</Text>
          <Text style={styles.techniqueDescription}>{technique.description}</Text>
          <Text style={styles.duration}>{technique.durationMinutes} min</Text>
        </Card>
      </TouchableOpacity>
    </View>
  );
}

export function DistractionPicker({
  onSelect,
  testID,
}: DistractionPickerProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Choose a Distraction</Text>
      <Text style={styles.subtitle}>
        Pick something to shift your focus. Even a few minutes can help a craving pass.
      </Text>

      <FlatList
        data={DISTRACTION_TECHNIQUES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <DistractionCard
            technique={item}
            onSelect={onSelect}
            testID={testID ? `${testID}-${item.id}` : undefined}
          />
        )}
      />
    </View>
  );
}
