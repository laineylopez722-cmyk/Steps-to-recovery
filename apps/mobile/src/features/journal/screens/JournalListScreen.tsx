/**
 * Journal List - Apple Notes Style
 * 
 * Clean list with card-style entries.
 * Search bar in bottom toolbar.
 * Bold section headers.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { useJournalEntries, useDeleteJournalEntry } from '../hooks/useJournalEntries';
import { ds } from '../../../design-system/tokens/ds';
import { hapticLight } from '../../../utils/haptics';
import type { JournalEntryDecrypted } from '@recovery/shared';
import type { JournalStackParamList } from '../../../navigation/types';

interface Props {
  userId: string;
}

// Format time like "7:37 pm"
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
}

// Get preview text
function getPreview(entry: JournalEntryDecrypted): string {
  // If there's a body that's different from title, use it
  if (entry.body && entry.body !== entry.title) {
    const preview = entry.body.replace(/\n+/g, ' ').trim();
    if (preview.length <= 40) return preview;
    return preview.slice(0, 40).trim() + '...';
  }
  return 'No additional text';
}

// Get title
function getTitle(entry: JournalEntryDecrypted): string {
  if (entry.title) return entry.title;
  const firstLine = entry.body.split('\n')[0]?.trim();
  if (firstLine && firstLine.length <= 50) return firstLine;
  return 'New Entry';
}

// Entry Card Component - Apple Notes style
function EntryCard({ 
  entry, 
  onPress,
}: { 
  entry: JournalEntryDecrypted;
  onPress: () => void;
}) {
  const title = getTitle(entry);
  const preview = getPreview(entry);
  const time = formatTime(new Date(entry.created_at));
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.entryCard,
        pressed && styles.entryCardPressed,
      ]}
    >
      <Text style={styles.entryTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.entryMeta}>
        <Text style={styles.entryTime}>{time}</Text>
        <Text style={styles.entryPreview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
}

// Section Header
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// Empty State
function EmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <Animated.View 
      entering={FadeIn.delay(200).duration(400)} 
      style={styles.empty}
    >
      <Feather 
        name={isSearching ? 'search' : 'book-open'} 
        size={48} 
        color={ds.colors.textQuaternary} 
      />
      <Text style={styles.emptyTitle}>
        {isSearching ? 'No Results' : 'No Notes'}
      </Text>
      <Text style={styles.emptyText}>
        {isSearching 
          ? 'Try a different search'
          : 'Tap the compose button to create your first note'
        }
      </Text>
    </Animated.View>
  );
}

export function JournalListScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<JournalStackParamList>>();
  const insets = useSafeAreaInsets();
  const { entries, isLoading, refetch } = useJournalEntries(userId);
  useDeleteJournalEntry(userId);
  
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Filter entries by search
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    
    const query = search.toLowerCase();
    return entries.filter(entry => 
      entry.title?.toLowerCase().includes(query) ||
      entry.body.toLowerCase().includes(query)
    );
  }, [entries, search]);
  
  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { title: string; data: JournalEntryDecrypted[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayEntries: JournalEntryDecrypted[] = [];
    const yesterdayEntries: JournalEntryDecrypted[] = [];
    const thisWeekEntries: JournalEntryDecrypted[] = [];
    const olderEntries: JournalEntryDecrypted[] = [];
    
    for (const entry of filteredEntries) {
      const entryDate = new Date(entry.created_at);
      const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      
      if (entryDay.getTime() === today.getTime()) {
        todayEntries.push(entry);
      } else if (entryDay.getTime() === yesterday.getTime()) {
        yesterdayEntries.push(entry);
      } else if (entryDay.getTime() > weekAgo.getTime()) {
        thisWeekEntries.push(entry);
      } else {
        olderEntries.push(entry);
      }
    }
    
    if (todayEntries.length > 0) groups.push({ title: 'Today', data: todayEntries });
    if (yesterdayEntries.length > 0) groups.push({ title: 'Yesterday', data: yesterdayEntries });
    if (thisWeekEntries.length > 0) groups.push({ title: 'Previous 7 Days', data: thisWeekEntries });
    if (olderEntries.length > 0) groups.push({ title: 'Older', data: olderEntries });
    
    return groups;
  }, [filteredEntries]);
  
  // Flatten for FlatList
  type FlatListItem =
    | { type: 'header'; data: string; id: string }
    | { type: 'entry'; data: JournalEntryDecrypted; id: string };

  const flatData = useMemo(() => {
    const items: FlatListItem[] = [];
    for (const group of groupedEntries) {
      items.push({ type: 'header', data: group.title, id: `header-${group.title}` });
      for (const entry of group.data) {
        items.push({ type: 'entry', data: entry, id: entry.id });
      }
    }
    return items;
  }, [groupedEntries]);
  
  const handleNewEntry = () => {
    hapticLight();
    Keyboard.dismiss();
    navigation.navigate('JournalEditor', { mode: 'create' });
  };

  const handleEntryPress = (entry: JournalEntryDecrypted) => {
    Keyboard.dismiss();
    navigation.navigate('JournalEditor', { mode: 'edit', entryId: entry.id });
  };

  const renderItem = useCallback(({ item, index }: { item: FlatListItem; index: number }) => {
    if (item.type === 'header') {
      return <SectionHeader title={item.data} />;
    }
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).duration(300)}
        layout={Layout.springify()}
      >
        <EntryCard
          entry={item.data}
          onPress={() => handleEntryPress(item.data)}
        />
      </Animated.View>
    );
  }, []);
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          {/* Back button */}
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backBtnInner}>
              <Feather name="chevron-left" size={24} color={ds.colors.textPrimary} />
            </View>
          </Pressable>
          
          {/* Right actions */}
          <View style={styles.actionsPill}>
            <Pressable style={styles.actionBtn}>
              <Feather name="share" size={18} color={ds.colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <Feather name="more-horizontal" size={18} color={ds.colors.textPrimary} />
            </Pressable>
          </View>
        </Animated.View>
        
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Journal</Text>
          <View style={styles.subtitleRow}>
            <Feather name="lock" size={12} color={ds.colors.textTertiary} />
            <Text style={styles.subtitle}>End-to-end encrypted</Text>
            <Text style={styles.entryCount}>{filteredEntries.length} entries</Text>
          </View>
        </View>
        
        {/* List */}
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? <EmptyState isSearching={!!search} /> : null
          }
          refreshing={isLoading}
          onRefresh={refetch}
        />
        
        {/* Bottom Toolbar */}
        <View style={[styles.toolbar, { paddingBottom: insets.bottom || ds.space[4] }]}>
          {/* Search bar */}
          <View style={[
            styles.searchBar,
            isSearchFocused && styles.searchBarFocused,
          ]}>
            <Feather name="search" size={18} color={ds.colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search"
              placeholderTextColor={ds.colors.textQuaternary}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
            />
            <Pressable
              style={styles.micBtn}
              accessibilityLabel="Voice input"
              accessibilityRole="button"
              accessibilityHint="Activate voice input for search"
            >
              <Feather name="mic" size={18} color={ds.colors.textTertiary} />
            </Pressable>
          </View>

          {/* New note button */}
          <Pressable
            onPress={handleNewEntry}
            style={styles.newNoteBtn}
            accessibilityLabel="Create new journal entry"
            accessibilityRole="button"
          >
            <Feather name="edit-3" size={18} color={ds.colors.accent} />
            <Text style={styles.newNoteText}>New</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.space[4],
    paddingTop: ds.space[3],
    paddingBottom: ds.space[2],
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ds.colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsPill: {
    flexDirection: 'row',
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 20,
    paddingHorizontal: ds.space[2],
    paddingVertical: ds.space[2],
    gap: ds.space[1],
  },
  actionBtn: {
    width: 36,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Title
  titleContainer: {
    paddingHorizontal: ds.sizes.contentPadding,
    paddingTop: ds.space[3],
    paddingBottom: ds.space[4],
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: ds.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitleRow: {
    marginTop: ds.space[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
  },
  subtitle: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
  },
  entryCount: {
    ...ds.typography.micro,
    color: ds.colors.textQuaternary,
    marginLeft: 'auto',
  },
  
  // List
  listContent: {
    paddingHorizontal: ds.sizes.contentPadding,
    paddingBottom: ds.space[4],
  },
  
  // Section headers
  sectionHeader: {
    paddingTop: ds.space[4],
    paddingBottom: ds.space[2],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ds.colors.textPrimary,
  },
  
  // Entry card - Apple Notes style
  entryCard: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.md,
    padding: ds.space[4],
    marginBottom: ds.space[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderSubtle,
  },
  entryCardPressed: {
    backgroundColor: ds.colors.bgQuaternary,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ds.colors.textPrimary,
    marginBottom: ds.space[1],
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryTime: {
    ...ds.typography.bodySm,
    color: ds.colors.textTertiary,
    marginRight: ds.space[2],
  },
  entryPreview: {
    ...ds.typography.bodySm,
    color: ds.colors.textTertiary,
    flex: 1,
  },
  
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: ds.space[20],
  },
  emptyTitle: {
    ...ds.typography.h3,
    color: ds.colors.textSecondary,
    marginTop: ds.space[4],
  },
  emptyText: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
    marginTop: ds.space[2],
    textAlign: 'center',
    paddingHorizontal: ds.space[8],
  },
  
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.space[4],
    paddingTop: ds.space[3],
    backgroundColor: ds.colors.bgSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ds.colors.divider,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 12,
    paddingHorizontal: ds.space[3],
    height: 44,
    gap: ds.space[2],
  },
  searchBarFocused: {
    backgroundColor: ds.colors.bgQuaternary,
    borderWidth: 1,
    borderColor: ds.colors.accentMuted,
  },
  searchInput: {
    flex: 1,
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    height: 44,
  },
  micBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newNoteBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: ds.colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: ds.space[3],
    gap: ds.space[1],
  },
  newNoteText: {
    ...ds.typography.caption,
    color: ds.colors.accent,
    fontWeight: '700',
  },
});
