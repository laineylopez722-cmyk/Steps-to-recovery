import React, { useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInUp,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../design-system';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { useCleanTime } from '../hooks/useCleanTime';
import { useTodayCheckIns } from '../hooks/useCheckIns';
import { DailyReadingCard } from '../components/DailyReadingCard';
import { RiskAlertCard } from '../components/RiskAlertCard';
import { useAutoRiskDetection } from '../../../hooks/useRiskDetection';
import { CircularProgressRing } from '../../../components/CircularProgressRing';
import { QuickMeetingCheckIn } from '../../../components/QuickMeetingCheckIn';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface HomeScreenModernProps {
  userId: string;
}

export function HomeScreenModern({ userId }: HomeScreenModernProps): React.ReactElement {
  const navigation = useNavigation();
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  
  const {
    days,
    hours,
    minutes,
    seconds,
    nextMilestone,
    isLoading: cleanTimeLoading,
  } = useCleanTime(userId);
  
  const { morning, evening, isLoading: checkInsLoading } = useTodayCheckIns(userId);
  
  // Risk detection
  const {
    primaryPattern,
    dismiss,
    notifySponsorAbout,
    hasAnyRisk,
  } = useAutoRiskDetection(userId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Trigger refetch here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleEmergency = (): void => {
    navigation.navigate('Emergency' as never);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative glow */}
      <View style={styles.glowOrb} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AnimatedScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={darkAccent.primary} />
          }
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInUp.duration(600)}
            style={styles.header}
          >
            <View>
              <Text style={styles.greeting} accessibilityRole="header" accessibilityLabel="Good Morning">Good Morning</Text>
              <Text style={styles.subtitle}>Your journey continues</Text>
            </View>
            <Pressable 
              style={styles.profileButton}
              accessibilityLabel="Profile settings"
              accessibilityRole="button"
              accessibilityHint="Opens your profile and settings"
            >
              <MaterialIcons name="person" size={24} color={darkAccent.text} accessible={false} />
            </Pressable>
          </Animated.View>

          {/* Risk Alert Card */}
          {hasAnyRisk && primaryPattern && (
            <RiskAlertCard
              pattern={primaryPattern}
              onDismiss={() => dismiss(primaryPattern.type)}
              onNotifySponsor={
                primaryPattern.canNotifySponsor
                  ? () => notifySponsorAbout(primaryPattern)
                  : undefined
              }
            />
          )}

          {/* Sobriety Counter Card with Circular Rings */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <GlassCard intensity="heavy" glow glowColor={darkAccent.success}>
              <View style={styles.counterHeader}>
                <View style={styles.badge}>
                  <MaterialIcons name="local-fire-department" size={16} color="#FBBF24" accessible={false} />
                  <Text style={styles.badgeText}>STREAK ACTIVE</Text>
                </View>
              </View>
              
              {/* Circular Progress Rings */}
              <View style={styles.circularRingsContainer}>
                <CircularProgressRing
                  days={days}
                  hours={hours}
                  minutes={minutes}
                  isMilestone={!!nextMilestone && (nextMilestone.days - days) === 0}
                  accessibilityLabel={`${days} days, ${hours} hours, ${minutes} minutes clean`}
                />
              </View>

              {nextMilestone && (
                <View style={styles.milestoneRow}>
                  <MaterialIcons name="emoji-events" size={18} color={darkAccent.warning} accessible={false} />
                  <Text style={styles.milestoneText}>
                    {nextMilestone.days - days} days until {nextMilestone.title}
                  </Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Daily Reading Card */}
          <DailyReadingCard userId={userId} />

          {/* Meeting Check-In Card */}
          <Animated.View entering={FadeInUp.delay(150).duration(600)}>
            <QuickMeetingCheckIn userId={userId} />
          </Animated.View>

          {/* Daily Check-in Card */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <GlassCard intensity="medium">
              <View style={styles.checkinHeader}>
                <Text style={styles.cardTitle} accessibilityRole="header">Daily Check-in</Text>
                <View 
                  style={[styles.statusDot, { backgroundColor: morning ? darkAccent.success : darkAccent.warning }]} 
                  accessibilityLabel={morning ? "Morning check-in completed" : "Morning check-in pending"}
                  accessibilityRole="image"
                />
              </View>
              
              <View style={styles.checkinGrid}>
                <CheckinButton
                  title="Morning"
                  icon="wb-sunny"
                  completed={!!morning}
                  onPress={() => navigation.navigate('MorningIntention' as never)}
                />
                <CheckinButton
                  title="Evening"
                  icon="nights-stay"
                  completed={!!evening}
                  onPress={() => navigation.navigate('EveningPulse' as never)}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Quick Actions Grid */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <ActionTile
                icon="book"
                title="Journal"
                color={gradients.aurora[0]}
                onPress={() => navigation.navigate('JournalList' as never)}
              />
              <ActionTile
                icon="people"
                title="Meetings"
                color={gradients.aurora[1]}
                onPress={() => navigation.navigate('MeetingFinder' as never)}
              />
              <ActionTile
                icon="format-list-numbered"
                title="Steps"
                color={gradients.aurora[2]}
                onPress={() => navigation.navigate('StepsOverview' as never)}
              />
              <ActionTile
                icon="trending-up"
                title="Progress"
                color={gradients.ocean[0]}
                onPress={() => navigation.navigate('ProgressDashboard' as never)}
              />
            </View>
          </Animated.View>

          {/* Bottom padding for FAB */}
          <View style={{ height: 100 }} />
        </AnimatedScrollView>
      </SafeAreaView>

      {/* Emergency FAB */}
      <Animated.View 
        entering={FadeIn.delay(500)}
        style={styles.fabContainer}
      >
        <GradientButton
          title="Emergency Support"
          variant="danger"
          size="lg"
          icon={<MaterialIcons name="phone" size={20} color="#FFF" accessible={false} />}
          onPress={handleEmergency}
          haptic
          accessibilityLabel="Emergency support"
          accessibilityRole="button"
          accessibilityHint="Call emergency support contact immediately"
        />
      </Animated.View>
    </View>
  );
}

// Sub-components
function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.timeUnit}>
      <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );
}

