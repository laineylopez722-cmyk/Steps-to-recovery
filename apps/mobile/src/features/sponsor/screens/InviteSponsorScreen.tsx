/**
 * Invite Sponsor Screen
 * Local-only pairing via shareable payloads
 */

import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections } from '../hooks';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { Input, Button, Card, Modal, Toast, TextArea } from '../../../design-system/components';
import type { ModalAction } from '../../../design-system/components';

export function InviteSponsorScreen(): React.ReactElement {
  const navigation = useNavigation();
  const ds = useDs();
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
    await Share.share({ message: invitePayload });
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
    { title: 'Done', onPress: handleSuccessModalClose, variant: 'primary' },
  ];

  const errorActions: ModalAction[] = [
    { title: 'OK', onPress: () => setShowErrorModal(false), variant: 'primary' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Text style={styles.screenTitle}>Invite a Sponsor</Text>
            <Text style={styles.headerSubtitle}>
              Create a private invite payload and share it with your sponsor. They will reply with a
              confirmation payload to complete the connection.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Input
              label="Your name (optional)"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Name shown to your sponsor"
              autoCapitalize="words"
              accessibilityLabel="Your display name"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.buttonContainer}>
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
          </Animated.View>

          {invitePayload ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card variant="elevated" style={styles.payloadCard}>
                <Text style={styles.cardTitle}>Invite Payload</Text>
                <Text style={styles.cardCaption}>
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
                  <Text style={styles.cardCaption}>Invite code: {inviteCode}</Text>
                )}
              </Card>
            </Animated.View>
          ) : (
            pendingInvites.length > 0 && (
              <Card variant="outlined" style={styles.payloadCard}>
                <Text style={styles.pendingText}>
                  You already have a pending invite: {pendingInvites[0].invite_code}. Generate a new
                  invite if you need to start over.
                </Text>
              </Card>
            )
          )}

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Card variant="flat" style={styles.infoCard}>
              <Text style={styles.infoTitle}>How it works</Text>
              <View style={styles.infoList}>
                <InfoItem ds={ds} text="Generate your private invite payload" />
                <InfoItem ds={ds} text="Sponsor enters it on their device" />
                <InfoItem ds={ds} text="You receive a confirmation payload" />
                <InfoItem ds={ds} text="Paste it below to connect" />
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(300)}>
            <Card variant="elevated" style={styles.confirmCard}>
              <Text style={styles.cardTitle}>Confirm Sponsor</Text>
              <Text style={styles.cardCaption}>
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
          </Animated.View>
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

function InfoItem({ ds, text }: { ds: ReturnType<typeof import('../../../design-system/DsProvider').useDs>; text: string }): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Text style={{ ...ds.semantic.typography.body, color: ds.semantic.intent.primary.solid }}>
        • {text}
      </Text>
    </View>
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
    scrollView: {
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
    buttonContainer: {
      marginTop: ds.space[4],
    },
    button: {
      marginTop: ds.space[4],
    },
    payloadCard: {
      marginTop: ds.space[5],
      padding: ds.semantic.layout.cardPadding,
    },
    payloadActions: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: ds.space[3],
    },
    cardTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
    },
    cardCaption: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[1],
    },
    pendingText: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
    },
    infoCard: {
      marginTop: ds.semantic.layout.sectionGap,
      padding: ds.semantic.layout.cardPadding,
      backgroundColor: 'transparent',
    },
    infoTitle: {
      ...ds.typography.h3,
      color: ds.semantic.intent.primary.solid,
      marginBottom: ds.space[3],
    },
    infoList: {
      gap: ds.space[2],
    },
    confirmCard: {
      marginTop: ds.semantic.layout.sectionGap,
      padding: ds.semantic.layout.cardPadding,
    },
  }) as const;

