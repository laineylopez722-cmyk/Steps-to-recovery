import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInRight, FadeInDown, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { JournalCard } from '../components/JournalCard';
import { useJournalEntries, useDeleteJournalEntry } from '../hooks/useJournalEntries';
import type { JournalEntryDecrypted } from '@recovery/shared/src/types/models';
import {
  useTheme,
  FloatingActionButton,
  Input,
  EmptyState,
  SwipeableListItem,
  ContextMenu,
} from '../../../design-system';
import type { SwipeAction, ContextMenuItem } from '../../../design-system';
import { hapticSuccess } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';

interface JournalListScreenProps {
  userId: string;
}

// Stagger delay calculation (max 300ms total delay)
const getStaggerDelay = (index: number): number => Math.min(index * 50, 300);

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
    // TODO: Implement share with sponsor
    logger.debug('Share entry:', { entryId: entry.id });
  }, []);

  // Swipe actions for each item
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

  // Context menu items for long press
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
      entering={FadeInRight.delay(getStaggerDelay(index)).springify().damping(15)}
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
    <Animated.View entering={FadeInDown.delay(200).springify()}>
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Animated.View entering={FadeInDown.duration(300)} style={styles.searchContainer}>
        <Input
          label=""
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search entries..."
          leftIcon={<MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />}
          containerStyle={styles.searchInputContainer}
          accessibilityLabel="Search journal entries"
          accessibilityRole="search"
        />
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
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
          estimatedItemSize={180}
        />
      )}

      <FloatingActionButton
        icon={<MaterialIcons name="add" size={24} color="#FFFFFF" />}
        label="New Entry"
        variant="primary"
        onPress={handleNewEntry}
        accessibilityLabel="Create new journal entry"
        accessibilityRole="button"
        accessibilityHint="Opens the journal editor to create a new entry"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
});
