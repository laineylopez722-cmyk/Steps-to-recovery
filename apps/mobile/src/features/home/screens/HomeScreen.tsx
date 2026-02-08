/**
 * Home Screen
 *
 * Premium, focused recovery dashboard.
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
import { MotionTransitions } from '../../../design-system/tokens/motion';
import { Action } from '../../../design-system/primitives';
import { useCleanTime } from '../hooks/useCleanTime';
import { useTodayCheckIns } from '../hooks/useCheckIns';
import { ds } from '../../../design-system/tokens/ds';
import { SobrietyCandle } from '../../../design-system/components';
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

function TaskItem({
  icon,
  label,
  sublabel,
  done,
  onPress,
  isLast,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sublabel: string;
  done?: boolean;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <View>
      <Action.Root onPress={onPress} contentStyle={styles.taskItem}>
        <Action.Icon style={[styles.taskIcon, done && styles.taskIconDone]}>
          <Feather
            name={done ? 'check' : icon}
            size={ds.sizes.iconMd}
            color={done ? ds.colors.success : ds.semantic.text.tertiary}
          />
        </Action.Icon>

        <Action.Content style={styles.taskContent}>
          <Action.Title style={[styles.taskLabel, done && styles.taskLabelDone]}>{label}</Action.Title>
          <Action.Subtitle style={styles.taskSublabel}>{sublabel}</Action.Subtitle>
        </Action.Content>

        <Action.Trailing style={styles.taskChevron}>
          <Feather name="chevron-right" size={ds.sizes.iconSm} color={ds.semantic.text.muted} />
        </Action.Trailing>
      </Action.Root>

      {!isLast && <View style={styles.taskDivider} />}
    </View>
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
  const { days, isLoading: loadingDays } = useCleanTime(userId);
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
            >
              <Feather name="user" size={ds.sizes.iconMd} color={ds.semantic.text.primary} />
            </Pressable>
          </Animated.View>

          <Animated.View entering={MotionTransitions.fadeDelayed(150)} style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroTitle}>Clean Time Streak</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{days > 0 ? 'Streak intact' : 'Start today'}</Text>
              </View>
            </View>

            <SobrietyCandle days={days} size={1.15} maxDays={365} />

            <View style={styles.dayInfo}>
              <Text style={styles.dayCount}>{days}</Text>
              <Text style={styles.dayLabel}>{days === 1 ? 'day clean' : 'days clean'}</Text>
            </View>

            <Text style={styles.heroMessage}>
              {days < 7 ? 'One day at a time. You are doing this.' : 'Your consistency is building real momentum.'}
            </Text>

            <View style={styles.miniStatsRow}>
              <MiniStat label="Today" value={`${completedToday}/2`} tint={ds.semantic.intent.primary.solid} />
              <MiniStat label="Current step" value="1/12" />
              <MiniStat label="Check-ins" value={String(completedToday)} />
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
              <Feather name="arrow-right" size={20} color="rgba(0,0,0,0.4)" />
            </View>
          </ActionCard>

          <Animated.View entering={MotionTransitions.cardEnter(3)} style={styles.section}>
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

          <Animated.View entering={MotionTransitions.cardEnter(4)} style={styles.section}>
            <Text style={styles.sectionTitle}>Recovery rhythm</Text>

            <View style={styles.taskList}>
              <TaskItem
                icon="sun"
                label="Morning check-in"
                sublabel={morning ? 'Done' : 'Set your intention'}
                done={!!morning}
                onPress={handleMorning}
              />

              <TaskItem
                icon="moon"
                label="Evening reflection"
                sublabel={evening ? 'Done' : 'Review your day'}
                done={!!evening}
                onPress={handleEvening}
                isLast
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
    backgroundColor: ds.semantic.surface.app,
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
  },
  profileButtonPressed: {
    backgroundColor: ds.semantic.surface.interactive,
  },

  heroCard: {
    backgroundColor: ds.semantic.surface.canvas,
    borderRadius: ds.radius.xl,
    paddingHorizontal: ds.space[5],
    paddingTop: ds.space[4],
    paddingBottom: ds.space[5],
    marginBottom: ds.space[5],
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    ...ds.typography.body,
    color: ds.semantic.text.primary,
    fontWeight: '600',
  },
  heroBadge: {
    backgroundColor: ds.colors.successMuted,
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.full,
  },
  heroBadgeText: {
    ...ds.typography.caption,
    color: ds.colors.success,
    fontWeight: '600',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: ds.space[3],
    gap: ds.space[2],
  },
  dayCount: {
    fontSize: 54,
    fontWeight: '700',
    color: ds.semantic.text.primary,
    letterSpacing: -1.5,
  },
  dayLabel: {
    ...ds.typography.body,
    color: ds.semantic.text.tertiary,
  },
  heroMessage: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    textAlign: 'center',
    marginTop: ds.space[2],
    marginBottom: ds.space[4],
  },
  miniStatsRow: {
    flexDirection: 'row',
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
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
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionHint: {
    ...ds.typography.micro,
    color: ds.semantic.text.muted,
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
    borderColor: ds.colors.borderSubtle,
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

  taskList: {
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[5],
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: ds.radius.md,
    backgroundColor: ds.semantic.surface.interactive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconDone: {
    backgroundColor: ds.colors.successMuted,
  },
  taskContent: {
    flex: 1,
    marginLeft: ds.space[4],
  },
  taskLabel: {
    ...ds.typography.body,
    color: ds.semantic.text.primary,
    fontWeight: '500',
  },
  taskLabelDone: {
    color: ds.colors.textSecondary,
  },
  taskSublabel: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    marginTop: 2,
  },
  taskChevron: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ds.colors.divider,
    marginLeft: 44 + ds.space[5] + ds.space[4],
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
    fontWeight: '600',
    color: '#000',
  },
  companionSubtitle: {
    ...ds.typography.caption,
    color: 'rgba(0, 0, 0, 0.55)',
    marginTop: 2,
  },
});
