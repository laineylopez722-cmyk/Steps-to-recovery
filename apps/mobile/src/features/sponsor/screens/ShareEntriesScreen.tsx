/**
 * Share Entries Screen
 * Select journal entries and generate sponsor share payloads
 */

import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, View, Text, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { Card, Button, TextArea, Modal } from '../../../design-system';
import { useAuth } from '../../../contexts/AuthContext';
import { useJournalEntries } from '../../journal/hooks/useJournalEntries';
import { useSponsorConnections, useSponsorSharedEntries } from '../hooks';
import type { JournalEntryDecrypted } from '@/shared';
import type { ProfileStackParamList } from '../../../navigation/types';

type ShareRoute = RouteProp<ProfileStackParamList, 'ShareEntries'>;

export function ShareEntriesScreen(): React.ReactElement {
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
    try {
      const payloads = await shareEntries(mySponsor.id, selectedEntries, user?.user_metadata?.name);
      const bundle = payloads.join('\n');
      setShareBundle(bundle);
      setShareModalVisible(true);
    } catch {
      Alert.alert('Share Failed', 'Could not prepare entries for sharing. Please try again.');
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!shareBundle) return;
    try {
      await Clipboard.setStringAsync(shareBundle);
    } catch {
      Alert.alert('Copy Failed', 'Could not copy to clipboard.');
    }
  };

  const handleShareBundle = async (): Promise<void> => {
    if (!shareBundle) return;
    try {
      await Share.share({ message: shareBundle });
    } catch {
      // User cancelled share sheet — no error needed
    }
  };

  const renderItem = ({ item, index }: { item: JournalEntryDecrypted; index: number }): React.ReactElement => {
    const isSelected = selectedIds.has(item.id);
    return (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
        <Card
          variant="interactive"
          style={[styles.entryCard, isSelected && styles.entryCardSelected]}
        >
          <Button
            title={isSelected ? 'Selected' : 'Select'}
            onPress={() => toggleSelection(item.id)}
            variant={isSelected ? 'primary' : 'outline'}
            size="small"
            accessibilityLabel={isSelected ? 'Deselect entry' : 'Select entry'}
          />
          <View style={styles.entryContent}>
            <Text style={styles.entryTitle}>{item.title || 'Untitled Entry'}</Text>
            <Text numberOfLines={2} style={styles.entryBody}>
              {item.body}
            </Text>
            <Text style={styles.entryDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </Card>
      </Animated.View>
    );
  };

  if (!mySponsor) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="account-alert"
            size={48}
            color={styles.mutedIcon.color}
            importantForAccessibility="no"
            accessibilityElementsHidden
          />
          <Text style={styles.emptyText}>Connect a sponsor to share entries.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No journal entries available yet.</Text>
          }
          accessibilityRole="list"
          accessibilityLabel="Journal entries list for sharing"
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Text style={styles.footerCount}>Selected: {selectedEntries.length}</Text>
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

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    listContent: {
      padding: ds.semantic.layout.screenPadding,
      paddingBottom: 120,
      gap: ds.space[3],
    },
    entryCard: {
      padding: ds.space[3],
      gap: ds.space[2],
    },
    entryCardSelected: {
      borderColor: ds.semantic.intent.primary.solid,
    },
    entryContent: {
      marginTop: ds.space[2],
      gap: ds.space[2],
    },
    entryTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
    },
    entryBody: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
    },
    entryDate: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
    },
    footer: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      padding: ds.space[4],
      borderTopWidth: 1,
      borderTopColor: ds.semantic.surface.overlay,
      backgroundColor: ds.semantic.surface.card,
      gap: ds.space[2],
    },
    footerCount: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: ds.semantic.layout.screenPadding,
    },
    emptyText: {
      ...ds.semantic.typography.body,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[3],
    },
    mutedIcon: {
      color: ds.semantic.text.muted,
    },
  }) as const;
