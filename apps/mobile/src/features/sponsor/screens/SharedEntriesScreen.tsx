/**
 * Shared Entries Screen
 * View and import entries shared by a sponsee
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useTheme, Card, Button, EmptyState, TextArea, Modal } from '../../../design-system';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections, useSponsorSharedEntries } from '../hooks';
import type { SharedEntryView } from '../hooks/useSponsorSharedEntries';
import type { ProfileStackParamList } from '../../../navigation/types';

type RouteParams = RouteProp<ProfileStackParamList, 'SharedEntries'>;

export function SharedEntriesScreen(): React.ReactElement {
  const route = useRoute<RouteParams>();
  const theme = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { connectionId } = route.params;

  const { connections } = useSponsorConnections(userId);
  const { loadIncomingEntries, importPayloads, shareComment } = useSponsorSharedEntries(userId);
  const connection = connections.find((item) => item.id === connectionId);

  const [entries, setEntries] = useState<SharedEntryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [importText, setImportText] = useState('');
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const [commentEntry, setCommentEntry] = useState<SharedEntryView | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentPayload, setCommentPayload] = useState('');
  const [payloadModalVisible, setPayloadModalVisible] = useState(false);

  const fetchSharedEntries = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const data = await loadIncomingEntries(connectionId);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [connectionId, loadIncomingEntries]);

  useEffect(() => {
    fetchSharedEntries();
  }, [fetchSharedEntries]);

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchSharedEntries();
  };

  const handleImport = async (): Promise<void> => {
    if (!importText.trim()) return;
    try {
      const result = await importPayloads(importText);
      setImportText('');
      const parts = [];
      if (result.entries > 0) parts.push(`${result.entries} entries`);
      if (result.comments > 0) parts.push(`${result.comments} comments`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
      setImportSummary(parts.length > 0 ? `Imported ${parts.join(', ')}` : 'Nothing to import');
      fetchSharedEntries();
    } catch (err) {
      setImportSummary(err instanceof Error ? err.message : 'Failed to import');
    }
  };

  const handleCreateCommentPayload = async (): Promise<void> => {
    if (!commentEntry || !commentText.trim()) return;
    const payload = await shareComment(connectionId, commentEntry.entryId, commentText.trim());
    setCommentPayload(payload);
    setCommentText('');
    setCommentEntry(null);
    setPayloadModalVisible(true);
  };

  const handleCopyPayload = async (): Promise<void> => {
    if (!commentPayload) return;
    await Clipboard.setStringAsync(commentPayload);
  };

  const handleSharePayload = async (): Promise<void> => {
    if (!commentPayload) return;
    await Share.share({ message: commentPayload });
  };

  const renderItem = ({ item }: { item: SharedEntryView }): React.ReactElement => (
    <Card variant="elevated" style={styles.entryCard}>
      <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
        {item.title || 'Untitled Entry'}
      </Text>
      <Text
        style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}
        numberOfLines={4}
      >
        {item.body}
      </Text>
      <View style={styles.entryMeta}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          Shared {new Date(item.sharedAt).toLocaleDateString()}
        </Text>
        <View style={styles.tagRow}>
          {item.tags.slice(0, 2).map((tag) => (
            <Text key={tag} style={[theme.typography.caption, { color: theme.colors.primary }]}>
              #{tag}
            </Text>
          ))}
        </View>
      </View>
      <Button
        title="Leave Comment"
        onPress={() => {
          setCommentEntry(item);
          setCommentText('');
        }}
        variant="outline"
        size="small"
        style={{ marginTop: theme.spacing.sm }}
        accessibilityLabel="Leave a comment for this entry"
      />
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12 }]}
          >
            Loading shared entries...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.errorContainer}>
          <Card variant="elevated" style={styles.errorCard}>
            <Text
              style={[
                theme.typography.title2,
                { color: theme.colors.danger, marginBottom: 8, textAlign: 'center' },
              ]}
            >
              Error
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.text, textAlign: 'center' }]}
            >
              {error}
            </Text>
            <Button
              title="Retry"
              onPress={fetchSharedEntries}
              variant="primary"
              size="small"
              style={{ marginTop: 12 }}
              accessibilityLabel="Retry loading shared entries"
            />
          </Card>
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
        <Card variant="flat" style={styles.header}>
          <Text style={[theme.typography.title1, { color: theme.colors.text, marginBottom: 4 }]}>
            {connection?.display_name || 'Shared Entries'}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Entries shared by your sponsee. Add supportive comments below.
          </Text>
        </Card>

        <Card variant="outlined" style={styles.importCard}>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
            Paste entry payloads your sponsee shared with you.
          </Text>
          <TextArea
            label="Shared payloads"
            value={importText}
            onChangeText={setImportText}
            placeholder="Paste RCSHARE payloads here"
            minHeight={120}
            accessibilityLabel="Shared payload input"
          />
          <Button
            title="Import Entries"
            onPress={handleImport}
            variant="primary"
            size="small"
            disabled={!importText.trim()}
            accessibilityLabel="Import shared entries"
            style={{ marginTop: theme.spacing.sm }}
          />
          {importSummary && (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 6 },
              ]}
            >
              {importSummary}
            </Text>
          )}
        </Card>

        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            entries.length === 0 && styles.listContentEmpty,
          ]}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <EmptyState
              icon="folder-shared"
              title="No Shared Entries"
              description="Your sponsee hasn't shared any journal entries with you yet."
            />
          }
          showsVerticalScrollIndicator={false}
          accessibilityRole="list"
          accessibilityLabel="Shared journal entries list"
          // Performance optimizations
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews
        />
      </SafeAreaView>

      <Modal
        visible={commentEntry !== null}
        onClose={() => setCommentEntry(null)}
        title="Supportive Comment"
        message="Write a brief, supportive note. Share the payload with your sponsee after generating it."
        variant="center"
        actions={[
          {
            title: 'Cancel',
            onPress: () => setCommentEntry(null),
            variant: 'outline',
          },
          {
            title: 'Create Payload',
            onPress: handleCreateCommentPayload,
            variant: 'primary',
          },
        ]}
      >
        <TextArea
          label="Comment"
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Your comment"
          minHeight={120}
          accessibilityLabel="Comment input"
        />
      </Modal>

      <Modal
        visible={payloadModalVisible}
        onClose={() => setPayloadModalVisible(false)}
        title="Comment Payload"
        message="Share this payload with your sponsee so they can import your comment."
        variant="center"
        actions={[
          {
            title: 'Copy',
            onPress: handleCopyPayload,
            variant: 'outline',
          },
          {
            title: 'Share',
            onPress: handleSharePayload,
            variant: 'primary',
          },
        ]}
      >
        <TextArea
          label=""
          value={commentPayload}
          editable={false}
          minHeight={140}
          accessibilityLabel="Comment payload"
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  importCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  entryCard: {
    padding: 16,
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorCard: {
    padding: 24,
    width: '100%',
  },
});
