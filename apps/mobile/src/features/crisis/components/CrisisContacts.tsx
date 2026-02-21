/**
 * CrisisContacts - Emergency Contacts with Tap-to-Call
 *
 * Displays crisis hotlines and user's custom emergency contacts
 * with one-tap calling/texting during crisis moments.
 *
 * WCAG AAA compliant with large touch targets (≥48dp).
 */

import React, { useCallback, type ReactElement } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { spacing, radius } from '../../../design-system/tokens/modern';
import { Text } from '../../../design-system/components/Text';
import { useEmergencyAccess } from '../../../hooks/useEmergencyAccess';
import { logger } from '../../../utils/logger';

const PRIMARY_HOTLINES: Array<{
  name: string;
  number: string;
  displayNumber: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  action: 'call' | 'text';
}> = [
  {
    name: '988 Suicide & Crisis Lifeline',
    number: '988',
    displayNumber: '988',
    description: '24/7 free crisis support',
    icon: 'phone',
    action: 'call',
  },
  {
    name: 'Crisis Text Line',
    number: '741741',
    displayNumber: 'Text HOME to 741741',
    description: 'Free 24/7 text-based support',
    icon: 'message',
    action: 'text',
  },
  {
    name: 'SAMHSA National Helpline',
    number: '18006624357',
    displayNumber: '1-800-662-4357',
    description: 'Substance abuse treatment referral',
    icon: 'local-hospital',
    action: 'call',
  },
];

interface CrisisContactsProps {
  /** Whether to show user's custom emergency contacts */
  showCustomContacts?: boolean;
}

