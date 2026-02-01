/**
 * Achievement Trigger Service
 *
 * Automatically triggers achievement checks when relevant actions occur.
 * These functions should be called after user actions to check if any
 * achievements should be unlocked.
 *
 * @module services/achievementTriggers
 */

import { useAchievementStore, type AchievementContext } from '../store/achievementStore';
import { getSponsor, getRecoveryContacts } from '../db/models';
import { scheduleAchievementNotification } from '../notifications';
import type { Achievement } from '../types';

/**
 * Trigger achievement check after adding a contact
 *
 * Checks for fellowship-related achievements when a new recovery contact
 * is added. Automatically schedules notifications for newly unlocked achievements.
 *
 * @returns Promise resolving to array of newly unlocked achievements
 * @example
 * ```ts
 * await addContact(contactData);
 * const newAchievements = await onContactAdded();
 * if (newAchievements.length > 0) {
 *   // Show achievement celebration
 * }
 * ```
 */
export async function onContactAdded(): Promise<Achievement[]> {
  const store = useAchievementStore.getState();

  // Get current contacts count
  const contacts = await getRecoveryContacts();
  const sponsor = await getSponsor();

  const context = {
    soberDays: 0, // Will be filled by checkAutoAchievements
    contactsCount: contacts.length,
    hasSponsor: !!sponsor,
    hasHomeGroup: false,
    meetingsCount: 0,
    checkinStreak: 0,
    readingStreak: 0,
    tenthStepStreak: 0,
    gratitudeStreak: 0,
    phoneTherapyDays: 0,
    stepProgress: {},
    meetingsWithShares: 0,
  };

  const newlyUnlocked = await store.checkAutoAchievements(context);

  // Schedule notifications for newly unlocked achievements
  for (const achievement of newlyUnlocked) {
    await scheduleAchievementNotification(achievement);
  }

  return newlyUnlocked;
}

/**
 * Trigger achievement check after logging a meeting
 *
 * Checks for service/meeting-related achievements when a meeting is logged.
 *
 * @param meetingsCount - Total number of meetings attended
 * @param didShare - Whether the user shared at the meeting
 * @returns Promise resolving to array of newly unlocked achievements
 * @example
 * ```ts
 * await logMeeting(meetingData);
 * const newAchievements = await onMeetingLogged(totalMeetings, shared);
 * ```
 */
export async function onMeetingLogged(
  meetingsCount: number,
  didShare: boolean,
): Promise<Achievement[]> {
  const store = useAchievementStore.getState();

  const context = {
    soberDays: 0,
    contactsCount: 0,
    hasSponsor: false,
    hasHomeGroup: false,
    meetingsCount,
    checkinStreak: 0,
    readingStreak: 0,
    tenthStepStreak: 0,
    gratitudeStreak: 0,
    phoneTherapyDays: 0,
    stepProgress: {},
    meetingsWithShares: didShare ? 1 : 0,
  };

  const newlyUnlocked = await store.checkAutoAchievements(context);

  for (const achievement of newlyUnlocked) {
    await scheduleAchievementNotification(achievement);
  }

  return newlyUnlocked;
}

/**
 * Trigger achievement check after completing step work
 *
 * Checks for step work achievements when step progress is updated.
 *
 * @param stepNumber - Step number being worked (1-12)
 * @param answeredQuestions - Number of questions answered
 * @param totalQuestions - Total number of questions for this step
 * @returns Promise resolving to array of newly unlocked achievements
 * @example
 * ```ts
 * await updateStepWork(stepNumber, answers);
 * const newAchievements = await onStepWorkUpdated(stepNumber, answered, total);
 * ```
 */
export async function onStepWorkUpdated(
  stepNumber: number,
  answeredQuestions: number,
  totalQuestions: number,
): Promise<Achievement[]> {
  // Validate inputs
  if (stepNumber < 1 || stepNumber > 12 || !Number.isInteger(stepNumber)) {
    return [];
  }
  if (answeredQuestions < 0 || totalQuestions < 1 || answeredQuestions > totalQuestions) {
    return [];
  }
  const store = useAchievementStore.getState();

  const stepProgress: Record<number, { answered: number; total: number }> = {
    [stepNumber]: { answered: answeredQuestions, total: totalQuestions },
  };

  const context = {
    soberDays: 0,
    contactsCount: 0,
    hasSponsor: false,
    hasHomeGroup: false,
    meetingsCount: 0,
    checkinStreak: 0,
    readingStreak: 0,
    tenthStepStreak: 0,
    gratitudeStreak: 0,
    phoneTherapyDays: 0,
    stepProgress,
    meetingsWithShares: 0,
  };

  const newlyUnlocked = await store.checkAutoAchievements(context);

  for (const achievement of newlyUnlocked) {
    await scheduleAchievementNotification(achievement);
  }

  return newlyUnlocked;
}

