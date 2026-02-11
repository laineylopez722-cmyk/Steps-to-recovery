/**
 * Safety Plan Step View
 *
 * Displays a single step of the safety plan wizard with an editable list of items.
 * For steps 4 and 5 (contacts), renders SafetyContactInput instead of plain text inputs.
 */

import React, { useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../../../design-system/components/Text';
import { Input } from '../../../design-system/components/Input';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { SafetyContactInput } from './SafetyContactInput';
import type { SafetyPlanStep, SafetyContact } from '../types';

interface SafetyPlanStepViewProps {
  step: SafetyPlanStep;
  items: string[];
  contacts?: SafetyContact[];
  onItemsChange: (items: string[]) => void;
  onContactsChange?: (contacts: SafetyContact[]) => void;
  isContactStep: boolean;
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: ds.space[4],
      paddingBottom: ds.space[10],
    },
    stepCard: {
      marginBottom: ds.space[4],
    },
    title: {
      marginBottom: ds.space[2],
    },
    description: {
      marginBottom: ds.space[4],
    },
    itemRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: ds.space[2],
      gap: ds.space[2],
    },
    itemInput: {
      flex: 1,
    },
    removeButton: {
      minWidth: 48,
      minHeight: 48,
    },
    addButton: {
      marginTop: ds.space[3],
    },
  }) as const;

export function SafetyPlanStepView({
  step,
  items,
  contacts,
  onItemsChange,
  onContactsChange,
  isContactStep,
}: SafetyPlanStepViewProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);

  const handleItemChange = useCallback(
    (index: number, value: string) => {
      const updated = [...items];
      updated[index] = value;
      onItemsChange(updated);
    },
    [items, onItemsChange],
  );

  const handleRemoveItem = useCallback(
    (index: number) => {
      onItemsChange(items.filter((_, i) => i !== index));
    },
    [items, onItemsChange],
  );

  const handleAddItem = useCallback(() => {
    onItemsChange([...items, '']);
  }, [items, onItemsChange]);

  const handleContactChange = useCallback(
    (index: number, contact: SafetyContact) => {
      if (!contacts || !onContactsChange) return;
      const updated = [...contacts];
      updated[index] = contact;
      onContactsChange(updated);
    },
    [contacts, onContactsChange],
  );

  const handleRemoveContact = useCallback(
    (index: number) => {
      if (!contacts || !onContactsChange) return;
      onContactsChange(contacts.filter((_, i) => i !== index));
    },
    [contacts, onContactsChange],
  );

  const handleAddContact = useCallback(() => {
    if (!contacts || !onContactsChange) return;
    onContactsChange([...contacts, { name: '', phone: '', relationship: '' }]);
  }, [contacts, onContactsChange]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card variant="flat" style={styles.stepCard}>
          <Text variant="h3" style={styles.title}>
            {step.title}
          </Text>
          <Text variant="body" color="textSecondary" style={styles.description}>
            {step.description}
          </Text>
        </Card>

        {isContactStep && contacts ? (
          <>
            {contacts.map((contact, index) => (
              <SafetyContactInput
                key={index}
                contact={contact}
                index={index}
                onChange={handleContactChange}
                onRemove={handleRemoveContact}
              />
            ))}
            <Button
              variant="outline"
              title="+ Add Contact"
              onPress={handleAddContact}
              style={styles.addButton}
              accessibilityLabel={`Add contact to ${step.title}`}
              accessibilityRole="button"
            />
          </>
        ) : (
          <>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInput}>
                  <Input
                    label={`Item ${index + 1}`}
                    value={item}
                    onChangeText={(text: string) => handleItemChange(index, text)}
                    placeholder={step.placeholder}
                    accessibilityLabel={`${step.title} item ${index + 1}`}
                    accessibilityRole="none"
                  />
                </View>
                <Button
                  variant="outline"
                  title="✕"
                  onPress={() => handleRemoveItem(index)}
                  style={styles.removeButton}
                  size="small"
                  accessibilityLabel={`Remove item ${index + 1} from ${step.title}`}
                  accessibilityRole="button"
                />
              </View>
            ))}
            <Button
              variant="outline"
              title="+ Add Item"
              onPress={handleAddItem}
              style={styles.addButton}
              accessibilityLabel={`Add item to ${step.title}`}
              accessibilityRole="button"
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
