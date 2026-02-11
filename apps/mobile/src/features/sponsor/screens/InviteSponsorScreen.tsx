/**
 * Invite Sponsor Screen
 * Local-only pairing via shareable payloads
 */

import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections } from '../hooks';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { Input, Button, Card, Modal, Toast, TextArea } from '../../../design-system/components';
import type { ModalAction } from '../../../design-system/components';
import type { Theme } from '../../../design-system/context/ThemeContext';

export function InviteSponsorScreen(): React.ReactElement {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { createInvite, confirmInvite, pendingInvites } = useSponsorConnections(userId);

  const [displayName, setDisplayName] = useState('');
  const [invitePayload, setInvitePayload] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [confirmationPayload, setConfirmationPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleGenerateInvite = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await createInvite(displayName.trim() || undefined);
      setInvitePayload(result.payload);
      setInviteCode(result.code);
      setToastMessage('Invite created. Share the payload with your sponsor.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create invite');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async (): Promise<void> => {
    if (!invitePayload) return;
    await Clipboard.setStringAsync(invitePayload);
    setToastMessage('Invite payload copied');
  };

  const handleShareInvite = async (): Promise<void> => {
    if (!invitePayload) return;
    await Share.share({
      message: invitePayload,
    });
  };

  const handleConfirmSponsor = async (): Promise<void> => {
    if (!confirmationPayload.trim()) return;
    setLoading(true);
    try {
      await confirmInvite(confirmationPayload.trim());
      setShowSuccessModal(true);
      setConfirmationPayload('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to confirm sponsor');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = (): void => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const successActions: ModalAction[] = [
    {
      title: 'Done',
      onPress: handleSuccessModalClose,
      variant: 'primary',
    },
  ];

  const errorActions: ModalAction[] = [
    {
      title: 'OK',
      onPress: () => setShowErrorModal(false),
      variant: 'primary',
    },
  ];

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
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text
              style={[theme.typography.largeTitle, { color: theme.colors.text, marginBottom: 8 }]}
            >
              Invite a Sponsor
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}
            >
              Create a private invite payload and share it with your sponsor. They will reply with a
              confirmation payload to complete the connection.
            </Text>
          </View>

          <Input
            label="Your name (optional)"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Name shown to your sponsor"
            autoCapitalize="words"
            accessibilityLabel="Your display name"
          />

          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              size="large"
              onPress={handleGenerateInvite}
              disabled={loading}
              loading={loading}
              accessibilityLabel="Generate sponsor invite payload"
              style={styles.button}
            >
              Generate Invite
            </Button>
          </View>

          {invitePayload ? (
            <Card variant="elevated" style={styles.payloadCard}>
              <Text style={[theme.typography.title3, { color: theme.colors.text }]}>
                Invite Payload
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Share this exact payload with your sponsor.
              </Text>
              <TextArea
                label=""
                value={invitePayload}
                editable={false}
                minHeight={140}
                accessibilityLabel="Invite payload"
              />
              <View style={styles.payloadActions}>
                <Button
                  title="Copy"
                  onPress={handleCopyInvite}
                  variant="outline"
                  size="small"
                  accessibilityLabel="Copy invite payload"
                />
                <Button
                  title="Share"
                  onPress={handleShareInvite}
                  variant="secondary"
                  size="small"
                  accessibilityLabel="Share invite payload"
                />
              </View>
              {inviteCode && (
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Invite code: {inviteCode}
                </Text>
              )}
            </Card>
          ) : (
            pendingInvites.length > 0 && (
              <Card variant="outlined" style={styles.payloadCard}>
                <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
                  You already have a pending invite: {pendingInvites[0].invite_code}. Generate a new
                  invite if you need to start over.
                </Text>
              </Card>
            )
          )}

          <Card variant="flat" style={styles.infoCard}>
            <Text
              style={[theme.typography.title3, { color: theme.colors.primary, marginBottom: 12 }]}
            >
              How it works
            </Text>
            <View style={styles.infoList}>
              <InfoItem theme={theme} text="Generate your private invite payload" />
              <InfoItem theme={theme} text="Sponsor enters it on their device" />
              <InfoItem theme={theme} text="You receive a confirmation payload" />
              <InfoItem theme={theme} text="Paste it below to connect" />
            </View>
          </Card>

          <Card variant="elevated" style={styles.confirmCard}>
            <Text style={[theme.typography.title3, { color: theme.colors.text }]}>
              Confirm Sponsor
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
              Paste the confirmation payload from your sponsor to complete the connection.
            </Text>
            <TextArea
              label="Confirmation payload"
              value={confirmationPayload}
              onChangeText={setConfirmationPayload}
              placeholder="Paste RCCONFIRM payload here"
              minHeight={140}
              accessibilityLabel="Sponsor confirmation payload input"
            />
            <Button
              title="Confirm Sponsor"
              onPress={handleConfirmSponsor}
              variant="primary"
              size="large"
              disabled={loading || !confirmationPayload.trim()}
              loading={loading}
              style={styles.button}
              accessibilityLabel="Confirm sponsor connection"
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showSuccessModal}
        title="Sponsor Connected"
        message="Your sponsor connection is active. You can now share journal entries."
        actions={successActions}
        variant="center"
        onClose={handleSuccessModalClose}
      />

      <Modal
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        actions={errorActions}
        variant="center"
        onClose={() => setShowErrorModal(false)}
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

function InfoItem({ theme, text }: { theme: Theme; text: string }): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.infoItem}>
      <Text style={[theme.typography.body, { color: theme.colors.primary }]}>• {text}</Text>
    </View>
  );
}

const createStyles = (_ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 24,
    },
    buttonContainer: {
      marginTop: 16,
    },
    button: {
      marginTop: 16,
    },
    payloadCard: {
      marginTop: 20,
      padding: 16,
    },
    payloadActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    infoCard: {
      marginTop: 24,
      padding: 16,
      backgroundColor: 'transparent',
    },
    infoList: {
      gap: 8,
    },
    infoItem: {
      flexDirection: 'row',
    },
    confirmCard: {
      marginTop: 24,
      padding: 16,
    },
  }) as const;
