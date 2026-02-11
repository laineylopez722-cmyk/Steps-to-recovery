/**
 * Safety Plan Summary
 *
 * Read-only full plan view with "Call" buttons next to contacts.
 */

import React, { useCallback } from 'react';
import { View, ScrollView, Linking, Alert } from 'react-native';
import { Text } from '../../../design-system/components/Text';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { logger } from '../../../utils/logger';
import { SAFETY_PLAN_STEPS } from '../types';
import type { SafetyPlanData, SafetyContact } from '../types';

interface SafetyPlanSummaryProps {
  plan: SafetyPlanData;
  onEdit: () => void;
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
    sectionCard: {
      marginBottom: ds.space[4],
    },
    sectionTitle: {
      marginBottom: ds.space[2],
    },
    item: {
      paddingVertical: ds.space[1],
    },
    contactRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: ds.space[2],
    },
    contactInfo: {
      flex: 1,
    },
    callButton: {
      minWidth: 48,
      minHeight: 48,
    },
    editButton: {
      marginTop: ds.space[4],
    },
    emptyText: {
      fontStyle: 'italic' as const,
    },
  }) as const;

function ContactRow({ contact }: { contact: SafetyContact }): React.ReactElement {
  const styles = useThemedStyles(createStyles);

  const handleCall = useCallback(async () => {
    const phoneUrl = `tel:${contact.phone}`;
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Unable to Call', 'Phone calls are not supported on this device.');
      }
    } catch (err) {
      logger.error('Failed to initiate call', err);
    }
  }, [contact.phone]);

  return (
    <View style={styles.contactRow}>
      <View style={styles.contactInfo}>
        <Text variant="body" weight="semibold">
          {contact.name}
        </Text>
        {contact.relationship ? (
          <Text variant="caption" color="textSecondary">
            {contact.relationship}
          </Text>
        ) : null}
        <Text variant="body" color="textSecondary">
          {contact.phone}
        </Text>
      </View>
      {contact.phone ? (
        <Button
          variant="primary"
          title="Call"
          onPress={handleCall}
          size="small"
          style={styles.callButton}
          accessibilityLabel={`Call ${contact.name}`}
          accessibilityRole="button"
          accessibilityHint="Double tap to call"
        />
      ) : null}
    </View>
  );
}

function renderItems(items: string[], label: string): React.ReactElement[] {
  if (items.length === 0) {
    return [];
  }
  return items
    .filter((item) => item.trim().length > 0)
    .map((item, index) => (
      <Text
        key={index}
        variant="body"
        accessibilityLabel={`${label} item ${index + 1}: ${item}`}
      >
        • {item}
      </Text>
    ));
}

export function SafetyPlanSummary({ plan, onEdit }: SafetyPlanSummaryProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);

  const sections: Array<{
    step: (typeof SAFETY_PLAN_STEPS)[number];
    items?: string[];
    contacts?: SafetyContact[];
  }> = [
    { step: SAFETY_PLAN_STEPS[0], items: plan.warningSigns },
    { step: SAFETY_PLAN_STEPS[1], items: plan.copingStrategies },
    { step: SAFETY_PLAN_STEPS[2], items: plan.distractionPeople },
    { step: SAFETY_PLAN_STEPS[3], contacts: plan.supportContacts },
    { step: SAFETY_PLAN_STEPS[4], contacts: plan.professionalContacts },
    { step: SAFETY_PLAN_STEPS[5], items: plan.safeEnvironment },
    { step: SAFETY_PLAN_STEPS[6], items: plan.reasonsToLive },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sections.map((section) => (
          <Card key={section.step.stepNumber} variant="elevated" style={styles.sectionCard}>
            <Text variant="h3" style={styles.sectionTitle}>
              {section.step.stepNumber}. {section.step.title}
            </Text>
            {section.contacts ? (
              section.contacts.length > 0 ? (
                section.contacts.map((contact, i) => (
                  <ContactRow key={i} contact={contact} />
                ))
              ) : (
                <Text variant="body" color="textSecondary" style={styles.emptyText}>
                  No contacts added
                </Text>
              )
            ) : (
              <>
                {section.items && renderItems(section.items, section.step.title).length > 0 ? (
                  renderItems(section.items, section.step.title)
                ) : (
                  <Text variant="body" color="textSecondary" style={styles.emptyText}>
                    No items added
                  </Text>
                )}
              </>
            )}
          </Card>
        ))}

        <Button
          variant="outline"
          title="Edit Safety Plan"
          onPress={onEdit}
          style={styles.editButton}
          accessibilityLabel="Edit safety plan"
          accessibilityRole="button"
        />
      </ScrollView>
    </View>
  );
}
