import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../design-system';
import { FloatingActionButton } from '../../../design-system';
import { CleanTimeTracker } from '../components/CleanTimeTracker';
import { DailyCheckInCard } from '../components/DailyCheckInCard';
import { QuickActions } from '../components/QuickActions';
import { SyncStatusIndicator } from '../components/SyncStatusIndicator';
import { useCleanTime } from '../hooks/useCleanTime';
import { useTodayCheckIns } from '../hooks/useCheckIns';

interface HomeScreenProps {
  userId: string;
}

export function HomeScreen({ userId }: HomeScreenProps): React.ReactElement {
  const navigation = useNavigation();
  const theme = useTheme();
  const {
    days,
    hours,
    minutes,
    seconds,
    nextMilestone,
    isLoading: cleanTimeLoading,
  } = useCleanTime(userId);
  const { morning, evening, isLoading: checkInsLoading } = useTodayCheckIns(userId);

  const handleEmergency = (): void => {
    navigation.navigate('Emergency' as never);
  };

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          accessibilityRole="scrollbar"
          accessibilityLabel="Home screen content"
        >
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Text style={{ fontSize: 20, marginRight: 8 }} accessible={false}>✨</Text>
              <Text 
                style={[theme.typography.h1, { color: theme.colors.text, fontSize: 24 }]}
                accessibilityRole="header"
                accessibilityLabel="Welcome back"
              >
                Welcome back
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              This space keeps the next right move visible, not overwhelming.
            </Text>
          </View>

          <CleanTimeTracker
            days={days}
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            nextMilestone={nextMilestone}
            isLoading={cleanTimeLoading}
          />

          <SyncStatusIndicator />

          <DailyCheckInCard
            morningCheckIn={morning}
            eveningCheckIn={evening}
            isLoading={checkInsLoading}
            userId={userId}
          />

          <QuickActions userId={userId} />
        </ScrollView>
      </SafeAreaView>

      <FloatingActionButton
        icon={<MaterialIcons name="phone" size={24} color="#FFFFFF" />}
        label="Emergency"
        variant="danger"
        onPress={handleEmergency}
        accessibilityLabel="Emergency support button - Call emergency support contact"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
