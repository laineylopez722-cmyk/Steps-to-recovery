import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: undefined;
  MainApp: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeMain: undefined;
  MorningIntention: undefined;
  EveningPulse: undefined;
  Emergency: undefined;
  DailyReading: undefined;
  ProgressDashboard: undefined;
  MeetingStats: undefined;
  Achievements: undefined;
  DangerZone: undefined;
  SafeDialIntervention: { contactName: string; phoneNumber: string };
  BeforeYouUse: undefined;
  CompanionChat: undefined;
  PersonalInventory: undefined;
  CravingSurf: undefined;
  Gratitude: undefined;
  SafetyPlan: undefined;
};

// Journal Stack
export type JournalStackParamList = {
  JournalList: undefined;
  JournalEditor:
    | {
        mode?: 'create' | 'edit';
        entryId?: string;
        initialTitle?: string;
        initialContent?: string;
        tags?: string[];
      }
    | undefined;
};

// Steps Stack
export type StepsStackParamList = {
  StepsOverview: undefined;
  StepDetail: { stepNumber: number; initialQuestion?: number };
  StepReview: { stepNumber: number };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileHome: undefined;
  Sponsor: undefined;
  InviteSponsor: undefined;
  SharedEntries: { connectionId: string };
  ShareEntries: { entryId?: string } | undefined;
  NotificationSettings: undefined;
  AISettings: undefined;
  SecuritySettings: undefined;
};

// Meetings Stack
export type MeetingsStackParamList = {
  MeetingFinder: undefined;
  MeetingDetail: { meetingId: string };
  FavoriteMeetings: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Journal: NavigatorScreenParams<JournalStackParamList>;
  Steps: NavigatorScreenParams<StepsStackParamList>;
  Meetings: NavigatorScreenParams<MeetingsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type JournalStackScreenProps<T extends keyof JournalStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<JournalStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type StepsStackScreenProps<T extends keyof StepsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<StepsStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type MeetingsStackScreenProps<T extends keyof MeetingsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<MeetingsStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

// Declaration for useNavigation hook typing
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
