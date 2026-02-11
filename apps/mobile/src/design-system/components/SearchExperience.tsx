import React, { useState, useEffect, useCallback, type ReactElement } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { darkAccent, radius, spacing, typography } from '../tokens/modern';
import { useHaptics } from '../../hooks/useHaptics';
import { useThemedStyles, type DS } from '../hooks/useThemedStyles';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'tag';
}

interface SearchExperienceProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  suggestions?: SearchSuggestion[];
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  filters?: React.ReactNode;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export function SearchExperience({
  placeholder = 'Search...',
  value,
  onChangeText,
  onSubmit,
  suggestions = [],
  onSuggestionPress,
  filters,
  showFilters,
  onToggleFilters,
}: SearchExperienceProps): ReactElement {
  const styles = useThemedStyles(createStyles);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { light } = useHaptics();

  // Load recent searches on mount
  useEffect(() => {
    // TODO: Load from storage
    setRecentSearches(['gratitude', 'step 4', 'meeting notes']);
  }, []);

  const handleClear = async () => {
    await light();
    onChangeText('');
  };

  const handleSuggestionPress = async (suggestion: SearchSuggestion) => {
    await light();
    onChangeText(suggestion.text);
    onSuggestionPress?.(suggestion);
  };

  const saveSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      return [query, ...filtered].slice(0, 5);
    });
  }, []);

  const handleSubmit = () => {
    saveSearch(value);
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <GlassCard intensity={isFocused ? 'medium' : 'light'} style={styles.searchBar}>
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={22} color={darkAccent.textMuted} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor={darkAccent.textSubtle}
            style={styles.input}
            returnKeyType="search"
          />
          {value.length > 0 && (
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <MaterialIcons name="close" size={18} color={darkAccent.textMuted} />
            </Pressable>
          )}
          {onToggleFilters && (
            <Pressable onPress={onToggleFilters} style={styles.filterButton}>
              <MaterialIcons
                name="tune"
                size={22}
                color={showFilters ? darkAccent.primary : darkAccent.textMuted}
              />
            </Pressable>
          )}
        </View>
      </GlassCard>

      {/* Filters */}
      {showFilters && filters && (
        <Animated.View entering={FadeInUp} style={styles.filtersContainer}>
          {filters}
        </Animated.View>
      )}

      {/* Suggestions Dropdown */}
      {isFocused && value.length === 0 && recentSearches.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.suggestionsContainer}>
          <GlassCard intensity="heavy" style={styles.suggestionsCard}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsTitle}>Recent Searches</Text>
              <Pressable onPress={() => setRecentSearches([])}>
                <Text style={styles.clearAll}>Clear All</Text>
              </Pressable>
            </View>
            {recentSearches.map((search, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  handleSuggestionPress({ id: String(index), text: search, type: 'recent' })
                }
                style={styles.suggestionItem}
              >
                <MaterialIcons name="history" size={18} color={darkAccent.textMuted} />
                <Text style={styles.suggestionText}>{search}</Text>
                <MaterialIcons name="arrow-outward" size={16} color={darkAccent.textSubtle} />
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>
      )}

      {/* Live Suggestions */}
      {value.length > 0 && suggestions && suggestions.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.suggestionsContainer}>
          <GlassCard intensity="heavy" style={styles.suggestionsCard}>
            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            {suggestions.map((suggestion: SearchSuggestion) => (
              <Pressable
                key={suggestion.id}
                onPress={() => handleSuggestionPress(suggestion)}
                style={styles.suggestionItem}
              >
                <MaterialIcons
                  name={suggestion.type === 'tag' ? 'label' : 'trending-up'}
                  size={18}
                  color={darkAccent.textMuted}
                />
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>
      )}
    </View>
  );
}

// Filter Chip component
interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  count?: number;
}

export function FilterChip({
  label,
  isSelected,
  onPress,
  count,
}: FilterChipProps): ReactElement {
  const styles = useThemedStyles(createStyles);
  const scale = useSharedValue(1);

  const handlePress = async () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.chip, isSelected && styles.chipSelected, animatedStyle]}>
        <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{label}</Text>
        {count !== undefined && (
          <View style={[styles.chipCount, isSelected && styles.chipCountSelected]}>
            <Text style={[styles.chipCountText, isSelected && styles.chipCountTextSelected]}>
              {count}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Search Results Header
interface SearchResultsHeaderProps {
  query: string;
  resultCount: number;
  onClear: () => void;
}

export function SearchResultsHeader({
  query,
  resultCount,
  onClear,
}: SearchResultsHeaderProps): ReactElement {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.resultsHeader}>
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsQuery}>&ldquo;{query}&rdquo;</Text>
        <Text style={styles.resultsCount}>{resultCount} results</Text>
      </View>
      <Pressable onPress={onClear} style={styles.clearResults}>
        <Text style={styles.clearResultsText}>Clear</Text>
      </Pressable>
    </View>
  );
}

// Highlighted Text (for search results)
interface HighlightedTextProps {
  text: string;
  highlight: string;
  style?: StyleProp<TextStyle>;
}

export function HighlightedText({
  text,
  highlight,
  style,
      }: HighlightedTextProps): ReactElement {
  const styles = useThemedStyles(createStyles);
  if (!highlight.trim()) {
    return <Text style={style}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={index} style={styles.highlight}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

const createStyles = (ds: DS) => StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  searchBar: {
    padding: spacing[2],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  input: {
    flex: 1,
    ...typography.body,
    color: darkAccent.text,
    padding: 0,
    height: 40,
  },
  clearButton: {
    padding: spacing[1],
  },
  filterButton: {
    padding: spacing[1],
  },
  filtersContainer: {
    marginTop: spacing[2],
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  suggestionsCard: {
    padding: spacing[2],
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  suggestionsTitle: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAll: {
    ...typography.bodySmall,
    color: darkAccent.primary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1.5],
  },
  suggestionText: {
    ...typography.body,
    color: darkAccent.text,
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: darkAccent.surfaceHigh,
    borderWidth: 1,
    borderColor: darkAccent.border,
  },
  chipSelected: {
    backgroundColor: darkAccent.primary,
    borderColor: darkAccent.primary,
  },
  chipLabel: {
    ...typography.bodySmall,
    color: darkAccent.text,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: ds.semantic.text.onDark,
    fontWeight: '600',
  },
  chipCount: {
    backgroundColor: darkAccent.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  chipCountSelected: {
    backgroundColor: ds.colors.bgSecondary,
  },
  chipCountText: {
    ...typography.caption,
    color: darkAccent.textMuted,
    fontWeight: '600',
  },
  chipCountTextSelected: {
    color: ds.semantic.text.onDark,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    paddingBottom: spacing[2],
  },
  resultsInfo: {
    flex: 1,
  },
  resultsQuery: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
  },
  resultsCount: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  clearResults: {
    padding: spacing[1],
  },
  clearResultsText: {
    ...typography.bodySmall,
    color: darkAccent.primary,
    fontWeight: '600',
  },
  highlight: {
    backgroundColor: ds.colors.accentMuted,
    color: darkAccent.text,
    fontWeight: '600',
  },
});
