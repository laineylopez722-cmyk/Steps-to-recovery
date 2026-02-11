/**
 * Recovery Components Example Usage
 * Demonstrates how to use all recovery-specific components
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  StreakCounter,
  StreakHistoryGraph,
  DailyCheckInCard,
  JournalEntryCard,
  StepProgressTracker,
  AchievementBadge,
  CompactCrisisButton,
  type StreakData,
  type DailyActivity,
  type CheckInData,
  type JournalEntry,
  type StepData,
  type Achievement,
} from '../index';

// Example: StreakCounter
export function StreakCounterExample(): React.ReactElement {
  const streakData: StreakData = {
    days: 30,
    hours: 12,
    minutes: 45,
    lastResetDate: new Date('2026-01-12'),
    nextMilestone: 60,
  };

  const history: DailyActivity[] = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    morningCompleted: Math.random() > 0.3,
    eveningCompleted: Math.random() > 0.4,
  }));

  return (
    <View style={styles.section}>
      <StreakCounter
        data={streakData}
        history={history}
        onPress={() => console.log('Streak pressed')}
        onShowHistory={() => console.log('Show history')}
      />
      <View style={styles.spacer} />
      <StreakHistoryGraph
        history={history}
        onDayPress={(day) => console.log('Day pressed:', day)}
      />
    </View>
  );
}

// Example: DailyCheckInCard
export function DailyCheckInCardExample(): React.ReactElement {
  const [checkInData, _setCheckInData] = useState<CheckInData>({
    morning: {
      completed: true,
      time: '7:30 AM',
      mood: 4,
      intention: 'Stay present and kind',
    },
    evening: {
      completed: false,
      time: undefined,
      cravingIntensity: 3,
    },
  });

  return (
    <View style={styles.section}>
      <DailyCheckInCard
        date={new Date()}
        checkInData={checkInData}
        onMorningPress={() => console.log('Morning check-in')}
        onEveningPress={() => console.log('Evening check-in')}
        onCompletePress={() => console.log('Complete check-in')}
      />
    </View>
  );
}

// Example: JournalEntryCard
export function JournalEntryCardExample(): React.ReactElement {
  const entry: JournalEntry = {
    id: '1',
    title: 'Grateful for support',
    date: new Date('2026-02-10T14:30:00'),
    mood: 'great',
    tags: ['Gratitude', 'Family', 'Support'],
    hasCraving: true,
    cravingIntensity: 4,
    isSharedWithSponsor: true,
    sponsorAvatar: '👤',
  };

  const entry2: JournalEntry = {
    id: '2',
    title: 'Tough day but made it',
    date: new Date('2026-02-09T20:15:00'),
    mood: 'neutral',
    tags: ['Struggle', 'Resilience'],
    hasCraving: false,
    isSharedWithSponsor: false,
  };

  return (
    <View style={styles.section}>
      <JournalEntryCard
        entry={entry}
        onPress={(e) => console.log('Entry pressed:', e.id)}
        onSharePress={(e) => console.log('Share:', e.id)}
      />
      <View style={styles.spacer} />
      <JournalEntryCard entry={entry2} onPress={(e) => console.log('Entry pressed:', e.id)} />
    </View>
  );
}

// Example: StepProgressTracker
export function StepProgressTrackerExample(): React.ReactElement {
  const steps: StepData[] = [
    { number: 1, status: 'completed', title: 'We admitted...' },
    { number: 2, status: 'completed', title: 'Came to believe...' },
    { number: 3, status: 'completed', title: 'Made a decision...' },
    { number: 4, status: 'current', title: 'Made a searching...' },
    { number: 5, status: 'not-started', title: 'Admitted to God...' },
    { number: 6, status: 'not-started', title: 'Were entirely ready...' },
    { number: 7, status: 'not-started', title: 'Humbly asked...' },
    { number: 8, status: 'not-started', title: 'Made a list...' },
    { number: 9, status: 'not-started', title: 'Made direct amends...' },
    { number: 10, status: 'not-started', title: 'Continued to take...' },
    { number: 11, status: 'not-started', title: 'Sought through prayer...' },
    { number: 12, status: 'not-started', title: 'Having had a spiritual...' },
  ];

  return (
    <View style={styles.section}>
      <StepProgressTracker
        steps={steps}
        currentStep={4}
        onStepPress={(step) => console.log('Step pressed:', step.number)}
      />
    </View>
  );
}

// Example: AchievementBadge
export function AchievementBadgeExample(): React.ReactElement {
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first day',
      icon: 'award',
      unlocked: true,
      unlockedDate: new Date('2026-01-12'),
      color: '#6B9B8D',
    },
    {
      id: '2',
      name: '7 Days Strong',
      description: 'One week of recovery',
      icon: 'flame',
      unlocked: true,
      unlockedDate: new Date('2026-01-19'),
      color: '#D4A574',
    },
    {
      id: '3',
      name: '30 Day Milestone',
      description: 'A full month!',
      icon: 'trophy',
      unlocked: true,
      unlockedDate: new Date('2026-02-11'),
      color: '#F4B942',
    },
    {
      id: '4',
      name: '90 Day Warrior',
      description: 'Three months of strength',
      icon: 'star',
      unlocked: false,
      color: '#E8A89A',
    },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.achievementGrid}>
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onPress={(a) => console.log('Achievement:', a.name)}
            showConfetti={achievement.id === '3'}
          />
        ))}
      </View>
    </View>
  );
}

// Example: CrisisFAB
export function CrisisFABExample(): React.ReactElement {
  return (
    <View style={styles.section}>
      <CompactCrisisButton
        onPress={() => console.log('Crisis button pressed')}
        label="Get Help Now"
      />
      {/* CrisisFAB would be used at the screen level, not in scroll view */}
    </View>
  );
}

// Complete showcase
export function RecoveryComponentsShowcase(): React.ReactElement {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StreakCounterExample />
      <DailyCheckInCardExample />
      <JournalEntryCardExample />
      <StepProgressTrackerExample />
      <AchievementBadgeExample />
      <CrisisFABExample />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  spacer: {
    height: 16,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
});

export default RecoveryComponentsShowcase;
