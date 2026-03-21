/**
 * Emergency Access Hook
 *
 * Quick access to emergency resources during crisis situations.
 * Provides contacts, coping tools, and safety plan in one place.
 *
 * **Crisis Support**:
 * - One-tap call to sponsor/emergency contact
 * - Quick access to breathing exercises
 * - Safety plan visibility
 * - Crisis hotline numbers
 *
 * @example
 * ```ts
 * const {
 *   emergencyContacts,
 *   callSponsor,
 *   callCrisisLine,
 *   openBreathingExercise,
 *   safetyPlan,
 * } = useEmergencyAccess();
 *
 * // In crisis button handler:
 * await callSponsor();
 * ```
 */

import { useCallback, useMemo } from 'react';
import { Linking, Platform, Alert } from 'react-native';
import * as Haptics from '@/platform/haptics';
import { useContactStore } from '@/shared';
import type { RecoveryContact } from '@/shared';
import { logger } from '../utils/logger';

interface CrisisHotline {
  name: string;
  number: string;
  description: string;
  available: string;
}

const CRISIS_HOTLINES: CrisisHotline[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    number: '988',
    description: '24/7 crisis support and suicide prevention',
    available: '24/7',
  },
  {
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    description: 'Substance abuse treatment referral',
    available: '24/7',
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    description: 'Text-based crisis support',
    available: '24/7',
  },
  {
    name: 'AA Hotline',
    number: '1-800-839-1686',
    description: 'Alcoholics Anonymous 24-hour hotline',
    available: '24/7',
  },
  {
    name: 'NA Helpline',
    number: '1-818-773-9999',
    description: 'Narcotics Anonymous helpline',
    available: '24/7',
  },
];

interface SafetyPlanItem {
  category:
    | 'warning_signs'
    | 'coping_strategies'
    | 'support_people'
    | 'professional_help'
    | 'safe_environment';
  title: string;
  items: string[];
}

interface EmergencyAccessState {
  /** Primary sponsor contact (if set) */
  sponsor: RecoveryContact | null;
  /** All emergency contacts */
  emergencyContacts: RecoveryContact[];
  /** Crisis hotline numbers */
  crisisHotlines: CrisisHotline[];
  /** User's safety plan items */
  safetyPlan: SafetyPlanItem[];
  /** Is currently making a call */
  isCalling: boolean;
}

interface EmergencyAccessActions {
  /** Call sponsor (shows confirmation first) */
  callSponsor: (skipConfirmation?: boolean) => Promise<void>;
  /** Call specific contact */
  callContact: (contact: RecoveryContact, skipConfirmation?: boolean) => Promise<void>;
  /** Call crisis hotline */
  callCrisisLine: (hotline: CrisisHotline) => Promise<void>;
  /** Text sponsor */
  textSponsor: (message?: string) => Promise<void>;
  /** Text contact */
  textContact: (contact: RecoveryContact, message?: string) => Promise<void>;
  /** Open phone's emergency dialer */
  callEmergencyServices: () => Promise<void>;
  /** Log emergency event for tracking */
  logEmergencyEvent: (
    eventType: 'call_sponsor' | 'call_crisis_line' | 'view_safety_plan' | 'start_breathing',
  ) => void;
}

