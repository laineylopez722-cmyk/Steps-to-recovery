/**
 * Home Screen
 *
 * Serene Dark redesign: bold, premium, and accessible.
 * Enhanced with pull-to-refresh, smooth scroll animations, and error handling.
 */

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
} from '@/platform/haptics';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MotionTransitions } from '../../../design-system/tokens/motion';
import { Action } from '../../../design-system/primitives';
import { useCleanTime, useMilestones } from '../hooks/useCleanTime';
import { useTodayCheckIns } from '../hooks/useCheckIns';
import { useStepProgress } from '../../steps/hooks/useStepWork';
import { MilestoneCelebrationModal } from '../../../components/MilestoneCelebrationModal';
import { TodayWidget } from '../../../components/TodayWidget';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type { HomeStackParamList } from '../../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UpcomingMilestones } from '../components/UpcomingMilestones';
import { RelapseRiskCard } from '../components/RelapseRiskCard';
import { useRelapseRisk } from '../hooks/useRelapseRisk';
import { useAppReview } from '../../../hooks/useAppReview';

interface HomeScreenProps {
  userId: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const ActionCard = React.memo(function ActionCard({
  children,
  onPress,
  containerStyle,
  contentStyle,
  delay = 0,
  accessibilityLabel,
  accessibilityHint,
}: {
  children: React.ReactNode;
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  delay?: number;
  accessibilityLabel: string;
  accessibilityHint?: string;
}) {
  return (
    <Animated.View entering={MotionTransitions.cardEnter(Math.floor(delay / 50))}>
      <Action.Root
        onPress={onPress}
        containerStyle={containerStyle}
        contentStyle={contentStyle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </Action.Root>
    </Animated.View>
  );
});

function PremiumProgressHero({
  days,
  hours,
  minutes,
  completedToday,
  currentStep,
}: {
  days: number;
  hours: number;
  minutes: number;
  completedToday: number;
  currentStep: number;
}) {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const size = 160;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const yearProgress = Math.min(days / 365, 1);
  const strokeDashoffset = circumference * (1 - yearProgress);

  const streakStatus = days > 0 ? 'Streak intact' : 'Day zero, still progress';
  const clockDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const heroA11yLabel = `Clean time: ${days} ${days === 1 ? 'day' : 'days'}, ${hours} hours ${minutes} minutes. ${streakStatus}`;

  return (
    <Animated.View entering={MotionTransitions.fadeDelayed(150)} style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <Text style={styles.heroTitle} accessibilityRole="header">Clean Time</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>
            {streakStatus}
          </Text>
        </View>
      </View>

      <View
        style={styles.ringWrap}
        accessible
        accessibilityLabel={heroA11yLabel}
        accessibilityRole="text"
      >
        <Svg width={size} height={size} accessibilityElementsHidden>
          <Defs>
            <LinearGradient id="sereneRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={ds.colors.accentLight} />
              <Stop offset="100%" stopColor={ds.colors.accent} />
            </LinearGradient>
          </Defs>

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ds.colors.bgQuaternary}
            strokeWidth={stroke}
            fill="none"
          />

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#sereneRing)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        <View style={styles.ringCenter} importantForAccessibility="no-hide-descendants">
          <Text style={styles.dayCount}>{days}</Text>
          <Text style={styles.dayLabel}>{days === 1 ? 'day clean' : 'days clean'}</Text>
          <Text style={styles.heroClock}>{clockDisplay}</Text>
        </View>
      </View>

      <View style={styles.miniStatsRow}>
        <MiniStat
          label="Check-ins"
          value={`${completedToday}/2`}
          tint={ds.semantic.intent.primary.solid}
        />
        <MiniStat label="Year path" value={`${Math.round(yearProgress * 100)}%`} />
        <MiniStat label="Current step" value={`${currentStep}/12`} />
      </View>
    </Animated.View>
  );
}

function MiniStat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.miniStat} accessible accessibilityLabel={`${label}: ${value}`} accessibilityRole="text">
      <Text style={[styles.miniStatValue, tint ? { color: tint } : null]} importantForAccessibility="no">{value}</Text>
      <Text style={styles.miniStatLabel} importantForAccessibility="no">{label}</Text>
    </View>
  );
}

function ShortcutCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  return (
    <ActionCard
      onPress={onPress}
      containerStyle={styles.shortcutCardContainer}
      contentStyle={styles.shortcutCard}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <Action.Icon style={styles.shortcutIconWrap}>
        <Feather name={icon} size={18} color={ds.semantic.intent.primary.solid} importantForAccessibility="no" />
      </Action.Icon>
      <Action.Title style={styles.shortcutTitle}>{title}</Action.Title>
      <Action.Subtitle style={styles.shortcutSubtitle}>{subtitle}</Action.Subtitle>
      <Feather
        name="arrow-up-right"
        size={14}
        color={ds.semantic.text.muted}
        style={styles.shortcutArrow}
        importantForAccessibility="no"
      />
    </ActionCard>
  );
}

// Shimmer loading placeholder
function HomeScreenSkeleton() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container} testID="home-screen">
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer} accessible accessibilityLabel="Loading home screen" accessibilityRole="text">
          {/* Header skeleton */}
          <View style={styles.skeletonHeader}>
            <View>
              <View style={[styles.skeletonLine, { width: 120, marginBottom: 8 }]} />
              <View style={[styles.skeletonLine, { width: 200, height: 32 }]} />
              <View style={[styles.skeletonLine, { width: 180, marginTop: 8 }]} />
            </View>
            <View style={styles.skeletonAvatar} />
          </View>

          {/* Hero skeleton */}
          <View style={styles.skeletonHero}>
            <View style={[styles.skeletonLine, { width: 100, alignSelf: 'center' }]} />
            <View style={styles.skeletonRing} />
            <View style={styles.skeletonStats}>
              <View style={styles.skeletonStat} />
              <View style={styles.skeletonStat} />
              <View style={styles.skeletonStat} />
            </View>
          </View>

          {/* Section skeletons */}
          <View style={[styles.skeletonLine, { width: 150, marginTop: 24 }]} />
          <View style={styles.skeletonPills}>
            <View style={styles.skeletonPill} />
            <View style={styles.skeletonPill} />
            <View style={styles.skeletonPill} />
            <View style={styles.skeletonPill} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export function HomeScreen({ userId }: HomeScreenProps): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const {
    days,
    hours,
    minutes,
    isLoading: loadingDays,
    error: daysError,
    refetch: refetchDays,
  } = useCleanTime(userId);
  const {
    morning,
    evening,
    isLoading: loadingCheckins,
    error: checkinsError,
    refetch: refetchCheckins,
  } = useTodayCheckIns(userId);
  const { newMilestone, checkForNewMilestones } = useMilestones(userId);
  const { checkMilestoneReview } = useAppReview();
  const { currentStep } = useStepProgress(userId);

  const { risk, refetch: refetchRisk } = useRelapseRisk(userId);
  const [riskDismissed, setRiskDismissed] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const lastCelebratedKeyRef = useRef<string | null>(null);
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const greeting = useMemo(() => getGreeting(), []);
  const date = useMemo(() => formatDate(), []);
  const completedToday = Number(Boolean(morning)) + Number(Boolean(evening));

  // Check for new milestones when clean days change
  useEffect(() => {
    if (days > 0) {
      checkForNewMilestones();
    }
  }, [days, checkForNewMilestones]);

  // Show celebration modal when a new milestone is detected
  useEffect(() => {
    if (newMilestone && newMilestone.key !== lastCelebratedKeyRef.current) {
      lastCelebratedKeyRef.current = newMilestone.key;
      setShowMilestone(true);
    }
  }, [newMilestone]);

  const handleCloseMilestone = useCallback((): void => {
    setShowMilestone(false);
    // Prompt for app review after celebrating a milestone
    if (days > 0) {
      checkMilestoneReview(days).catch(() => {});
    }
  }, [days, checkMilestoneReview]);

  const hapticLight = () => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});

    try {
      await Promise.all([refetchDays?.(), refetchCheckins?.(), refetchRisk()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchDays, refetchCheckins]);

  const handleMorning = useCallback(() => {
    hapticLight();
    navigation.navigate('MorningIntention');
  }, [navigation]);

  const handleReading = useCallback(() => {
    hapticLight();
    navigation.navigate('DailyReading');
  }, [navigation]);

  const handleEvening = useCallback(() => {
    hapticLight();
    navigation.navigate('EveningPulse');
  }, [navigation]);

  const handleCompanion = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate('CompanionChat');
  }, [navigation]);

  const handleEmergency = useCallback(() => {
    notificationAsync(NotificationFeedbackType.Warning).catch(() => {});
    navigation.navigate('Emergency');
  }, [navigation]);

  const handleMindfulness = useCallback(() => {
    hapticLight();
    navigation.navigate('MindfulnessLibrary');
  }, [navigation]);

  const handleProgress = useCallback(() => {
    hapticLight();
    navigation.navigate('ProgressDashboard');
  }, [navigation]);

  const handleSteps = useCallback(() => {
    hapticLight();
    navigation.getParent()?.navigate('Steps' as never);
  }, [navigation]);

  const handleProfile = useCallback(() => {
    hapticLight();
    navigation.getParent()?.navigate('Profile' as never);
  }, [navigation]);

  const handleJournal = useCallback(() => {
    hapticLight();
    navigation.getParent()?.navigate('Journal' as never);
  }, [navigation]);

  const handleMeetings = useCallback(() => {
    hapticLight();
    navigation.getParent()?.navigate('Meetings' as never);
  }, [navigation]);

  const intentionPills = [
    { label: 'Stay present', icon: 'sun' as const, onPress: handleMorning },
    { label: 'Read one page', icon: 'book-open' as const, onPress: handleReading },
    { label: 'Call support', icon: 'phone-call' as const, onPress: handleCompanion },
    { label: 'Close day strong', icon: 'moon' as const, onPress: handleEvening },
  ];

  // Show skeleton while loading
  if (loadingDays || loadingCheckins) {
    return <HomeScreenSkeleton />;
  }

  const hasError = daysError || checkinsError;

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.bgLayerTop} importantForAccessibility="no-hide-descendants" />
      <View pointerEvents="none" style={styles.bgLayerMid} importantForAccessibility="no-hide-descendants" />
      <View pointerEvents="none" style={styles.bgLayerBottom} importantForAccessibility="no-hide-descendants" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={ds.semantic.intent.primary.solid}
              colors={[ds.semantic.intent.primary.solid]}
              progressBackgroundColor={ds.semantic.surface.elevated}
            />
          }
        >
          <Animated.View entering={MotionTransitions.screenEnter()} style={styles.header}>
            <View accessible accessibilityRole="header" accessibilityLabel={`${greeting}. ${date}`}>
              <Text style={styles.date} importantForAccessibility="no">{date}</Text>
              <Text style={styles.greeting} importantForAccessibility="no">{greeting}</Text>
              <Text style={styles.subtitle}>Welcome back — keep your next right move simple.</Text>
            </View>

            <Pressable
              onPress={handleProfile}
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.profileButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Feather name="user" size={ds.sizes.iconMd} color={ds.semantic.text.primary} />
            </Pressable>
          </Animated.View>

          {hasError && (
            <Animated.View entering={FadeIn} style={styles.errorBanner} accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Feather name="alert-circle" size={18} color={ds.semantic.intent.alert.solid} accessibilityElementsHidden />
              <Text style={styles.errorText}>Unable to load some data. Pull to retry.</Text>
            </Animated.View>
          )}

          <PremiumProgressHero
            days={days}
            hours={hours}
            minutes={minutes}
            completedToday={completedToday}
            currentStep={currentStep}
          />

          {risk && !riskDismissed && (
            <RelapseRiskCard
              risk={risk}
              userId={userId}
              onDismiss={() => setRiskDismissed(true)}
            />
          )}

          <Animated.View entering={MotionTransitions.cardEnter(3)} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Daily intention</Text>
              <Text style={styles.sectionHint} importantForAccessibility="no">Choose one now</Text>
            </View>

            <View style={styles.pillsRow}>
              {intentionPills.map((pill, index) => (
                <Animated.View key={pill.label} entering={FadeInUp.delay(300 + index * 50)}>
                  <Action.Root
                    onPress={pill.onPress}
                    contentStyle={styles.intentionPill}
                    accessibilityRole="button"
                    accessibilityLabel={pill.label}
                    accessibilityHint="Set this as your daily intention"
                  >
                    <Feather name={pill.icon} size={14} color={ds.semantic.intent.primary.solid} />
                    <Text style={styles.intentionPillText}>{pill.label}</Text>
                  </Action.Root>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <ActionCard
            onPress={handleCompanion}
            contentStyle={styles.companionCard}
            delay={220}
            accessibilityLabel="Talk to your companion"
            accessibilityHint="Get support before things spiral"
          >
            <View style={styles.companionIcon} importantForAccessibility="no-hide-descendants">
              <Feather
                name="message-circle"
                size={24}
                color={ds.semantic.intent.primary.onSolid}
              />
            </View>
            <View style={styles.companionContent}>
              <Text style={styles.companionTitle}>Talk to your companion</Text>
              <Text style={styles.companionSubtitle}>Get support before things spiral</Text>
            </View>
            <Feather name="arrow-right" size={20} color="rgba(0,0,0,0.4)" importantForAccessibility="no" />
          </ActionCard>

          <Animated.View entering={MotionTransitions.cardEnter(4)} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Today shortcuts</Text>
              <Text style={styles.sectionHint} importantForAccessibility="no">Tap to open</Text>
            </View>
            <View style={styles.shortcutsGrid}>
              <ShortcutCard
                icon="book-open"
                title="Step work"
                subtitle="Continue where you left off"
                onPress={handleSteps}
              />
              <ShortcutCard
                icon="book"
                title="Daily reading"
                subtitle="Ground yourself now"
                onPress={handleReading}
              />
              <ShortcutCard
                icon="bar-chart-2"
                title="Insights"
                subtitle="See your pattern"
                onPress={handleProgress}
              />
              <ShortcutCard
                icon="alert-triangle"
                title="Emergency"
                subtitle="Open support instantly"
                onPress={handleEmergency}
              />
              <ShortcutCard
                icon="wind"
                title="Mindfulness"
                subtitle="Breathing & meditations"
                onPress={handleMindfulness}
              />
            </View>
          </Animated.View>

          <TodayWidget
            userId={userId}
            onCheckIn={handleMorning}
            onJournal={handleJournal}
            onMeeting={handleMeetings}
          />

          <UpcomingMilestones userId={userId} />

          <View style={{ height: ds.space[20] }} />
        </ScrollView>
      </SafeAreaView>

      <MilestoneCelebrationModal
        visible={showMilestone}
        milestone={newMilestone}
        onClose={handleCloseMilestone}
      />
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.colors.bgPrimary,
    },
    safe: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: ds.semantic.layout.screenPadding,
    },

    // Loading skeleton styles
    loadingContainer: {
      flex: 1,
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingTop: ds.space[6],
    },
    skeletonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingBottom: ds.space[4],
    },
    skeletonLine: {
      height: 16,
      backgroundColor: ds.semantic.surface.interactive,
      borderRadius: 8,
    },
    skeletonAvatar: {
      width: ds.sizes.touchMin,
      height: ds.sizes.touchMin,
      borderRadius: ds.sizes.touchMin / 2,
      backgroundColor: ds.semantic.surface.interactive,
    },
    skeletonHero: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.xl,
      padding: ds.space[5],
      marginTop: ds.space[4],
    },
    skeletonRing: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: ds.semantic.surface.elevated,
      alignSelf: 'center',
      marginVertical: ds.space[4],
    },
    skeletonStats: {
      flexDirection: 'row',
      gap: ds.space[2],
    },
    skeletonStat: {
      flex: 1,
      height: 50,
      backgroundColor: ds.semantic.surface.elevated,
      borderRadius: ds.radius.lg,
    },
    skeletonPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ds.space[2],
      marginTop: ds.space[3],
    },
    skeletonPill: {
      width: 120,
      height: 36,
      backgroundColor: ds.semantic.surface.elevated,
      borderRadius: ds.radius.full,
    },

    // Error banner
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.semantic.intent.alert.subtle,
      borderRadius: ds.radius.lg,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      marginBottom: ds.space[4],
      gap: ds.space[2],
    },
    errorText: {
      ...ds.typography.caption,
      color: ds.semantic.intent.alert.solid,
      flex: 1,
    },

    bgLayerTop: {
      position: 'absolute',
      top: -120,
      right: -70,
      width: 260,
      height: 260,
      borderRadius: ds.radius.full,
      backgroundColor: ds.semantic.intent.secondary.subtle,
      opacity: 0.3,
    },
    bgLayerMid: {
      position: 'absolute',
      top: 210,
      left: -120,
      width: 300,
      height: 300,
      borderRadius: ds.radius.full,
      backgroundColor: ds.semantic.intent.primary.subtle,
      opacity: 0.3,
    },
    bgLayerBottom: {
      position: 'absolute',
      bottom: -260,
      right: -180,
      width: 360,
      height: 360,
      borderRadius: ds.radius.full,
      backgroundColor: ds.semantic.surface.interactive,
      opacity: 0.15,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: ds.space[6],
      paddingBottom: ds.space[4],
    },
    date: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: ds.space[1],
    },
    greeting: {
      ...ds.semantic.typography.screenTitle,
      color: ds.semantic.text.primary,
    },
    subtitle: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      marginTop: ds.space[1],
    },
    profileButton: {
      width: ds.sizes.touchMin,
      height: ds.sizes.touchMin,
      borderRadius: ds.radius.full,
      backgroundColor: ds.semantic.surface.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.colors.borderDefault,
    },
    profileButtonPressed: {
      backgroundColor: ds.semantic.surface.interactive,
    },

    heroCard: {
      backgroundColor: ds.semantic.surface.elevated,
      borderRadius: ds.radius.xl,
      paddingHorizontal: ds.space[5],
      paddingTop: ds.space[4],
      paddingBottom: ds.space[5],
      marginBottom: ds.space[5],
      borderWidth: 1,
      borderColor: ds.semantic.intent.primary.muted,
      ...ds.shadows.lg,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroTitle: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      fontWeight: '700',
    },
    heroBadge: {
      backgroundColor: ds.semantic.intent.primary.muted,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[1],
      borderRadius: ds.radius.full,
    },
    heroBadgeText: {
      ...ds.typography.micro,
      color: ds.semantic.intent.primary.solid,
      fontWeight: '700',
    },
    ringWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: ds.space[4],
    },
    ringCenter: {
      position: 'absolute',
      alignItems: 'center',
    },
    dayCount: {
      fontSize: 40,
      fontWeight: '700',
      color: ds.semantic.text.primary,
      letterSpacing: -1,
    },
    dayLabel: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      marginTop: -2,
    },
    heroClock: {
      ...ds.typography.micro,
      color: ds.semantic.intent.primary.solid,
      marginTop: ds.space[1],
      letterSpacing: 0.4,
    },
    miniStatsRow: {
      flexDirection: 'row',
      backgroundColor: ds.semantic.surface.overlay,
      borderRadius: ds.radius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.colors.borderDefault,
    },
    miniStat: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: ds.space[3],
    },
    miniStatValue: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      fontWeight: '700',
    },
    miniStatLabel: {
      ...ds.typography.caption,
      color: ds.semantic.text.muted,
      marginTop: 2,
    },

    section: {
      marginTop: ds.space[2],
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: ds.space[3],
      marginLeft: ds.space[1],
    },
    sectionTitle: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    sectionHint: {
      ...ds.typography.micro,
      color: ds.semantic.text.muted,
    },

    pillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ds.space[2],
      marginBottom: ds.space[3],
    },
    intentionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      backgroundColor: ds.semantic.surface.interactive,
      borderRadius: ds.radius.full,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[2],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.semantic.intent.primary.muted,
    },
    intentionPillText: {
      ...ds.typography.caption,
      color: ds.semantic.text.primary,
      fontWeight: '600',
    },

    shortcutsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: ds.space[2],
    },
    shortcutCardContainer: {
      width: '48%',
      marginBottom: ds.space[3],
    },
    shortcutCard: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      padding: ds.space[3],
      minHeight: 100,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.colors.borderDefault,
    },
    shortcutIconWrap: {
      width: 30,
      height: 30,
      borderRadius: ds.radius.md,
      backgroundColor: ds.semantic.intent.primary.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: ds.space[2],
    },
    shortcutTitle: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      fontWeight: '600',
    },
    shortcutSubtitle: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      marginTop: ds.space[1],
      paddingRight: ds.space[4],
    },
    shortcutArrow: {
      position: 'absolute',
      right: ds.space[3],
      top: ds.space[3],
    },

    companionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.semantic.intent.primary.solid,
      borderRadius: ds.radius.xl,
      paddingVertical: ds.space[5],
      paddingHorizontal: ds.space[5],
      marginBottom: ds.space[2],
      ...ds.shadows.md,
    },
    companionIcon: {
      width: 48,
      height: 48,
      borderRadius: ds.radius.lg,
      backgroundColor: 'rgba(0,0,0,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    companionContent: {
      flex: 1,
      marginLeft: ds.space[4],
    },
    companionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: ds.semantic.intent.primary.onSolid,
    },
    companionSubtitle: {
      ...ds.typography.caption,
      color: 'rgba(0,0,0,0.6)',
      marginTop: 2,
    },
  }) as const;