/**
 * Trigger achievement check after daily check-in
 *
 * Checks for daily practice achievements when a check-in is completed.
 *
 * @param checkinStreak - Current consecutive days of check-ins
 * @returns Promise resolving to array of newly unlocked achievements
 * @example
 * ```ts
 * await completeCheckin(checkinData);
 * const newAchievements = await onCheckinCompleted(currentStreak);
 * ```
 */
export async function onCheckinCompleted(checkinStreak: number): Promise<Achievement[]> {
  if (checkinStreak < 0 || !Number.isInteger(checkinStreak)) {
    return [];
  }
  const store = useAchievementStore.getState();

  const context = {
    soberDays: 0,
    contactsCount: 0,
    hasSponsor: false,
    hasHomeGroup: false,
    meetingsCount: 0,
    checkinStreak,
    readingStreak: 0,
    tenthStepStreak: 0,
    gratitudeStreak: 0,
    phoneTherapyDays: 0,
    stepProgress: {},
    meetingsWithShares: 0,
  };

  const newlyUnlocked = await store.checkAutoAchievements(context);

  for (const achievement of newlyUnlocked) {
    await scheduleAchievementNotification(achievement);
  }

  return newlyUnlocked;
}

/**
 * Trigger achievement check after reading reflection
 *
 * Checks for daily practice achievements when a reading/reflection is completed.
 *
 * @param readingStreak - Current consecutive days of readings
 * @returns Promise resolving to array of newly unlocked achievements
 */
export async function onReadingCompleted(readingStreak: number): Promise<Achievement[]> {
  if (readingStreak < 0 || !Number.isInteger(readingStreak)) {
    return [];
  }
  const store = useAchievementStore.getState();

  const context = {
    soberDays: 0,
    contactsCount: 0,
    hasSponsor: false,
    hasHomeGroup: false,
    meetingsCount: 0,
    checkinStreak: 0,
    readingStreak,
    tenthStepStreak: 0,
    gratitudeStreak: 0,
    phoneTherapyDays: 0,
    stepProgress: {},
    meetingsWithShares: 0,
  };

  const newlyUnlocked = await store.checkAutoAchievements(context);

  for (const achievement of newlyUnlocked) {
    await scheduleAchievementNotification(achievement);
  }

  return newlyUnlocked;
}

/**
 * Trigger keytag check when sobriety days update
 *
 * Updates keytags (milestone chips) when clean time changes.
 * This should be called whenever the user's sobriety date or clean days change.
 *
 * @param soberDays - Current number of days of sobriety
 * @example
 * ```ts
 * const cleanDays = calculateCleanDays(sobrietyDate);
 * onSobrietyDaysUpdated(cleanDays);
 * ```
 */
export function onSobrietyDaysUpdated(soberDays: number): void {
  if (soberDays < 0 || !Number.isInteger(soberDays)) {
    return;
  }
  const store = useAchievementStore.getState();
  store.updateKeytagsForDays(soberDays);
}

/**
 * Trigger full achievement check
 *
 * Performs a comprehensive achievement check using the provided context.
 * Call this on app startup or after significant events to ensure all
 * achievements are properly evaluated.
 *
 * @param context - Complete achievement context with all relevant data
 * @returns Promise resolving to array of newly unlocked achievements
 * @example
 * ```ts
 * const context = await buildAchievementContext();
 * const newAchievements = await triggerFullAchievementCheck(context);
 * ```
 */
export async function triggerFullAchievementCheck(
  context: AchievementContext,
): Promise<Achievement[]> {
  const store = useAchievementStore.getState();

  const newlyUnlocked = await store.checkAutoAchievements(context);

  for (const achievement of newlyUnlocked) {
    await scheduleAchievementNotification(achievement);
  }

  return newlyUnlocked;
}
