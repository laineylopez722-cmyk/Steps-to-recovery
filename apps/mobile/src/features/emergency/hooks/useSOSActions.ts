/**
 * useSOSActions Hook
 *
 * Manages SOS action configuration and execution.
 * Supports phone calls via Linking, screen navigation, and custom actions.
 * Sponsor phone number is resolved from sponsor_connections table.
 */

import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import { hapticHeavy, hapticWarning } from '../../../utils/haptics';
import { type SOSAction, DEFAULT_SOS_ACTIONS } from '../types';

interface SponsorRow {
  phone_number: string | null;
}

interface UseSOSActionsReturn {
  actions: SOSAction[];
  executeAction: (action: SOSAction) => Promise<void>;
  isExecuting: boolean;
}

export function useSOSActions(): UseSOSActionsReturn {
  const { db } = useDatabase();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isExecuting, setIsExecuting] = useState(false);

  const resolveSponsorPhone = useCallback(async (): Promise<string | null> => {
    if (!db || !user) return null;

    try {
      const row = await db.getFirstAsync<SponsorRow>(
        `SELECT phone_number FROM sponsor_connections
         WHERE sponsee_id = ? AND status = 'accepted'
         ORDER BY created_at DESC LIMIT 1`,
        [user.id],
      );
      return row?.phone_number ?? null;
    } catch (error) {
      logger.error('Failed to resolve sponsor phone', error);
      return null;
    }
  }, [db, user]);

  const dialPhone = useCallback(async (phoneNumber: string): Promise<void> => {
    const url = `tel:${phoneNumber.replace(/\s/g, '')}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Cannot Make Call',
        `Unable to dial ${phoneNumber}. Please try from your phone app.`,
      );
    }
  }, []);

  const executeAction = useCallback(
    async (action: SOSAction): Promise<void> => {
      if (isExecuting) return;
      setIsExecuting(true);

      try {
        await hapticHeavy();
        logger.info('SOS action triggered', { actionId: action.id, type: action.type });

        switch (action.type) {
          case 'call': {
            if (action.target === 'sponsor') {
              const phone = await resolveSponsorPhone();
              if (phone) {
                await dialPhone(phone);
              } else {
                await hapticWarning();
                Alert.alert(
                  'No Sponsor Found',
                  "You don't have an active sponsor connection. Would you like to call the crisis hotline instead?",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Call 988',
                      onPress: async () => {
                        await dialPhone('988');
                      },
                    },
                  ],
                );
              }
            } else {
              await dialPhone(action.target);
            }
            break;
          }

          case 'navigate': {
            navigation.navigate(action.target as never);
            break;
          }

          case 'action': {
            logger.info('Custom SOS action executed', { actionId: action.id });
            break;
          }
        }
      } catch (error) {
        logger.error('SOS action failed', error);
        await hapticWarning();
        Alert.alert(
          'Action Failed',
          'Something went wrong. Please try again or call 988 directly.',
        );
      } finally {
        setIsExecuting(false);
      }
    },
    [isExecuting, navigation, resolveSponsorPhone, dialPhone],
  );

  return {
    actions: DEFAULT_SOS_ACTIONS,
    executeAction,
    isExecuting,
  };
}
