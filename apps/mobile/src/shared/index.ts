/**
 * Shared Package Exports
 *
 * This is the main entry point for the @/shared package.
 * It exports all shared types, utilities, constants, and services
 * used across the Steps to Recovery application.
 *
 * @module @/shared
 * @example
 * ```ts
 * import { AchievementDefinition, sendSMS, useAuthStore } from '@/shared';
 * ```
 */


// Export only non-conflicting types from ./types
export type {
  SyncStatus,
  SyncQueueItem,
  UserProfile as DbUserProfile,
  UserProfile,
  DailyCheckIn as DbDailyCheckIn,
  DailyCheckIn,
  DailyCheckInDecrypted,
  JournalEntryDecrypted,
  MilestoneDefinition,
  StepWork as DbStepWork,
  StepWork,
  StepWorkDecrypted,
  CheckInType,
} from './types';

// Export application types (camelCase)
export type {
  JournalEntry,
  JournalType,
  JournalEntryDb,
  MeetingLog,
  MeetingType,
  DailyCheckin,
  AppSettings,
  TimeCapsule,
  ContactRole,
  RecoveryContact,
  RegularMeeting,
  RegularMeetingType,
  PhoneCallLog,
  FourthStepType,
  AmendsType,
  AmendsStatus,
  StepProgress,
} from './types';

// Explicit exports from constants to avoid naming conflicts
export {
  TIME_MILESTONES,
  type TimeMilestone,
  getNextMilestone,
  getLatestMilestone,
  getAchievedMilestones,
  hasAchievedMilestone,
} from './constants';

export {
  getAchievementDefinition,
  isValidAchievementId,
  MEETING_ACHIEVEMENTS,
  ACHIEVEMENT_COLORS,
  ACHIEVEMENT_MESSAGES,
  getAchievementByKey,
  getAchievementsByCategory,
  getRandomAchievementMessage,
  type Achievement,
  type AchievementDefinition,
} from './constants';

export {
  STEP_PROMPTS,
  type StepPrompt,
  type StepSection,
  getStepPrompts,
  getStepSection,
  getStepQuestionCount,
  getTotalQuestionCount,
  isValidStepNumber,
  getAllStepNumbers,
} from './constants';

export {
  type CrisisResource,
  type CrisisHotline,
  type RegionConfig,
  CRISIS_REGIONS,
  COPING_STRATEGIES,
  DEFAULT_REGION,
  getCrisisResources,
  getEmergencyNumber,
  getAvailableRegions,
  isValidRegion,
} from './constants';

export {
  PRAYERS,
  type Prayer,
  getPrayerById,
  getPrayersByCategory,
  getPrayersForStep,
} from './constants';

export {
  SLOGANS,
  type Slogan,
  getSloganById,
  getSlogansByCategory,
  getRandomSlogan,
} from './constants';

export {
  type Keytag,
  type KeytagWithStatus,
  KEYTAGS,
  getKeytagForDays,
  getNextKeytag,
  getKeytagsWithStatus,
  getEarnedKeytagsCount,
} from './constants';
export * from './db';
export * from './store';
export * from './utils';
export * from './utils/encryption';
export * from './jitai';
export * from './notifications';
export * from './animations';
export * from './export';
/**
 * Services barrel export
 *
 * Provides centralized services for:
 * - Achievement triggers
 * - Error tracking
 * - Sponsor connections
 * - Weekly reports
 */

// Achievement Trigger Services
export {
  onContactAdded,
  onMeetingLogged,
  onStepWorkUpdated,
  onCheckinCompleted,
  onReadingCompleted,
  onSobrietyDaysUpdated,
  triggerFullAchievementCheck,
} from './services/achievementTriggers';

// Error Tracking Services
export {
  type ErrorContext,
  type BreadcrumbData,
  initializeErrorTracking,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUserContext,
  clearUserContext,
  setTag,
  startTransaction,
  withErrorBoundary,
  ErrorFallback,
  logNavigation,
  logUserAction,
  logDatabaseOperation,
} from './services/errorTracking';

// Sponsor Connection Services
export {
  type ConnectionCode,
  type SponsorKeyPair,
  type EncryptedPayload,
  type SponsorInvitePayload,
  type SponsorConfirmPayload,
  type EntrySharePayload,
  type CommentSharePayload,
  type SponseeConnection,
  type SponsorShareData,
  generateSponsorCode,
  generateSponsorKeyPair,
  deriveSharedKeyBase64,
  encryptWithSharedKey,
  decryptWithSharedKey,
  createInvitePayload,
  parseInvitePayload,
  createConfirmPayload,
  parseConfirmPayload,
  createEntrySharePayload,
  parseEntrySharePayload,
  createCommentSharePayload,
  parseCommentSharePayload,
  getCurrentSponsorCode,
  revokeSponsorCode,
  addSponseeConnection,
  getSponseeConnections,
  getSponseeConnectionById,
  updateSponseeConnectionName,
  removeSponseeConnection,
  generateShareData,
  encodeShareData,
  decodeShareData,
  generateShareMessage,
  isValidCodeFormat,
} from './services/sponsorConnection';

// Weekly Report Services
export {
  type WeeklyReport,
  generateWeeklyReport,
  formatReportForDisplay,
  formatReportForSponsor,
} from './services/weeklyReport';