export function CrisisContacts({ showCustomContacts = true }: CrisisContactsProps): ReactElement {
  const styles = useThemedStyles(createStyles);
  const { emergencyContacts, callCrisisLine: _callCrisisLine } = useEmergencyAccess();

  const triggerHaptic = useCallback((): void => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
        // Haptics not available
      });
    }
  }, []);

  const handleCallHotline = useCallback(
    async (number: string, name: string): Promise<void> => {
      triggerHaptic();
      logger.info('Crisis hotline call initiated', { hotline: name });
      const cleanNumber = number.replace(/[^\d+]/g, '');

      try {
        await Linking.openURL(`tel:${cleanNumber}`);
      } catch (error) {
        logger.warn('Failed to initiate crisis hotline call', {
          hotline: name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [triggerHaptic],
  );

  const handleTextHotline = useCallback(
    async (number: string, name: string): Promise<void> => {
      triggerHaptic();
      logger.info('Crisis text line initiated', { hotline: name });
      const cleanNumber = number.replace(/[^\d+]/g, '');
      const body = encodeURIComponent('HOME');
      const smsUrl =
        Platform.OS === 'ios'
          ? `sms:${cleanNumber}&body=${body}`
          : `sms:${cleanNumber}?body=${body}`;

      try {
        await Linking.openURL(smsUrl);
      } catch (error) {
        logger.warn('Failed to initiate crisis text line', {
          hotline: name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [triggerHaptic],
  );

  const handleCallContact = useCallback(
    async (phone: string, name: string): Promise<void> => {
      triggerHaptic();
      logger.info('Emergency contact call initiated', { contactName: name });
      const cleanNumber = phone.replace(/[^\d+]/g, '');

      try {
        await Linking.openURL(`tel:${cleanNumber}`);
      } catch (error) {
        logger.warn('Failed to initiate emergency contact call', {
          contactName: name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [triggerHaptic],
  );

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Get Help Now
      </Text>
      <Text style={styles.description}>You don't have to do this alone. Reach out.</Text>

      {/* Primary hotlines */}
      {PRIMARY_HOTLINES.map((hotline, index) => (
        <Animated.View key={hotline.number} entering={FadeInDown.duration(300).delay(index * 80)}>
          <Pressable
            onPress={() => {
              if (hotline.action === 'text') {
                void handleTextHotline(hotline.number, hotline.name);
              } else {
                void handleCallHotline(hotline.number, hotline.name);
              }
            }}
            style={styles.hotlineCard}
            accessibilityLabel={`${hotline.action === 'call' ? 'Call' : 'Text'} ${hotline.name} at ${hotline.displayNumber}`}
            accessibilityRole="button"
            accessibilityHint={`${hotline.action === 'call' ? 'Makes a phone call' : 'Opens text message'} to ${hotline.name}`}
          >
            <View style={styles.hotlineIcon}>
              <MaterialIcons name={hotline.icon} size={24} color={styles.iconColor.color} />
            </View>
            <View style={styles.hotlineContent}>
              <Text style={styles.hotlineName}>{hotline.name}</Text>
              <Text style={styles.hotlineNumber}>{hotline.displayNumber}</Text>
              <Text style={styles.hotlineDescription}>{hotline.description}</Text>
            </View>
            <View style={styles.hotlineAction}>
              <MaterialIcons
                name={hotline.action === 'call' ? 'call' : 'message'}
                size={20}
                color="#FFFFFF"
              />
            </View>
          </Pressable>
        </Animated.View>
      ))}

      {/* User's custom emergency contacts */}
      {showCustomContacts && emergencyContacts.length > 0 && (
        <View style={styles.customSection}>
          <Text style={styles.sectionLabel}>Your Emergency Contacts</Text>
          {emergencyContacts.map((contact, index) => (
            <Animated.View
              key={contact.id ?? index}
              entering={FadeInDown.duration(300).delay((PRIMARY_HOTLINES.length + index) * 80)}
            >
              <Pressable
                onPress={() => {
                  if (contact.phone) {
                    void handleCallContact(contact.phone, contact.name);
                  }
                }}
                style={styles.contactCard}
                disabled={!contact.phone}
                accessibilityLabel={`Call ${contact.name}${contact.phone ? ` at ${contact.phone}` : ''}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !contact.phone }}
                accessibilityHint={
                  contact.phone ? 'Makes a phone call' : 'No phone number available'
                }
              >
                <View style={styles.contactIcon}>
                  <MaterialIcons name="person" size={20} color={styles.contactIconColor.color} />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.phone ? (
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  ) : (
                    <Text style={styles.contactNoPhone}>No phone number</Text>
                  )}
                </View>
                {contact.phone && (
                  <MaterialIcons name="call" size={20} color={styles.iconColor.color} />
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      paddingVertical: spacing[4],
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: spacing[1],
    },
    description: {
      fontSize: 15,
      color: ds.semantic.text.tertiary,
      textAlign: 'center' as const,
      marginBottom: spacing[4],
    },
    // Hotline cards
    hotlineCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: ds.semantic.surface.card,
      borderRadius: radius.lg,
      padding: spacing[3],
      marginBottom: spacing[2],
      minHeight: 72,
    },
    hotlineIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ds.semantic.emergency?.calmMuted ?? 'rgba(100, 160, 140, 0.15)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing[2],
    },
    iconColor: {
      color: ds.semantic.emergency?.calm ?? '#6B9B8D',
    },
    hotlineContent: {
      flex: 1,
      marginRight: spacing[2],
    },
    hotlineName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
    },
    hotlineNumber: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: ds.semantic.emergency?.calm ?? '#6B9B8D',
      marginTop: 2,
    },
    hotlineDescription: {
      fontSize: 13,
      color: ds.semantic.text.tertiary,
      marginTop: 2,
    },
    hotlineAction: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ds.semantic.emergency?.calm ?? '#6B9B8D',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    // Custom contacts
    customSection: {
      marginTop: spacing[4],
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: ds.semantic.text.tertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginBottom: spacing[2],
    },
    contactCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: ds.semantic.surface.card,
      borderRadius: radius.lg,
      padding: spacing[3],
      marginBottom: spacing[1],
      minHeight: 56,
    },
    contactIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ds.semantic.intent?.primary?.muted ?? 'rgba(245, 158, 11, 0.15)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing[2],
    },
    contactIconColor: {
      color: ds.semantic.intent?.primary?.solid ?? '#F59E0B',
    },
    contactContent: {
      flex: 1,
    },
    contactName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
    },
    contactPhone: {
      fontSize: 13,
      color: ds.semantic.text.tertiary,
      marginTop: 1,
    },
    contactNoPhone: {
      fontSize: 13,
      color: ds.semantic.text.muted ?? ds.semantic.text.tertiary,
      fontStyle: 'italic' as const,
      marginTop: 1,
    },
  }) as const;
