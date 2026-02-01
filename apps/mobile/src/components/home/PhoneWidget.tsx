/**
 * PhoneWidget Component
 * Home page widget showing phone call tracking and quick call options
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouterCompat } from '../../utils/navigationHelper';
import { LegacyCard as Card } from '../ui';
import { usePhoneCalls } from '../../hooks/usePhoneCalls';
import { useContacts } from '../../hooks/useContacts';
import type { PhoneCallLog, RecoveryContact } from '@recovery/shared';

interface PhoneWidgetProps {
  className?: string;
}

export function PhoneWidget({ className = '' }: PhoneWidgetProps) {
  const router = useRouterCompat();
  const { todayCalls, stats, loadTodayCalls, formatCallTime, formatDuration, logCallWithContact } =
    usePhoneCalls();

  const { contacts, sponsor, callContact, loadContacts } = useContacts();

  // Load data on mount
  useEffect(() => {
    loadTodayCalls();
    loadContacts();
  }, []);

  const { todayCallCount, dailyGoal, goalProgress } = stats;

  // Get suggested contacts to call (haven't called today)
  const suggestedContacts = contacts
    .filter(
      (c: RecoveryContact) => !todayCalls.some((call: PhoneCallLog) => call.contactId === c.id),
    )
    .slice(0, 3);

  const handleQuickCall = async (contact: (typeof contacts)[0]) => {
    callContact(contact);
    // Log the call after initiating
    await logCallWithContact(contact);
  };

  return (
    <Card variant="default" className={className}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">📞</Text>
          <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
            Fellowship Calls
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/contacts')}
          accessibilityRole="button"
          accessibilityLabel="View all contacts"
        >
          <Text className="text-sm text-primary-600 dark:text-primary-400">All Contacts →</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm text-surface-600 dark:text-surface-400">Today's calls</Text>
          <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
            {todayCallCount}/{dailyGoal}
          </Text>
        </View>
        <View className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              goalProgress >= 1
                ? 'bg-green-500'
                : goalProgress >= 0.5
                  ? 'bg-amber-500'
                  : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(goalProgress * 100, 100)}%` }}
          />
        </View>
        {goalProgress >= 1 && (
          <Text className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✓ Daily goal reached!
          </Text>
        )}
      </View>

      {/* Today's Calls */}
      {todayCalls.length > 0 && (
        <View className="mb-4">
          <Text className="text-xs font-medium text-surface-500 uppercase mb-2">Today</Text>
          {todayCalls.slice(0, 3).map((call: PhoneCallLog) => (
            <View
              key={call.id}
              className="flex-row items-center py-2 border-b border-surface-100 dark:border-surface-800"
            >
              <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mr-3">
                <Text className="text-sm">✓</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {call.contactName}
                </Text>
                <Text className="text-xs text-surface-500">
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
        <View>
          <Text className="text-xs font-medium text-surface-500 uppercase mb-2">
            {todayCalls.length > 0 ? 'Call Next' : 'Suggested'}
          </Text>
          <View className="flex-row gap-2">
            {suggestedContacts.map((contact: RecoveryContact) => (
              <TouchableOpacity
                key={contact.id}
                onPress={() => handleQuickCall(contact)}
                className="flex-1 bg-surface-100 dark:bg-surface-800 rounded-lg py-3 px-3 items-center"
                accessibilityRole="button"
                accessibilityLabel={`Call ${contact.name}`}
              >
                <Text className="text-lg mb-1">{contact.role === 'sponsor' ? '⭐' : '📞'}</Text>
                <Text
                  className="text-xs font-medium text-surface-900 dark:text-surface-100 text-center"
                  numberOfLines={1}
                >
                  {contact.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {contacts.length === 0 && (
        <View className="py-4 items-center">
          <Text className="text-surface-500 text-sm mb-2">Add contacts to track your calls</Text>
          <TouchableOpacity
            onPress={() => router.push('/contacts/add')}
            className="bg-primary-600 px-4 py-2 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Add your first contact"
          >
            <Text className="text-white font-medium text-sm">Add Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sponsor Quick Call */}
      {sponsor && !todayCalls.some((c: PhoneCallLog) => c.contactId === sponsor.id) && (
        <TouchableOpacity
          onPress={() => handleQuickCall(sponsor)}
          className="mt-3 flex-row items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-lg py-2.5"
          accessibilityRole="button"
          accessibilityLabel={`Call your sponsor ${sponsor.name}`}
        >
          <Text className="text-amber-700 dark:text-amber-300 font-medium">
            ⭐ Call {sponsor.name} (Sponsor)
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}