function CheckinButton({
  title,
  icon,
  completed,
  onPress,
}: {
  title: string;
  icon: string;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <GlassCard
      intensity="light"
      pressable
      onPress={onPress}
      style={[styles.checkinButton, completed && styles.checkinCompleted]}
      accessibilityLabel={`${title} check-in`}
      accessibilityRole="button"
      accessibilityHint={completed ? `${title} check-in completed` : `Start ${title} check-in`}
      accessibilityState={{ disabled: completed }}
    >
      <MaterialIcons
        name={completed ? 'check-circle' : (icon as any)}
        size={24}
        color={completed ? darkAccent.success : darkAccent.textMuted}
        accessible={false}
      />
      <Text style={[styles.checkinText, completed && styles.checkinTextCompleted]}>
        {title}
      </Text>
    </GlassCard>
  );
}

function ActionTile({
  icon,
  title,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <GlassCard
      intensity="light"
      pressable
      onPress={onPress}
      style={styles.actionTile}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityHint={`Open ${title}`}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <MaterialIcons name={icon as any} size={24} color={color} accessible={false} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: darkAccent.primary,
    opacity: 0.08,
    blurRadius: 100,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[3],
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  greeting: {
    ...typography.h2,
    color: darkAccent.text,
  },
  subtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  counterMain: {
    alignItems: 'center',
    marginVertical: spacing[2],
  },
  daysCount: {
    fontSize: 72,
    fontWeight: '800',
    color: darkAccent.text,
    letterSpacing: -2,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkAccent.success,
    letterSpacing: 2,
    marginTop: -8,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: darkAccent.text,
  },
  timeLabel: {
    fontSize: 11,
    color: darkAccent.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  circularRingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[4],
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  milestoneText: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
  },
  checkinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  cardTitle: {
    ...typography.h4,
    color: darkAccent.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkinGrid: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  checkinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing[2],
  },
  checkinCompleted: {
    borderColor: `${darkAccent.success}40`,
    backgroundColor: `${darkAccent.success}10`,
  },
  checkinText: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    fontWeight: '600',
  },
  checkinTextCompleted: {
    color: darkAccent.success,
  },
  sectionTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  actionTile: {
    width: '47%',
    alignItems: 'center',
    padding: spacing[2.5],
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1.5],
  },
  actionTitle: {
    ...typography.bodySmall,
    color: darkAccent.text,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[3],
    right: spacing[3],
  },
});
