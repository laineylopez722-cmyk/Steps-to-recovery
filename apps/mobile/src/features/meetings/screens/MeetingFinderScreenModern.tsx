import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GlassListItem } from '../../../design-system/components/GlassListItem';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useNearbyMeetings } from '../hooks/useNearbyMeetings';
import type { MeetingWithDetails } from '../types/meeting';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const MEETING_TYPE_ICONS: Record<string, string> = {
  'AA': 'local-bar',
  'NA': 'medication',
  'OA': 'restaurant',
  'GA': 'casino',
  'SA': 'favorite',
  'default': 'groups',
};

const MEETING_TYPE_COLORS: Record<string, string> = {
  'AA': '#3B82F6',
  'NA': '#10B981',
  'OA': '#F59E0B',
  'GA': '#8B5CF6',
  'SA': '#EC4899',
  'default': '#6B7280',
};

export function MeetingFinderScreenModern(): React.ReactElement {
  const navigation = useNavigation();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const {
    meetings,
    isLoading,
    error,
    searchNearby,
    currentFilters,
    locationError,
    requestLocationPermission,
  } = useNearbyMeetings();

  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = useCallback(async () => {
    await searchNearby();
  }, [searchNearby]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await searchNearby();
    setIsRefreshing(false);
  }, [searchNearby]);

  const handleMeetingPress = useCallback((meeting: MeetingWithDetails) => {
    navigation.navigate('MeetingDetail', { meetingId: meeting.id } as any);
  }, [navigation]);

  const clearFilters = useCallback(() => {
    setSelectedType(null);
    setSelectedDay(null);
    setShowFilters(false);
  }, []);

  const filteredMeetings = meetings.filter((meeting) => {
    if (selectedType && meeting.meeting_type !== selectedType) return false;
    if (selectedDay && meeting.day_of_week !== selectedDay) return false;
    return true;
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderMeetingItem = ({ item, index }: { item: MeetingWithDetails; index: number }) => {
    const icon = MEETING_TYPE_ICONS[item.meeting_type] || MEETING_TYPE_ICONS.default;
    const color = MEETING_TYPE_COLORS[item.meeting_type] || MEETING_TYPE_COLORS.default;
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
        <GlassListItem
          title={item.name}
          subtitle={`${item.meeting_type} • ${formatTime(item.start_time)}`}
          description={`${item.location_name}${item.distance ? ` • ${formatDistance(item.distance)}` : ''}`}
          icon={icon}
          iconColor={color}
          onPress={() => handleMeetingPress(item)}
          rightElement={
            item.is_favorite ? (
              <MaterialIcons name="favorite" size={20} color={darkAccent.error} />
            ) : (
              <MaterialIcons name="favorite-border" size={20} color={darkAccent.textSubtle} />
            )
          }
        />
      </Animated.View>
    );
  };

  // Filter Modal
  if (showFilters) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.filterHeader}>
            <Pressable 
              onPress={() => setShowFilters(false)} 
              style={styles.closeButton}
              accessibilityLabel="Close filters"
              accessibilityRole="button"
              accessibilityHint="Closes the filter screen"
            >
              <MaterialIcons name="close" size={24} color={darkAccent.text} accessible={false} />
            </Pressable>
            <Text style={styles.filterTitle} accessibilityRole="header">Filter Meetings</Text>
            <Pressable 
              onPress={clearFilters}
              accessibilityLabel="Clear all filters"
              accessibilityRole="button"
              accessibilityHint="Removes all active filters"
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Meeting Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle} accessibilityRole="header">Meeting Type</Text>
              <View style={styles.filterOptions}>
                {['AA', 'NA', 'OA', 'GA'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(selectedType === type ? null : type)}
                    style={[
                      styles.filterChip,
                      selectedType === type && {
                        backgroundColor: MEETING_TYPE_COLORS[type],
                        borderColor: MEETING_TYPE_COLORS[type],
                      },
                    ]}
                    accessibilityLabel={`${type} meetings`}
                    accessibilityRole="button"
                    accessibilityHint={selectedType === type ? 'Deselect this meeting type' : 'Select this meeting type'}
                    accessibilityState={{ selected: selectedType === type }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedType === type && styles.filterChipTextActive,
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Day of Week */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle} accessibilityRole="header">Day</Text>
              <View style={styles.filterOptions}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(selectedDay === day ? null : day)}
                    style={[
                      styles.filterChip,
                      selectedDay === day && styles.filterChipActive,
                    ]}
                    accessibilityLabel={`${day} meetings`}
                    accessibilityRole="button"
                    accessibilityHint={selectedDay === day ? 'Deselect this day' : 'Select this day'}
                    accessibilityState={{ selected: selectedDay === day }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedDay === day && styles.filterChipTextActive,
                    ]}>
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <GradientButton
              title={`Show ${filteredMeetings.length} Meetings`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => setShowFilters(false)}
              accessibilityLabel={`Show ${filteredMeetings.length} filtered meetings`}
              accessibilityHint="Applies filters and returns to meeting list"
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Loading state
  if (isLoading && meetings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={darkAccent.primary} />
      </View>
    );
  }

  // Error state
  if (error && meetings.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color={darkAccent.error} accessible={false} />
          <Text style={styles.errorTitle}>Unable to find meetings</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <GradientButton 
            title="Try Again" 
            variant="primary" 
            onPress={handleSearch}
            accessibilityLabel="Try again"
            accessibilityHint="Attempts to search for meetings again"
          />
        </View>
      </View>
    );
  }

  // Location permission state
  if (locationError && meetings.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
        <View style={styles.centerContainer}>
          <MaterialIcons name="location-off" size={48} color={darkAccent.textMuted} accessible={false} />
          <Text style={styles.errorTitle}>Location Access Needed</Text>
          <Text style={styles.errorDescription}>{locationError}</Text>
          <GradientButton 
            title="Enable Location" 
            variant="primary" 
            onPress={requestLocationPermission}
            accessibilityLabel="Enable location access"
            accessibilityHint="Opens location permission settings"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">Find Meetings</Text>
          <Pressable 
            onPress={() => setShowFilters(true)} 
            style={styles.filterButton}
            accessibilityLabel="Filter meetings"
            accessibilityRole="button"
            accessibilityHint="Opens meeting filter options"
          >
            <MaterialIcons name="tune" size={24} color={darkAccent.text} accessible={false} />
            {(selectedType || selectedDay) && (
              <View 
                style={styles.filterBadge} 
                accessibilityLabel="Filters active"
                accessibilityRole="image"
              />
            )}
          </Pressable>
        </Animated.View>

        {/* Active Filters */}
        {(selectedType || selectedDay) && (
          <Animated.View entering={FadeInUp} style={styles.activeFilters}>
            {selectedType && (
              <View style={[styles.activeFilterChip, { backgroundColor: MEETING_TYPE_COLORS[selectedType] }]}>
                <Text style={styles.activeFilterText}>{selectedType}</Text>
                <Pressable 
                  onPress={() => setSelectedType(null)}
                  accessibilityLabel={`Remove ${selectedType} filter`}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="close" size={14} color="#FFF" accessible={false} />
                </Pressable>
              </View>
            )}
            {selectedDay && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{selectedDay}</Text>
                <Pressable 
                  onPress={() => setSelectedDay(null)}
                  accessibilityLabel={`Remove ${selectedDay} filter`}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="close" size={14} color="#FFF" accessible={false} />
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}

        {/* Results Count */}
        <Text style={styles.resultsText}>
          {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} nearby
        </Text>

        {/* Meetings List */}
        <AnimatedFlashList
          data={filteredMeetings}
          renderItem={renderMeetingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={darkAccent.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color={darkAccent.textMuted} accessible={false} />
              <Text style={styles.emptyTitle}>No meetings found</Text>
              <Text style={styles.emptyDescription}>Try adjusting your filters</Text>
              <GradientButton 
                title="Clear Filters" 
                variant="ghost" 
                onPress={clearFilters}
                accessibilityLabel="Clear all filters"
                accessibilityHint="Removes all filters to show all meetings"
              />
            </View>
          }
          estimatedItemSize={100}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

// Need to import ScrollView for the filter modal
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    ...typography.h1,
    color: darkAccent.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: darkAccent.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkAccent.primary,
  },
  activeFilters: {
    flexDirection: 'row',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  activeFilterText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '600',
  },
  resultsText: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
  },
  listContent: {
    padding: spacing[2],
    paddingBottom: spacing[4],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  emptyTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  emptyDescription: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  errorDescription: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  // Filter Modal Styles
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: darkAccent.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: darkAccent.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTitle: {
    ...typography.h3,
    color: darkAccent.text,
  },
  clearText: {
    ...typography.body,
    color: darkAccent.primary,
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
    padding: spacing[3],
  },
  filterSection: {
    marginBottom: spacing[4],
  },
  filterSectionTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: darkAccent.surfaceHigh,
    borderWidth: 1,
    borderColor: darkAccent.border,
  },
  filterChipActive: {
    backgroundColor: darkAccent.primary,
    borderColor: darkAccent.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: darkAccent.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  filterFooter: {
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
    backgroundColor: darkAccent.background,
  },
});
