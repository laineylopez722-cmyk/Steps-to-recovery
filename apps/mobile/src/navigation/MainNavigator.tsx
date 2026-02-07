import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { JournalListScreen } from '../features/journal/screens/JournalListScreen';
import { JournalEditorScreen } from '../features/journal/screens/JournalEditorScreen';
import { MorningIntentionScreen } from '../features/home/screens/MorningIntentionScreen';
import { EveningPulseScreen } from '../features/home/screens/EveningPulseScreen';
import { EmergencyScreen } from '../features/emergency/screens/EmergencyScreen';
import { StepsOverviewScreen } from '../features/steps/screens/StepsOverviewScreen';
import { StepDetailScreen } from '../features/steps/screens/StepDetailScreen';
import { StepReviewScreen } from '../features/steps/screens/StepReviewScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { NotificationSettingsScreen } from '../features/settings/screens/NotificationSettingsScreen';
import { SponsorScreen } from '../features/sponsor/screens/SponsorScreen';
import { InviteSponsorScreen } from '../features/sponsor/screens/InviteSponsorScreen';
import { SharedEntriesScreen } from '../features/sponsor/screens/SharedEntriesScreen';
import {
  MeetingFinderScreen,
  MeetingDetailScreen,
  FavoriteMeetingsScreen,
} from '../features/meetings/screens';
import { MeetingStatsScreen } from '../features/meetings/screens/MeetingStatsScreen';
import { AchievementsScreen } from '../features/meetings/screens/AchievementsScreen';
import { DailyReadingScreen } from '../features/readings/screens';
import { ProgressDashboardScreen } from '../features/progress/screens';
import { DangerZoneScreen } from '../features/emergency/screens/DangerZoneScreen';
import { SafeDialInterventionScreen } from '../features/emergency/screens/SafeDialInterventionScreen';
import BeforeYouUseScreen from '../features/crisis/screens/BeforeYouUseScreen';
import { ChatScreen } from '../features/ai-companion/components/ChatScreen';
import { AISettingsScreen } from '../features/ai-companion/screens/AISettingsScreen';
import type {
  MainTabParamList,
  HomeStackParamList,
  JournalStackParamList,
  StepsStackParamList,
  MeetingsStackParamList,
  ProfileStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();
const StepsStack = createNativeStackNavigator<StepsStackParamList>();
const MeetingsStack = createNativeStackNavigator<MeetingsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Serene Olive theme colors
const themeColors = {
  background: '#2E3E2C',        // Deep olive
  surface: 'rgba(255, 255, 255, 0.08)',
  accent: '#E8E0D0',            // Warm cream
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(255, 255, 255, 0.1)',
};

// Dark header style for all stacks
const darkHeaderOptions = {
  headerStyle: {
    backgroundColor: themeColors.background,
  },
  headerTintColor: themeColors.text,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 17,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function HomeStackNavigator(): React.ReactElement {
  const { user } = useAuth();
  const userId = user?.id || '';

  return (
    <HomeStack.Navigator screenOptions={darkHeaderOptions}>
      <HomeStack.Screen name="HomeMain" options={{ headerShown: false }}>
        {() => <HomeScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="MorningIntention"
        options={{ title: 'Morning Intention', headerBackTitle: 'Back' }}
      >
        {() => <MorningIntentionScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="EveningPulse"
        options={{ title: 'Evening Pulse Check', headerBackTitle: 'Back' }}
      >
        {() => <EveningPulseScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="Emergency"
        options={{ title: 'Emergency Support', headerBackTitle: 'Back', presentation: 'modal' }}
      >
        {() => <EmergencyScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="DailyReading"
        options={{ title: "Today's Reading", headerBackTitle: 'Back' }}
      >
        {() => <DailyReadingScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="ProgressDashboard"
        options={{ title: 'My Progress', headerBackTitle: 'Back' }}
      >
        {() => <ProgressDashboardScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="MeetingStats"
        options={{ title: 'Meeting Stats', headerBackTitle: 'Back' }}
        component={MeetingStatsScreen}
      />
      <HomeStack.Screen
        name="Achievements"
        options={{ title: 'Achievements', headerBackTitle: 'Back' }}
        component={AchievementsScreen}
      />
      <HomeStack.Screen
        name="DangerZone"
        options={{ title: 'Trigger Protection', headerBackTitle: 'Back' }}
        component={DangerZoneScreen}
      />
      <HomeStack.Screen
        name="SafeDialIntervention"
        options={{
          title: 'Stop',
          headerShown: false,
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      >
        {() => {
          const route = useRoute();
          const navigation = useNavigation();
          const { user } = useAuth();
          const params = route.params as { contactName: string; phoneNumber: string };

          return (
            <SafeDialInterventionScreen
              riskyContact={{
                id: '',
                userId: user?.id || '',
                name: params.contactName,
                phoneNumber: params.phoneNumber,
                relationshipType: 'other',
                notes: '',
                addedAt: new Date().toISOString(),
                isActive: true,
              }}
              onDismiss={() => navigation.goBack()}
            />
          );
        }}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="BeforeYouUse"
        options={{
          title: 'Before You Use',
          headerShown: false,
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      >
        {() => <BeforeYouUseScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="CompanionChat"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      >
        {() => <ChatScreen userId={userId} />}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

function JournalStackNavigator(): React.ReactElement {
  const { user } = useAuth();
  const userId = user?.id || '';

  return (
    <JournalStack.Navigator screenOptions={darkHeaderOptions}>
      <JournalStack.Screen name="JournalList" options={{ title: 'Journal' }}>
        {() => <JournalListScreen userId={userId} />}
      </JournalStack.Screen>
      <JournalStack.Screen
        name="JournalEditor"
        options={{ title: 'Journal Entry', headerBackTitle: 'Back' }}
      >
        {() => <JournalEditorScreen userId={userId} />}
      </JournalStack.Screen>
    </JournalStack.Navigator>
  );
}

function StepsStackNavigator(): React.ReactElement {
  const { user } = useAuth();
  const userId = user?.id || '';

  return (
    <StepsStack.Navigator screenOptions={darkHeaderOptions}>
      <StepsStack.Screen name="StepsOverview" options={{ title: '12 Steps' }}>
        {() => <StepsOverviewScreen userId={userId} />}
      </StepsStack.Screen>
      <StepsStack.Screen
        name="StepDetail"
        component={StepDetailScreen}
        options={({ route }) => ({
          title: `Step ${(route.params as { stepNumber: number }).stepNumber}`,
          headerBackTitle: 'Steps',
        })}
      />
      <StepsStack.Screen
        name="StepReview"
        component={StepReviewScreen}
        options={({ route }) => ({
          title: `Step ${(route.params as { stepNumber: number }).stepNumber} Review`,
          headerBackTitle: 'Step',
        })}
      />
    </StepsStack.Navigator>
  );
}

function MeetingsStackNavigator(): React.ReactElement {
  return (
    <MeetingsStack.Navigator screenOptions={darkHeaderOptions}>
      <MeetingsStack.Screen
        name="MeetingFinder"
        component={MeetingFinderScreen}
        options={{ title: 'Find Meetings' }}
      />
      <MeetingsStack.Screen
        name="MeetingDetail"
        component={MeetingDetailScreen}
        options={{ title: 'Meeting Details', headerBackTitle: 'Back' }}
      />
      <MeetingsStack.Screen
        name="FavoriteMeetings"
        component={FavoriteMeetingsScreen}
        options={{ title: 'Favorite Meetings', headerBackTitle: 'Back' }}
      />
    </MeetingsStack.Navigator>
  );
}

function ProfileStackNavigator(): React.ReactElement {
  return (
    <ProfileStack.Navigator screenOptions={darkHeaderOptions}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Sponsor"
        component={SponsorScreen}
        options={{ title: 'Sponsor', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="InviteSponsor"
        component={InviteSponsorScreen}
        options={{ title: 'Find a Sponsor', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="SharedEntries"
        component={SharedEntriesScreen}
        options={{ title: 'Shared Entries', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="AISettings"
        component={AISettingsScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

export function MainNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          paddingTop: 12,
          paddingBottom: 8,
          height: 70,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Steps"
        component={StepsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="stairs" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Meetings"
        component={MeetingsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
