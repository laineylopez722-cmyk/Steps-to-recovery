/**
 * Safe Dial Protection Hooks
 * 
 * React hooks for managing risky contacts and intervention flow.
 * Uses optimistic updates and proper error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getRiskyContacts,
  addRiskyContact,
  updateRiskyContact,
  deleteRiskyContact,
  isRiskyContact,
  logCloseCall,
  getCloseCallHistory,
  getCloseCallStats,
  addMultipleRiskyContacts,
  type RiskyContact,
  type CloseCall,
  type CloseCallStats,
  type AddRiskyContactParams,
  type LogCloseCallParams,
  type ActionTaken,
  type RelationshipType,
} from '../../../services/safeDialService';
import { logger } from '../../../utils/logger';

// ========================================
// Hook: useRiskyContacts
// ========================================

export interface UseRiskyContactsReturn {
  contacts: RiskyContact[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addContact: (params: Omit<AddRiskyContactParams, 'userId'>) => Promise<RiskyContact>;
  updateContact: (
    contactId: string,
    updates: Partial<Pick<RiskyContact, 'name' | 'phoneNumber' | 'relationshipType' | 'notes' | 'isActive'>>
  ) => Promise<RiskyContact>;
  removeContact: (contactId: string) => Promise<void>;
  addMultiple: (contacts: Omit<AddRiskyContactParams, 'userId'>[]) => Promise<{
    successful: RiskyContact[];
    failed: Array<{ contact: Omit<AddRiskyContactParams, 'userId'>; error: string }>;
  }>;
}

/**
 * Hook for managing risky contacts (Danger Zone)
 */
export function useRiskyContacts(): UseRiskyContactsReturn {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<RiskyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getRiskyContacts(user.id);
      setContacts(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch risky contacts');
      setError(error);
      logger.error('useRiskyContacts: refetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addContact = useCallback(
    async (params: Omit<AddRiskyContactParams, 'userId'>): Promise<RiskyContact> => {
      if (!user?.id) throw new Error('Not authenticated');

      const newContact = await addRiskyContact({
        ...params,
        userId: user.id,
      });

      // Optimistic update
      setContacts((prev) => [newContact, ...prev]);
      return newContact;
    },
    [user?.id]
  );

  const updateContact = useCallback(
    async (
      contactId: string,
      updates: Partial<Pick<RiskyContact, 'name' | 'phoneNumber' | 'relationshipType' | 'notes' | 'isActive'>>
    ): Promise<RiskyContact> => {
      const updated = await updateRiskyContact(contactId, updates);

      // Optimistic update
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? updated : c))
      );

      return updated;
    },
    []
  );

  const removeContact = useCallback(async (contactId: string): Promise<void> => {
    await deleteRiskyContact(contactId);

    // Optimistic update
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  }, []);

  const addMultiple = useCallback(
    async (contactsToAdd: Omit<AddRiskyContactParams, 'userId'>[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      const paramsWithUserId = contactsToAdd.map((c) => ({
        ...c,
        userId: user.id,
      }));

      const result = await addMultipleRiskyContacts(paramsWithUserId);

      // Optimistic update with successful additions
      setContacts((prev) => [...result.successful, ...prev]);

      return result;
    },
    [user?.id]
  );

  return {
    contacts,
    loading,
    error,
    refetch,
    addContact,
    updateContact,
    removeContact,
    addMultiple,
  };
}

// ========================================
// Hook: useCheckRiskyContact
// ========================================

export interface UseCheckRiskyContactReturn {
  checkContact: (phoneNumber: string) => Promise<RiskyContact | null>;
  isChecking: boolean;
}

/**
 * Hook for checking if a phone number is in the danger zone
 * Useful for real-time intervention checking
 */
export function useCheckRiskyContact(): UseCheckRiskyContactReturn {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkContact = useCallback(
    async (phoneNumber: string): Promise<RiskyContact | null> => {
      if (!user?.id) return null;

      try {
        setIsChecking(true);
        return await isRiskyContact(user.id, phoneNumber);
      } catch (err) {
        logger.error('useCheckRiskyContact: check failed', err);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [user?.id]
  );

  return {
    checkContact,
    isChecking,
  };
}

// ========================================
// Hook: useCloseCallTracking
// ========================================

export interface UseCloseCallTrackingReturn {
  history: CloseCall[];
  stats: CloseCallStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  logCall: (params: Omit<LogCloseCallParams, 'userId'>) => Promise<CloseCall>;
}

/**
 * Hook for tracking close calls (intervention attempts)
 */
export function useCloseCallTracking(): UseCloseCallTrackingReturn {
  const { user } = useAuth();
  const [history, setHistory] = useState<CloseCall[]>([]);
  const [stats, setStats] = useState<CloseCallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setHistory([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [historyData, statsData] = await Promise.all([
        getCloseCallHistory(user.id),
        getCloseCallStats(user.id),
      ]);

      setHistory(historyData);
      setStats(statsData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch close call data');
      setError(error);
      logger.error('useCloseCallTracking: refetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const logCall = useCallback(
    async (params: Omit<LogCloseCallParams, 'userId'>): Promise<CloseCall> => {
      if (!user?.id) throw new Error('Not authenticated');

      const closeCall = await logCloseCall({
        ...params,
        userId: user.id,
      });

      // Optimistic update
      setHistory((prev) => [closeCall, ...prev]);

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          totalCloseCalls: stats.totalCloseCalls + 1,
          timesResisted:
            ['called_sponsor', 'texted_sponsor', 'waited', 'dismissed', 'played_game'].includes(
              params.actionTaken
            )
              ? stats.timesResisted + 1
              : stats.timesResisted,
          timesProceeded:
            params.actionTaken === 'proceeded' ? stats.timesProceeded + 1 : stats.timesProceeded,
          lastCloseCall: closeCall.createdAt,
        });
      }

      return closeCall;
    },
    [user?.id, stats]
  );

  return {
    history,
    stats,
    loading,
    error,
    refetch,
    logCall,
  };
}

// ========================================
// Export Types for Convenience
// ========================================

export type {
  RiskyContact,
  CloseCall,
  CloseCallStats,
  AddRiskyContactParams,
  LogCloseCallParams,
  ActionTaken,
  RelationshipType,
};
