/**
 * Connect Sponsor Screen
 * For sponsors to accept invite payloads
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { Input, Button, Card, Modal, TextArea, Toast } from '../../../design-system/components';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections } from '../hooks';

export function ConnectSponsorScreen(): React.ReactElement {
  const theme = useTheme();
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text
              style={[theme.typography.largeTitle, { color: theme.colors.text, marginBottom: 8 }]}
            >
              Connect as Sponsor
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}
            >
              Paste the invite payload from your sponsee. You will receive a confirmation payload to
              send back.
            </Text>
          </View>

          <Input
            label="Your name (optional)"
            value={sponsorName}
            onChangeText={setSponsorName}
            placeholder="Name shown to your sponsee"
            autoCapitalize="words"
            accessibilityLabel="Your name"
          />

          <TextArea
            label="Invite payload"
            value={invitePayload}
            onChangeText={setInvitePayload}
            placeholder="Paste RCINVITE payload here"
            minHeight={160}
            accessibilityLabel="Invite payload input"
          />

          <Button
            title="Create Confirmation"
            onPress={handleConnect}
            variant="primary"
            size="large"
            disabled={loading || !invitePayload.trim()}
            loading={loading}
            style={{ marginTop: 16 }}
            accessibilityLabel="Create confirmation payload"
          />
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
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Confirmation payload
          </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  payloadCard: {
    marginTop: 12,
    padding: 12,
  },
});
