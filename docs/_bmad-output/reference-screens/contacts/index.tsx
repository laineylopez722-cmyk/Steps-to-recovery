/**
 * Recovery Contacts Screen
 * Manage fellowship contacts for support network
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useContacts } from '../../lib/hooks/useContacts';
import { Card, Button } from '../../components/ui';
import { ContactCard } from '../../components/contacts/ContactCard';
import { EmptyState } from '../../components/common';
import type { ContactRole, RecoveryContact } from '../../lib/types';

const ROLE_SECTIONS: { role: ContactRole; title: string; icon: string }[] = [
  { role: 'sponsor', title: 'Sponsor', icon: '⭐' },
  { role: 'emergency', title: 'Emergency Contacts', icon: '🆘' },
  { role: 'sponsee', title: 'Sponsees', icon: '🌱' },
  { role: 'home_group', title: 'Home Group', icon: '🏠' },
  { role: 'fellowship', title: 'Fellowship', icon: '🤝' },
];

export default function ContactsScreen() {
  const router = useRouter();
  const {
    contacts,
    sponsor,
    isLoading,
    contactsByRole,
    loadContacts,
    removeContact,
    callContact,
    textContact,
    sendSOSToSponsor,
  } = useContacts();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const handleDeleteContact = (contact: RecoveryContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to remove ${contact.name} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeContact(contact.id),
        },
      ]
    );
  };

  const handleEditContact = (contact: RecoveryContact) => {
    router.push({
      pathname: '/contacts/add',
      params: { editId: contact.id },
    });
  };

  if (contacts.length === 0 && !isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-surface-900 dark:text-surface-100 text-center">
            Recovery Contacts
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            emoji="📱"
            title="No Contacts Yet"
            message="Build your recovery support network by adding contacts from your fellowship."
          />
          <Button
            title="Add First Contact"
            onPress={() => router.push('/contacts/add')}
            size="lg"
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-surface-900 dark:text-surface-100 text-center">
          Recovery Contacts
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/contacts/add')}
          className="w-10 h-10 items-center justify-center -mr-2"
          accessibilityRole="button"
          accessibilityLabel="Add new contact"
        >
          <Text className="text-2xl text-primary-600">+</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        className="flex-1 px-4"
        sections={ROLE_SECTIONS.map(({ role, title, icon }) => ({
          title,
          icon,
          role,
          data: contactsByRole[role],
        })).filter((section) => section.data.length > 0)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onCall={() => callContact(item)}
            onText={() => textContact(item)}
            onEdit={() => handleEditContact(item)}
            onDelete={() => handleDeleteContact(item)}
          />
        )}
        renderSectionHeader={({ section: { title, icon, data } }) => (
          <View className="flex-row items-center mb-3 mt-6 bg-surface-50 dark:bg-surface-900 py-1">
            <Text className="text-lg mr-2">{icon}</Text>
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {title}
            </Text>
            <Text className="text-sm text-surface-500 ml-2">
              ({data.length})
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <>
            {/* SOS Button - if sponsor exists */}
            {sponsor && (
              <Card
                variant="outlined"
                className="mt-4 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-red-800 dark:text-red-200 font-semibold">
                      Need to talk?
                    </Text>
                    <Text className="text-sm text-red-600 dark:text-red-400">
                      Send an SOS to {sponsor.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={sendSOSToSponsor}
                    className="bg-red-600 px-4 py-2 rounded-lg"
                    accessibilityRole="button"
                    accessibilityLabel="Send SOS message to sponsor"
                  >
                    <Text className="text-white font-semibold">SOS</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          </>
        }
        ListFooterComponent={
          <>
            {/* Empty state for adding sponsor */}
            {!sponsor && (
              <Card
                variant="outlined"
                className="mt-6 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
              >
                <View className="items-center py-2">
                  <Text className="text-amber-800 dark:text-amber-200 font-semibold mb-1">
                    Add Your Sponsor
                  </Text>
                  <Text className="text-sm text-amber-600 dark:text-amber-400 text-center mb-3">
                    Having a sponsor is a key part of the program
                  </Text>
                  <Button
                    title="Add Sponsor"
                    variant="secondary"
                    size="sm"
                    onPress={() =>
                      router.push({
                        pathname: '/contacts/add',
                        params: { role: 'sponsor' },
                      })
                    }
                  />
                </View>
              </Card>
            )}
            {/* Bottom spacing */}
            <View className="h-8" />
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        stickySectionHeadersEnabled={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

