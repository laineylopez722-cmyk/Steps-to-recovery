import React from 'react';
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
import { MindfulnessLibraryScreen } from '../features/mindfulness/screens/MindfulnessLibraryScreen';
import { MeditationPlayerScreen } from '../features/mindfulness/screens/MeditationPlayerScreen';
import { CopingRecommendationsScreen } from '../features/craving-surf/screens/CopingRecommendationsScreen';
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

// ---------------------------------------------------------------------------
// Per-screen error boundary wrappers for `component=` screens.
// Defined at module level so React Navigation does not remount on re-render.
// A crash in one screen only takes down that screen, not the entire tab.
// ---------------------------------------------------------------------------
function boundScreen<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  screenName: string,
): React.FC<P> {
  const Wrapper: React.FC<P> = (props) => (
    <ScreenErrorBoundary screenName={screenName}>
      <Component {...props} />
    </ScreenErrorBoundary>
  );
  Wrapper.displayName = `Bounded(${screenName})`;
  return Wrapper;
}

// Home stack — component= screens
const BoundedMeetingStatsScreen = boundScreen(MeetingStatsScreen, 'MeetingStats');
const BoundedAchievementsScreen = boundScreen(AchievementsScreen, 'Achievements');
const BoundedDangerZoneScreen = boundScreen(DangerZoneScreen, 'DangerZone');
const BoundedCravingSurfScreen = boundScreen(CravingSurfScreen, 'CravingSurf');
// Steps stack
const BoundedStepDetailScreen = boundScreen(StepDetailScreen, 'StepDetail');
const BoundedStepReviewScreen = boundScreen(StepReviewScreen, 'StepReview');
// Meetings stack
const BoundedMeetingFinderScreen = boundScreen(MeetingFinderScreen, 'MeetingFinder');
const BoundedMeetingDetailScreen = boundScreen(MeetingDetailScreen, 'MeetingDetail');
const BoundedFavoriteMeetingsScreen = boundScreen(FavoriteMeetingsScreen, 'FavoriteMeetings');
// Profile stack
const BoundedProfileScreen = boundScreen(ProfileScreen, 'ProfileHome');
const BoundedSponsorScreen = boundScreen(SponsorScreen, 'Sponsor');
const BoundedNotificationSettingsScreen = boundScreen(NotificationSettingsScreen, 'NotificationSettings');
const BoundedInviteSponsorScreen = boundScreen(InviteSponsorScreen, 'InviteSponsor');
const BoundedSharedEntriesScreen = boundScreen(SharedEntriesScreen, 'SharedEntries');
const BoundedShareEntriesScreen = boundScreen(ShareEntriesScreen, 'ShareEntries');
const BoundedAISettingsScreen = boundScreen(AISettingsScreen, 'AISettings');
const BoundedSecuritySettingsScreen = boundScreen(SecuritySettingsScreen, 'SecuritySettings');
const BoundedWidgetSettingsScreen = boundScreen(WidgetSettingsScreen, 'WidgetSettings');
const BoundedPrivacyPolicyScreen = boundScreen(PrivacyPolicyScreen, 'PrivacyPolicy');
const BoundedTermsOfServiceScreen = boundScreen(TermsOfServiceScreen, 'TermsOfService');

