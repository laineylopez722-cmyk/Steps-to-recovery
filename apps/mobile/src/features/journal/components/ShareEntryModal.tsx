/**
 * ShareEntryModal - Modal for sharing journal entries with sponsors
 * Allows user to select a sponsor and optionally add a message
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share as RNShare,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useSponsorConnections } from '../../sponsor/hooks/useSponsorConnections';
import { useSponsorSharedEntries } from '../../sponsor/hooks/useSponsorSharedEntries';
import { useAuth } from '../../../contexts/AuthContext';
import type { JournalEntryDecrypted } from '@recovery/shared';
import { hapticSuccess, hapticWarning } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';

interface ShareEntryModalProps {
  visible: boolean;
  entry: JournalEntryDecrypted | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareEntryModal({
  visible,
  entry,
  onClose,
  onSuccess,
}: ShareEntryModalProps): React.ReactElement | null {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { mySponsor, isLoading: sponsorsLoading } = useSponsorConnections(userId);
  const { shareEntries } = useSponsorSharedEntries(userId);

  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [sharePayload, setSharePayload] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (!entry || !selectedSponsorId) {
      hapticWarning();
      return;
    }

    try {
      setSharing(true);
      const payloads = await shareEntries(selectedSponsorId, [entry], user?.email);

      if (payloads.length > 0) {
        setSharePayload(payloads[0]);
        setShareSuccess(true);
        hapticSuccess();
        logger.info('Entry shared successfully');
      }
    } catch (error) {
      logger.error('Failed to share entry', error);
      hapticWarning();
    } finally {
      setSharing(false);
    }
  }, [entry, selectedSponsorId, shareEntries, user]);

  const handleShareViaApp = useCallback(async () => {
    if (!sharePayload) return;

    try {
      await RNShare.share({
        message: `Journal Entry Share Code\n\nPaste this code into your Steps to Recovery app to view the shared entry:\n\n${sharePayload}`,
      });
    } catch (error) {
      logger.warn('Failed to share payload', error);
    }
  }, [sharePayload]);

  const handleClose = useCallback(() => {
    setSelectedSponsorId(null);
    setShareSuccess(false);
    setSharePayload(null);
    setSharing(false);
    onClose();
  }, [onClose]);

  const handleDone = useCallback(() => {
    handleClose();
    onSuccess?.();
  }, [handleClose, onSuccess]);

  if (!visible || !entry) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop} />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.modalContainer}>
        <GlassCard intensity="heavy" style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="share" size={24} color={darkAccent.primary} />
              <Text style={styles.headerTitle}>Share Entry</Text>
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
              accessibilityHint="Closes the share entry modal"
              hitSlop={8}
            >
              <MaterialIcons name="close" size={24} color={darkAccent.textSubtle} />
            </Pressable>
          </View>

          {!shareSuccess ? (
            <>
              {/* Entry Preview */}
              <View style={styles.entryPreview}>
                <Text style={styles.entryTitle} numberOfLines={1}>
                  {entry.title || 'Untitled Entry'}
                </Text>
                <Text style={styles.entryBody} numberOfLines={3}>
                  {entry.body}
                </Text>
                <Text style={styles.entryDate}>
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Sponsor Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Share with</Text>

                {sponsorsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={darkAccent.primary} />
                    <Text style={styles.loadingText}>Loading sponsors...</Text>
                  </View>
                ) : mySponsor ? (
                  <Pressable
                    onPress={() => setSelectedSponsorId(mySponsor.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedSponsorId === mySponsor.id }}
                    accessibilityLabel={`Share with ${mySponsor.display_name || 'your sponsor'}`}
                  >
                    <GlassCard
                      intensity="light"
                      style={[
                        styles.sponsorCard,
                        selectedSponsorId === mySponsor.id && styles.sponsorCardSelected,
                      ]}
                    >
                      <View style={styles.sponsorCardContent}>
                        <View style={styles.radioCircle}>
                          {selectedSponsorId === mySponsor.id && <View style={styles.radioInner} />}
                        </View>
                        <MaterialIcons name="account-circle" size={32} color={darkAccent.primary} />
                        <View style={styles.sponsorInfo}>
                          <Text style={styles.sponsorName}>
                            {mySponsor.display_name || 'My Sponsor'}
                          </Text>
                          <Text style={styles.sponsorRole}>Sponsor</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialIcons
                      name="supervisor-account"
                      size={48}
                      color={darkAccent.textSubtle}
                    />
                    <Text style={styles.emptyText}>No sponsor connected</Text>
                    <Text style={styles.emptySubtext}>
                      Connect with a sponsor first to share entries
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <GradientButton
                  title="Cancel"
                  variant="ghost"
                  size="md"
                  onPress={handleClose}
                  style={styles.actionButton}
                  accessibilityLabel="Cancel sharing"
                  accessibilityRole="button"
                />
                <GradientButton
                  title="Share"
                  variant="primary"
                  size="md"
                  onPress={handleShare}
                  loading={sharing}
                  disabled={!selectedSponsorId || sharing}
                  style={styles.actionButton}
                  accessibilityLabel="Share entry with selected sponsor"
                  accessibilityRole="button"
                  accessibilityHint="Generates a secure share code"
                />
              </View>
            </>
          ) : (
            <>
              {/* Success State */}
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <MaterialIcons name="check-circle" size={64} color={darkAccent.success} />
                </View>
                <Text style={styles.successTitle}>Entry Shared!</Text>
                <Text style={styles.successSubtext}>
                  A secure share code has been generated. Send this code to your sponsor.
                </Text>

                {sharePayload && (
                  <GlassCard intensity="light" style={styles.payloadCard}>
                    <Text style={styles.payloadLabel}>Share Code:</Text>
                    <ScrollView style={styles.payloadScroll} showsVerticalScrollIndicator={false}>
                      <Text style={styles.payloadText} selectable>
                        {sharePayload}
                      </Text>
                    </ScrollView>
                  </GlassCard>
                )}

                <GradientButton
                  title="Send to Sponsor"
                  variant="primary"
                  size="md"
                  icon={<MaterialIcons name="send" size={20} color="#FFF" />}
                  iconPosition="left"
                  onPress={handleShareViaApp}
                  fullWidth
                  style={styles.sendButton}
                  accessibilityLabel="Send share code via messaging app"
                  accessibilityRole="button"
                />

                <GradientButton
                  title="Done"
                  variant="ghost"
                  size="md"
                  onPress={handleDone}
                  fullWidth
                  accessibilityLabel="Close and return"
                  accessibilityRole="button"
                />
              </View>
            </>
          )}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  modal: {
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    ...typography.h3,
    color: darkAccent.text,
  },
  entryPreview: {
    backgroundColor: `${darkAccent.primary}10`,
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  entryTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  entryBody: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginBottom: spacing[2],
  },
  entryDate: {
    ...typography.caption,
    color: darkAccent.textSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: darkAccent.border,
    marginVertical: spacing[3],
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.label,
    color: darkAccent.text,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    gap: spacing[2],
  },
  loadingText: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  sponsorCard: {
    padding: spacing[3],
  },
  sponsorCardSelected: {
    borderColor: darkAccent.primary,
    borderWidth: 2,
  },
  sponsorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: darkAccent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkAccent.primary,
  },
  sponsorInfo: {
    flex: 1,
  },
  sponsorName: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
  },
  sponsorRole: {
    ...typography.caption,
    color: darkAccent.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing[4],
  },
  emptyText: {
    ...typography.body,
    color: darkAccent.text,
    marginTop: spacing[2],
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  successIcon: {
    marginBottom: spacing[3],
  },
  successTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  successSubtext: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  payloadCard: {
    width: '100%',
    padding: spacing[3],
    marginBottom: spacing[3],
    maxHeight: 150,
  },
  payloadLabel: {
    ...typography.caption,
    color: darkAccent.textSubtle,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
  },
  payloadScroll: {
    maxHeight: 100,
  },
  payloadText: {
    ...typography.bodySmall,
    color: darkAccent.text,
    fontFamily: 'monospace',
  },
  sendButton: {
    marginBottom: spacing[2],
  },
});
