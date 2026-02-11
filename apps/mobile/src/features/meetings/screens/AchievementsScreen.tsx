/**
 * Achievements Screen
 * Full gallery of all achievements with progress tracking
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { ACHIEVEMENT_COLORS } from '@recovery/shared';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type FilterType = 'all' | 'unlocked' | 'locked';

export function AchievementsScreen(): React.ReactElement {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);

  const { achievements, isLoading: _isLoading, unlockedCount, totalCount } = useAchievements();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refetch happens automatically through React Query
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });

  const handleAchievementPress = (achievement: (typeof achievements)[0]) => {
    if (achievement.unlocked) {
      setSelectedAchievement(achievement.key);
      setShowModal(true);
    }
  };

  const getProgressBarColor = (category: (typeof achievements)[0]['category']) => {
    return ACHIEVEMENT_COLORS[category].gradient;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[darkAccent.background, darkAccent.surfaceHigh]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={24} color={darkAccent.text} />
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Achievements
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Stats Banner */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <LinearGradient
            colors={[ds.colors.accent, ds.semantic.intent.primary.solid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsBanner}
          >
            <View style={styles.statsContent}>
              <MaterialIcons name="emoji-events" size={48} color={ds.semantic.text.onDark} />
              <View>
                <Text style={styles.statsValue}>
                  {unlockedCount} / {totalCount}
                </Text>
                <Text style={styles.statsLabel}>Achievements Unlocked</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${(unlockedCount / totalCount) * 100}%` }]}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.filterContainer}>
          <Pressable
            onPress={() => setFilter('all')}
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            accessibilityLabel="Show all achievements"
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'all' }}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All ({totalCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('unlocked')}
            style={[styles.filterTab, filter === 'unlocked' && styles.filterTabActive]}
            accessibilityLabel="Show unlocked achievements"
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'unlocked' }}
          >
            <Text
              style={[styles.filterTabText, filter === 'unlocked' && styles.filterTabTextActive]}
            >
              Unlocked ({unlockedCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('locked')}
            style={[styles.filterTab, filter === 'locked' && styles.filterTabActive]}
            accessibilityLabel="Show locked achievements"
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'locked' }}
          >
            <Text style={[styles.filterTabText, filter === 'locked' && styles.filterTabTextActive]}>
              Locked ({totalCount - unlockedCount})
            </Text>
          </Pressable>
        </Animated.View>

        {/* Achievements Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkAccent.primary}
            />
          }
        >
          <View style={styles.grid}>
            {filteredAchievements.map((achievement, index) => (
              <Animated.View key={achievement.key} entering={FadeInUp.delay(300 + index * 50)}>
                <Pressable
                  onPress={() => handleAchievementPress(achievement)}
                  style={[
                    styles.achievementCard,
                    !achievement.unlocked && styles.achievementCardLocked,
                  ]}
                  accessibilityLabel={`${achievement.title}${
                    achievement.unlocked
                      ? ` - Unlocked on ${new Date(achievement.unlockedAt!).toLocaleDateString()}`
                      : ` - Locked - ${achievement.progressText}`
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !achievement.unlocked }}
                >
                  <GlassCard style={styles.cardContent}>
                    {/* Icon */}
                    <View
                      style={[
                        styles.iconContainer,
                        achievement.unlocked && styles.iconContainerUnlocked,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          achievement.unlocked
                            ? getProgressBarColor(achievement.category)
                            : [ds.colors.bgSecondary, ds.colors.bgTertiary]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconBg}
                      >
                        <MaterialIcons
                          name={achievement.icon as IconName}
                          size={48}
                          color={
                            achievement.unlocked ? ds.semantic.text.onDark : ds.colors.textTertiary
                          }
                        />
                      </LinearGradient>

                      {/* Unlock Badge */}
                      {achievement.unlocked && (
                        <View style={styles.unlockBadge}>
                          <MaterialIcons name="check" size={16} color={ds.semantic.text.onDark} />
                        </View>
                      )}

                      {/* Lock Icon */}
                      {!achievement.unlocked && (
                        <View style={styles.lockBadge}>
                          <MaterialIcons name="lock" size={16} color={ds.colors.textTertiary} />
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.infoContainer}>
                      <Text
                        style={[
                          styles.achievementTitle,
                          !achievement.unlocked && styles.achievementTitleLocked,
                        ]}
                      >
                        {achievement.title}
                      </Text>
                      <Text
                        style={[
                          styles.achievementDescription,
                          !achievement.unlocked && styles.achievementDescriptionLocked,
                        ]}
                        numberOfLines={2}
                      >
                        {achievement.description}
                      </Text>

                      {/* Progress or Date */}
                      {achievement.unlocked ? (
                        <Text style={styles.unlockedDate}>
                          Unlocked{' '}
                          {new Date(achievement.unlockedAt!).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      ) : (
                        <>
                          <View style={styles.progressBarContainer}>
                            <View style={styles.progressBar}>
                              <View
                                style={[
                                  styles.progressBarFill,
                                  { width: `${achievement.progress}%` },
                                ]}
                              >
                                <LinearGradient
                                  colors={getProgressBarColor(achievement.category)}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.progressBarGradient}
                                />
                              </View>
                            </View>
                          </View>
                          <Text style={styles.progressText}>{achievement.progressText}</Text>
                        </>
                      )}
                    </View>

                    {/* Shine effect for unlocked */}
                    {achievement.unlocked && (
                      <View style={styles.shineOverlay}>
                        <LinearGradient
                          colors={['transparent', ds.colors.bgOverlay, 'transparent']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                      </View>
                    )}
                  </GlassCard>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {filteredAchievements.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="emoji-events" size={64} color={darkAccent.textMuted} />
              <Text style={styles.emptyText}>
                {filter === 'unlocked' ? 'No achievements unlocked yet' : 'No locked achievements'}
              </Text>
              <Text style={styles.emptySubtext}>
                {filter === 'unlocked'
                  ? 'Keep attending meetings to unlock achievements!'
                  : 'You have unlocked all achievements!'}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AchievementUnlockModal
        visible={showModal}
        achievementKey={selectedAchievement}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    backButton: {
      padding: spacing.sm,
    },
    headerTitle: {
      ...typography.h2,
      color: darkAccent.text,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    statsBanner: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.xl,
    },
    statsContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    statsValue: {
      ...typography.h1,
      color: ds.semantic.text.onDark,
      fontWeight: '800',
    },
    statsLabel: {
      ...typography.body,
      color: ds.semantic.text.onDark,
    },
    progressTrack: {
      height: 8,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: ds.semantic.text.onDark,
      borderRadius: radius.full,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    filterTab: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: darkAccent.surfaceHigh,
      alignItems: 'center',
    },
    filterTabActive: {
      backgroundColor: darkAccent.primary,
    },
    filterTabText: {
      ...typography.body,
      color: darkAccent.textMuted,
      fontWeight: '600',
    },
    filterTabTextActive: {
      color: ds.semantic.text.onDark,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
    },
    grid: {
      gap: spacing.lg,
    },
    achievementCard: {
      marginBottom: spacing.md,
    },
    achievementCardLocked: {
      opacity: 0.7,
    },
    cardContent: {
      flexDirection: 'row',
      padding: spacing.lg,
      gap: spacing.md,
      position: 'relative',
      overflow: 'hidden',
    },
    iconContainer: {
      position: 'relative',
    },
    iconContainerUnlocked: {
      // Add shine/glow effect
    },
    iconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: ds.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    unlockBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: ds.colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: darkAccent.primary,
    },
    lockBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: darkAccent.surfaceHigh,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: darkAccent.border,
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    achievementTitle: {
      ...typography.h3,
      color: darkAccent.text,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    achievementTitleLocked: {
      color: darkAccent.textMuted,
    },
    achievementDescription: {
      ...typography.body,
      color: darkAccent.textMuted,
      marginBottom: spacing.sm,
    },
    achievementDescriptionLocked: {
      color: darkAccent.textMuted,
    },
    unlockedDate: {
      ...typography.caption,
      color: ds.colors.success,
      fontWeight: '600',
    },
    progressBarContainer: {
      marginBottom: spacing.xs,
    },
    progressBar: {
      height: 6,
      backgroundColor: darkAccent.surfaceHigh,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressBarGradient: {
      flex: 1,
    },
    progressText: {
      ...typography.caption,
      color: darkAccent.textMuted,
    },
    shineOverlay: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
    emptyText: {
      ...typography.h3,
      color: darkAccent.text,
      textAlign: 'center',
    },
    emptySubtext: {
      ...typography.body,
      color: darkAccent.textMuted,
      textAlign: 'center',
    },
  }) as const;
