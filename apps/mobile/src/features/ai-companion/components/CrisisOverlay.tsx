/**
 * Crisis Overlay Component
 * Full-screen modal shown when crisis indicators are detected.
 * Provides immediate access to sponsor and crisis hotline.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Modal } from 'react-native';
import { Heart, Phone } from 'lucide-react-native';
import { Icon } from '@/components/ui/Icon';

interface CrisisOverlayProps {
  visible: boolean;
  sponsorPhone?: string;
  sponsorName?: string;
  onDismiss: () => void;
  severity: 'low' | 'medium' | 'high';
}

export function CrisisOverlay({
  visible,
  sponsorPhone,
  sponsorName,
  onDismiss,
  severity,
}: CrisisOverlayProps) {
  const [canDismiss, setCanDismiss] = useState(false);

  // Prevent panic dismissal - require 5 second wait
  useEffect(() => {
    if (visible) {
      setCanDismiss(false);
      const timer = setTimeout(() => setCanDismiss(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const callSponsor = () => {
    if (sponsorPhone) {
      Linking.openURL(`tel:${sponsorPhone}`);
    }
  };

  const callHotline = () => {
    Linking.openURL('tel:988'); // Suicide & Crisis Lifeline (US)
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      accessibilityLabel="Crisis support overlay"
    >
      <View className="flex-1 bg-black/90 justify-center items-center px-6">
        <View className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm">
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center mb-4">
              <Icon as={Heart} size={32} className="text-amber-500" />
            </View>
            <Text className="text-2xl font-bold text-white text-center">
              I'm here for you
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Whatever you're going through, you don't have to face it alone.
            </Text>
          </View>

          {/* Sponsor call */}
          {sponsorPhone && (
            <TouchableOpacity
              onPress={callSponsor}
              className="bg-amber-500 rounded-2xl py-4 px-6 flex-row items-center justify-center mb-3"
              accessibilityRole="button"
              accessibilityLabel={`Call ${sponsorName || 'Sponsor'}`}
            >
              <Icon as={Phone} size={20} className="text-black" />
              <Text className="text-black font-semibold ml-2">
                Call {sponsorName || 'Sponsor'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Crisis hotline */}
          <TouchableOpacity
            onPress={callHotline}
            className="bg-gray-800 rounded-2xl py-4 px-6 flex-row items-center justify-center mb-6"
            accessibilityRole="button"
            accessibilityLabel="Call Crisis Hotline 988"
          >
            <Icon as={Phone} size={20} className="text-white" />
            <Text className="text-white font-semibold ml-2">Crisis Hotline (988)</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={onDismiss}
            disabled={!canDismiss}
            className={`py-3 ${canDismiss ? 'opacity-100' : 'opacity-30'}`}
            accessibilityRole="button"
            accessibilityLabel={canDismiss ? "I'm okay, dismiss" : 'Please wait'}
            accessibilityState={{ disabled: !canDismiss }}
          >
            <Text className="text-gray-500 text-center">
              {canDismiss ? "I'm okay, thanks" : 'Please wait...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
