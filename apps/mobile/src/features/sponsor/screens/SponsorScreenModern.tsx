/**
 * Enhanced Sponsor Screen - Modern Dashboard
 * Shows sponsor connections, sponsees, and shared entries overview
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { SponsorshipsList, type SponsorConnection } from '../components/SponsorshipsList';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections } from '../hooks/useSponsorConnections';
import { useSponsorSharedEntries } from '../hooks/useSponsorSharedEntries';
import type { ProfileStackParamList } from '../../../navigation/types';
import { hapticSuccess } from '../../../utils/haptics';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function SponsorScreenModern(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const {
    mySponsor,
    mySponsees,
    pendingInvites,
    isLoading,
    loadConnections,
  } = useSponsorConnections(userId);

  const { loadIncomingEntries } = useSponsorSharedEntries(userId);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Load unread counts for sponsees
  React.useEffect(() => {
    const loadUnreadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const sponsee of mySponsees) {
        const entries = await loadIncomingEntries(sponsee.id);
        counts[sponsee.id] = entries.length; // In real app, track read/unread status
      }
      setUnreadCounts(counts);
    };
    
    if (mySponsees.length > 0) {
      loadUnreadCounts();
    }
  }, [mySponsees, loadIncomingEntries]);

  const handleConnectSponsor = useCallback(() => {
    navigation.navigate('InviteSponsor' as any);
  }, [navigation]);

  const handleFindSponsee = useCallback(() => {
    navigation.navigate('ConnectSponsor' as any);
  }, [navigation]);

  const handleConnectionPress = useCallback((connection: SponsorConnection) => {
    if (connection.direction === 'sponsee') {
      navigation.navigate('SharedEntries', {
        connectionId: connection.id,
      });
    }
  }, [navigation]);

  const mapToSponsorConnections = useCallback((): SponsorConnection[] => {
    const connections: SponsorConnection[] = [];

    if (mySponsor) {
      connections.push({
        id: mySponsor.id,
        display_name: mySponsor.display_name,
        status: 'active',
        direction: 'sponsor',
        lastContact: mySponsor.updated_at,
      });
    }

    mySponsees.forEach((sponsee) => {
      connections.push({
        id: sponsee.id,
        display_name: sponsee.display_name,
        status: 'active',
        direction: 'sponsee',
        lastContact: sponsee.updated_at,
        unreadCount: unreadCounts[sponsee.id] || 0,
      });
    });

    return connections;
  }, [mySponsor, mySponsees, unreadCounts]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={darkAccent.primary} />
            <Text style={styles.loadingText}>Loading connections...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  const connections = mapToSponsorConnections();

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Sponsor Connections
            </Text>
            {totalUnread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
              </View>
            )}
          </Animated.View>

          {/* Stats Row */}
          {connections.length > 0 && (
            <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
              <GlassCard intensity="light" style={styles.statCard}>
                <MaterialCommunityIcons
                  name="account-heart"
                  size={24}
                  color={darkAccent.primary}
                />
                <Text style={styles.statValue}>{mySponsor ? 1 : 0}</Text>
                <Text style={styles.statLabel}>Sponsor</Text>
              </GlassCard>

              <GlassCard intensity="light" style={styles.statCard}>
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={24}
                  color={darkAccent.success}
                />
                <Text style={styles.statValue}>{mySponsees.length}</Text>
                <Text style={styles.statLabel}>Sponsees</Text>
              </GlassCard>

              <GlassCard intensity="light" style={styles.statCard}>
                <MaterialIcons
                  name="mark-email-unread"
                  size={24}
                  color={totalUnread > 0 ? darkAccent.danger : darkAccent.textSubtle}
                />
                <Text style={styles.statValue}>{totalUnread}</Text>
                <Text style={styles.statLabel}>Unread</Text>
              </GlassCard>
            </Animated.View>
          )}

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleConnectSponsor}
                style={styles.actionCard}
                accessibilityRole="button"
                accessibilityLabel="Connect with a sponsor"
                accessibilityHint="Opens screen to invite or connect with a sponsor"
              >
                <GlassCard intensity="medium" style={styles.actionCardInner}>
                  <MaterialCommunityIcons
                    name="account-heart-outline"
                    size={32}
                    color={darkAccent.primary}
                  />
                  <Text style={styles.actionTitle}>Find Sponsor</Text>
                  <Text style={styles.actionSubtitle}>Get support</Text>
                </GlassCard>
              </Pressable>

              <Pressable
                onPress={handleFindSponsee}
                style={styles.actionCard}
                accessibilityRole="button"
                accessibilityLabel="Sponsor someone"
                accessibilityHint="Opens screen to connect with a sponsee"
              >
                <GlassCard intensity="medium" style={styles.actionCardInner}>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={32}
                    color={darkAccent.success}
                  />
                  <Text style={styles.actionTitle}>Be a Sponsor</Text>
                  <Text style={styles.actionSubtitle}>Give support</Text>
                </GlassCard>
              </Pressable>
            </View>
          </Animated.View>

          {/* Connections List */}
          {connections.length > 0 ? (
            <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>My Connections</Text>
              <SponsorshipsList
                connections={connections}
                onConnectionPress={handleConnectionPress}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(300)} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="account-multiple-outline"
                  size={64}
                  color={darkAccent.textSubtle}
                />
              </View>
              <Text style={styles.emptyTitle}>No Connections Yet</Text>
              <Text style={styles.emptyDescription}>
                The sponsor/sponsee relationship is a cornerstone of recovery. Connect with someone
                to share your journey.
              </Text>
              <View style={styles.emptyActions}>
                <GradientButton
                  title="Find a Sponsor"
                  variant="primary"
                  size="md"
                  onPress={handleConnectSponsor}
                  icon={<MaterialCommunityIcons name="account-heart" size={20} color="#FFF" />}
                  iconPosition="left"
                  style={styles.emptyButton}
                  accessibilityLabel="Find a sponsor"
                  accessibilityRole="button"
                />
                <GradientButton
                  title="Become a Sponsor"
                  variant="ghost"
                  size="md"
                  onPress={handleFindSponsee}
                  icon={<MaterialCommunityIcons name="account-plus" size={20} color={darkAccent.primary} />}
                  iconPosition="left"
                  style={styles.emptyButton}
                  accessibilityLabel="Become a sponsor"
                  accessibilityRole="button"
                />
              </View>
            </Animated.View>
          )}

          {/* Pending Invites Notice */}
          {pendingInvites.length > 0 && (
            <Animated.View entering={FadeInUp.delay(400)}>
              <GlassCard intensity="medium" style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={24}
                    color={darkAccent.warning}
                  />
                  <Text style={styles.pendingTitle}>Pending Invites</Text>
                </View>
                <Text style={styles.pendingText}>
                  You have {pendingInvites.length} pending invite{pendingInvites.length > 1 ? 's' : ''}.
                  Waiting for confirmation.
                </Text>
              </GlassCard>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginTop: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[3],
    paddingBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  headerTitle: {
    ...typography.h1,
    color: darkAccent.text,
  },
  unreadBadge: {
    backgroundColor: darkAccent.danger,
    borderRadius: radius.full,
    minWidth: 28,
    height: 28,
    paddingHorizontal: spacing[1.5],
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[3],
  },
  statValue: {
    ...typography.h2,
    color: darkAccent.text,
    marginTop: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionCard: {
    flex: 1,
  },
  actionCardInner: {
    alignItems: 'center',
    padding: spacing[4],
  },
  actionTitle: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
    marginTop: spacing[2],
  },
  actionSubtitle: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing[6],
    marginTop: spacing[4],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: radius['2xl'],
    backgroundColor: `${darkAccent.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  emptyTitle: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginBottom: spacing[4],
    maxWidth: 300,
    lineHeight: 22,
  },
  emptyActions: {
    width: '100%',
    gap: spacing[2],
  },
  emptyButton: {
    width: '100%',
  },
  pendingCard: {
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1.5],
  },
  pendingTitle: {
    ...typography.h4,
    color: darkAccent.text,
  },
  pendingText: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
});
