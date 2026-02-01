/**
 * Sponsor Connections Screen (local-only)
 * Manages manual invite/confirm flows with encrypted payloads.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../navigation/types';
import { useTheme, Card, Button, Modal, Input, Toast } from '../../../design-system';
import { useAuth } from '../../../contexts/AuthContext';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useSponsorConnections } from '../hooks/useSponsorConnections';
import { generateId } from '../../../utils/id';
import { logger } from '../../../utils/logger';
import { parseCommentSharePayload } from '@recovery/shared/services/sponsorConnection';
import { Text } from 'react-native';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function SponsorScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
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
      logger.error('Failed to create invite', error);
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
      logger.error('Failed to connect as sponsor', error);
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
      logger.error('Failed to confirm sponsor', error);
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
      logger.error('Failed to remove connection', error);
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
      await db.runAsync(
        `INSERT INTO sponsor_shared_entries (
          id, user_id, connection_id, direction, journal_entry_id,
          payload, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('share'),
          userId,
          connection.id,
          'comment',
          payload.entryId,
          commentPayloadInput.trim(),
          now,
          now,
        ],
      );

      setCommentPayloadInput('');
      setCommentImportVisible(false);
      showToast('Comment imported into your journal.', 'success');
    } catch (error) {
      logger.error('Failed to import comment', error);
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
            ]}
          >
            Loading connections...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={[styles.content, { paddingHorizontal: theme.spacing.md }]}>
          <View style={[styles.header, { marginBottom: theme.spacing.lg }]}>
            <Text
              style={[theme.typography.h1, { color: theme.colors.text }]}
              accessibilityRole="header"
            >
              Sponsor Connections
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
              ]}
            >
              {sponsorSummary}
            </Text>
          </View>

          <Card variant="elevated" style={{ marginBottom: theme.spacing.lg }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-heart" size={24} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginLeft: theme.spacing.sm },
                ]}
              >
                I need a sponsor
              </Text>
            </View>
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
              ]}
            >
              Create an invite and share it with your sponsor. When they send back a confirmation,
              paste it here to finalize the connection.
            </Text>

            <View style={[styles.buttonRow, { marginTop: theme.spacing.md }]}>
              <Button
                title="Create Invite"
                onPress={() => setInviteModalVisible(true)}
                variant="primary"
                size="small"
                style={{ flex: 1, marginRight: theme.spacing.xs }}
              />
              <Button
                title="Confirm Sponsor"
                onPress={() => setConfirmModalVisible(true)}
                variant="outline"
                size="small"
                style={{ flex: 1, marginLeft: theme.spacing.xs }}
              />
            </View>

            <Button
              title="Import Sponsor Comment"
              onPress={() => setCommentImportVisible(true)}
              variant="outline"
              size="small"
              style={{ marginTop: theme.spacing.sm }}
            />
          </Card>

          <Card variant="elevated" style={{ marginBottom: theme.spacing.lg }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-tie" size={24} color={theme.colors.secondary} />
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginLeft: theme.spacing.sm },
                ]}
              >
                I am a sponsor
              </Text>
            </View>
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
              ]}
            >
              Paste an invite from your sponsee to connect. You will receive a confirmation payload
              to send back.
            </Text>
            <Button
              title="Connect with Invite"
              onPress={() => setConnectModalVisible(true)}
              variant="secondary"
              size="small"
              style={{ marginTop: theme.spacing.md }}
            />
          </Card>

          {mySponsor && (
            <Card variant="interactive" style={{ marginBottom: theme.spacing.lg }}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="account-supervisor"
                  size={24}
                  color={theme.colors.success}
                />
                <Text
                  style={[
                    theme.typography.h3,
                    { color: theme.colors.text, marginLeft: theme.spacing.sm },
                  ]}
                >
                  My Sponsor
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
                ]}
              >
                {mySponsor.display_name || 'Sponsor connected'}
              </Text>
              <Button
                title="Remove Sponsor"
                onPress={() => handleRemove(mySponsor.id)}
                variant="outline"
                size="small"
                textStyle={{ color: theme.colors.danger }}
                style={{ marginTop: theme.spacing.md }}
              />
            </Card>
          )}

          {mySponsees.length > 0 && (
            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginBottom: theme.spacing.sm },
                ]}
                accessibilityRole="header"
              >
                My Sponsees ({mySponsees.length})
              </Text>
              {mySponsees.map((sponsee) => (
                <Card
                  key={sponsee.id}
                  variant="interactive"
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                      name="account-check"
                      size={24}
                      color={theme.colors.success}
                    />
                    <Text
                      style={[
                        theme.typography.h3,
                        { color: theme.colors.text, marginLeft: theme.spacing.sm },
                      ]}
                    >
                      {sponsee.display_name || 'Sponsee'}
                    </Text>
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
                    style={{ marginTop: theme.spacing.md }}
                  />
                  <Button
                    title="Remove Sponsee"
                    onPress={() => handleRemove(sponsee.id)}
                    variant="outline"
                    size="small"
                    textStyle={{ color: theme.colors.danger }}
                    style={{ marginTop: theme.spacing.sm }}
                  />
                </Card>
              ))}
            </View>
          )}
        </View>
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
          <Card variant="outlined" style={{ marginBottom: theme.spacing.md }}>
            <Text style={[theme.typography.label, { color: theme.colors.textSecondary }]}>
              Invite Code: {inviteCode}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 8 },
              ]}
            >
              Share this payload with your sponsor:
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.text, marginTop: 8 }]}>
              {invitePayload}
            </Text>
            <Button
              title="Share Invite"
              onPress={() => sharePayload(invitePayload, 'Sponsor invite payload')}
              variant="primary"
              size="small"
              style={{ marginTop: theme.spacing.sm }}
            />
          </Card>
        ) : (
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
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
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
          Share this confirmation payload back with your sponsee.
        </Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.text, marginTop: 12 }]}>
          {confirmPayload}
        </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    // spacing inline
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActions: {
    marginTop: 12,
  },
});
