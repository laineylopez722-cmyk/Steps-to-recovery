/**
 * Danger Zone Screen
 * 
 * Main screen for managing risky contacts (Safe Dial protection)
 * Shows list of protected contacts and close call statistics
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme, Button, Card } from '../../../design-system';
import { hapticSelection } from '../../../utils/haptics';
import { useAuth } from '../../../contexts/AuthContext';
import {
  useRiskyContacts,
  useCloseCallTracking,
  type RiskyContact,
} from '../hooks';
import {
  RiskyContactCard,
  CloseCallInsights,
  AddRiskyContactModal,
} from '../components';

interface DangerZoneScreenProps {
  onNavigateToIntervention?: () => void;
}

export function DangerZoneScreen({
  onNavigateToIntervention: _onNavigateToIntervention,
}: DangerZoneScreenProps): React.ReactElement {
  const theme = useTheme();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<RiskyContact | null>(null);

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
    await Promise.all([refetchContacts(), refetchStats()]);
    setRefreshing(false);
  }, [refetchContacts, refetchStats]);

  const handleAddContact = useCallback(
    async (contact: {
      name: string;
      phoneNumber: string;
      relationshipType: any;
      notes?: string;
    }) => {
      await addContact(contact);
      hapticSelection();
    },
    [addContact]
  );

  const handleRemoveContact = useCallback(
    async (contactId: string) => {
      await removeContact(contactId);
      hapticSelection();
    },
    [removeContact]
  );

  const handleEditContact = useCallback((contact: RiskyContact) => {
    setEditingContact(contact);
    Alert.alert(
      'Edit Contact',
      'Contact editing will be implemented in the edit modal (coming soon)',
      [{ text: 'OK', onPress: () => setEditingContact(null) }]
    );
  }, []);

  const loading = contactsLoading || statsLoading;
  const error = contactsError || statsError;

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Please log in to access this feature
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header Section */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.danger + '20' }]}>
            <MaterialCommunityIcons name="shield-alert" size={48} color={theme.colors.danger} />
          </View>
          <Text
            style={[
              theme.typography.h1,
              { color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing.md },
            ]}
            accessibilityRole="header"
          >
            Trigger Protection
          </Text>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            Manage contacts that pose relapse risk
          </Text>
        </Animated.View>

        {/* Stats Section */}
        {stats && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.lg }}
          >
            <CloseCallInsights stats={stats} />
          </Animated.View>
        )}

        {/* Summary Card */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={{ paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.lg }}
        >
          <Card variant="outlined" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons
                  name="shield"
                  size={24}
                  color={theme.colors.danger}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
                  {contacts.length}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Protected Contacts
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* How It Works Section */}
        {contacts.length === 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(400)}
            style={{ paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.lg }}
          >
            <Card
              variant="outlined"
              style={[styles.howItWorksCard, { backgroundColor: theme.colors.primary + '10' }]}
            >
              <MaterialCommunityIcons
                name="information"
                size={32}
                color={theme.colors.primary}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={[
                  theme.typography.h3,
                  {
                    color: theme.colors.text,
                    marginBottom: 8,
                    textAlign: 'center',
                  },
                ]}
              >
                How Trigger Protection Works
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.textSecondary,
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
                  <View
                    style={[
                      styles.stepNumber,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.labelSmall,
                        { color: '#FFFFFF', fontWeight: 'bold' },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Contacts List Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(500)}
          style={{ paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.lg }}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={[theme.typography.h2, { color: theme.colors.text }]}
              accessibilityRole="header"
            >
              Protected Contacts
            </Text>
            <Pressable
              onPress={() => {
                hapticSelection();
                setShowAddModal(true);
              }}
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Add risky contact"
            >
              <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {error ? (
            <Card variant="outlined" style={styles.errorCard}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={32}
                color={theme.colors.danger}
                style={{ marginBottom: 8 }}
              />
              <Text style={[theme.typography.body, { color: theme.colors.text, textAlign: 'center' }]}>
                Failed to load contacts
              </Text>
              <Button
                title="Retry"
                onPress={handleRefresh}
                variant="outlined"
                size="small"
                style={{ marginTop: 12 }}
              />
            </Card>
          ) : loading ? (
            <Card variant="outlined" style={styles.loadingCard}>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                Loading contacts...
              </Text>
            </Card>
          ) : contacts.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="shield-check"
                size={64}
                color={theme.colors.success}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginBottom: 8, textAlign: 'center' },
                ]}
              >
                No risky contacts yet
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 16 },
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
                icon={<MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />}
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
          entering={FadeInDown.duration(400).delay(600)}
          style={{
            paddingHorizontal: theme.spacing.md,
            marginTop: theme.spacing.xl,
            marginBottom: theme.spacing.xl,
          }}
        >
          <Card
            variant="outlined"
            style={[styles.privacyCard, { backgroundColor: theme.colors.success + '10' }]}
          >
            <MaterialCommunityIcons
              name="lock"
              size={20}
              color={theme.colors.success}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.textSecondary, flex: 1 },
              ]}
            >
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>Your privacy is protected.</Text>{' '}
              All contact data is encrypted and never shared. You can disable this feature anytime in Settings.
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

const styles = StyleSheet.create({
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
});
