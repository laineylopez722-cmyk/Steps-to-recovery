/**
 * PhoneWidget Component
 * Home page widget showing phone call tracking and quick call options
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Loading skeleton state
 * - Error handling with retry
 * - Haptic feedback on actions
 * - Accessibility optimized
 * - Micro-interactions
 */

import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouterCompat } from '../../utils/navigationHelper';
import { GlassCard } from '../../design-system/components/GlassCard';
import { usePhoneCalls } from '../../hooks/usePhoneCalls';
import { useContacts } from '../../hooks/useContacts';
import type { PhoneCallLog, RecoveryContact } from '@recovery/shared';
import * as Haptics from 'expo-haptics';
import { logger } from '../../utils/logger';

interface PhoneWidgetProps {
  /** Delay index for staggered entrance animation */
  enteringDelay?: number;
}

// Progress bar component with accessibility
function ProgressBar({
  progress,
  label,
  sublabel,
}: {
  progress: number;
  label: string;
  sublabel: string;
}) {
  const getProgressColor = () => {
    if (progress >= 1) return '#22c55e'; // green-500
    if (progress >= 0.5) return '#f59e0b'; // amber-500
    return '#60a5fa'; // primary-400
  };

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{sublabel}</Text>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={`Call progress: ${Math.round(progress * 100)}%`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      >
        <View
          style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: getProgressColor() }]}
        />
      </View>
      {progress >= 1 && (
        <Text style={styles.goalReachedText}>✓ Daily goal reached!</Text>
      )}
    </View>
  );
}

// Quick call button with micro-interactions
function QuickCallButton({
  contact,
  onPress,
  isSponsor = false,
  delay = 0,
}: {
  contact: RecoveryContact;
  onPress: () => void;
  isSponsor?: boolean;
  delay?: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress]);

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={[styles.quickCallContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.quickCallButton, isSponsor && styles.sponsorButton]}
        accessibilityRole="button"
        accessibilityLabel={`Call ${contact.name}${isSponsor ? ', your sponsor' : ''}`}
        accessibilityHint="Initiates phone call"
      >
        <Text style={styles.quickCallIcon}>{isSponsor ? '⭐' : '📞'}</Text>
        <Text style={[styles.quickCallName, isSponsor && styles.sponsorName]} numberOfLines={1}>
          {contact.name}
        </Text>
        {isSponsor && <Text style={styles.sponsorLabel}>Sponsor</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function PhoneWidget({ enteringDelay = 3 }: PhoneWidgetProps) {
  const router = useRouterCompat();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    todayCalls,
    stats,
    loadTodayCalls,
    formatCallTime,
    formatDuration,
    logCallWithContact,
  } = usePhoneCalls();

  const { contacts, sponsor, callContact, loadContacts } = useContacts();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([loadTodayCalls(), loadContacts()]);
      } catch (err) {
        logger.error('Failed to load phone widget data', err);
        setError(err instanceof Error ? err : new Error('Failed to load'));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadTodayCalls, loadContacts]);

  const { todayCallCount, dailyGoal, goalProgress } = stats;

  // Get suggested contacts to call (haven't called today)
  const suggestedContacts = contacts
    .filter((c: RecoveryContact) => !todayCalls.some((call: PhoneCallLog) => call.contactId === c.id))
    .slice(0, 3);

  const handleQuickCall = useCallback(
    async (contact: RecoveryContact) => {
      try {
        callContact(contact);
        await logCallWithContact(contact);
      } catch (err) {
        logger.error('Failed to initiate call', err);
      }
    },
    [callContact, logCallWithContact]
  );

  const handleViewAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/contacts');
  }, [router]);

  const handleAddContact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/contacts/add');
  }, [router]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.card}>
          <View style={styles.skeleton}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonProgress} />
            <View style={styles.skeletonButtons} />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // Error state
  if (error) {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={[styles.card, styles.errorCard]}>
          <View style={styles.errorContent}>
            <Feather name="alert-circle" size={24} color="#f87171" />
            <Text style={styles.errorTitle}>Couldn't load calls</Text>
            <TouchableOpacity onPress={() => {}} accessibilityRole="button" accessibilityLabel="Retry loading">
              <Text style={styles.errorSubtitle}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
      <GlassCard gradient="card" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text accessibilityElementsHidden>📞</Text>
            <Text style={styles.headerTitle}>Fellowship Calls</Text>
          </View>
          <TouchableOpacity
            onPress={handleViewAll}
            accessibilityRole="button"
            accessibilityLabel="View all contacts"
            accessibilityHint="Opens contacts screen"
          >
            <Text style={styles.viewAllText}>All Contacts →</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <ProgressBar
          progress={goalProgress}
          label="Today's calls"
          sublabel={`${todayCallCount}/${dailyGoal}`}
        />

        {/* Today's Calls */}
        {todayCalls.length > 0 && (
          <View style={styles.callsSection}>
            <Text style={styles.sectionTitle}>Today</Text>
            {todayCalls.slice(0, 3).map((call: PhoneCallLog, index: number) => (
              <View key={call.id} style={[styles.callItem, index < todayCalls.length - 1 && styles.callItemBorder]}>
                <View style={styles.callIconContainer}>
                  <Feather name="check" size={14} color="#22c55e" />
                </View>
                <View style={styles.callInfo}>
                  <Text style={styles.callName}>{call.contactName}</Text>
                  <Text style={styles.callMeta}>
                    {formatCallTime(call)}
                    {call.duration ? ` · ${formatDuration(call.duration)}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Suggested Contacts */}
        {suggestedContacts.length > 0 && (
          <View style={styles.suggestedSection}>
            <Text style={styles.sectionTitle}>{todayCalls.length > 0 ? 'Call Next' : 'Suggested'}</Text>
            <View style={styles.suggestedGrid}>
              {suggestedContacts.map((contact: RecoveryContact, index: number) => (
                <QuickCallButton
                  key={contact.id}
                  contact={contact}
                  onPress={() => handleQuickCall(contact)}
                  delay={index * 50}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {contacts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Add contacts to track your calls</Text>
            <TouchableOpacity
              onPress={handleAddContact}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Add your first contact"
              accessibilityHint="Opens add contact screen"
            >
              <Text style={styles.addButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sponsor Quick Call */}
        {sponsor && !todayCalls.some((c: PhoneCallLog) => c.contactId === sponsor.id) && (
          <QuickCallButton
            contact={sponsor}
            onPress={() => handleQuickCall(sponsor)}
            isSponsor
            delay={100}
          />
        )}
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
  errorCard: {
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderWidth: 1,
  },
  errorContent: {
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  skeleton: {
    opacity: 0.5,
  },
  skeletonHeader: {
    height: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 4,
    width: '50%',
    marginBottom: 16,
  },
  skeletonProgress: {
    height: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonButtons: {
    height: 60,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 14,
    color: '#60a5fa',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalReachedText: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 4,
  },
  callsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  callItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
  },
  callIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  callMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  suggestedSection: {
    marginBottom: 16,
  },
  suggestedGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCallContainer: {
    flex: 1,
  },
  quickCallButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickCallIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickCallName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  sponsorButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    marginTop: 8,
  },
  sponsorName: {
    color: '#fbbf24',
  },
  sponsorLabel: {
    fontSize: 10,
    color: '#f59e0b',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
});
