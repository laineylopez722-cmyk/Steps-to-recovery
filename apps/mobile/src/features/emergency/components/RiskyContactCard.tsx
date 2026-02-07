/**
 * RiskyContactCard Component
 *
 * Displays a single risky contact with edit/delete actions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Card, useTheme } from '../../../design-system';
import { hapticSelection, hapticWarning } from '../../../utils/haptics';
import type { RiskyContact, RelationshipType } from '../hooks';

interface RiskyContactCardProps {
  contact: RiskyContact;
  onEdit?: (contact: RiskyContact) => void;
  onDelete?: (contactId: string) => void;
}

const RELATIONSHIP_ICONS: Record<RelationshipType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  dealer: 'pill',
  old_friend: 'account-group',
  trigger_person: 'alert-circle',
  other: 'account-alert',
};

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  dealer: 'Dealer',
  old_friend: 'Old Using Friend',
  trigger_person: 'Trigger Person',
  other: 'Other',
};

export function RiskyContactCard({
  contact,
  onEdit,
  onDelete,
}: RiskyContactCardProps): React.ReactElement {
  const theme = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (): void => {
    hapticWarning();

    Alert.alert(
      'Remove Protection?',
      `Are you sure you want to remove protection from "${contact.name}"? You can always add them back later.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => hapticSelection(),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              onDelete?.(contact.id);
              hapticSelection();
            } catch (_error) {
              Alert.alert('Error', 'Failed to remove contact. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleEdit = (): void => {
    hapticSelection();
    onEdit?.(contact);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Simple US format: (XXX) XXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const addedDate = new Date(contact.addedAt);
  const daysAgo = Math.floor((Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={{ opacity: isDeleting ? 0.5 : 1 }}
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.danger + '20' }]}>
              <MaterialCommunityIcons
                name={RELATIONSHIP_ICONS[contact.relationshipType]}
                size={24}
                color={theme.colors.danger}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[theme.typography.h3, { color: theme.colors.text }]} numberOfLines={1}>
                {contact.name}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {RELATIONSHIP_LABELS[contact.relationshipType]}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {onEdit && (
              <Pressable
                onPress={handleEdit}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${contact.name}`}
                disabled={isDeleting}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={handleDelete}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${contact.name}`}
                disabled={isDeleting}
              >
                <MaterialCommunityIcons name="delete" size={20} color={theme.colors.danger} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="phone"
              size={16}
              color={theme.colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              {formatPhoneNumber(contact.phoneNumber)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={theme.colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
              Added {daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}
            </Text>
          </View>

          {contact.notes && (
            <View style={[styles.notesContainer, { backgroundColor: theme.colors.background }]}>
              <Text
                style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {contact.notes}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  notesContainer: {
    marginTop: 4,
    padding: 12,
    borderRadius: 8,
  },
});
