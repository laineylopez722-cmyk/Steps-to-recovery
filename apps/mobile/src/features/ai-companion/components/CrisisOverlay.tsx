/**
 * Crisis Overlay Component
 * Full-screen modal shown when crisis indicators are detected.
 * Provides immediate access to sponsor and crisis hotline.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Modal, StyleSheet } from 'react-native';
import { Heart, Phone } from 'lucide-react-native';
import * as Haptics from '@/platform/haptics';
import { Icon } from '../../../components/ui/Icon';

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
  severity: _severity,
}: CrisisOverlayProps) {
  const [canDismiss, setCanDismiss] = useState(false);

  // Prevent panic dismissal - require 3 second wait
  useEffect(() => {
    if (visible) {
      // Strong haptic to get attention
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

      setCanDismiss(false);
      const timer = setTimeout(() => setCanDismiss(true), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible]);

  const callSponsor = () => {
    if (sponsorPhone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Linking.openURL(`tel:${sponsorPhone}`);
    }
  };

  const callHotline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Linking.openURL('tel:988'); // Suicide & Crisis Lifeline (US)
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      accessibilityLabel="Crisis support overlay"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Icon as={Heart} size={32} color="#F59E0B" />
            </View>
            <Text style={styles.title}>I'm here for you</Text>
            <Text style={styles.subtitle}>
              Whatever you're going through, you don't have to face it alone.
            </Text>
          </View>

          {/* Sponsor call */}
          {sponsorPhone && (
            <TouchableOpacity
              onPress={callSponsor}
              style={styles.sponsorButton}
              accessibilityRole="button"
              accessibilityLabel={`Call ${sponsorName || 'Sponsor'}`}
            >
              <Icon as={Phone} size={20} color="#000000" />
              <Text style={styles.sponsorButtonText}>Call {sponsorName || 'Sponsor'}</Text>
            </TouchableOpacity>
          )}

          {/* Crisis hotline */}
          <TouchableOpacity
            onPress={callHotline}
            style={styles.hotlineButton}
            accessibilityRole="button"
            accessibilityLabel="Call Crisis Hotline 988"
          >
            <Icon as={Phone} size={20} color="#FFFFFF" />
            <Text style={styles.hotlineButtonText}>Crisis Hotline (988)</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={handleDismiss}
            disabled={!canDismiss}
            style={[styles.dismissButton, !canDismiss && styles.dismissButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel={canDismiss ? "I'm okay, dismiss" : 'Please wait'}
            accessibilityState={{ disabled: !canDismiss }}
          >
            <Text style={styles.dismissText}>
              {canDismiss ? "I'm okay, thanks" : 'Take a breath...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  sponsorButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sponsorButtonText: {
    color: '#000000',
    fontWeight: '600',
    marginLeft: 8,
  },
  hotlineButton: {
    backgroundColor: '#374151',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  hotlineButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    paddingVertical: 12,
  },
  dismissButtonDisabled: {
    opacity: 0.3,
  },
  dismissText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 16,
  },
});