export function useEmergencyAccess(): EmergencyAccessState & EmergencyAccessActions {
  const { contacts } = useContactStore();

  // Find sponsor
  const sponsor = useMemo(() => {
    return contacts.find((c) => c.role === 'sponsor') || null;
  }, [contacts]);

  // Get emergency contacts (role = 'emergency' or 'sponsor')
  const emergencyContacts = useMemo(() => {
    return contacts.filter((c) => c.role === 'emergency' || c.role === 'sponsor');
  }, [contacts]);

  // Default safety plan template (user can customize in settings)
  const safetyPlan = useMemo((): SafetyPlanItem[] => {
    return [
      {
        category: 'warning_signs',
        title: 'Warning Signs',
        items: [
          'Feeling isolated or alone',
          'Thinking about past use',
          'Increased stress or anxiety',
          'Sleep problems',
          'Irritability',
        ],
      },
      {
        category: 'coping_strategies',
        title: 'Coping Strategies',
        items: [
          'Practice breathing exercises',
          'Call sponsor or support person',
          'Go to a meeting',
          'Exercise or go for a walk',
          'Write in journal',
          'Play the tape forward',
        ],
      },
      {
        category: 'support_people',
        title: 'People to Contact',
        items: emergencyContacts.map((c) => `${c.name}: ${c.phone}`),
      },
      {
        category: 'professional_help',
        title: 'Professional Help',
        items: CRISIS_HOTLINES.map((h) => `${h.name}: ${h.number}`),
      },
      {
        category: 'safe_environment',
        title: 'Making Environment Safe',
        items: [
          'Remove triggers from home',
          'Avoid high-risk locations',
          'Stay with safe people',
          'Go to a meeting place',
        ],
      },
    ];
  }, [emergencyContacts]);

  const triggerHaptic = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch {
      // Haptics not available
    }
  }, []);

  const makePhoneCall = useCallback(
    async (phoneNumber: string): Promise<void> => {
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      const telUrl = `tel:${cleanNumber}`;

      try {
        const supported = await Linking.canOpenURL(telUrl);
        if (!supported) {
          Alert.alert('Error', 'Phone calls are not supported on this device');
          return;
        }

        await triggerHaptic();
        await Linking.openURL(telUrl);
      } catch (error) {
        logger.error('Failed to make phone call', { phoneNumber: cleanNumber, error });
        Alert.alert('Error', 'Could not make the call. Please try again.');
      }
    },
    [triggerHaptic],
  );

  const sendSMS = useCallback(
    async (phoneNumber: string, message?: string): Promise<void> => {
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      const smsUrl = message
        ? `sms:${cleanNumber}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`
        : `sms:${cleanNumber}`;

      try {
        const supported = await Linking.canOpenURL(smsUrl);
        if (!supported) {
          Alert.alert('Error', 'SMS is not supported on this device');
          return;
        }

        await triggerHaptic();
        await Linking.openURL(smsUrl);
      } catch (error) {
        logger.error('Failed to send SMS', { phoneNumber: cleanNumber, error });
        Alert.alert('Error', 'Could not open SMS. Please try again.');
      }
    },
    [triggerHaptic],
  );

  const callSponsor = useCallback(
    async (skipConfirmation = false): Promise<void> => {
      if (!sponsor) {
        Alert.alert('No Sponsor', 'You have not added a sponsor yet. Add one in your contacts.');
        return;
      }

      if (!sponsor.phone) {
        Alert.alert('No Phone Number', 'Your sponsor does not have a phone number saved.');
        return;
      }

      logger.info('Emergency call to sponsor initiated');

      if (skipConfirmation) {
        await makePhoneCall(sponsor.phone);
        return;
      }

      Alert.alert('Call Sponsor', `Call ${sponsor.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', style: 'default', onPress: () => makePhoneCall(sponsor.phone!) },
      ]);
    },
    [sponsor, makePhoneCall],
  );

  const callContact = useCallback(
    async (contact: RecoveryContact, skipConfirmation = false): Promise<void> => {
      if (!contact.phone) {
        Alert.alert('No Phone Number', `${contact.name} does not have a phone number saved.`);
        return;
      }

      logger.info('Emergency call to contact initiated', { contactName: contact.name });

      if (skipConfirmation) {
        await makePhoneCall(contact.phone);
        return;
      }

      Alert.alert('Call Contact', `Call ${contact.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', style: 'default', onPress: () => makePhoneCall(contact.phone!) },
      ]);
    },
    [makePhoneCall],
  );

  const callCrisisLine = useCallback(
    async (hotline: CrisisHotline): Promise<void> => {
      // Crisis lines don't need confirmation - immediate access is critical
      logger.info('Crisis line call initiated', { hotline: hotline.name });
      await makePhoneCall(hotline.number);
    },
    [makePhoneCall],
  );

  const textSponsor = useCallback(
    async (message?: string): Promise<void> => {
      if (!sponsor) {
        Alert.alert('No Sponsor', 'You have not added a sponsor yet. Add one in your contacts.');
        return;
      }

      if (!sponsor.phone) {
        Alert.alert('No Phone Number', 'Your sponsor does not have a phone number saved.');
        return;
      }

      logger.info('Emergency text to sponsor initiated');
      const defaultMessage = message || "I'm having a tough time and could use some support.";
      await sendSMS(sponsor.phone, defaultMessage);
    },
    [sponsor, sendSMS],
  );

  const textContact = useCallback(
    async (contact: RecoveryContact, message?: string): Promise<void> => {
      if (!contact.phone) {
        Alert.alert('No Phone Number', `${contact.name} does not have a phone number saved.`);
        return;
      }

      logger.info('Emergency text to contact initiated', { contactName: contact.name });
      await sendSMS(contact.phone, message);
    },
    [sendSMS],
  );

  const callEmergencyServices = useCallback(async (): Promise<void> => {
    Alert.alert('Call 911', 'Are you sure you want to call emergency services?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call 911',
        style: 'destructive',
        onPress: async () => {
          logger.info('Emergency services call initiated');
          await makePhoneCall('911');
        },
      },
    ]);
  }, [makePhoneCall]);

  const logEmergencyEvent = useCallback(
    (
      eventType: 'call_sponsor' | 'call_crisis_line' | 'view_safety_plan' | 'start_breathing',
    ): void => {
      logger.info('Emergency event', { eventType, timestamp: new Date().toISOString() });
      // Could also track this for analytics/recovery patterns
    },
    [],
  );

  return {
    sponsor,
    emergencyContacts,
    crisisHotlines: CRISIS_HOTLINES,
    safetyPlan,
    isCalling: false, // Could track with state if needed
    callSponsor,
    callContact,
    callCrisisLine,
    textSponsor,
    textContact,
    callEmergencyServices,
    logEmergencyEvent,
  };
}

export { CRISIS_HOTLINES };
export type { CrisisHotline, SafetyPlanItem };

