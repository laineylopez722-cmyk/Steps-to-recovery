/**
 * Contact Store
 * Manages recovery contacts and fellowship network
 */

import { create } from 'zustand';
import type { RecoveryContact, ContactRole } from '../types';
import {
  createRecoveryContact,
  getRecoveryContacts,
  getRecoveryContactById,
  getSponsor,
  updateRecoveryContact,
  updateContactLastContacted,
  deleteRecoveryContact,
} from '../db/models';
import { decryptContent } from '../encryption';

interface ContactState {
  contacts: RecoveryContact[];
  sponsor: RecoveryContact | null;
  isLoading: boolean;
  error: string | null;
}

interface ContactActions {
  loadContacts: () => Promise<void>;
  addContact: (
    name: string,
    phone: string,
    role: ContactRole,
    notes?: string,
  ) => Promise<RecoveryContact>;
  updateContact: (
    id: string,
    updates: Partial<Pick<RecoveryContact, 'name' | 'phone' | 'role' | 'notes'>>,
  ) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  markContacted: (id: string) => Promise<void>;
  getContactById: (id: string) => Promise<RecoveryContact | null>;
  getContactsByRole: (role: ContactRole) => RecoveryContact[];
  decryptContactNotes: (contact: RecoveryContact) => Promise<string | null>;
}

export const useContactStore = create<ContactState & ContactActions>((set, get) => ({
  contacts: [],
  sponsor: null,
  isLoading: false,
  error: null,

  loadContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const contacts = await getRecoveryContacts();
      const sponsor = await getSponsor();
      set({ contacts, sponsor, isLoading: false });
    } catch (error) {
      console.error('Failed to load contacts:', error);
      set({ error: 'Failed to load contacts', isLoading: false });
    }
  },

  addContact: async (name, phone, role, notes) => {
    try {
      const contact = await createRecoveryContact(name, phone, role, notes);

      set((state) => {
        const newContacts = [...state.contacts, contact];
        // Sort by role priority then name
        newContacts.sort((a, b) => {
          const roleOrder: Record<ContactRole, number> = {
            sponsor: 0,
            emergency: 1,
            sponsee: 2,
            home_group: 3,
            fellowship: 4,
          };
          if (roleOrder[a.role] !== roleOrder[b.role]) {
            return roleOrder[a.role] - roleOrder[b.role];
          }
          return a.name.localeCompare(b.name);
        });

        return {
          contacts: newContacts,
          sponsor: role === 'sponsor' ? contact : state.sponsor,
        };
      });

      return contact;
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  },

  updateContact: async (id, updates) => {
    try {
      await updateRecoveryContact(id, updates);

      set((state) => {
        const updatedContacts = state.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c));

        // Update sponsor reference if needed
        let newSponsor = state.sponsor;
        if (updates.role === 'sponsor') {
          newSponsor = updatedContacts.find((c) => c.id === id) || null;
        } else if (state.sponsor?.id === id && updates.role) {
          // If updating the sponsor's role to something other than sponsor
          newSponsor = null;
        }

        return {
          contacts: updatedContacts,
          sponsor: newSponsor,
        };
      });
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  },

  removeContact: async (id) => {
    try {
      await deleteRecoveryContact(id);

      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        sponsor: state.sponsor?.id === id ? null : state.sponsor,
      }));
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  },

  markContacted: async (id) => {
    try {
      await updateContactLastContacted(id);

      set((state) => ({
        contacts: state.contacts.map((c) =>
          c.id === id ? { ...c, lastContactedAt: new Date() } : c,
        ),
        sponsor:
          state.sponsor?.id === id
            ? { ...state.sponsor, lastContactedAt: new Date() }
            : state.sponsor,
      }));
    } catch (error) {
      console.error('Failed to mark contact as contacted:', error);
      throw error;
    }
  },

  getContactById: async (id) => {
    const { contacts } = get();
    const cached = contacts.find((c) => c.id === id);
    if (cached) return cached;

    try {
      return await getRecoveryContactById(id);
    } catch (error) {
      console.error('Failed to get contact:', error);
      return null;
    }
  },

  getContactsByRole: (role) => {
    const { contacts } = get();
    return contacts.filter((c) => c.role === role);
  },

  decryptContactNotes: async (contact) => {
    if (!contact.notes) return null;
    try {
      return await decryptContent(contact.notes);
    } catch (error) {
      console.error('Failed to decrypt notes:', error);
      return null;
    }
  },
}));
