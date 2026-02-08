/**
 * SponsorWidget Component
 * Quick access to sponsor with call, text, and SOS functionality
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Haptic feedback on actions
 * - SOS confirmation dialog (prevents accidental sends)
 * - Urgency indicators for last contact
 * - Empty state CTA when no sponsor
 * - Accessibility optimized
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import { useContacts } from '../../hooks/useContacts';
import { usePhoneCalls } from '../../hooks/usePhoneCalls';
import { sendSOSMessage, makePhoneCall, openMessagingApp, SOS_MESSAGE } from '@recovery/shared';
import { logger } from '../../utils/logger';
import { useRouterCompat } from '../../utils/navigationHelper';
import * as Haptics from 'expo-haptics';

interface SponsorWidgetProps {
  /** Compact mode for smaller display */
  compact?: boolean;
  /** Delay index for staggered entrance animation */
  enteringDelay?: number;
}

export function SponsorWidget({ compact = false, enteringDelay = 0 }: SponsorWidgetProps) {
  const router = useRouterCompat();
  const { sponsor, loadContacts, markContacted } = useContacts();
  const { logCallWithContact } = usePhoneCalls();
  const [daysSinceContact, setDaysSinceContact] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadContacts();
      setIsLoading(false);
    };
    loadData();
  }, [loadContacts]);

  useEffect(() => {
    if (sponsor?.lastContactedAt) {
      const days = Math.floor(
        (Date.now() - new Date(sponsor.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      setDaysSinceContact(days);
    } else {
      setDaysSinceContact(null);
    }
  }, [sponsor]);

  const handleCall = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const success = await makePhoneCall(sponsor!.phone);
      if (success) {
        await logCallWithContact(sponsor!);
        await markContacted(sponsor!.id);
      }
    } catch (error) {
      logger.error('Failed to call sponsor', error);
      Alert.alert('Call Failed', 'Unable to make the call. Please try again.');
    }
  }, [sponsor, logCallWithContact, markContacted]);

  const handleText = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const success = await openMessagingApp(sponsor!.phone);
      if (success) {
        await markContacted(sponsor!.id);
      }
    } catch (error) {
      logger.error('Failed to open messaging', error);
    }
  }, [sponsor, markContacted]);

  const handleSOS = useCallback(async () => {
    // Haptic warning
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

    // Confirmation dialog to prevent accidental sends
    Alert.alert(
      'Send SOS Message?',
      `This will text your sponsor: "${SOS_MESSAGE}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              const result = await sendSOSMessage(sponsor!.phone, sponsor!.name);
              if (result.success) {
                await markContacted(sponsor!.id);
                Alert.alert('Message Sent', `SOS message sent to ${sponsor!.name}`);
              }
            } catch (error) {
              logger.error('Failed to send SOS', error);
              Alert.alert('Failed', 'Unable to send SOS message. Please try calling directly.');
            }
          },
        },
      ]
    );
  }, [sponsor, markContacted]);

  const handleAddSponsor = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/sponsor/connect');
  }, [router]);

  const getDaysSinceText = () => {
    if (daysSinceContact === null) return 'No contact logged';
    if (daysSinceContact === 0) return 'Contacted today';
    if (daysSinceContact === 1) return 'Contacted yesterday';
    return `${daysSinceContact} days since last contact`;
  };

  const getContactUrgencyColor = () => {
    if (daysSinceContact === null) return '#64748b';
    if (daysSinceContact <= 3) return '#22c55e'; // green
    if (daysSinceContact <= 7) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getContactUrgencyBg = () => {
    if (daysSinceContact === null) return 'rgba(100, 116, 139, 0.2)';
    if (daysSinceContact <= 3) return 'rgba(34, 197, 94, 0.2)';
    if (daysSinceContact <= 7) return 'rgba(245, 158, 11, 0.2)';
    return 'rgba(239, 68, 68, 0.2)';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.skeleton}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonText} />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // Empty state - show CTA to add sponsor
  if (!sponsor) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <TouchableOpacity
          onPress={handleAddSponsor}
          accessibilityRole="button"
          accessibilityLabel="Add a sponsor"
          accessibilityHint="Opens screen to connect with a sponsor"
        >
          <GlassCard gradient="card" style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyIconContainer}>
                <Feather name="user-plus" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.emptyTitle}>Add Your Sponsor</Text>
              <Text style={styles.emptySubtitle}>
                Connect with your sponsor for quick access to support
              </Text>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>Connect Sponsor →</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (compact) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.compactContainer}>
            <View style={styles.compactLeft}>
              <View style={[styles.avatar, { backgroundColor: getContactUrgencyBg() }]}>
                <Feather name="star" size={20} color={getContactUrgencyColor()} />
              </View>
              <View style={styles.compactInfo}>
                <Text style={styles.compactName}>{sponsor.name}</Text>
                <Text style={[styles.compactStatus, { color: getContactUrgencyColor() }]}>
                  {getDaysSinceText()}
                </Text>
              </View>
            </View>
            <View style={styles.compactActions}>
              <TouchableOpacity
                onPress={handleCall}
                style={[styles.actionButton, styles.callButton]}
                accessibilityRole="button"
                accessibilityLabel={`Call ${sponsor.name}`}
                accessibilityHint="Initiates phone call"
              >
                <Feather name="phone" size={18} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSOS}
                style={[styles.actionButton, styles.sosButton]}
                accessibilityRole="button"
                accessibilityLabel="Send SOS message to sponsor"
                accessibilityHint={`Sends: ${SOS_MESSAGE}`}
              >
                <Feather name="alert-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
      <GlassCard gradient="elevated" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: getContactUrgencyBg() }]}>
            <Feather name="star" size={24} color={getContactUrgencyColor()} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>Your Sponsor</Text>
            <Text style={styles.headerName}>{sponsor.name}</Text>
            <Text style={[styles.headerStatus, { color: getContactUrgencyColor() }]}>
              {getDaysSinceText()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleCall}
            style={[styles.mainButton, styles.callMainButton]}
            accessibilityRole="button"
            accessibilityLabel={`Call ${sponsor.name}`}
            accessibilityHint="Initiates phone call"
          >
            <Feather name="phone" size={18} color="#ffffff" />
            <Text style={styles.mainButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleText}
            style={[styles.mainButton, styles.textButton]}
            accessibilityRole="button"
            accessibilityLabel={`Text ${sponsor.name}`}
            accessibilityHint="Opens messaging app"
          >
            <Feather name="message-circle" size={18} color="#ffffff" />
            <Text style={styles.mainButtonText}>Text</Text>
          </TouchableOpacity>
        </View>

        {/* SOS Button */}
        <TouchableOpacity
          onPress={handleSOS}
          style={styles.sosMainButton}
          accessibilityRole="button"
          accessibilityLabel="Send SOS message to sponsor"
          accessibilityHint={`Sends: ${SOS_MESSAGE}`}
        >
          <Feather name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.sosButtonText}>SOS - I need to talk</Text>
        </TouchableOpacity>

        {/* Help text */}
        <Text style={styles.helpText} accessibilityElementsHidden>
          SOS sends: "{SOS_MESSAGE}"
        </Text>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  emptyCard: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
  },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.5,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginRight: 12,
  },
  skeletonText: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 8,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fbbf24',
    fontWeight: '600',
    fontSize: 14,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  compactStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  compactActions: {
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
  callButton: {
    backgroundColor: '#22c55e',
  },
  sosButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  headerStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  callMainButton: {
    backgroundColor: '#22c55e',
  },
  textButton: {
    backgroundColor: '#3b82f6',
  },
  mainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sosMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  sosButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
  },
});
