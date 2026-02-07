/**
 * Journal List Screen - Clean Dark Design
 * 
 * Features:
 * - Clean search bar
 * - Animated list items
 * - Skeleton loading
 * - Header with new entry button (replaces FAB)
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import type { ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { JournalCard } from '../components/JournalCard';
import { useJournalEntries, useDeleteJournalEntry } from '../hooks/useJournalEntries';
import type { JournalEntryDecrypted } from '@recovery/shared';
import {
  useTheme,
  Input,
  EmptyState,
  SwipeableListItem,
  ContextMenu,
  ScreenAnimations,
  SkeletonList,
  GlassCard,
} from '../../../design-system';
import type { SwipeAction, ContextMenuItem } from '../../../design-system';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import Animated from 'react-native-reanimated';
import { hapticSuccess } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';

interface JournalListScreenProps {
  userId: string;
}

export function JournalListScreen({ userId }: JournalListScreenProps): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation();
  const { entries, isLoading, refetch } = useJournalEntries(userId);
  const { deleteEntry } = useDeleteJournalEntry(userId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.title?.toLowerCase().includes(query) ||
      entry.body.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const handleNewEntry = (): void => {
    (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)(
      'JournalEditor',
      { userId, mode: 'create' },
    );
  };

  const handleEntryPress = (entry: JournalEntryDecrypted): void => {
    (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)(
      'JournalEditor',
      { userId, mode: 'edit', entryId: entry.id },
    );
  };

  const handleDeleteEntry = useCallback(
    async (entryId: string): Promise<void> => {
      try {
        await deleteEntry?.(entryId);
        hapticSuccess();
      } catch (_error) {
        // Error handled by hook
      }
    },
    [deleteEntry],
  );

  const handleShareEntry = useCallback((entry: JournalEntryDecrypted): void => {
    logger.debug('Share entry:', { entryId: entry.id });
  }, []);

  const getRightActions = useCallback(
    (entry: JournalEntryDecrypted): SwipeAction[] => [
      {
        key: 'delete',
        icon: <Feather name="trash-2" size={20} color="#FFFFFF" />,
        label: 'Delete',
        backgroundColor: theme.colors.danger,
        onPress: () => handleDeleteEntry(entry.id),
      },
    ],
    [theme.colors.danger, handleDeleteEntry],
  );

  const getLeftActions = useCallback(
    (entry: JournalEntryDecrypted): SwipeAction[] => [
      {
        key: 'share',
        icon: <Feather name="share" size={20} color="#FFFFFF" />,
        label: 'Share',
        backgroundColor: theme.colors.primary,
        onPress: () => handleShareEntry(entry),
      },
    ],
    [theme.colors.primary, handleShareEntry],
  );

  const getContextMenuItems = useCallback(
    (entry: JournalEntryDecrypted): ContextMenuItem[] => [
      {
        key: 'edit',
        label: 'Edit Entry',
        icon: <Feather name="edit-2" size={18} color={theme.colors.text} />,
        onPress: () => handleEntryPress(entry),
      },
      {
        key: 'share',
        label: 'Share with Sponsor',
        icon: <Feather name="share" size={18} color={theme.colors.text} />,
        onPress: () => handleShareEntry(entry),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <Feather name="trash-2" size={18} color={theme.colors.danger} />,
        destructive: true,
        onPress: () => handleDeleteEntry(entry.id),
      },
    ],
    [theme.colors.text, theme.colors.danger, handleEntryPress, handleShareEntry, handleDeleteEntry],
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: JournalEntryDecrypted;
    index: number;
  }): React.ReactElement => (
    <Animated.View
      entering={ScreenAnimations.item(index)}
      layout={Layout.springify()}
    >
      <SwipeableListItem
        rightActions={getRightActions(item)}
        leftActions={getLeftActions(item)}
        onSwipeDelete={() => handleDeleteEntry(item.id)}
      >
        <ContextMenu items={getContextMenuItems(item)}>
          <JournalCard entry={item} onPress={() => handleEntryPress(item)} />
        </ContextMenu>
      </SwipeableListItem>
    </Animated.View>
  );

  const renderEmpty = (): React.ReactElement => (
    <Animated.View entering={ScreenAnimations.fadeDelayed(200)}>
      <EmptyState
        icon={searchQuery ? 'search-off' : 'book'}
        title={searchQuery ? 'No entries found' : 'Your thoughts are safe here'}
        description={
          searchQuery
            ? `No entries match "${searchQuery}". Try a different search term.`
            : 'Start your first journal entry to track your thoughts, feelings, and progress on your recovery journey.'
        }
        actionLabel={searchQuery ? undefined : 'Create Entry'}
        onAction={searchQuery ? undefined : handleNewEntry}
      />
    </Animated.View>
  );

  // Loading state with skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.skeletonContainer}>
          <SkeletonList items={5} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Header with Search and New Entry Button */}
        <Animated.View entering={ScreenAnimations.entrance} style={styles.header}>
          <View style={styles.searchContainer}>
            <GlassCard intensity="subtle" style={styles.searchCard}>
              <Input
                label=""
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search your entries..."
                leftIcon={<MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />}
                containerStyle={styles.searchInputContainer}
                accessibilityLabel="Search journal entries"
                accessibilityRole="search"
              />
            </GlassCard>
          </View>
          
          {/* New Entry Button - replaces FAB */}
          <TouchableOpacity
            onPress={handleNewEntry}
            style={styles.newEntryButton}
            accessibilityLabel="Create new journal entry"
            accessibilityRole="button"
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        <FlashList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={renderEmpty}
          accessibilityRole="list"
          accessibilityLabel="Journal entries list"
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchCard: {
    padding: 12,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  newEntryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: aestheticColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow
    shadowColor: aestheticColors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
