import type { InventoryCoverageSummary, ScreenInventoryEntry, UxRouteStatus, UxRiskLevel, UxStack } from './types';

export const ROOT_ROUTE_NAMES = ['Onboarding'] as const;
export const AUTH_ROUTE_NAMES = ['Login', 'SignUp', 'ForgotPassword'] as const;
export const HOME_ROUTE_NAMES = [
  'HomeMain',
  'MorningIntention',
  'EveningPulse',
  'Emergency',
  'DailyReading',
  'ProgressDashboard',
  'MeetingStats',
  'Achievements',
  'DangerZone',
  'SafeDialIntervention',
  'BeforeYouUse',
  'CompanionChat',
] as const;
export const JOURNAL_ROUTE_NAMES = ['JournalList', 'JournalEditor'] as const;
export const STEPS_ROUTE_NAMES = ['StepsOverview', 'StepDetail', 'StepReview'] as const;
export const MEETINGS_ROUTE_NAMES = ['MeetingFinder', 'MeetingDetail', 'FavoriteMeetings'] as const;
export const PROFILE_ROUTE_NAMES = [
  'ProfileHome',
  'Sponsor',
  'InviteSponsor',
  'SharedEntries',
  'ShareEntries',
  'NotificationSettings',
  'AISettings',
] as const;

export const APP_AUDIT_ROUTE_NAMES = [
  ...ROOT_ROUTE_NAMES,
  ...AUTH_ROUTE_NAMES,
  ...HOME_ROUTE_NAMES,
  ...JOURNAL_ROUTE_NAMES,
  ...STEPS_ROUTE_NAMES,
  ...MEETINGS_ROUTE_NAMES,
  ...PROFILE_ROUTE_NAMES,
] as const;

export type AuditRouteName = (typeof APP_AUDIT_ROUTE_NAMES)[number];

type InventoryEntryByRoute = Record<AuditRouteName, ScreenInventoryEntry & { route: AuditRouteName }>;

