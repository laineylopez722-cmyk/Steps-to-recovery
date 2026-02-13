/**
 * Connect Sponsor Screen
 * For sponsors to accept invite payloads
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { Input, Button, Card, Modal, TextArea, Toast } from '../../../design-system/components';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections } from '../hooks';

export function ConnectSponsorScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { connectAsSponsor } = useSponsorConnections(userId);

  const [sponsorName, setSponsorName] = useState('');
  const [invitePayload, setInvitePayload] = useState('');
  const [confirmationPayload, setConfirmationPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async (): Promise<void> => {
    if (!invitePayload.trim()) return;
    setLoading(true);
    try {
      const confirmPayload = await connectAsSponsor(
        invitePayload.trim(),
        sponsorName.trim() || undefined,
      );
      setConfirmationPayload(confirmPayload);
      setShowConfirmModal(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!confirmationPayload) return;
    await Clipboard.setStringAsync(confirmationPayload);
    setToastMessage('Confirmation payload copied');
  };

  const handleShare = async (): Promise<void> => {
    if (!confirmationPayload) return;
    await Share.share({ message: confirmationPayload });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Text style={styles.screenTitle}>Connect as Sponsor</Text>
            <Text style={styles.headerSubtitle}>
              Paste the invite payload from your sponsee. You will receive a confirmation payload to
              send back.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Input
              label="Your name (optional)"
              value={sponsorName}
              onChangeText={setSponsorName}
              placeholder="Name shown to your sponsee"
              autoCapitalize="words"
              accessibilityLabel="Your name"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <TextArea
              label="Invite payload"
              value={invitePayload}
              onChangeText={setInvitePayload}
              placeholder="Paste RCINVITE payload here"
              minHeight={160}
              accessibilityLabel="Invite payload input"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Button
              title="Create Confirmation"
              onPress={handleConnect}
              variant="primary"
              size="large"
              disabled={loading || !invitePayload.trim()}
              loading={loading}
              style={styles.submitButton}
              accessibilityLabel="Create confirmation payload"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmation Ready"
        message="Share this payload with your sponsee to complete the connection."
        variant="center"
        actions={[
          {
            title: 'Copy',
            onPress: handleCopy,
            variant: 'outline',
            accessibilityLabel: 'Copy confirmation payload',
          },
          {
            title: 'Share',
            onPress: handleShare,
            variant: 'primary',
            accessibilityLabel: 'Share confirmation payload',
          },
        ]}
      >
        <Card variant="outlined" style={styles.payloadCard}>
          <Text style={styles.payloadLabel}>Confirmation payload</Text>
          <TextArea
            label=""
            value={confirmationPayload}
            editable={false}
            minHeight={140}
            accessibilityLabel="Confirmation payload"
          />
        </Card>
      </Modal>

      <Modal
        visible={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
        title="Error"
        message={errorMessage ?? ''}
        variant="center"
        actions={[
          {
            title: 'OK',
            onPress: () => setErrorMessage(null),
            variant: 'primary',
          },
        ]}
      />

      <Toast
        visible={Boolean(toastMessage)}
        message={toastMessage ?? ''}
        variant="success"
        duration={2000}
        onDismiss={() => setToastMessage(null)}
      />
    </SafeAreaView>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    keyboardView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingTop: ds.space[5],
      paddingBottom: ds.space[10],
    },
    header: {
      marginBottom: ds.semantic.layout.sectionGap,
    },
    screenTitle: {
      ...ds.semantic.typography.screenTitle,
      color: ds.semantic.text.primary,
      marginBottom: ds.space[2],
    },
    headerSubtitle: {
      ...ds.semantic.typography.body,
      color: ds.semantic.text.secondary,
      lineHeight: 22,
    },
    submitButton: {
      marginTop: ds.space[4],
    },
    payloadCard: {
      marginTop: ds.space[3],
      padding: ds.space[3],
    },
    payloadLabel: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
    },
  }) as const;
