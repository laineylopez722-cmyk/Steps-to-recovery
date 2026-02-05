import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GlassListItem } from '../../../design-system/components/GlassListItem';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useJournalEntries, useDeleteJournalEntry } from '../hooks/useJournalEntries';
import { ShareEntryModal } from '../components/ShareEntryModal';
import type { JournalEntryDecrypted } from '@recovery/shared/src/types/models';
import { hapticSuccess, hapticWarning } from '../../../utils/haptics';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

interface JournalListScreenModernProps {
  userId: string;
}

export function JournalListScreenModern({ userId }: JournalListScreenModernProps): React.ReactElement {
  const navigation = useNavigation();
  const { entries, isLoading, refetch } = useJournalEntries(userId);
  const { deleteEntry } = useDeleteJournalEntry(userId);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [entryToShare, setEntryToShare] = useState<JournalEntryDecrypted | null>(null);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter((entry) =>
      entry.title?.toLowerCase().includes(query) ||
      entry.body.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  const handleNewEntry = () => {
    navigation.navigate('JournalEditor', { userId, mode: 'create' } as any);
  };

  const handleEntryPress = (entry: JournalEntryDecrypted) => {
    navigation.navigate('JournalEditor', { userId, mode: 'edit', entryId: entry.id } as any);
  };

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    try {
      await deleteEntry?.(entryId);
      hapticSuccess();
    } catch {
      hapticWarning();
    }
  }, [deleteEntry]);

  const handleShareEntry = useCallback((entry: JournalEntryDecrypted) => {
    setEntryToShare(entry);
    setShareModalVisible(true);
  }, []);

  const handleShareSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getPreviewText = (body: string) => {
    return body.replace(/\n/g, ' ').slice(0, 100) + (body.length > 100 ? '...' : '');
  };

  const getMoodColor = (mood: number | null) => {
    if (!mood) return darkAccent.textSubtle;
    const colors = ['#EF4444', '#F59E0B', '#6B7280', '#10B981', '#3B82F6'];
    return colors[mood - 1] || darkAccent.textSubtle;
  };

  const renderItem = ({ item, index }: { item: JournalEntryDecrypted; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
      <GlassListItem
        title={item.title || 'Untitled Entry'}
        subtitle={formatDate(item.created_at)}
        description={getPreviewText(item.body)}
        icon="book"
        iconColor={getMoodColor(item.mood)}
        onPress={() => handleEntryPress(item)}
        accessibilityLabel={`Journal entry: ${item.title || 'Untitled'}, ${formatDate(item.created_at)}`}
        accessibilityHint="Tap to view and edit this entry"
        rightElement={
          <View style={styles.entryMeta}>
            {item.tags.length > 0 && (
              <View style={styles.tagBadge} accessible={false}>
                <Text style={styles.tagText}>{item.tags[0]}</Text>
                {item.tags.length > 1 && (
                  <Text style={styles.tagMore}>+{item.tags.length - 1}</Text>
                )}
              </View>
            )}
            <Pressable
              onPress={() => handleShareEntry(item)}
              hitSlop={8}
              accessibilityLabel="Share entry with sponsor"
              accessibilityRole="button"
              accessibilityHint="Opens share dialog to share this entry with your sponsor"
              style={styles.shareButton}
            >
              <MaterialIcons name="share" size={20} color={darkAccent.primary} />
            </Pressable>
            <MaterialIcons name="chevron-right" size={24} color={darkAccent.textSubtle} accessible={false} />
          </View>
        }
      />
    </Animated.View>
  );

  const renderEmpty = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="auto-stories" size={48} color={darkAccent.primary} accessible={false} />
      </View>
      <Text 
        style={styles.emptyTitle}
        accessibilityRole="header"
      >
        {searchQuery ? 'No entries found' : 'Your Journal'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery 
          ? `No entries match "${searchQuery}"`
          : 'Start writing to track your thoughts, feelings, and progress on your recovery journey.'
        }
      </Text>
      {!searchQuery && (
        <GradientButton
          title="Write First Entry"
          variant="primary"
          size="md"
          onPress={handleNewEntry}
          style={styles.emptyButton}
          accessibilityLabel="Write your first journal entry"
          accessibilityRole="button"
          accessibilityHint="Opens the journal editor"
        />
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Header with Search */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header" accessibilityLabel="Journal">Journal</Text>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={darkAccent.textSubtle} style={styles.searchIcon} accessible={false} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search entries..."
              placeholderTextColor={darkAccent.textSubtle}
              style={styles.searchInput}
              accessibilityLabel="Search journal entries"
              accessibilityRole="search"
              accessibilityHint="Type to filter entries by title, content, or tags"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                accessibilityHint="Clears the search text"
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={darkAccent.textSubtle}
                  accessible={false}
                />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Stats Summary */}
        {!searchQuery && entries.length > 0 && (
          <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
            <GlassCard intensity="light" style={styles.statCard}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </GlassCard>
            <GlassCard intensity="light" style={styles.statCard}>
              <Text style={styles.statValue}>
                {new Set(entries.flatMap(e => e.tags)).size}
              </Text>
              <Text style={styles.statLabel}>Tags</Text>
            </GlassCard>
            <GlassCard intensity="light" style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatDate(entries[0]?.created_at || '')}
              </Text>
              <Text style={styles.statLabel}>Latest</Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Entries List */}
        <AnimatedFlashList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={renderEmpty}
          estimatedItemSize={100}
          showsVerticalScrollIndicator={false}
        />

        {/* Floating Action Button */}
        <View style={styles.fabContainer}>
          <GradientButton
            title="New Entry"
            variant="primary"
            size="lg"
            icon={<MaterialIcons name="add" size={20} color="#FFF" />}
            iconPosition="left"
            onPress={handleNewEntry}
            fullWidth
            accessibilityLabel="Create new journal entry"
            accessibilityHint="Opens the journal editor to write a new entry"
          />
        </View>
      </SafeAreaView>

      {/* Share Entry Modal */}
      <ShareEntryModal
        visible={shareModalVisible}
        entry={entryToShare}
        onClose={() => setShareModalVisible(false)}
        onSuccess={handleShareSuccess}
      />
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
  header: {
    padding: spacing[3],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    ...typography.h1,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: darkAccent.border,
  },
  searchIcon: {
    marginRight: spacing[1.5],
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: darkAccent.text,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[3],
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[2],
  },
  statValue: {
    ...typography.h3,
    color: darkAccent.text,
  },
  statLabel: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  listContent: {
    padding: spacing[2],
    paddingBottom: 100,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  shareButton: {
    padding: spacing[1],
    borderRadius: radius.sm,
    backgroundColor: `${darkAccent.primary}15`,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${darkAccent.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  tagText: {
    ...typography.caption,
    color: darkAccent.primaryLight,
    fontWeight: '600',
  },
  tagMore: {
    ...typography.caption,
    color: darkAccent.textSubtle,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    marginTop: spacing[8],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius['2xl'],
    backgroundColor: `${darkAccent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  emptyTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  emptyDescription: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginBottom: spacing[4],
    maxWidth: 280,
  },
  emptyButton: {
    minWidth: 160,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[3],
    right: spacing[3],
  },
});