function SafeDialInterventionRouteScreen({
  route,
  navigation,
}: HomeStackScreenProps<'SafeDialIntervention'>): React.ReactElement {
  const { user } = useAuth();
  const { contactName, phoneNumber } = route.params;

  return (
    <ScreenErrorBoundary screenName="SafeDialIntervention">
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
    </ScreenErrorBoundary>
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
        {() => (
          <ScreenErrorBoundary screenName="Home">
            <HomeScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="MorningIntention"
        options={{ headerShown: false }}
      >
        {() => (
          <ScreenErrorBoundary screenName="MorningIntention">
            <MorningIntentionScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="EveningPulse"
        options={{ headerShown: false }}
      >
        {() => (
          <ScreenErrorBoundary screenName="EveningPulse">
            <EveningPulseScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="Emergency"
        options={{ title: 'Emergency Support', headerBackTitle: 'Back', presentation: 'modal' }}
      >
        {() => (
          <ScreenErrorBoundary screenName="Emergency">
            <EmergencyScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="DailyReading"
        options={{ title: "Today's Reading", headerBackTitle: 'Back' }}
      >
        {() => (
          <ScreenErrorBoundary screenName="DailyReading">
            <DailyReadingScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="ProgressDashboard"
        options={{ title: 'My Progress', headerBackTitle: 'Back' }}
      >
        {() => (
          <ScreenErrorBoundary screenName="ProgressDashboard">
            <ProgressDashboardScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="MeetingStats"
        options={{ headerShown: false }}
        component={BoundedMeetingStatsScreen}
      />
      <HomeStack.Screen
        name="Achievements"
        options={{ headerShown: false }}
        component={BoundedAchievementsScreen}
      />
      <HomeStack.Screen
        name="Challenges"
        options={{ title: 'Challenges', headerBackTitle: 'Back' }}
      >
        {() => (
          <ScreenErrorBoundary screenName="Challenges">
            <ChallengesScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="DangerZone"
        options={{ title: 'Trigger Protection', headerBackTitle: 'Back' }}
        component={BoundedDangerZoneScreen}
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
        {() => (
          <ScreenErrorBoundary screenName="BeforeYouUse">
            <BeforeYouUseScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="CompanionChat"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      >
        {() => (
          <ScreenErrorBoundary screenName="CompanionChat">
            <ChatScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="PersonalInventory"
        options={{ headerShown: false }}
      >
        {() => (
          <ScreenErrorBoundary screenName="PersonalInventory">
            <PersonalInventoryScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="Gratitude"
        options={{ headerShown: false }}
      >
        {() => (
          <ScreenErrorBoundary screenName="Gratitude">
            <GratitudeScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="CravingSurf"
        component={BoundedCravingSurfScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="SafetyPlan"
        options={{ title: 'Safety Plan', headerBackTitle: 'Back' }}
      >
        {() => (
          <ScreenErrorBoundary screenName="SafetyPlan">
            <SafetyPlanScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="MindfulnessLibrary"
        component={MindfulnessLibraryScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="MeditationPlayer"
        component={MeditationPlayerScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="CopingRecommendations"
        component={CopingRecommendationsScreen}
        options={{ headerShown: false }}
      />
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
        {() => (
          <ScreenErrorBoundary screenName="JournalList">
            <JournalListScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </JournalStack.Screen>
      <JournalStack.Screen name="JournalEditor" options={{ headerShown: false }}>
        {() => (
          <ScreenErrorBoundary screenName="JournalEditor">
            <JournalEditorScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
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
        {() => (
          <ScreenErrorBoundary screenName="StepsOverview">
            <StepsOverviewScreen userId={userId} />
          </ScreenErrorBoundary>
        )}
      </StepsStack.Screen>
      <StepsStack.Screen
        name="StepDetail"
        component={BoundedStepDetailScreen}
        options={({ route }) => ({
          title: `Step ${(route.params as { stepNumber: number }).stepNumber}`,
          headerBackTitle: 'Steps',
        })}
      />
      <StepsStack.Screen
        name="StepReview"
        component={BoundedStepReviewScreen}
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
        component={BoundedMeetingFinderScreen}
        options={{ title: 'Find Meetings' }}
      />
      <MeetingsStack.Screen
        name="MeetingDetail"
        component={BoundedMeetingDetailScreen}
        options={{ title: 'Meeting Details', headerBackTitle: 'Back' }}
      />
      <MeetingsStack.Screen
        name="FavoriteMeetings"
        component={BoundedFavoriteMeetingsScreen}
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
        component={BoundedProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Sponsor"
        component={BoundedSponsorScreen}
        options={{ title: 'Sponsor', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="NotificationSettings"
        component={BoundedNotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="InviteSponsor"
        component={BoundedInviteSponsorScreen}
        options={{ title: 'Find a Sponsor', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="SharedEntries"
        component={BoundedSharedEntriesScreen}
        options={{ title: 'Shared Entries', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="ShareEntries"
        component={BoundedShareEntriesScreen}
        options={{ title: 'Share Entries', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="AISettings"
        component={BoundedAISettingsScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="SecuritySettings"
        component={BoundedSecuritySettingsScreen}
        options={{ title: 'Privacy & Security', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="WidgetSettings"
        component={BoundedWidgetSettingsScreen}
        options={{ title: 'Home Screen Widget', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="PrivacyPolicy"
        component={BoundedPrivacyPolicyScreen}
        options={{ title: 'Privacy Policy', headerBackTitle: 'Back' }}
      />
      <ProfileStack.Screen
        name="TermsOfService"
        component={BoundedTermsOfServiceScreen}
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
