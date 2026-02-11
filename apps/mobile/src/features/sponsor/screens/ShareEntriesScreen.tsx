/**
 * Share Entries Screen
 * Select journal entries and generate sponsor share payloads
 */

import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, View, Text, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, Card, Button, TextArea, Modal } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { useJournalEntries } from '../../journal/hooks/useJournalEntries';
import { useSponsorConnections, useSponsorSharedEntries } from '../hooks';
import type { JournalEntryDecrypted } from '@recovery/shared';
import type { ProfileStackParamList } from '../../../navigation/types';

type ShareRoute = RouteProp<ProfileStackParamList, 'ShareEntries'>;

export function ShareEntriesScreen(): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const route = useRoute<ShareRoute>();
  const preselectId = route.params?.entryId;
  const { entries, isLoading } = useJournalEntries(userId);
  const { mySponsor } = useSponsorConnections(userId);
  const { shareEntries } = useSponsorSharedEntries(userId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareBundle, setShareBundle] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    if (preselectId) {
      setSelectedIds(new Set([preselectId]));
    }
  }, [preselectId]);

  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedIds.has(entry.id)),
    [entries, selectedIds],
  );

  const toggleSelection = (entryId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleShare = async (): Promise<void> => {
    if (!mySponsor || selectedEntries.length === 0) return;
    const payloads = await shareEntries(mySponsor.id, selectedEntries, user?.user_metadata?.name);
    const bundle = payloads.join('\n');
    setShareBundle(bundle);
    setShareModalVisible(true);
  };

  const handleCopy = async (): Promise<void> => {
    if (!shareBundle) return;
    await Clipboard.setStringAsync(shareBundle);
  };

  const handleShareBundle = async (): Promise<void> => {
    if (!shareBundle) return;
    await Share.share({ message: shareBundle });
  };

  const renderItem = ({ item }: { item: JournalEntryDecrypted }): React.ReactElement => {
    const isSelected = selectedIds.has(item.id);
    return (
      <Card
        variant="interactive"
        style={[styles.entryCard, isSelected && { borderColor: theme.colors.primary }]}
      >
        <Button
          title={isSelected ? 'Selected' : 'Select'}
          onPress={() => toggleSelection(item.id)}
          variant={isSelected ? 'primary' : 'outline'}
          size="small"
          accessibilityLabel={isSelected ? 'Deselect entry' : 'Select entry'}
        />
        <View style={styles.entryContent}>
          <Text style={[theme.typography.title3, { color: theme.colors.text }]}>
            {item.title || 'Untitled Entry'}
          </Text>
          <Text
            numberOfLines={2}
            style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}
          >
            {item.body}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    );
  };

  if (!mySponsor) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="account-alert" size={48} color={theme.colors.muted} />
          <Text
            style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12 }]}
          >
            Connect a sponsor to share entries.
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
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          ListEmptyComponent={
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              No journal entries available yet.
            </Text>
          }
          accessibilityRole="list"
          accessibilityLabel="Journal entries list for sharing"
          // Performance optimizations
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Selected: {selectedEntries.length}
          </Text>
          <Button
            title="Share Selected"
            onPress={handleShare}
            variant="primary"
            size="large"
            disabled={selectedEntries.length === 0}
            accessibilityLabel="Share selected entries"
          />
        </View>
      </SafeAreaView>

      <Modal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        title="Share Payload"
        message="Send this payload to your sponsor. They will import it on their device."
        variant="center"
        actions={[
          {
            title: 'Copy',
            onPress: handleCopy,
            variant: 'outline',
            accessibilityLabel: 'Copy share payload',
          },
          {
            title: 'Share',
            onPress: handleShareBundle,
            variant: 'primary',
            accessibilityLabel: 'Share payload',
          },
        ]}
      >
        <TextArea
          label=""
          value={shareBundle}
          editable={false}
          minHeight={140}
          accessibilityLabel="Share payload"
        />
      </Modal>
    </>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
  },
  entryCard: {
    padding: 12,
    gap: 8,
  },
  entryContent: {
    marginTop: 8,
    gap: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
    backgroundColor: ds.semantic.surface.card,
    gap: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
} as const);
