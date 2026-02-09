/**
 * Journal Tab Screen
 * Track thoughts, moods, and recovery journey - matches reference site design
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useJournalStore } from '../../lib/store';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

// Sort options
type SortOption = 'newest' | 'oldest';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Journal entry card
const JournalEntryCard = memo(function JournalEntryCard({
  entry,
  onPress,
  index,
}: {
  entry: {
    id: string;
    type: string;
    content: string;
    moodBefore?: number;
    moodAfter?: number;
    cravingLevel?: number;
    emotionTags: string[];
    createdAt: Date;
    stepNumber?: number;
  };
  onPress: () => void;
  index: number;
}) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (): FeatherIconName => {
    switch (entry.type) {
      case 'step-work': return 'book-open';
      case 'meeting-reflection': return 'users';
      case 'daily-checkin': return 'check-circle';
      default: return 'edit-3';
    }
  };

  const getTypeLabel = () => {
    switch (entry.type) {
      case 'step-work': return `Step ${entry.stepNumber || ''} Work`;
      case 'meeting-reflection': return 'Meeting Reflection';
      case 'daily-checkin': return 'Daily Check-in';
      default: return 'Journal Entry';
    }
  };

  // Check if entry has trigger/warning content
  const hasTrigger = entry.cravingLevel && entry.cravingLevel >= 7;

  return (
    <AnimatedTouchableOpacity
      entering={FadeInUp.delay(index * 50).springify()}
      layout={Layout.springify()}
      onPress={onPress}
      className="bg-navy-800/40 rounded-2xl p-4 mb-3 border border-surface-700/30"
      accessibilityRole="button"
      accessibilityLabel={`Journal entry from ${formatDate(entry.createdAt)}`}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-primary-500/20 p-2 rounded-lg">
            <Feather name={getTypeIcon()} size={16} color="#60a5fa" />
          </View>
          <View>
            <Text className="text-white font-medium">{getTypeLabel()}</Text>
            <Text className="text-surface-500 text-xs">{formatDate(entry.createdAt)}</Text>
          </View>
        </View>
        {hasTrigger && (
          <View className="bg-danger-500/20 px-2 py-1 rounded-full flex-row items-center gap-1">
            <Feather name="alert-triangle" size={12} color="#f87171" />
            <Text className="text-danger-400 text-xs">High craving</Text>
          </View>
        )}
      </View>

      <Text className="text-surface-300 text-sm" numberOfLines={3}>
        {entry.content || 'No content'}
      </Text>

      {/* Emotion tags */}
      {entry.emotionTags && entry.emotionTags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {entry.emotionTags.slice(0, 3).map((tag) => (
            <View key={tag} className="bg-surface-700/30 px-2 py-1 rounded-full">
              <Text className="text-surface-400 text-xs">{tag}</Text>
            </View>
          ))}
          {entry.emotionTags.length > 3 && (
            <Text className="text-surface-500 text-xs self-center">
              +{entry.emotionTags.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* Mood indicator */}
      {(entry.moodBefore || entry.moodAfter) && (
        <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-surface-700/30">
          <Feather name="activity" size={14} color="#64748b" />
          <Text className="text-surface-500 text-xs">
            Mood: {entry.moodBefore || entry.moodAfter}/10
          </Text>
          {entry.cravingLevel !== undefined && (
            <>
              <Text className="text-surface-600">•</Text>
              <Text className="text-surface-500 text-xs">
                Craving: {entry.cravingLevel}/10
              </Text>
            </>
          )}
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
});

// Empty state component
function EmptyState({ onCreateEntry }: { onCreateEntry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="bg-navy-800/40 p-6 rounded-full mb-6">
        <Feather name="edit-3" size={48} color="#64748b" />
      </View>
      <Text className="text-white text-xl font-semibold text-center mb-2">
        No journal entries yet
      </Text>
      <Text className="text-surface-400 text-center mb-6">
        Start documenting your recovery journey. Your thoughts and reflections are valuable.
      </Text>
      <TouchableOpacity
        onPress={onCreateEntry}
        className="bg-primary-500 py-3 px-6 rounded-xl"
      >
        <Text className="text-white font-semibold">Create your first entry</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const { entries, searchEntries } = useJournalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest' as SortOption);
  const [showTriggersOnly, setShowTriggersOnly] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = searchQuery ? searchEntries(searchQuery) : [...entries];

    // Filter triggers only
    if (showTriggersOnly) {
      result = result.filter(e => (e.cravingLevel ?? 0) >= 7);
    }

    // Sort
    result.sort((a: { createdAt: string | number | Date; }, b: { createdAt: string | number | Date; }) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [entries, searchQuery, sortOption, showTriggersOnly, searchEntries]);

  const handleNewEntry = useCallback(() => {
    router.push('/journal/new');
  }, [router]);

  const handleEntryPress = useCallback((id: string) => {
    router.push(`/journal/${id}` as Href);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      {/* Header */}
      <View className="px-4 pt-4 pb-4">
        <Text className="text-2xl font-bold text-white mb-1">Journal</Text>
        <Text className="text-surface-400">
          Track your thoughts, moods, and recovery journey
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center mt-4 gap-3">
          <View className="flex-1 flex-row items-center bg-navy-800/40 rounded-xl px-4 py-3 border border-surface-700/30">
            <Feather name="search" size={18} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search entries..."
              placeholderTextColor="#64748b"
              className="flex-1 ml-3 text-white"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleNewEntry}
            className="bg-primary-500 p-3 rounded-xl flex-row items-center gap-2"
            accessibilityLabel="Create new entry"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text className="text-white font-semibold">New Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Filters Row */}
        <View className="flex-row items-center gap-3 mt-3">
          {/* Sort Dropdown */}
          <View className="relative">
            <TouchableOpacity
              onPress={() => setShowSortDropdown(!showSortDropdown)}
              className="flex-row items-center gap-2 bg-navy-800/40 rounded-lg px-3 py-2 border border-surface-700/30"
            >
              <Feather name="sliders" size={14} color="#64748b" />
              <Text className="text-surface-300 text-sm">Sort:</Text>
              <Text className="text-white text-sm">{sortOption === 'newest' ? 'Newest' : 'Oldest'}</Text>
              <Feather name="chevron-down" size={14} color="#64748b" />
            </TouchableOpacity>

            {showSortDropdown && (
              <View className="absolute top-12 left-0 z-10 bg-navy-800 rounded-lg border border-surface-700/30 shadow-lg">
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortOption('newest');
                    setShowSortDropdown(false);
                  }}
                  className={`px-4 py-3 ${sortOption === 'newest' ? 'bg-primary-500/20' : ''}`}
                >
                  <Text className={`${sortOption === 'newest' ? 'text-primary-400' : 'text-surface-300'}`}>
                    Newest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortOption('oldest');
                    setShowSortDropdown(false);
                  }}
                  className={`px-4 py-3 ${sortOption === 'oldest' ? 'bg-primary-500/20' : ''}`}
                >
                  <Text className={`${sortOption === 'oldest' ? 'text-primary-400' : 'text-surface-300'}`}>
                    Oldest
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Triggers Filter */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTriggersOnly(!showTriggersOnly);
            }}
            className={`flex-row items-center gap-2 px-3 py-2 rounded-lg border ${showTriggersOnly
              ? 'bg-danger-500/20 border-danger-500/50'
              : 'bg-navy-800/40 border-surface-700/30'
              }`}
          >
            <Feather
              name="alert-triangle"
              size={14}
              color={showTriggersOnly ? '#f87171' : '#64748b'}
            />
            <Text className={showTriggersOnly ? 'text-danger-400 text-sm' : 'text-surface-300 text-sm'}>
              Triggers Only
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Journal Entries List */}
      {filteredEntries.length === 0 ? (
        <EmptyState onCreateEntry={handleNewEntry} />
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <JournalEntryCard
              entry={item}
              onPress={() => handleEntryPress(item.id)}
              index={index}
            />
          )}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}
