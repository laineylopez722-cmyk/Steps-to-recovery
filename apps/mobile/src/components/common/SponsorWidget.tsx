/**
 * SponsorWidget Component
 * Quick access to sponsor with call, text, and SOS functionality
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LegacyCard as Card } from '../ui';
import { useContacts } from '../../hooks/useContacts';
import { usePhoneCalls } from '../../hooks/usePhoneCalls';
import { sendSOSMessage, makePhoneCall, openMessagingApp, SOS_MESSAGE } from '@recovery/shared';
import { logger } from '../../utils/logger';

interface SponsorWidgetProps {
  className?: string;
  compact?: boolean;
}

export function SponsorWidget({ className = '', compact = false }: SponsorWidgetProps) {
  const { sponsor, loadContacts, markContacted } = useContacts();
  const { logCallWithContact } = usePhoneCalls();
  const [daysSinceContact, setDaysSinceContact] = useState<number | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

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

  // Don't render if no sponsor
  if (!sponsor) {
    return null;
  }

  const handleCall = async () => {
    try {
      // Make the call
      const success = await makePhoneCall(sponsor.phone);

      if (success) {
        // Log the call and mark as contacted
        await logCallWithContact(sponsor);
        await markContacted(sponsor.id);
      }
    } catch (error) {
      logger.error('Failed to call sponsor', error);
      Alert.alert('Call Failed', 'Unable to make the call. Please try again.');
    }
  };

  const handleText = async () => {
    try {
      const success = await openMessagingApp(sponsor.phone);

      if (success) {
        // Mark as contacted since they're opening messaging
        await markContacted(sponsor.id);
      }
    } catch (error) {
      logger.error('Failed to open messaging', error);
    }
  };

  const handleSOS = async () => {
    try {
      const result = await sendSOSMessage(sponsor.phone, sponsor.name);

      if (result.success) {
        // Log the interaction
        await markContacted(sponsor.id);
      }
    } catch (error) {
      logger.error('Failed to send SOS', error);
    }
  };

  const getDaysSinceText = () => {
    if (daysSinceContact === null) return 'No contact logged';
    if (daysSinceContact === 0) return 'Contacted today';
    if (daysSinceContact === 1) return 'Contacted yesterday';
    return `${daysSinceContact} days since last contact`;
  };

  const getContactUrgencyColor = () => {
    if (daysSinceContact === null) return 'text-surface-500';
    if (daysSinceContact <= 3) return 'text-green-600 dark:text-green-400';
    if (daysSinceContact <= 7) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (compact) {
    return (
      <Card variant="default" className={className}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center mr-3">
              <Text className="text-xl">⭐</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-surface-900 dark:text-surface-100">
                {sponsor.name}
              </Text>
              <Text className={`text-xs ${getContactUrgencyColor()}`}>{getDaysSinceText()}</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleCall}
              className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={`Call ${sponsor.name}`}
            >
              <Text className="text-lg">📞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSOS}
              className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Send SOS message to sponsor"
            >
              <Text className="text-lg">🆘</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="default" className={className}>
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center mr-3">
          <Text className="text-2xl">⭐</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase">
            Your Sponsor
          </Text>
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {sponsor.name}
          </Text>
          <Text className={`text-sm ${getContactUrgencyColor()}`}>{getDaysSinceText()}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        {/* Call Button */}
        <TouchableOpacity
          onPress={handleCall}
          className="flex-1 bg-green-500 dark:bg-green-600 py-3 rounded-xl flex-row items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={`Call ${sponsor.name}`}
        >
          <Text className="text-white font-medium">📞 Call</Text>
        </TouchableOpacity>

        {/* Text Button */}
        <TouchableOpacity
          onPress={handleText}
          className="flex-1 bg-primary-500 py-3 rounded-xl flex-row items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={`Text ${sponsor.name}`}
        >
          <Text className="text-white font-medium">💬 Text</Text>
        </TouchableOpacity>
      </View>

      {/* SOS Button */}
      <TouchableOpacity
        onPress={handleSOS}
        className="mt-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 py-3 rounded-xl flex-row items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Send SOS message to sponsor"
        accessibilityHint={`Sends the message: ${SOS_MESSAGE}`}
      >
        <Text className="text-red-700 dark:text-red-300 font-medium">🆘 SOS - I need to talk</Text>
      </TouchableOpacity>

      {/* Help text */}
      <Text className="text-xs text-surface-400 text-center mt-3">SOS sends: "{SOS_MESSAGE}"</Text>
    </Card>
  );
}
