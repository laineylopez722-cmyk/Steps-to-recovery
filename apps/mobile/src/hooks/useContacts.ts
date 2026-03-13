/**
 * Recovery Contacts Hook
 * Provides contact data and actions for UI components
 */

import { useEffect, useMemo, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { useContactStore } from '@recovery/shared';
import type { RecoveryContact, ContactRole } from '@recovery/shared';
import { logger } from '../utils/logger';

interface UseContactsReturn {
  contacts: RecoveryContact[];
  sponsor: RecoveryContact | null;
  isLoading: boolean;
  error: string | null;
  contactsByRole: Record<ContactRole, RecoveryContact[]>;
  recentContacts: RecoveryContact[];
  needsAttention: RecoveryContact[];
  loadContacts: () => Promise<void>;
  addContact: (name: string, phone: string, role: ContactRole, notes?: string) => Promise<RecoveryContact>;
  updateContact: (id: string, updates: Partial<Pick<RecoveryContact, 'name' | 'phone' | 'role' | 'notes'>>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  markContacted: (id: string) => Promise<void>;
  getContactById: (id: string) => Promise<RecoveryContact | null>;
  getContactsByRole: (role: ContactRole) => RecoveryContact[];
  decryptContactNotes: (contact: RecoveryContact) => Promise<string | null>;
  callContact: (contact: RecoveryContact) => Promise<void>;
  textContact: (contact: RecoveryContact, message?: string) => Promise<void>;
  sendSOSToSponsor: () => Promise<void>;
  getRoleLabel: (role: ContactRole) => string;
  getDaysSinceContact: (contact: RecoveryContact) => string;
}

export function useContacts(): UseContactsReturn {
  const {
    contacts,
    sponsor,
    isLoading,
    error,
    loadContacts,
    addContact,
    updateContact,
    removeContact,
    markContacted,
    getContactById,
    getContactsByRole,
    decryptContactNotes,
  } = useContactStore();

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Get contacts grouped by role
  const contactsByRole = useMemo(() => {
    const grouped: Record<ContactRole, RecoveryContact[]> = {
      sponsor: [],
      emergency: [],
      sponsee: [],
      home_group: [],
      fellowship: [],
    };

    contacts.forEach((contact) => {
      grouped[contact.role].push(contact);
    });

    return grouped;
  }, [contacts]);

  // Get recent contacts (contacted within last week)
  const recentContacts = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return contacts.filter((c) => c.lastContactedAt && new Date(c.lastContactedAt) >= weekAgo);
  }, [contacts]);

  // Get contacts needing attention (no contact in 2+ weeks)
  const needsAttention = useMemo(() => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    return contacts.filter((c) => {
      if (!c.lastContactedAt) return true;
      return new Date(c.lastContactedAt) < twoWeeksAgo;
    });
  }, [contacts]);

  // Call a contact using native dialer
  const callContact = useCallback(
    async (contact: RecoveryContact) => {
      const phoneUrl = `tel:${contact.phone.replace(/[^\d+]/g, '')}`;

      try {
        const canOpen = await Linking.canOpenURL(phoneUrl);
        if (canOpen) {
          await Linking.openURL(phoneUrl);
          // Mark as contacted
          await markContacted(contact.id);
        } else {
          Alert.alert('Error', 'Unable to make phone calls on this device');
        }
      } catch (error) {
        logger.error('Failed to call contact', error);
        Alert.alert('Error', 'Failed to initiate call');
      }
    },
    [markContacted],
  );

  // Text a contact
  const textContact = useCallback(
    async (contact: RecoveryContact, message?: string) => {
      const encodedMessage = message ? encodeURIComponent(message) : '';
      const smsUrl = `sms:${contact.phone.replace(/[^\d+]/g, '')}${
        message ? `?body=${encodedMessage}` : ''
      }`;

      try {
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
          await markContacted(contact.id);
        } else {
          Alert.alert('Error', 'Unable to send text messages on this device');
        }
      } catch (error) {
        logger.error('Failed to text contact', error);
        Alert.alert('Error', 'Failed to open messaging');
      }
    },
    [markContacted],
  );

  // Send SOS message to sponsor
  const sendSOSToSponsor = useCallback(async () => {
    if (!sponsor) {
      Alert.alert('No Sponsor Set', 'Please add a sponsor to your contacts first.');
      return;
    }

    const sosMessage = "Hey, I'm having a hard time. Can you talk?";
    await textContact(sponsor, sosMessage);
  }, [sponsor, textContact]);

  // Get role display label
  const getRoleLabel = useCallback((role: ContactRole): string => {
    const labels: Record<ContactRole, string> = {
      sponsor: 'Sponsor',
      sponsee: 'Sponsee',
      home_group: 'Home Group',
      fellowship: 'Fellowship',
      emergency: 'Emergency',
    };
    return labels[role];
  }, []);

  // Format days since last contact
  const getDaysSinceContact = useCallback((contact: RecoveryContact): string => {
    if (!contact.lastContactedAt) {
      return 'Never contacted';
    }

    const now = new Date();
    const lastContact = new Date(contact.lastContactedAt);
    const diffTime = now.getTime() - lastContact.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? 's' : ''} ago`;
  }, []);

  return {
    // State
    contacts,
    sponsor,
    isLoading,
    error,

    // Grouped data
    contactsByRole,
    recentContacts,
    needsAttention,

    // Actions
    loadContacts,
    addContact,
    updateContact,
    removeContact,
    markContacted,
    getContactById,
    getContactsByRole,
    decryptContactNotes,

    // Communication
    callContact,
    textContact,
    sendSOSToSponsor,

    // Utilities
    getRoleLabel,
    getDaysSinceContact,
  };
}
