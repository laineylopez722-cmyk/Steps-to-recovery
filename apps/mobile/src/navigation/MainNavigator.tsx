import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { SecuritySettingsScreen } from '../features/settings/screens/SecuritySettingsScreen';
import { WidgetSettingsScreen } from '../features/settings/screens/WidgetSettingsScreen';
import { PrivacyPolicyScreen } from '../features/settings/screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../features/settings/screens/TermsOfServiceScreen';
import { SponsorScreen } from '../features/sponsor/screens/SponsorScreen';
import { InviteSponsorScreen } from '../features/sponsor/screens/InviteSponsorScreen';
import { SharedEntriesScreen } from '../features/sponsor/screens/SharedEntriesScreen';
import { ShareEntriesScreen } from '../features/sponsor/screens/ShareEntriesScreen';
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
import { BeforeYouUseScreen } from '../features/crisis/screens/BeforeYouUseScreen';
import { ChatScreen } from '../features/ai-companion/components/ChatScreen';
import { PersonalInventoryScreen } from '../features/inventory/screens/PersonalInventoryScreen';
import { AISettingsScreen } from '../features/ai-companion/screens/AISettingsScreen';
import { CravingSurfScreen } from '../features/craving-surf/screens/CravingSurfScreen';
import { GratitudeScreen } from '../features/gratitude/screens/GratitudeScreen';
import { SafetyPlanScreen } from '../features/safety-plan/screens/SafetyPlanScreen';
import { ChallengesScreen } from '../features/challenges/screens/ChallengesScreen';
import { StatusBar } from 'expo-status-bar';
import { useDs, useDsIsDark } from '../design-system/DsProvider';
import { CustomTabBar } from './CustomTabBar';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import type {
  MainTabParamList,
  HomeStackParamList,
  JournalStackParamList,
  StepsStackParamList,
  MeetingsStackParamList,
  ProfileStackParamList,
  HomeStackScreenProps,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();
const StepsStack = createNativeStackNavigator<StepsStackParamList>();
const MeetingsStack = createNativeStackNavigator<MeetingsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function SafeDialInterventionRouteScreen({
  route,
  navigation,
}: HomeStackScreenProps<'SafeDialIntervention'>): React.ReactElement {
  const { user } = useAuth();
  const { contactName, phoneNumber } = route.params;

  return (
    <SafeDialInterventionScreen
      riskyContact={{
        id: '',
        userId: user?.id || '',
        name: contactName,
        phoneNumber,
        relationshipType: 'other',
        notes: '',
        addedAt: new Date().toISOString(),
        isActive: true,
      }}
      onDismiss={() => navigation.goBack()}
    />
  );
}
// Dark header style for all stacks (theme-aware)
function useDarkHeaderOptions() {
  const ds = useDs();
  return {
    headerStyle: {
      backgroundColor: ds.semantic.surface.app,
    },
    headerTintColor: ds.semantic.text.primary,
    headerTitleStyle: {
      fontWeight: '600' as const,
      fontSize: 17,
    },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    headerLargeTitle: false,
    animation: 'fade_from_bottom' as const,
    animationDuration: 200,
  };
}

function HomeStackNavigator(): React.ReactElement {
  const { user } = useAuth();
  const userId = user?.id || '';
  const darkHeaderOptions = useDarkHeaderOptions();

  return (
    <ScreenErrorBoundary screenName="HomeStack">
    <HomeStack.Navigator screenOptions={darkHeaderOptions}>
      <HomeStack.Screen name="HomeMain" options={{ headerShown: false }}>
        {() => <HomeScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="MorningIntention"
        options={{ headerShown: false }}
      >
        {() => <MorningIntentionScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="EveningPulse"
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
        component={MeetingStatsScreen}
      />
      <HomeStack.Screen
        name="Achievements"
        options={{ headerShown: false }}
        component={AchievementsScreen}
      />
      <HomeStack.Screen
        name="Challenges"
        options={{ title: 'Challenges', headerBackTitle: 'Back' }}
      >
        {() => <ChallengesScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="DangerZone"
        options={{ title: 'Trigger Protection', headerBackTitle: 'Back' }}
        component={DangerZoneScreen}
      />
      <HomeStack.Screen
        name="SafeDialIntervention"
        component={SafeDialInterventionRouteScreen}
        options={{
          title: 'Stop',
          headerShown: false,
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      />
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
      <HomeStack.Screen
        name="PersonalInventory"
        options={{ headerShown: false }}
      >
        {() => <PersonalInventoryScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="Gratitude"
        options={{ headerShown: false }}
      >
        {() => <GratitudeScreen userId={userId} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="CravingSurf"
        component={CravingSurfScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="SafetyPlan"
        options={{ title: 'Safety Plan', headerBackTitle: 'Back' }}
      >
        {() => <SafetyPlanScreen userId={userId} />}
      </HomeStack.Screen>
    </HomeStack.Navigator>
    </ScreenErrorBoundary>
  );
}

function JournalStackNavigator(): React.ReactElement {
  const { user } = useAuth();
  const userId = user?.id || '';
  const darkHeaderOptions = useDarkHeaderOptions();

  return (
    <ScreenErrorBoundary screenName="JournalStack">
    <JournalStack.Navigator screenOptions={darkHeaderOptions}>
      <JournalStack.Screen name="JournalList" options={{ headerShown: false }}>
        {() => <JournalListScreen userId={userId} />}
      </JournalStack.Screen>
      <JournalStack.Screen name="JournalEditor" options={{ headerShown: false }}>
        {() => <JournalEditorScreen userId={userId} />}
      </JournalStack.Screen>
    </JournalStack.Navigator>
    </ScreenErrorBoundary>
  );
}

function StepsStackNavigator(): React.ReactElement {
  const { user } = useAuth();
  const userId = user?.id || '';
  const darkHeaderOptions = useDarkHeaderOptions();

  return (
    <ScreenErrorBoundary screenName="StepsStack">
    <StepsStack.Navigator screenOptions={darkHeaderOptions}>
      <StepsStack.Screen name="StepsOverview" options={{ headerShown: false }}>
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
    </ScreenErrorBoundary>
  );
}

function MeetingsStackNavigator(): React.ReactElement {
  const darkHeaderOptions = useDarkHeaderOptions();
  return (
    <ScreenErrorBoundary screenName="MeetingsStack">
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
    </ScreenErrorBoundary>
  );
}

function ProfileStackNavigator(): React.ReactElement {
  const darkHeaderOptions = useDarkHeaderOptions();
  return (
    <ScreenErrorBoundary screenName="ProfileStack">
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
        options={{ headerShown: false }}
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
        name="ShareEntries"
        component={ShareEntriesScreen}
        options={{ title: 'Share Entries', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="AISettings"
        component={AISettingsScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={{ title: 'Privacy & Security', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="WidgetSettings"
        component={WidgetSettingsScreen}
        options={{ title: 'Home Screen Widget', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service', headerBackTitle: 'Back' }}
      />
    </ProfileStack.Navigator>
    </ScreenErrorBoundary>
  );
}

export function MainNavigator(): React.ReactElement {
  const isDark = useDsIsDark();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ tabBarAccessibilityLabel: 'Home' }}
        />
        <Tab.Screen
          name="Journal"
          component={JournalStackNavigator}
          options={{ tabBarAccessibilityLabel: 'Journal' }}
        />
        <Tab.Screen
          name="Steps"
          component={StepsStackNavigator}
          options={{ tabBarAccessibilityLabel: 'Steps' }}
        />
        <Tab.Screen
          name="Meetings"
          component={MeetingsStackNavigator}
          options={{ tabBarAccessibilityLabel: 'Meetings' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{ tabBarAccessibilityLabel: 'Profile' }}
        />
      </Tab.Navigator>
    </>
  );
}