export const SCREEN_INVENTORY: InventoryEntryByRoute = {
  Onboarding: {
    route: 'Onboarding',
    stack: 'Root',
    feature: 'auth',
    journey: 'onboarding',
    filePath: 'src/features/auth/screens/OnboardingScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },

  Login: {
    route: 'Login',
    stack: 'Auth',
    feature: 'auth',
    journey: 'auth',
    filePath: 'src/features/auth/screens/LoginScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  SignUp: {
    route: 'SignUp',
    stack: 'Auth',
    feature: 'auth',
    journey: 'auth',
    filePath: 'src/features/auth/screens/SignUpScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  ForgotPassword: {
    route: 'ForgotPassword',
    stack: 'Auth',
    feature: 'auth',
    journey: 'auth',
    filePath: 'src/features/auth/screens/ForgotPasswordScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },

  HomeMain: {
    route: 'HomeMain',
    stack: 'Home',
    feature: 'home',
    journey: 'daily-home',
    filePath: 'src/features/home/screens/HomeScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  MorningIntention: {
    route: 'MorningIntention',
    stack: 'Home',
    feature: 'home',
    journey: 'daily-home',
    filePath: 'src/features/home/screens/MorningIntentionScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  EveningPulse: {
    route: 'EveningPulse',
    stack: 'Home',
    feature: 'home',
    journey: 'daily-home',
    filePath: 'src/features/home/screens/EveningPulseScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  Emergency: {
    route: 'Emergency',
    stack: 'Home',
    feature: 'emergency',
    journey: 'emergency-support',
    filePath: 'src/features/emergency/screens/EmergencyScreen.tsx',
    status: 'active',
    riskLevel: 'safety-critical',
  },
  DailyReading: {
    route: 'DailyReading',
    stack: 'Home',
    feature: 'home',
    journey: 'daily-home',
    filePath: 'src/features/readings/screens/DailyReadingScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
    notes: ['A second DailyReading implementation exists in src/features/home/screens.'],
  },
  ProgressDashboard: {
    route: 'ProgressDashboard',
    stack: 'Home',
    feature: 'progress',
    journey: 'progress',
    filePath: 'src/features/progress/screens/ProgressDashboardScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  MeetingStats: {
    route: 'MeetingStats',
    stack: 'Home',
    feature: 'meetings',
    journey: 'meetings',
    filePath: 'src/features/meetings/screens/MeetingStatsScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },
  Achievements: {
    route: 'Achievements',
    stack: 'Home',
    feature: 'meetings',
    journey: 'progress',
    filePath: 'src/features/meetings/screens/AchievementsScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },
  DangerZone: {
    route: 'DangerZone',
    stack: 'Home',
    feature: 'emergency',
    journey: 'emergency-support',
    filePath: 'src/features/emergency/screens/DangerZoneScreen.tsx',
    status: 'active',
    riskLevel: 'safety-critical',
  },
  SafeDialIntervention: {
    route: 'SafeDialIntervention',
    stack: 'Home',
    feature: 'emergency',
    journey: 'emergency-support',
    filePath: 'src/features/emergency/screens/SafeDialInterventionScreen.tsx',
    status: 'active',
    riskLevel: 'safety-critical',
  },
  BeforeYouUse: {
    route: 'BeforeYouUse',
    stack: 'Home',
    feature: 'crisis',
    journey: 'emergency-support',
    filePath: 'src/features/crisis/screens/BeforeYouUseScreen.tsx',
    status: 'active',
    riskLevel: 'safety-critical',
  },
  CompanionChat: {
    route: 'CompanionChat',
    stack: 'Home',
    feature: 'ai-companion',
    journey: 'ai-companion',
    filePath: 'src/features/ai-companion/components/ChatScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },

  JournalList: {
    route: 'JournalList',
    stack: 'Journal',
    feature: 'journal',
    journey: 'journaling',
    filePath: 'src/features/journal/screens/JournalListScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  JournalEditor: {
    route: 'JournalEditor',
    stack: 'Journal',
    feature: 'journal',
    journey: 'journaling',
    filePath: 'src/features/journal/screens/JournalEditorScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },

  StepsOverview: {
    route: 'StepsOverview',
    stack: 'Steps',
    feature: 'steps',
    journey: 'step-work',
    filePath: 'src/features/steps/screens/StepsOverviewScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  StepDetail: {
    route: 'StepDetail',
    stack: 'Steps',
    feature: 'steps',
    journey: 'step-work',
    filePath: 'src/features/steps/screens/StepDetailScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  StepReview: {
    route: 'StepReview',
    stack: 'Steps',
    feature: 'steps',
    journey: 'step-work',
    filePath: 'src/features/steps/screens/StepReviewScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },

  MeetingFinder: {
    route: 'MeetingFinder',
    stack: 'Meetings',
    feature: 'meetings',
    journey: 'meetings',
    filePath: 'src/features/meetings/screens/MeetingFinderScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  MeetingDetail: {
    route: 'MeetingDetail',
    stack: 'Meetings',
    feature: 'meetings',
    journey: 'meetings',
    filePath: 'src/features/meetings/screens/MeetingDetailScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  FavoriteMeetings: {
    route: 'FavoriteMeetings',
    stack: 'Meetings',
    feature: 'meetings',
    journey: 'meetings',
    filePath: 'src/features/meetings/screens/FavoriteMeetingsScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },

  ProfileHome: {
    route: 'ProfileHome',
    stack: 'Profile',
    feature: 'profile',
    journey: 'profile-settings',
    filePath: 'src/features/profile/screens/ProfileScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  Sponsor: {
    route: 'Sponsor',
    stack: 'Profile',
    feature: 'sponsor',
    journey: 'sponsor',
    filePath: 'src/features/sponsor/screens/SponsorScreen.tsx',
    status: 'active',
    riskLevel: 'core',
  },
  InviteSponsor: {
    route: 'InviteSponsor',
    stack: 'Profile',
    feature: 'sponsor',
    journey: 'sponsor',
    filePath: 'src/features/sponsor/screens/InviteSponsorScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },
  SharedEntries: {
    route: 'SharedEntries',
    stack: 'Profile',
    feature: 'sponsor',
    journey: 'sponsor',
    filePath: 'src/features/sponsor/screens/SharedEntriesScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },
  ShareEntries: {
    route: 'ShareEntries',
    stack: 'Profile',
    feature: 'sponsor',
    journey: 'sponsor',
    filePath: 'src/features/sponsor/screens/ShareEntriesScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },
  NotificationSettings: {
    route: 'NotificationSettings',
    stack: 'Profile',
    feature: 'profile',
    journey: 'profile-settings',
    filePath: 'src/features/settings/screens/NotificationSettingsScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },
  AISettings: {
    route: 'AISettings',
    stack: 'Profile',
    feature: 'ai-companion',
    journey: 'ai-companion',
    filePath: 'src/features/ai-companion/screens/AISettingsScreen.tsx',
    status: 'active',
    riskLevel: 'supporting',
  },
};

function buildStackCounter(): Record<UxStack, number> {
  return {
    Root: 0,
    Auth: 0,
    Home: 0,
    Journal: 0,
    Steps: 0,
    Meetings: 0,
    Profile: 0,
  };
}

function buildStatusCounter(): Record<UxRouteStatus, number> {
  return {
    active: 0,
    'typed-only': 0,
  };
}

function buildRiskCounter(): Record<UxRiskLevel, number> {
  return {
    'safety-critical': 0,
    core: 0,
    supporting: 0,
  };
}

export function getScreenInventory(): Array<ScreenInventoryEntry & { route: AuditRouteName }> {
  return APP_AUDIT_ROUTE_NAMES.map((route) => SCREEN_INVENTORY[route]);
}

export function getRoutesByStack(stack: UxStack): Array<ScreenInventoryEntry & { route: AuditRouteName }> {
  return getScreenInventory().filter((entry) => entry.stack === stack);
}

export function getCoverageSummary(): InventoryCoverageSummary {
  const byStack = buildStackCounter();
  const byStatus = buildStatusCounter();
  const byRiskLevel = buildRiskCounter();

  for (const entry of getScreenInventory()) {
    byStack[entry.stack] += 1;
    byStatus[entry.status] += 1;
    byRiskLevel[entry.riskLevel] += 1;
  }

  return {
    totalRoutes: APP_AUDIT_ROUTE_NAMES.length,
    byStack,
    byStatus,
    byRiskLevel,
  };
}
