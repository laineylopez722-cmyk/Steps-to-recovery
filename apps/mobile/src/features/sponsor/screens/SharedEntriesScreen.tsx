/**
 * Shared Entries Screen
 * View and import entries shared by a sponsee
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { Card, Button, EmptyState, TextArea, Modal, SkeletonCard } from '../../../design-system';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections, useSponsorSharedEntries } from '../hooks';
import type { SharedEntryView } from '../hooks/useSponsorSharedEntries';
import type { ProfileStackParamList } from '../../../navigation/types';

type RouteParams = RouteProp<ProfileStackParamList, 'SharedEntries'>;

export function SharedEntriesScreen(): React.ReactElement {
  const route = useRoute<RouteParams>();
  const styles = useThemedStyles(createStyles);
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

  const renderItem = ({ item, index }: { item: SharedEntryView; index: number }): React.ReactElement => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Card variant="elevated" style={styles.entryCard}>
        <Text style={styles.entryTitle}>{item.title || 'Untitled Entry'}</Text>
        <Text style={styles.entryBody} numberOfLines={4}>
          {item.body}
        </Text>
        <View style={styles.entryMeta}>
          <Text style={styles.metaText}>
            Shared {new Date(item.sharedAt).toLocaleDateString()}
          </Text>
          <View style={styles.tagRow}>
            {item.tags.slice(0, 2).map((tag) => (
              <Text key={tag} style={styles.tagText}>
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
          style={styles.commentButton}
          accessibilityLabel="Leave a comment for this entry"
        />
      </Card>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer} accessibilityLabel="Loading shared entries" accessibilityRole="progressbar">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Card variant="elevated" style={styles.errorCard} accessibilityRole="alert">
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Button
              title="Retry"
              onPress={fetchSharedEntries}
              variant="primary"
              size="small"
              style={styles.retryButton}
              accessibilityLabel="Retry loading shared entries"
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Card variant="flat" style={styles.header}>
          <Text style={styles.screenTitle} accessibilityRole="header">
            {connection?.display_name || 'Shared Entries'}
          </Text>
          <Text style={styles.headerCaption}>
            Entries shared by your sponsee. Add supportive comments below.
          </Text>
        </Card>

        <Card variant="outlined" style={styles.importCard}>
          <Text style={styles.importHint}>
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
            style={styles.importButton}
          />
          {importSummary && <Text style={styles.importSummary}>{importSummary}</Text>}
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
          { title: 'Cancel', onPress: () => setCommentEntry(null), variant: 'outline' },
          { title: 'Create Payload', onPress: handleCreateCommentPayload, variant: 'primary' },
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
          { title: 'Copy', onPress: handleCopyPayload, variant: 'outline' },
          { title: 'Share', onPress: handleSharePayload, variant: 'primary' },
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

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    header: {
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingVertical: ds.space[4],
    },
    screenTitle: {
      ...ds.typography.h2,
      color: ds.semantic.text.primary,
      marginBottom: ds.space[1],
    },
    headerCaption: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
    },
    importCard: {
      marginHorizontal: ds.semantic.layout.screenPadding,
      marginBottom: ds.space[3],
      padding: ds.semantic.layout.cardPadding,
    },
    importHint: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
    },
    importButton: {
      marginTop: ds.space[3],
    },
    importSummary: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[2],
    },
    listContent: {
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingBottom: ds.space[8],
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    entryCard: {
      padding: ds.semantic.layout.cardPadding,
      marginBottom: ds.space[3],
    },
    entryTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
    },
    entryBody: {
      ...ds.semantic.typography.body,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[2],
    },
    entryMeta: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: ds.space[3],
    },
    metaText: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
    },
    tagRow: {
      flexDirection: 'row' as const,
      gap: ds.space[2],
    },
    tagText: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.intent.primary.solid,
    },
    commentButton: {
      marginTop: ds.space[3],
    },
    loadingContainer: {
      flex: 1,
      padding: ds.semantic.layout.screenPadding,
      gap: ds.space[3],
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: ds.space[8],
    },
    errorCard: {
      padding: ds.semantic.layout.sectionGap,
      width: '100%' as const,
    },
    errorTitle: {
      ...ds.typography.h3,
      color: ds.semantic.intent.alert.solid,
      marginBottom: ds.space[2],
      textAlign: 'center' as const,
    },
    errorBody: {
      ...ds.semantic.typography.body,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
    },
    retryButton: {
      marginTop: ds.space[3],
    },
  }) as const;
