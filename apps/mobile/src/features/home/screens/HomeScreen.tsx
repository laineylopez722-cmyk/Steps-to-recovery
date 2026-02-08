/**
 * Home Screen
 * 
 * Apple-inspired design. Premium, minimal, confident.
 * No visible borders. Depth through background layers.
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
import Animated, { 
  FadeIn, 
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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
    day: 'numeric' 
  });
}

// Animated Pressable Card
function ActionCard({ 
  children, 
  onPress,
  style,
  delay = 0,
}: { 
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  delay?: number;
}) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, ds.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ds.spring.smooth);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[style, animatedStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Task Item - No borders, subtle differentiation
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
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable 
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98, ds.spring.snappy); }}
      onPressOut={() => { scale.value = withSpring(1, ds.spring.smooth); }}
    >
      <Animated.View style={[styles.taskItem, animatedStyle]}>
        <View style={[styles.taskIcon, done && styles.taskIconDone]}>
          <Feather 
            name={done ? 'check' : icon} 
            size={ds.sizes.iconMd} 
            color={done ? ds.colors.success : ds.colors.textTertiary} 
          />
        </View>
        
        <View style={styles.taskContent}>
          <Text style={[styles.taskLabel, done && styles.taskLabelDone]}>
            {label}
          </Text>
          <Text style={styles.taskSublabel}>{sublabel}</Text>
        </View>
        
        <View style={styles.taskChevron}>
          <Feather 
            name="chevron-right" 
            size={ds.sizes.iconSm} 
            color={ds.colors.textQuaternary} 
          />
        </View>
      </Animated.View>
      
      {!isLast && <View style={styles.taskDivider} />}
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
          <Animated.View entering={FadeIn.duration(300)}>
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
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <View>
              <Text style={styles.date}>{date}</Text>
              <Text style={styles.greeting}>{greeting}</Text>
            </View>
            
            <Pressable 
              onPress={handleProfile} 
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.profileButtonPressed,
              ]}
            >
              <Feather name="user" size={ds.sizes.iconMd} color={ds.colors.textPrimary} />
            </Pressable>
          </Animated.View>

          {/* Hero - Day Counter */}
          <Animated.View entering={FadeIn.delay(150).duration(600)} style={styles.hero}>
            <SobrietyCandle 
              days={days} 
              size={1.3}
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
          <ActionCard onPress={handleCompanion} delay={200}>
            <View style={styles.companionCard}>
              <View style={styles.companionIcon}>
                <Feather name="message-circle" size={26} color="#000" />
              </View>
              <View style={styles.companionContent}>
                <Text style={styles.companionTitle}>What's on your mind?</Text>
                <Text style={styles.companionSubtitle}>Talk it through</Text>
              </View>
              <Feather name="arrow-right" size={22} color="rgba(0,0,0,0.4)" />
            </View>
          </ActionCard>

          {/* Today Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            
            <View style={styles.taskList}>
              <TaskItem
                icon="sun"
                label="Morning check-in"
                sublabel={morning ? 'Done' : 'Set your intention'}
                done={!!morning}
                onPress={handleMorning}
              />
              
              <TaskItem
                icon="book-open"
                label="Daily reading"
                sublabel="Today's reflection"
                onPress={handleReading}
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
    fontSize: 32,
    color: ds.colors.textQuaternary,
    letterSpacing: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: ds.space[6],
    paddingBottom: ds.space[4],
  },
  date: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  profileButtonPressed: {
    backgroundColor: ds.colors.bgQuaternary,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: ds.space[6],
    paddingBottom: ds.space[8],
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: ds.space[5],
    gap: ds.space[2],
  },
  dayCount: {
    fontSize: 64,
    fontWeight: '700',
    color: ds.colors.textPrimary,
    letterSpacing: -2,
  },
  dayLabel: {
    fontSize: 24,
    fontWeight: '500',
    color: ds.colors.textTertiary,
  },

  // Section
  section: {
    marginTop: ds.space[4],
  },
  sectionTitle: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: ds.space[3],
    marginLeft: ds.space[1],
  },

  // Task List - No borders
  taskList: {
    backgroundColor: ds.colors.bgTertiary,
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
    backgroundColor: ds.colors.bgQuaternary,
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
    color: ds.colors.textPrimary,
    fontWeight: '500',
  },
  taskLabelDone: {
    color: ds.colors.textSecondary,
  },
  taskSublabel: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
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

  // Companion Card - Premium amber
  companionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.accent,
    borderRadius: ds.radius.xl,
    paddingVertical: ds.space[5],
    paddingHorizontal: ds.space[5],
    marginBottom: ds.space[6],
    ...ds.shadows.md,
  },
  companionIcon: {
    width: 52,
    height: 52,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  companionSubtitle: {
    ...ds.typography.caption,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 2,
  },
});
