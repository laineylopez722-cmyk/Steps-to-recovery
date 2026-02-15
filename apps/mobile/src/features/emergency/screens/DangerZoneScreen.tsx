/**
 * Danger Zone Screen
 *
 * Main screen for managing risky contacts (Safe Dial protection)
 * Shows list of protected contacts and close call statistics
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Button, Card } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { hapticSelection } from '../../../utils/haptics';
import { useAuth } from '../../../contexts/AuthContext';
import type { RelationshipType } from '../../../services/safeDialService';
import { useRiskyContacts, useCloseCallTracking, type RiskyContact } from '../hooks';
import { RiskyContactCard, CloseCallInsights, AddRiskyContactModal } from '../components';

interface DangerZoneScreenProps {
  onNavigateToIntervention?: () => void;
}

export function DangerZoneScreen({
  onNavigateToIntervention: _onNavigateToIntervention,
}: DangerZoneScreenProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [, setEditingContact] = useState<RiskyContact | null>(null);

  const {
    contacts,
    loading: contactsLoading,
    error: contactsError,
    refetch: refetchContacts,
    addContact,
    removeContact,
  } = useRiskyContacts();

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useCloseCallTracking();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchContacts(), refetchStats()]);
    } catch {
      // Swallow — hooks expose error state for UI
    } finally {
      setRefreshing(false);
    }
  }, [refetchContacts, refetchStats]);

  const handleAddContact = useCallback(
    async (contact: {
      name: string;
      phoneNumber: string;
      relationshipType: RelationshipType;
      notes?: string;
    }) => {
      try {
        await addContact(contact);
        hapticSelection();
      } catch {
        Alert.alert('Failed to Add', 'Could not save this contact. Please try again.');
      }
    },
    [addContact],
  );

  const handleRemoveContact = useCallback(
    async (contactId: string) => {
      try {
        await removeContact(contactId);
        hapticSelection();
      } catch {
        Alert.alert('Failed to Remove', 'Could not remove this contact. Please try again.');
      }
    },
    [removeContact],
  );

  const handleEditContact = useCallback((contact: RiskyContact) => {
    setEditingContact(contact);
    Alert.alert(
      'Edit Contact',
      'Contact editing will be implemented in the edit modal (coming soon)',
      [{ text: 'OK', onPress: () => setEditingContact(null) }],
    );
  }, []);

  const loading = contactsLoading || statsLoading;
  const error = contactsError || statsError;

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <View style={styles.centerContent}>
          <Text style={[ds.typography.body, { color: ds.semantic.text.secondary }]}>
            Please log in to access this feature
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ds.semantic.intent.primary.solid}
          />
        }
      >
        {/* Header Section */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { paddingHorizontal: ds.space[4] }]}
        >
          <View style={[styles.iconContainer, { backgroundColor: ds.semantic.intent.alert.solid + '20' }]}>
            <MaterialCommunityIcons name="shield-alert" size={48} color={ds.semantic.intent.alert.solid} />
          </View>
          <Text
            style={[
              ds.semantic.typography.screenTitle,
              { color: ds.semantic.text.primary, textAlign: 'center', marginTop: ds.space[3] },
            ]}
            accessibilityRole="header"
          >
            Trigger Protection
          </Text>
          <Text
            style={[
              ds.typography.body,
              {
                color: ds.semantic.text.secondary,
                textAlign: 'center',
                marginTop: ds.space[1],
              },
            ]}
          >
            Manage contacts that pose relapse risk
          </Text>
        </Animated.View>

        {/* Stats Section */}
        {stats && (
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            style={{ paddingHorizontal: ds.space[3], marginTop: ds.space[4] }}
          >
            <CloseCallInsights stats={stats} />
          </Animated.View>
        )}

        {/* Summary Card */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(300)}
          style={{ paddingHorizontal: ds.space[3], marginTop: ds.space[4] }}
        >
          <Card variant="outlined" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons
                  name="shield"
                  size={24}
                  color={ds.semantic.intent.alert.solid}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[ds.typography.h3, { color: ds.semantic.text.primary }]}>
                  {contacts.length}
                </Text>
                <Text style={[ds.typography.caption, { color: ds.semantic.text.secondary }]}>
                  Protected Contacts
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* How It Works Section */}
        {contacts.length === 0 && (
          <Animated.View
            entering={FadeInUp.duration(400).delay(400)}
            style={{ paddingHorizontal: ds.space[3], marginTop: ds.space[4] }}
          >
            <Card
              variant="outlined"
              style={[styles.howItWorksCard, { backgroundColor: ds.semantic.intent.primary.solid + '10' }]}
            >
              <MaterialCommunityIcons
                name="information"
                size={32}
                color={ds.semantic.intent.primary.solid}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={[
                  ds.typography.h3,
                  {
                    color: ds.semantic.text.primary,
                    marginBottom: 8,
                    textAlign: 'center',
                  },
                ]}
              >
                How Trigger Protection Works
              </Text>
              <Text
                style={[
                  ds.typography.body,
                  {
                    color: ds.semantic.text.secondary,
                    textAlign: 'center',
                    marginBottom: 16,
                  },
                ]}
              >
                When you try to call a protected contact, we'll:
              </Text>
              {[
                'Show you why you got sober',
                'Offer to call your sponsor instead',
                'Give you time to think it through',
                'Help you make healthier choices',
              ].map((step, index) => (
                <View key={index} style={styles.howItWorksStep}>
                  <View style={[styles.stepNumber, { backgroundColor: ds.semantic.intent.primary.solid }]}>
                    <Text
                      style={[
                        ds.typography.caption,
                        { color: ds.semantic.text.onDark, fontWeight: 'bold' },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[ds.typography.body, { color: ds.semantic.text.primary, flex: 1 }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Contacts List Section */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(500)}
          style={{ paddingHorizontal: ds.space[3], marginTop: ds.space[4] }}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={[ds.typography.h3, { color: ds.semantic.text.primary }]}
              accessibilityRole="header"
            >
              Protected Contacts
            </Text>
            <Pressable
              onPress={() => {
                hapticSelection();
                setShowAddModal(true);
              }}
              style={[styles.addButton, { backgroundColor: ds.semantic.intent.primary.solid }]}
              accessibilityRole="button"
              accessibilityLabel="Add risky contact"
            >
              <MaterialCommunityIcons name="plus" size={24} color={ds.semantic.text.onDark} />
            </Pressable>
          </View>

          {error ? (
            <Card variant="outlined" style={styles.errorCard}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={32}
                color={ds.semantic.intent.alert.solid}
                style={{ marginBottom: 8 }}
              />
              <Text
                style={[ds.typography.body, { color: ds.semantic.text.primary, textAlign: 'center' }]}
              >
                Failed to load contacts
              </Text>
              <Button
                title="Retry"
                onPress={handleRefresh}
                variant="outline"
                size="small"
                style={{ marginTop: 12 }}
              />
            </Card>
          ) : loading ? (
            <Card variant="outlined" style={styles.loadingCard}>
              <Text style={[ds.typography.body, { color: ds.semantic.text.secondary }]}>
                Loading contacts...
              </Text>
            </Card>
          ) : contacts.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="shield-check"
                size={64}
                color={ds.semantic.intent.success.solid}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={[
                  ds.typography.h3,
                  { color: ds.semantic.text.primary, marginBottom: 8, textAlign: 'center' },
                ]}
              >
                No risky contacts yet
              </Text>
              <Text
                style={[
                  ds.typography.body,
                  { color: ds.semantic.text.secondary, textAlign: 'center', marginBottom: 16 },
                ]}
              >
                Add contacts you want protection from
              </Text>
              <Button
                title="Add Your First Contact"
                onPress={() => {
                  hapticSelection();
                  setShowAddModal(true);
                }}
                variant="primary"
                size="medium"
                icon={
                  <MaterialCommunityIcons name="plus" size={20} color={ds.semantic.text.onDark} />
                }
              />
            </Card>
          ) : (
            <View style={styles.contactsList}>
              {contacts.map((contact) => (
                <RiskyContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={handleEditContact}
                  onDelete={handleRemoveContact}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Privacy Notice */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(600)}
          style={{
            paddingHorizontal: ds.space[3],
            marginTop: ds.space[6],
            marginBottom: ds.space[6],
          }}
        >
          <Card
            variant="outlined"
            style={[styles.privacyCard, { backgroundColor: ds.semantic.intent.success.solid + '10' }]}
          >
            <MaterialCommunityIcons
              name="lock"
              size={20}
              color={ds.semantic.intent.success.solid}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[ds.typography.bodySm, { color: ds.semantic.text.secondary, flex: 1 }]}
            >
              <Text style={{ fontWeight: '600', color: ds.semantic.text.primary }}>
                Your privacy is protected.
              </Text>{' '}
              All contact data is encrypted and never shared. You can disable this feature anytime
              in Settings.
            </Text>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Add Contact Modal */}
      <AddRiskyContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddContact}
      />
    </SafeAreaView>
  );
}

const createStyles = (_ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    iconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryCard: {
      padding: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    summaryItem: {
      alignItems: 'center',
      padding: 16,
    },
    howItWorksCard: {
      padding: 20,
      alignItems: 'center',
    },
    howItWorksStep: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      width: '100%',
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactsList: {
      marginTop: 8,
    },
    emptyCard: {
      padding: 32,
      alignItems: 'center',
    },
    loadingCard: {
      padding: 32,
      alignItems: 'center',
    },
    errorCard: {
      padding: 32,
      alignItems: 'center',
    },
    privacyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
  }) as const;
