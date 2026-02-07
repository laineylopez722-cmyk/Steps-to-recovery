/**
 * Home Screen
 * 
 * Following design system strictly.
 * Clean, confident, professional.
 */

import React, { useMemo, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCleanTime } from '../hooks/useCleanTime';
import { useTodayCheckIns } from '../hooks/useCheckIns';
import { ds } from '../../../design-system/tokens/ds';
import { SobrietyCandle } from '../../../design-system/components';
import type { HomeStackParamList } from '../../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface HomeScreenProps {
  userId: string;
}

// Get greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Format date
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Task Item Component
function TaskItem({ 
  icon, 
  label, 
  sublabel,
  done,
  onPress,
}: { 
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sublabel: string;
  done?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.taskItem,
        pressed && styles.taskItemPressed,
      ]}
    >
      <View style={[styles.taskIcon, done && styles.taskIconDone]}>
        <Feather 
          name={done ? 'check' : icon} 
          size={ds.sizes.iconMd} 
          color={done ? ds.colors.success : ds.colors.textSecondary} 
        />
      </View>
      
      <View style={styles.taskContent}>
        <Text style={[styles.taskLabel, done && styles.taskLabelDone]}>
          {label}
        </Text>
        <Text style={styles.taskSublabel}>{sublabel}</Text>
      </View>
      
      <Feather 
        name="chevron-right" 
        size={ds.sizes.iconSm} 
        color={ds.colors.textQuaternary} 
      />
    </Pressable>
  );
}

export function HomeScreen({ userId }: HomeScreenProps): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { days, isLoading: loadingDays } = useCleanTime(userId);
  const { morning, evening, isLoading: loadingCheckins } = useTodayCheckIns(userId);

  const greeting = useMemo(() => getGreeting(), []);
  const date = useMemo(() => formatDate(), []);

  const handleMorning = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('MorningIntention');
  }, [navigation]);
  
  const handleReading = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('DailyReading');
  }, [navigation]);
  
  const handleEvening = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('EveningPulse');
  }, [navigation]);
  
  const handleCompanion = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate('CompanionChat');
  }, [navigation]);
  
  const handleProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.getParent()?.navigate('Profile' as never);
  }, [navigation]);

  if (loadingDays || loadingCheckins) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
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
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <View>
              <Text style={styles.date}>{date}</Text>
              <Text style={styles.greeting}>{greeting}</Text>
            </View>
            
            <Pressable onPress={handleProfile} style={styles.profileButton}>
              <Feather name="user" size={ds.sizes.iconMd} color={ds.colors.textPrimary} />
            </Pressable>
          </Animated.View>

          {/* Hero - Candle Visualization */}
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.hero}>
            <SobrietyCandle 
              days={days} 
              size={1.2}
              maxDays={365}
            />
            <View style={styles.dayInfo}>
              <Text style={styles.dayCount}>{days}</Text>
              <Text style={styles.dayLabel}>
                {days === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </Animated.View>

          {/* Companion Card - Primary CTA */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Pressable 
              onPress={handleCompanion}
              style={({ pressed }) => [
                styles.companionCard,
                pressed && styles.companionCardPressed,
              ]}
            >
              <View style={styles.companionIcon}>
                <Feather name="message-circle" size={24} color={ds.colors.textPrimary} />
              </View>
              <View style={styles.companionContent}>
                <Text style={styles.companionTitle}>What's on your mind?</Text>
                <Text style={styles.companionSubtitle}>Tap to chat</Text>
              </View>
              <Feather name="chevron-right" size={20} color={ds.colors.textQuaternary} />
            </Pressable>
          </Animated.View>

          {/* Tasks */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            
            <View style={styles.taskList}>
              <TaskItem
                icon="sun"
                label="Morning check-in"
                sublabel={morning ? 'Completed' : 'Set your intention'}
                done={!!morning}
                onPress={handleMorning}
              />
              
              <View style={styles.taskDivider} />
              
              <TaskItem
                icon="book-open"
                label="Daily reading"
                sublabel="Reflect on today's wisdom"
                onPress={handleReading}
              />
              
              <View style={styles.taskDivider} />
              
              <TaskItem
                icon="moon"
                label="Evening reflection"
                sublabel={evening ? 'Completed' : 'Review your day'}
                done={!!evening}
                onPress={handleEvening}
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
    paddingHorizontal: ds.sizes.contentPadding,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: ds.space[4],
    paddingBottom: ds.space[6],
  },
  date: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginBottom: ds.space[1],
  },
  greeting: {
    ...ds.typography.h1,
    color: ds.colors.textPrimary,
  },
  profileButton: {
    width: ds.sizes.touchMin,
    height: ds.sizes.touchMin,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: ds.space[8],
    paddingBottom: ds.space[6],
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: ds.space[4],
    gap: ds.space[2],
  },
  dayCount: {
    fontSize: 48,
    fontWeight: '600',
    color: ds.colors.textPrimary,
    letterSpacing: -1,
  },
  dayLabel: {
    ...ds.typography.h3,
    color: ds.colors.textSecondary,
  },

  // Section
  section: {
    marginTop: ds.space[6],
  },
  sectionTitle: {
    ...ds.typography.h2,
    color: ds.colors.textPrimary,
    marginBottom: ds.space[4],
  },

  // Task List
  taskList: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[4],
  },
  taskItemPressed: {
    backgroundColor: ds.colors.bgQuaternary,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.bgQuaternary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconDone: {
    backgroundColor: ds.colors.successMuted,
  },
  taskContent: {
    flex: 1,
    marginLeft: ds.space[3],
  },
  taskLabel: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
  },
  taskLabelDone: {
    color: ds.colors.textSecondary,
  },
  taskSublabel: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginTop: 2,
  },
  taskDivider: {
    height: 1,
    backgroundColor: ds.colors.divider,
    marginLeft: 40 + ds.space[4] + ds.space[3],
  },

  // Companion Card
  companionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B', // Amber accent
    borderRadius: ds.radius.xl,
    padding: ds.space[4],
    marginBottom: ds.space[6],
  },
  companionCardPressed: {
    opacity: 0.9,
  },
  companionIcon: {
    width: 48,
    height: 48,
    borderRadius: ds.radius.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companionContent: {
    flex: 1,
    marginLeft: ds.space[3],
  },
  companionTitle: {
    ...ds.typography.body,
    fontWeight: '600',
    color: '#000',
  },
  companionSubtitle: {
    ...ds.typography.caption,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 2,
  },
});
