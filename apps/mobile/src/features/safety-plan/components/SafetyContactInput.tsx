/**
 * Safety Contact Input
 *
 * Editable contact row with name, phone, and relationship fields.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../../design-system/components/Input';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type { SafetyContact } from '../types';

interface SafetyContactInputProps {
  contact: SafetyContact;
  index: number;
  onChange: (index: number, contact: SafetyContact) => void;
  onRemove: (index: number) => void;
}

const createStyles = (ds: DS) =>
  ({
    container: {
      marginBottom: ds.space[3],
      padding: ds.space[3],
      borderRadius: ds.radius.md,
      backgroundColor: ds.semantic.surface.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.semantic.intent.primary.muted,
    },
    row: {
      flexDirection: 'row' as const,
      gap: ds.space[2],
    },
    nameField: {
      flex: 1,
    },
    phoneField: {
      flex: 1,
    },
    removeButton: {
      alignSelf: 'flex-start' as const,
      padding: ds.space[2],
      minWidth: 48,
      minHeight: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
    },
    fieldsContainer: {
      flex: 1,
    },
  }) as const;

export function SafetyContactInput({
  contact,
  index,
  onChange,
  onRemove,
}: SafetyContactInputProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const handleNameChange = useCallback(
    (text: string) => {
      onChange(index, { ...contact, name: text });
    },
    [contact, index, onChange],
  );

  const handlePhoneChange = useCallback(
    (text: string) => {
      onChange(index, { ...contact, phone: text });
    },
    [contact, index, onChange],
  );

  const handleRelationshipChange = useCallback(
    (text: string) => {
      onChange(index, { ...contact, relationship: text });
    },
    [contact, index, onChange],
  );

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <View style={styles.container} accessibilityRole="none" accessibilityLabel={`Contact ${index + 1}`}>
      <View style={styles.header}>
        <View style={styles.fieldsContainer}>
          <Input
            label="Name"
            value={contact.name}
            onChangeText={handleNameChange}
            accessibilityLabel={`Contact ${index + 1} name`}
            accessibilityRole="none"
          />
          <View style={styles.row}>
            <View style={styles.phoneField}>
              <Input
                label="Phone"
                value={contact.phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                accessibilityLabel={`Contact ${index + 1} phone number`}
                accessibilityRole="none"
                accessibilityHint="Double tap to call"
              />
            </View>
            <View style={styles.nameField}>
              <Input
                label="Relationship"
                value={contact.relationship}
                onChangeText={handleRelationshipChange}
                accessibilityLabel={`Contact ${index + 1} relationship`}
                accessibilityRole="none"
              />
            </View>
          </View>
        </View>
        <Pressable
          onPress={handleRemove}
          style={styles.removeButton}
          accessibilityLabel={`Remove contact ${index + 1}`}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={24}
            color={ds.semantic.text.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}
