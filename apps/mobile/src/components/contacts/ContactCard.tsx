/**
 * ContactCard Component
 * Displays a recovery contact with quick actions
 * Memoized for FlatList performance
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Role-based icons with colors
 * - Contact urgency indicators
 * - Long press for edit/delete
 * - Quick call/text actions
 * - Full accessibility support
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, type AlertButton, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import type { RecoveryContact, ContactRole } from '@recovery/shared';
import * as Haptics from 'expo-haptics';

interface ContactCardProps {
  contact: RecoveryContact;
  onCall: () => void;
  onText: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  enteringDelay?: number;
}

const ROLE_CONFIG: Record<
  ContactRole,
  { icon: React.ComponentProps<typeof Feather>['name']; color: string; bgColor: string; label: string }
> = {
  sponsor: {
    icon: 'star',
    color: '#fbbf24',
    bgColor: 'rgba(245, 158, 11, 0.2)',
    label: 'Sponsor',
  },
  emergency: {
    icon: 'alert-circle',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    label: 'Emergency',
  },
  sponsee: {
    icon: 'heart',
    color: '#4ade80',
    bgColor: 'rgba(34, 197, 94, 0.2)',
    label: 'Sponsee',
  },
  home_group: {
    icon: 'home',
    color: '#60a5fa',
    bgColor: 'rgba(59, 130, 246, 0.2)',
    label: 'Home Group',
  },
  fellowship: {
    icon: 'users',
    color: '#a78bfa',
    bgColor: 'rgba(139, 92, 246, 0.2)',
    label: 'Fellowship',
  },
};

function ContactCardComponent({
  contact,
  onCall,
  onText,
  onEdit,
  onDelete,
  showActions = true,
  enteringDelay = 0,
}: ContactCardProps) {
  const roleConfig = ROLE_CONFIG[contact.role];

  const getDaysSinceContact = useCallback((): { text: string; color: string } => {
    if (!contact.lastContactedAt) {
      return { text: 'Not contacted yet', color: '#64748b' };
    }

    const now = new Date();
    const lastContact = new Date(contact.lastContactedAt);
    const diffTime = now.getTime() - lastContact.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let text: string;
    let color: string;

    if (diffDays === 0) {
      text = 'Contacted today';
      color = '#22c55e';
    } else if (diffDays === 1) {
      text = 'Contacted yesterday';
      color = '#22c55e';
    } else if (diffDays < 7) {
      text = `${diffDays} days ago`;
      color = '#22c55e';
    } else if (diffDays < 14) {
      text = '1 week ago';
      color = '#f59e0b';
    } else if (diffDays < 30) {
      text = `${Math.floor(diffDays / 7)} weeks ago`;
      color = '#f59e0b';
    } else {
      text = `${Math.floor(diffDays / 30)} months ago`;
      color = '#ef4444';
    }

    return { text, color };
  }, [contact.lastContactedAt]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (onEdit || onDelete) {
      const buttons: AlertButton[] = [];
      if (onEdit) buttons.push({ text: 'Edit', onPress: onEdit });
      if (onDelete)
        buttons.push({
          text: 'Delete',
          onPress: onDelete,
          style: 'destructive',
        });
      buttons.push({ text: 'Cancel', style: 'cancel' });

      Alert.alert(contact.name, 'What would you like to do?', buttons);
    }
  }, [contact.name, onEdit, onDelete]);

  const handleCall = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onCall();
  }, [onCall]);

  const handleText = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onText();
  }, [onText]);

  const contactStatus = getDaysSinceContact();
  const accessibilityLabel = `${contact.name}, ${roleConfig.label}, ${contactStatus.text}. Phone: ${contact.phone}`;

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 30)}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        delayLongPress={500}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Long press for edit or delete options"
      >
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.container}>
            {/* Avatar/Icon */}
            <View style={[styles.avatar, { backgroundColor: roleConfig.bgColor }]}>
              <Feather name={roleConfig.icon} size={22} color={roleConfig.color} />
            </View>

            {/* Contact Info */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{contact.name}</Text>
                {contact.role === 'sponsor' && (
                  <View style={styles.sponsorBadge}>
                    <Text style={styles.sponsorText}>Sponsor</Text>
                  </View>
                )}
              </View>
              <Text style={styles.phone}>{contact.phone}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: contactStatus.color }]} />
                <Text style={[styles.statusText, { color: contactStatus.color }]}>
                  {contactStatus.text}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            {showActions && (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleText}
                  style={[styles.actionButton, styles.textButton]}
                  accessibilityRole="button"
                  accessibilityLabel={`Text ${contact.name}`}
                  accessibilityHint="Opens messaging app"
                >
                  <Feather name="message-circle" size={20} color="#60a5fa" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCall}
                  style={[styles.actionButton, styles.callButton]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${contact.name}`}
                  accessibilityHint="Initiates phone call"
                >
                  <Feather name="phone" size={20} color="#22c55e" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Memoize to prevent unnecessary re-renders in FlatList
export const ContactCard = memo(ContactCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.contact.id === nextProps.contact.id &&
    prevProps.contact.name === nextProps.contact.name &&
    prevProps.contact.phone === nextProps.contact.phone &&
    prevProps.contact.role === nextProps.contact.role &&
    prevProps.contact.lastContactedAt === nextProps.contact.lastContactedAt &&
    prevProps.showActions === nextProps.showActions &&
    prevProps.onCall === nextProps.onCall &&
    prevProps.onText === nextProps.onText &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  sponsorBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sponsorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fbbf24',
  },
  phone: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  callButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
});
