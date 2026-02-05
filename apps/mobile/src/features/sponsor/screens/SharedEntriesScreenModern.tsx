/**
 * Shared Entries Screen - Modern Version
 * View shared entries from a sponsee with modern UI
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Share as RNShare, Modal as RNModal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { SharedEntryCard } from '../components/SharedEntryCard';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useAuth } from '../../../contexts/AuthContext';
import { useSponsorConnections, useSponsorSharedEntries } from '../hooks';
import type { SharedEntryView } from '../hooks/useSponsorSharedEntries';
import type { ProfileStackParamList } from '../../../navigation/types';
import { hapticSuccess } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';

type RouteParams = RouteProp<ProfileStackParamList, 'SharedEntries'>;

export function SharedEntriesScreenModern(): React.ReactElement {
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { connectionId } = route.params;

  const { connections } = useSponsorConnections(userId);
  const { loadIncomingEntries, shareComment } = useSponsorSharedEntries(userId);
  const connection = connections.find((item) => item.id === connectionId);

  const [entries, setEntries] = useState<SharedEntryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Entry detail modal
  const [selectedEntry, setSelectedEntry] = useState<SharedEntryView | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchSharedEntries = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const data = await loadIncomingEntries(connectionId);
      setEntries(data);
    } catch (err) {
      logger.error('Failed to load shared entries', err);
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

  const handleEntryPress = useCallback((entry: SharedEntryView) => {
    setSelectedEntry(entry);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEntry(null);
    setCommentText('');
  }, []);

  const handleSendComment = useCallback(async () => {
    if (!selectedEntry || !commentText.trim()) return;

    try {
      setCommentLoading(true);
      const payload = await shareComment(
        connectionId,
        selectedEntry.entryId,
        commentText.trim(),
        user?.email
      );

      // Share via system
      await RNShare.share({
        message: `Sponsor Comment\n\nPaste this code into your Steps to Recovery app:\n\n${payload}`,
      });

      hapticSuccess();
      setCommentText('');
      setSelectedEntry(null);
    } catch (err) {
      logger.error('Failed to send comment', err);
    } finally {
      setCommentLoading(false);
    }
  }, [selectedEntry, commentText, connectionId, shareComment, user]);

  const getMoodColor = (mood: number | null) => {
    if (!mood) return darkAccent.textSubtle;
    const colors = ['#EF4444', '#F59E0B', '#6B7280', '#10B981', '#3B82F6'];
    return colors[mood - 1] || darkAccent.textSubtle;
  };

  const getMoodLabel = (mood: number | null) => {
    if (!mood) return 'Not specified';
    const labels = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'];
    return labels[mood - 1] || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={darkAccent.primary} />
            <Text style={styles.loadingText}>Loading shared entries...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.centerContainer}>
            <GlassCard intensity="heavy" style={styles.errorCard}>
              <MaterialIcons name="error-outline" size={48} color={darkAccent.danger} />
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorText}>{error}</Text>
              <GradientButton
                title="Retry"
                variant="primary"
                size="md"
                onPress={fetchSharedEntries}
                style={styles.retryButton}
              />
            </GlassCard>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={undefined}
          >
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
              <View style={styles.headerTop}>
                <MaterialCommunityIcons
                  name="folder-shared"
                  size={28}
                  color={darkAccent.primary}
                />
                <Text style={styles.headerTitle}>Shared Entries</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {connection?.display_name || 'Sponsee'} • {entries.length} entries
              </Text>
            </Animated.View>

            {/* Entries List */}
            {entries.length > 0 ? (
              <View style={styles.entriesList}>
                {entries.map((entry, index) => (
                  <SharedEntryCard
                    key={entry.id}
                    entry={entry}
                    onPress={handleEntryPress}
                    index={index}
                  />
                ))}
              </View>
            ) : (
              <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons
                    name="folder-open-outline"
                    size={64}
                    color={darkAccent.textSubtle}
                  />
                </View>
                <Text style={styles.emptyTitle}>No Shared Entries</Text>
                <Text style={styles.emptyDescription}>
                  Your sponsee hasn't shared any journal entries with you yet. Encourage them to
                  share their thoughts and progress.
                </Text>
                <GradientButton
                  title="Refresh"
                  variant="ghost"
                  size="md"
                  icon={<MaterialIcons name="refresh" size={20} color={darkAccent.primary} />}
                  iconPosition="left"
                  onPress={handleRefresh}
                  style={styles.refreshButton}
                />
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Entry Detail Modal */}
      <RNModal
        visible={selectedEntry !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseDetail}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
            style={StyleSheet.absoluteFill}
          />
          
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                onPress={handleCloseDetail}
                hitSlop={8}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={28} color={darkAccent.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Entry Details</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedEntry && (
                <>
                  {/* Entry Content */}
                  <GlassCard intensity="medium" style={styles.entryCard}>
                    <Text style={styles.entryTitle}>
                      {selectedEntry.title || 'Untitled Entry'}
                    </Text>
                    
                    <View style={styles.entryMeta}>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="calendar-today" size={16} color={darkAccent.textSubtle} />
                        <Text style={styles.metaText}>
                          {formatDate(selectedEntry.createdAt)}
                        </Text>
                      </View>

                      {selectedEntry.mood && (
                        <View style={styles.metaItem}>
                          <View style={[styles.moodDot, { backgroundColor: getMoodColor(selectedEntry.mood) }]} />
                          <Text style={[styles.metaText, { color: getMoodColor(selectedEntry.mood) }]}>
                            {getMoodLabel(selectedEntry.mood)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.entryBody}>{selectedEntry.body}</Text>

                    {selectedEntry.tags.length > 0 && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.tagsContainer}>
                          {selectedEntry.tags.map((tag) => (
                            <View key={tag} style={styles.tag}>
                              <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                  </GlassCard>

                  {/* Comment Section */}
                  <GlassCard intensity="medium" style={styles.commentCard}>
                    <Text style={styles.commentTitle}>Send Supportive Comment</Text>
                    <Text style={styles.commentSubtitle}>
                      Share encouragement and support with your sponsee
                    </Text>

                    <View style={styles.commentInputContainer}>
                      <Pressable
                        style={styles.commentInput}
                        onPress={() => {
                          // In real app, show text input modal or expand this
                        }}
                      >
                        <Text style={commentText ? styles.commentInputText : styles.commentPlaceholder}>
                          {commentText || 'Write a supportive message...'}
                        </Text>
                      </Pressable>
                    </View>

                    <GradientButton
                      title="Generate Share Code"
                      variant="primary"
                      size="md"
                      icon={<MaterialIcons name="send" size={20} color="#FFF" />}
                      iconPosition="left"
                      onPress={handleSendComment}
                      loading={commentLoading}
                      disabled={!commentText.trim() || commentLoading}
                      fullWidth
                    />
                  </GlassCard>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </RNModal>
    </>
  );
}

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
    paddingHorizontal: spacing[4],
  },
  loadingText: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginTop: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[3],
    paddingBottom: spacing[6],
  },
  header: {
    marginBottom: spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  headerTitle: {
    ...typography.h1,
    color: darkAccent.text,
  },
  headerSubtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  entriesList: {
    gap: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing[6],
    marginTop: spacing[8],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: radius['2xl'],
    backgroundColor: `${darkAccent.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  emptyTitle: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  emptyDescription: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginBottom: spacing[4],
    maxWidth: 300,
    lineHeight: 22,
  },
  refreshButton: {
    minWidth: 160,
  },
  errorCard: {
    alignItems: 'center',
    padding: spacing[6],
    maxWidth: 340,
  },
  errorTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginTop: spacing[2],
  },
  errorText: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  retryButton: {
    minWidth: 120,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: darkAccent.border,
  },
  modalTitle: {
    ...typography.h3,
    color: darkAccent.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: spacing[3],
    paddingBottom: spacing[6],
  },
  entryCard: {
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  entryTitle: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  entryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    ...typography.caption,
    color: darkAccent.textSubtle,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: darkAccent.border,
    marginVertical: spacing[3],
  },
  entryBody: {
    ...typography.body,
    color: darkAccent.text,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  tag: {
    backgroundColor: `${darkAccent.primary}20`,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  tagText: {
    ...typography.caption,
    color: darkAccent.primary,
    fontWeight: '600',
  },
  commentCard: {
    padding: spacing[4],
  },
  commentTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  commentSubtitle: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginBottom: spacing[3],
  },
  commentInputContainer: {
    marginBottom: spacing[3],
  },
  commentInput: {
    minHeight: 100,
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: darkAccent.border,
    padding: spacing[3],
  },
  commentInputText: {
    ...typography.body,
    color: darkAccent.text,
  },
  commentPlaceholder: {
    ...typography.body,
    color: darkAccent.textSubtle,
  },
});
