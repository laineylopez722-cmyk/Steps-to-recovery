/**
 * Home Screen
 *
 * Serene Dark redesign: bold, premium, and accessible.
 */

import React, { useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MotionTransitions } from '../../../design-system/tokens/motion';
import { Action } from '../../../design-system/primitives';
import { useCleanTime } from '../hooks/useCleanTime';
import { useTodayCheckIns } from '../hooks/useCheckIns';
import { ds } from '../../../design-system/tokens/ds';
import type { HomeStackParamList } from '../../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

function ActionCard({
  children,
  onPress,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  return (
    <Animated.View entering={MotionTransitions.cardEnter(Math.floor(delay / 50))}>
      <Action.Root onPress={onPress} contentStyle={style}>
        {children}
      </Action.Root>
    </Animated.View>
  );
}

function PremiumProgressHero({
  days,
  hours,
  minutes,
  completedToday,
}: {
  days: number;
  hours: number;
  minutes: number;
  completedToday: number;
}) {
  const size = 214;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const yearProgress = Math.min(days / 365, 1);
  const strokeDashoffset = circumference * (1 - yearProgress);

  return (
    <Animated.View entering={MotionTransitions.fadeDelayed(150)} style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <Text style={styles.heroTitle}>Clean Time</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{days > 0 ? 'Streak intact' : 'Day zero, still progress'}</Text>
        </View>
      </View>

      <View style={styles.ringWrap}>
        <Svg width={size} height={size}>
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

        <View style={styles.ringCenter}>
          <Text style={styles.dayCount}>{days}</Text>
          <Text style={styles.dayLabel}>{days === 1 ? 'day clean' : 'days clean'}</Text>
          <Text style={styles.heroClock}>{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</Text>
        </View>
      </View>

      <View style={styles.miniStatsRow}>
        <MiniStat label="Check-ins" value={`${completedToday}/2`} tint={ds.semantic.intent.primary.solid} />
        <MiniStat label="Year path" value={`${Math.round(yearProgress * 100)}%`} />
        <MiniStat label="Current step" value="1/12" />
      </View>
    </Animated.View>
  );
}

function MiniStat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
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
  return (
    <ActionCard onPress={onPress} style={styles.shortcutCard}>
      <Action.Icon style={styles.shortcutIconWrap}>
        <Feather name={icon} size={18} color={ds.semantic.intent.primary.solid} />
      </Action.Icon>
      <Action.Title style={styles.shortcutTitle}>{title}</Action.Title>
      <Action.Subtitle style={styles.shortcutSubtitle}>{subtitle}</Action.Subtitle>
      <Feather name="arrow-up-right" size={14} color={ds.semantic.text.muted} style={styles.shortcutArrow} />
    </ActionCard>
  );
}

export function HomeScreen({ userId }: HomeScreenProps): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { days, hours, minutes, isLoading: loadingDays } = useCleanTime(userId);
  const { morning, evening, isLoading: loadingCheckins } = useTodayCheckIns(userId);

  const greeting = useMemo(() => getGreeting(), []);
  const date = useMemo(() => formatDate(), []);
  const completedToday = Number(Boolean(morning)) + Number(Boolean(evening));

  const hapticLight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate('CompanionChat');
  }, [navigation]);

  const handleEmergency = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    navigation.navigate('Emergency');
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

  const intentionPills = [
    { label: 'Stay present', icon: 'sun' as const, onPress: handleMorning },
    { label: 'Read one page', icon: 'book-open' as const, onPress: handleReading },
    { label: 'Call support', icon: 'phone-call' as const, onPress: handleCompanion },
    { label: 'Close day strong', icon: 'moon' as const, onPress: handleEvening },
  ];

  if (loadingDays || loadingCheckins) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Animated.View entering={MotionTransitions.fade()}>
            <Text style={styles.loadingText}>...</Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.bgLayerTop} />
      <View pointerEvents="none" style={styles.bgLayerMid} />
      <View pointerEvents="none" style={styles.bgLayerBottom} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={MotionTransitions.screenEnter()} style={styles.header}>
            <View>
              <Text style={styles.date}>{date}</Text>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.subtitle}>Welcome back — keep your next right move simple.</Text>
            </View>

            <Pressable
              onPress={handleProfile}
              style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Feather name="user" size={ds.sizes.iconMd} color={ds.semantic.text.primary} />
            </Pressable>
          </Animated.View>

          <PremiumProgressHero
            days={days}
            hours={hours}
            minutes={minutes}
            completedToday={completedToday}
          />

          <Animated.View entering={MotionTransitions.cardEnter(3)} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Daily intention</Text>
              <Text style={styles.sectionHint}>Choose one now</Text>
            </View>

            <View style={styles.pillsRow}>
              {intentionPills.map((pill) => (
                <Action.Root key={pill.label} onPress={pill.onPress} contentStyle={styles.intentionPill}>
                  <Feather name={pill.icon} size={14} color={ds.semantic.intent.primary.solid} />
                  <Text style={styles.intentionPillText}>{pill.label}</Text>
                </Action.Root>
              ))}
            </View>
          </Animated.View>

          <ActionCard onPress={handleCompanion} delay={220}>
            <View style={styles.companionCard}>
              <View style={styles.companionIcon}>
                <Feather name="message-circle" size={24} color="#000" />
              </View>
              <View style={styles.companionContent}>
                <Text style={styles.companionTitle}>Talk to your companion</Text>
                <Text style={styles.companionSubtitle}>Get support before things spiral</Text>
              </View>
              <Feather name="arrow-right" size={20} color="rgba(0,0,0,0.42)" />
            </View>
          </ActionCard>

          <Animated.View entering={MotionTransitions.cardEnter(4)} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Today shortcuts</Text>
              <Text style={styles.sectionHint}>Tap to open</Text>
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
            </View>
          </Animated.View>

          <View style={{ height: ds.space[20] }} />
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.semantic.layout.screenPadding,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    color: ds.semantic.text.muted,
    letterSpacing: 4,
  },

  bgLayerTop: {
    position: 'absolute',
    top: -120,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: ds.radius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  bgLayerMid: {
    position: 'absolute',
    top: 210,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: ds.radius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  bgLayerBottom: {
    position: 'absolute',
    bottom: -180,
    right: -140,
    width: 360,
    height: 360,
    borderRadius: ds.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
    backgroundColor: 'rgba(20, 20, 22, 0.9)',
    borderRadius: ds.radius.xl,
    paddingHorizontal: ds.space[5],
    paddingTop: ds.space[4],
    paddingBottom: ds.space[5],
    marginBottom: ds.space[5],
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
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
    fontSize: 52,
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: ds.radius.full,
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  intentionPillText: {
    ...ds.typography.caption,
    color: ds.semantic.text.secondary,
    fontWeight: '600',
  },

  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: ds.space[2],
  },
  shortcutCard: {
    width: '48.5%',
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    padding: ds.space[4],
    marginBottom: ds.space[3],
    minHeight: 112,
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
    color: '#000',
  },
  companionSubtitle: {
    ...ds.typography.caption,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 2,
  },
});
