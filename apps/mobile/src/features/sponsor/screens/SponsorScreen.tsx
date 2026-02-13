/**
 * Sponsor Connections Screen (local-only)
 * Manages manual invite/confirm flows with encrypted payloads.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../navigation/types';
import { Card, Button, Modal, Input, Toast, SkeletonCard } from '../../../design-system';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../../contexts/AuthContext';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useSponsorConnections } from '../hooks/useSponsorConnections';
import { generateId } from '../../../utils/id';
import { logger } from '../../../utils/logger';
import { addToSyncQueue } from '../../../services/syncService';
import { parseCommentSharePayload } from '@recovery/shared';
import { Text } from 'react-native';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function SponsorScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { db } = useDatabase();

  const {
    mySponsor,
    mySponsees,
    pendingInvites,
    isLoading,
    createInvite,
    confirmInvite,
    connectAsSponsor,
    removeConnection,
    loadConnections,
  } = useSponsorConnections(userId);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [invitePayload, setInvitePayload] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [connectName, setConnectName] = useState('');
  const [connectPayload, setConnectPayload] = useState('');
  const [confirmPayload, setConfirmPayload] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [commentImportVisible, setCommentImportVisible] = useState(false);
  const [commentPayloadInput, setCommentPayloadInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, variant: 'success' | 'error' | 'info' = 'success'): void => {
    setToastMessage(message);
    setToastVariant(variant);
  };

  const sharePayload = async (payload: string, label: string): Promise<void> => {
    try {
      await Share.share({
        message: `${label}\n\n${payload}`,
      });
    } catch (error) {
      logger.warn('Failed to share sponsor payload', error);
    }
  };

  const handleCreateInvite = async (): Promise<void> => {
    try {
      setInviteLoading(true);
      const result = await createInvite(inviteName.trim() || undefined);
      setInvitePayload(result.payload);
      setInviteCode(result.code);
      showToast('Invite created. Share it with your sponsor.', 'success');
    } catch (error) {
      logger.warn('Failed to create invite', error);
      showToast('Unable to create invite. Try again.', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleConnectAsSponsor = async (): Promise<void> => {
    if (!connectPayload.trim()) {
      showToast('Paste the invite payload to connect.', 'info');
      return;
    }

    try {
      setConnectLoading(true);
      const confirmation = await connectAsSponsor(
        connectPayload.trim(),
        connectName.trim() || undefined,
      );
      setConfirmPayload(confirmation);
      setConnectModalVisible(false);
      showToast('Connection ready. Send confirmation back.', 'success');
    } catch (error) {
      logger.warn('Failed to connect as sponsor', error);
      showToast('Unable to connect. Check the invite code.', 'error');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleConfirmSponsor = async (): Promise<void> => {
    if (!confirmInput.trim()) {
      showToast('Paste the confirmation payload first.', 'info');
      return;
    }

    try {
      setConfirmLoading(true);
      await confirmInvite(confirmInput.trim());
      await loadConnections();
      setConfirmInput('');
      setConfirmModalVisible(false);
      showToast('Sponsor confirmed!', 'success');
    } catch (error) {
      logger.warn('Failed to confirm sponsor', error);
      showToast('Confirmation failed. Please check the code.', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleRemove = async (connectionId: string): Promise<void> => {
    try {
      await removeConnection(connectionId);
      showToast('Connection removed', 'success');
    } catch (error) {
      logger.warn('Failed to remove connection', error);
      showToast('Unable to remove connection', 'error');
    }
  };

  const handleImportComment = async (): Promise<void> => {
    if (!db) {
      showToast('Database not ready', 'error');
      return;
    }
    const payload = parseCommentSharePayload(commentPayloadInput.trim());
    if (!payload) {
      showToast('Invalid comment payload', 'error');
      return;
    }

    try {
      setCommentLoading(true);
      const connection = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM sponsor_connections WHERE user_id = ? AND invite_code = ?`,
        [userId, payload.code],
      );

      if (!connection?.id) {
        showToast('No matching sponsor connection found.', 'error');
        return;
      }

      const now = new Date().toISOString();
      const shareId = generateId('share');
      await db.runAsync(
        `INSERT INTO sponsor_shared_entries (
          id, user_id, connection_id, direction, journal_entry_id,
          payload, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shareId,
          userId,
          connection.id,
          'comment',
          payload.entryId,
          commentPayloadInput.trim(),
          now,
          now,
        ],
      );
      await addToSyncQueue(db, 'sponsor_shared_entries', shareId, 'insert');

      setCommentPayloadInput('');
      setCommentImportVisible(false);
      showToast('Comment imported into your journal.', 'success');
    } catch (error) {
      logger.warn('Failed to import comment', error);
      showToast('Unable to import comment.', 'error');
    } finally {
      setCommentLoading(false);
    }
  };

  const sponsorSummary = useMemo(() => {
    if (pendingInvites.length > 0) {
      return 'Invite sent — waiting for your sponsor to confirm.';
    }
    if (mySponsor) {
      return 'Connected to your sponsor.';
    }
    return 'No sponsor connected yet.';
  }, [pendingInvites.length, mySponsor]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Text style={styles.screenTitle} accessibilityRole="header">
              Sponsor Connections
            </Text>
            <Text style={styles.headerSubtitle}>{sponsorSummary}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-heart" size={24} color={styles.iconPrimary.color} />
              <Text style={styles.cardTitle}>I need a sponsor</Text>
            </View>
            <Text style={styles.cardDescription}>
              Create an invite and share it with your sponsor. When they send back a confirmation,
              paste it here to finalize the connection.
            </Text>

            <View style={styles.buttonRow}>
              <Button
                title="Create Invite"
                onPress={() => setInviteModalVisible(true)}
                variant="primary"
                size="small"
                style={styles.buttonRowButtonLeft}
              />
              <Button
                title="Confirm Sponsor"
                onPress={() => setConfirmModalVisible(true)}
                variant="outline"
                size="small"
                style={styles.buttonRowButtonRight}
              />
            </View>

            <Button
              title="Import Sponsor Comment"
              onPress={() => setCommentImportVisible(true)}
              variant="outline"
              size="small"
              style={styles.smallTopMargin}
            />
          </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-tie" size={24} color={styles.iconSecondary.color} />
              <Text style={styles.cardTitle}>I am a sponsor</Text>
            </View>
            <Text style={styles.cardDescription}>
              Paste an invite from your sponsee to connect. You will receive a confirmation payload
              to send back.
            </Text>
            <Button
              title="Connect with Invite"
              onPress={() => setConnectModalVisible(true)}
              variant="secondary"
              size="small"
              style={styles.mediumTopMargin}
            />
          </Card>
          </Animated.View>

          {mySponsor && (
            <Card variant="interactive" style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="account-supervisor"
                  size={24}
                  color={styles.iconSuccess.color}
                />
                <Text style={styles.cardTitle}>My Sponsor</Text>
              </View>
              <Text style={styles.cardDescription}>{mySponsor.display_name || 'Sponsor connected'}</Text>
              <Button
                title="Remove Sponsor"
                onPress={() => handleRemove(mySponsor.id)}
                variant="outline"
                size="small"
                textStyle={styles.dangerText}
                style={styles.mediumTopMargin}
              />
              <Button
                title="Message Sponsor"
                onPress={() => navigation.navigate('SponsorChat', { connectionId: mySponsor.id })}
                variant="primary"
                size="small"
                style={styles.smallTopMargin}
              />
            </Card>
          )}

          {mySponsees.length > 0 && (
            <View style={styles.sponseesSection}>
              <Text style={styles.sponseesTitle} accessibilityRole="header">
                My Sponsees ({mySponsees.length})
              </Text>
              {mySponsees.map((sponsee) => (
                <Card key={sponsee.id} variant="interactive" style={styles.sponseeCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                      name="account-check"
                      size={24}
                      color={styles.iconSuccess.color}
                    />
                    <Text style={styles.cardTitle}>{sponsee.display_name || 'Sponsee'}</Text>
                  </View>
                  <Button
                    title="View Shared Entries →"
                    onPress={() =>
                      navigation.navigate('SharedEntries', {
                        connectionId: sponsee.id,
                      })
                    }
                    variant="outline"
                    size="small"
                    style={styles.mediumTopMargin}
                  />
                  <Button
                    title="Message Sponsee"
                    onPress={() =>
                      navigation.navigate('SponsorChat', {
                        connectionId: sponsee.id,
                      })
                    }
                    variant="primary"
                    size="small"
                    style={styles.smallTopMargin}
                  />
                  <Button
                    title="Remove Sponsee"
                    onPress={() => handleRemove(sponsee.id)}
                    variant="outline"
                    size="small"
                    textStyle={styles.dangerText}
                    style={styles.smallTopMargin}
                  />
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Toast
        visible={!!toastMessage}
        message={toastMessage}
        variant={toastVariant}
        duration={2000}
        onDismiss={() => setToastMessage('')}
      />

      <Modal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        title="Create Sponsor Invite"
        variant="center"
      >
        <Input
          label="Your name (optional)"
          value={inviteName}
          onChangeText={setInviteName}
          placeholder="How your sponsor knows you"
        />
        {invitePayload ? (
          <Card variant="outlined" style={styles.modalCard}>
            <Text style={styles.inviteCodeText}>Invite Code: {inviteCode}</Text>
            <Text style={styles.modalCaption}>Share this payload with your sponsor:</Text>
            <Text style={styles.modalPayloadText}>{invitePayload}</Text>
            <Button
              title="Share Invite"
              onPress={() => sharePayload(invitePayload, 'Sponsor invite payload')}
              variant="primary"
              size="small"
              style={styles.smallTopMargin}
            />
          </Card>
        ) : (
          <Text style={styles.cardDescription}>
            Generate an invite and share the payload with your sponsor.
          </Text>
        )}

        <View style={styles.modalActions}>
          <Button
            title={invitePayload ? 'Close' : 'Generate Invite'}
            onPress={invitePayload ? () => setInviteModalVisible(false) : handleCreateInvite}
            variant="primary"
            size="medium"
            loading={inviteLoading}
            disabled={inviteLoading}
          />
        </View>
      </Modal>

      <Modal
        visible={connectModalVisible}
        onClose={() => setConnectModalVisible(false)}
        title="Connect as Sponsor"
        variant="center"
      >
        <Input
          label="Your name (optional)"
          value={connectName}
          onChangeText={setConnectName}
          placeholder="How your sponsee knows you"
        />
        <Input
          label="Invite Payload"
          value={connectPayload}
          onChangeText={setConnectPayload}
          placeholder="Paste invite payload"
          multiline
        />
        <View style={styles.modalActions}>
          <Button
            title="Connect"
            onPress={handleConnectAsSponsor}
            variant="primary"
            size="medium"
            loading={connectLoading}
            disabled={connectLoading}
          />
        </View>
      </Modal>

      <Modal
        visible={!!confirmPayload}
        onClose={() => setConfirmPayload('')}
        title="Send Confirmation"
        variant="center"
      >
        <Text style={styles.cardDescription}>Share this confirmation payload back with your sponsee.</Text>
        <Text style={styles.confirmPayloadText}>{confirmPayload}</Text>
        <View style={styles.modalActions}>
          <Button
            title="Share Confirmation"
            onPress={() => sharePayload(confirmPayload, 'Sponsor confirmation payload')}
            variant="primary"
            size="medium"
          />
        </View>
      </Modal>

      <Modal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        title="Confirm Sponsor"
        variant="center"
      >
        <Input
          label="Confirmation Payload"
          value={confirmInput}
          onChangeText={setConfirmInput}
          placeholder="Paste confirmation payload"
          multiline
        />
        <View style={styles.modalActions}>
          <Button
            title="Confirm"
            onPress={handleConfirmSponsor}
            variant="primary"
            size="medium"
            loading={confirmLoading}
            disabled={confirmLoading}
          />
        </View>
      </Modal>

      <Modal
        visible={commentImportVisible}
        onClose={() => setCommentImportVisible(false)}
        title="Import Sponsor Comment"
        variant="center"
      >
        <Input
          label="Comment Payload"
          value={commentPayloadInput}
          onChangeText={setCommentPayloadInput}
          placeholder="Paste comment payload"
          multiline
        />
        <View style={styles.modalActions}>
          <Button
            title="Import Comment"
            onPress={handleImportComment}
            variant="primary"
            size="medium"
            loading={commentLoading}
            disabled={commentLoading}
          />
        </View>
      </Modal>
    </>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      padding: ds.semantic.layout.screenPadding,
      gap: ds.space[3],
    },
    loadingText: {
      ...ds.typography.body,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[3],
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: ds.space[3],
      paddingTop: ds.space[4],
      paddingBottom: ds.space[6],
    },
    header: {
      marginBottom: ds.space[4],
    },
    screenTitle: {
      ...ds.semantic.typography.screenTitle,
      color: ds.semantic.text.primary,
    },
    headerSubtitle: {
      ...ds.typography.body,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[1],
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
      marginLeft: ds.space[2],
    },
    cardDescription: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[1],
    },
    sectionCard: {
      marginBottom: ds.space[4],
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: ds.space[3],
    },
    buttonRowButtonLeft: {
      flex: 1,
      marginRight: ds.space[1],
    },
    buttonRowButtonRight: {
      flex: 1,
      marginLeft: ds.space[1],
    },
    smallTopMargin: {
      marginTop: ds.space[2],
    },
    mediumTopMargin: {
      marginTop: ds.space[3],
    },
    sponseesSection: {
      marginBottom: ds.space[6],
    },
    sponseesTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
      marginBottom: ds.space[2],
    },
    sponseeCard: {
      marginBottom: ds.space[2],
    },
    dangerText: {
      color: ds.semantic.intent.alert.solid,
    },
    modalCard: {
      marginBottom: ds.space[3],
    },
    inviteCodeText: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
    },
    modalCaption: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[2],
    },
    modalPayloadText: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.primary,
      marginTop: ds.space[2],
    },
    modalActions: {
      marginTop: ds.space[3],
    },
    confirmPayloadText: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.primary,
      marginTop: ds.space[3],
    },
    iconPrimary: {
      color: ds.semantic.intent.primary.solid,
    },
    iconSecondary: {
      color: ds.semantic.intent.secondary.solid,
    },
    iconSuccess: {
      color: ds.semantic.intent.success.solid,
    },
  });
