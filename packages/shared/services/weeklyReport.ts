/**
 * Weekly Report Service
 *
 * Generates comprehensive weekly recovery summaries that help users
 * track their progress, identify patterns, and celebrate achievements.
 *
 * Reports include:
 * - Check-in statistics and trends
 * - Meeting attendance
 * - Fellowship activity
 * - Step work progress
 * - Achievements unlocked
 * - Personalized encouragement
 *
 * @module services/weeklyReport
 */

import { getCheckinHistory, getReadingStreak, getPhoneCallLogs } from '../db/models';

/**
 * Weekly report data structure
 */
export interface WeeklyReport {
  // Period
  weekStartDate: Date;
  weekEndDate: Date;
  generatedAt: Date;

  // Sobriety
  soberDays: number;
  daysThisWeek: number;

  // Check-ins
  checkinCount: number;
  checkinRate: number; // percentage
  averageMood: number;
  averageCraving: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  cravingTrend: 'improving' | 'stable' | 'worsening';
  highestMoodDay: { day: string; mood: number } | null;
  lowestMoodDay: { day: string; mood: number } | null;

  // Meetings
  meetingsAttended: number;
  meetingGoal: number;
  meetingGoalMet: boolean;
  sharesAtMeetings: number;

  // Fellowship
  phoneCalls: number;
  sponsorContacts: number;

  // Step work
  stepWorkSessions: number;
  currentStep: number;
  stepProgress: number; // percentage

  // Daily readings
  readingDays: number;
  readingStreak: number;

  // Achievements
  achievementsUnlocked: string[];
  keytagEarned: string | null;

  // Highlights & insights
  highlights: string[];
  areasForGrowth: string[];
  encouragement: string;
}

/**
 * Generate a weekly report
 *
 * Creates a comprehensive weekly summary of recovery activities and progress.
 * Analyzes data from the past 7 days and generates insights, highlights,
 * and areas for growth.
 *
 * @param soberDays - Current number of days of sobriety
 * @param meetingLogs - Array of meeting attendance records
 * @param stepProgress - Array of step work progress records
 * @param achievements - Array of achievement records
 * @param keytags - Array of keytag/milestone records
 * @param sponsorContactDate - Optional date of last sponsor contact
 * @returns Promise resolving to complete weekly report
 * @example
 * ```ts
 * const report = await generateWeeklyReport(
 *   cleanDays,
 *   meetings,
 *   stepWork,
 *   achievements,
 *   keytags,
 *   lastSponsorCall
 * );
 * ```
 */
export async function generateWeeklyReport(
  soberDays: number,
  meetingLogs: Array<{ date: Date; didShare?: boolean }>,
  stepProgress: Array<{ stepNumber: number; answeredQuestions: number; totalQuestions: number }>,
  achievements: Array<{ id: string; title: string; unlockedAt?: Date }>,
  keytags: Array<{ name: string; daysRequired: number; isEarned: boolean }>,
  sponsorContactDate?: Date,
): Promise<WeeklyReport> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(now);
  weekEnd.setHours(23, 59, 59, 999);

  // Get check-in history for the week
  const checkinHistory = await getCheckinHistory(7);
  const weekCheckins = checkinHistory.filter((c) => c.isCheckedIn);

  // Calculate check-in stats
  const checkinCount = weekCheckins.length;
  const checkinRate = Math.round((checkinCount / 7) * 100);

  const averageMood =
    weekCheckins.length > 0
      ? Math.round((weekCheckins.reduce((sum, c) => sum + c.mood, 0) / weekCheckins.length) * 10) /
        10
      : 0;

  const averageCraving =
    weekCheckins.length > 0
      ? Math.round(
          (weekCheckins.reduce((sum, c) => sum + c.cravingLevel, 0) / weekCheckins.length) * 10,
        ) / 10
      : 0;

  // Find highest and lowest mood days
  let highestMoodDay: { day: string; mood: number } | null = null;
  let lowestMoodDay: { day: string; mood: number } | null = null;

  if (weekCheckins.length > 0) {
    const sorted = [...weekCheckins].sort((a, b) => b.mood - a.mood);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    highestMoodDay = {
      day: new Date(highest.date).toLocaleDateString('en-US', { weekday: 'long' }),
      mood: highest.mood,
    };
    lowestMoodDay = {
      day: new Date(lowest.date).toLocaleDateString('en-US', { weekday: 'long' }),
      mood: lowest.mood,
    };
  }

  // Calculate mood trend (compare first half to second half of week)
  let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (weekCheckins.length >= 4) {
    const firstHalf = weekCheckins.slice(Math.floor(weekCheckins.length / 2));
    const secondHalf = weekCheckins.slice(0, Math.floor(weekCheckins.length / 2));

    const firstAvg = firstHalf.reduce((sum, c) => sum + c.mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, c) => sum + c.mood, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.5) moodTrend = 'improving';
    else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining';
  }

  // Calculate craving trend
  let cravingTrend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (weekCheckins.length >= 4) {
    const firstHalf = weekCheckins.slice(Math.floor(weekCheckins.length / 2));
    const secondHalf = weekCheckins.slice(0, Math.floor(weekCheckins.length / 2));

    const firstAvg = firstHalf.reduce((sum, c) => sum + c.cravingLevel, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, c) => sum + c.cravingLevel, 0) / secondHalf.length;

    if (secondAvg < firstAvg - 0.5) cravingTrend = 'improving';
    else if (secondAvg > firstAvg + 0.5) cravingTrend = 'worsening';
  }

  // Meeting stats
  const weekMeetings = meetingLogs.filter(
    (m) => new Date(m.date) >= weekStart && new Date(m.date) <= weekEnd,
  );
  const meetingsAttended = weekMeetings.length;
  const meetingGoal = soberDays <= 90 ? 7 : 3; // Higher goal for early recovery
  const meetingGoalMet = meetingsAttended >= meetingGoal;
  const sharesAtMeetings = weekMeetings.filter((m) => m.didShare).length;

  // Phone calls
  const callLogs = await getPhoneCallLogs(50);
  const weekCalls = callLogs.filter(
    (c) => new Date(c.calledAt) >= weekStart && new Date(c.calledAt) <= weekEnd,
  );
  const phoneCalls = weekCalls.length;

  // Sponsor contacts
  const sponsorContacts = sponsorContactDate && new Date(sponsorContactDate) >= weekStart ? 1 : 0;

  // Step work
  const currentStep =
    stepProgress.find((p) => p.answeredQuestions < p.totalQuestions)?.stepNumber || 12;
  const currentStepProgress = stepProgress.find((p) => p.stepNumber === currentStep);
  const stepProgressPercent = currentStepProgress
    ? Math.round((currentStepProgress.answeredQuestions / currentStepProgress.totalQuestions) * 100)
    : 100;

  // Reading streak
  const readingStreak = await getReadingStreak();
  const readingDays = Math.min(readingStreak, 7);

  // Achievements unlocked this week
  const weekAchievements = achievements.filter(
    (a) => a.unlockedAt && new Date(a.unlockedAt) >= weekStart && new Date(a.unlockedAt) <= weekEnd,
  );
  const achievementsUnlocked = weekAchievements.map((a) => a.title);

  // Keytag earned this week
  const earnedKeytags = keytags.filter((k) => k.isEarned && k.daysRequired <= soberDays);
  const latestKeytag = earnedKeytags[earnedKeytags.length - 1];
  const keytagEarned =
    latestKeytag && soberDays - latestKeytag.daysRequired < 7 ? latestKeytag.name : null;

  // Generate highlights
  const highlights: string[] = [];
  if (checkinRate >= 80) highlights.push('Excellent check-in consistency!');
  if (meetingGoalMet) highlights.push(`Met your meeting goal of ${meetingGoal} meetings`);
  if (moodTrend === 'improving') highlights.push('Your mood has been improving');
  if (cravingTrend === 'improving') highlights.push('Cravings are decreasing');
  if (sharesAtMeetings > 0) highlights.push(`Shared at ${sharesAtMeetings} meeting(s)`);
  if (phoneCalls >= 3) highlights.push('Great fellowship connection!');
  if (readingStreak >= 7) highlights.push('Week-long reading streak!');
  if (achievementsUnlocked.length > 0)
    highlights.push(`Unlocked ${achievementsUnlocked.length} achievement(s)`);
  if (keytagEarned) highlights.push(`Earned your ${keytagEarned} keytag!`);

  // Generate areas for growth
  const areasForGrowth: string[] = [];
  if (checkinRate < 50) areasForGrowth.push('Try to check in more consistently');
  if (!meetingGoalMet) areasForGrowth.push('Aim for more meetings next week');
  if (moodTrend === 'declining') areasForGrowth.push('Consider reaching out for support');
  if (cravingTrend === 'worsening') areasForGrowth.push('Use coping tools when cravings arise');
  if (phoneCalls === 0) areasForGrowth.push('Make some fellowship calls');
  if (sponsorContacts === 0) areasForGrowth.push('Connect with your sponsor');

  // Generate encouragement
  const encouragement = generateEncouragement(soberDays, moodTrend, meetingsAttended, checkinRate);

  return {
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    generatedAt: now,
    soberDays,
    daysThisWeek: 7,
    checkinCount,
    checkinRate,
    averageMood,
    averageCraving,
    moodTrend,
    cravingTrend,
    highestMoodDay,
    lowestMoodDay,
    meetingsAttended,
    meetingGoal,
    meetingGoalMet,
    sharesAtMeetings,
    phoneCalls,
    sponsorContacts,
    stepWorkSessions: 0, // Would need session tracking
    currentStep,
    stepProgress: stepProgressPercent,
    readingDays,
    readingStreak,
    achievementsUnlocked,
    keytagEarned,
    highlights,
    areasForGrowth,
    encouragement,
  };
}

/**
 * Generate encouraging message based on week's data
 */
function generateEncouragement(
  soberDays: number,
  moodTrend: string,
  meetingsAttended: number,
  checkinRate: number,
): string {
  const messages: string[] = [];

  if (soberDays <= 30) {
    messages.push(
      'The first month is the hardest. Every day you stay clean is a victory.',
      "You're building the foundation for a new life. Keep going!",
      "Early recovery takes courage. You're doing it!",
    );
  } else if (soberDays <= 90) {
    messages.push(
      "You're in the thick of it now. The fog is lifting. Keep working your program.",
      "90 days is when real change happens. You're almost there!",
      'Your brain is healing every day. Trust the process.',
    );
  } else if (soberDays <= 365) {
    messages.push(
      "You're building a life worth living. Keep nurturing your recovery.",
      "Recovery gets better, but it still needs attention. You're doing great.",
      'Your first year is a journey. Enjoy the growth.',
    );
  } else {
    messages.push(
      'Your recovery is an inspiration. Keep sharing your experience.',
      'Long-term recovery is a gift. Never take it for granted.',
      "You've come so far. Keep being of service to others.",
    );
  }

  if (moodTrend === 'declining') {
    messages.push(
      'Tough weeks happen. Reach out to your support network.',
      'When things are hard, double down on the basics: meetings, calls, step work.',
    );
  }

  if (meetingsAttended >= 5) {
    messages.push(
      "Meeting makers make it. You're proving that every week.",
      'Your commitment to meetings shows. Keep it up!',
    );
  }

  if (checkinRate >= 80) {
    messages.push(
      'Your consistency is impressive. Self-awareness is key to recovery.',
      'Checking in with yourself is a powerful habit. Well done!',
    );
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Format report for display
 */
export function formatReportForDisplay(report: WeeklyReport): string {
  const lines: string[] = [];

  lines.push(`📊 WEEKLY RECOVERY REPORT`);
  lines.push(
    `${report.weekStartDate.toLocaleDateString()} - ${report.weekEndDate.toLocaleDateString()}`,
  );
  lines.push('');

  lines.push(`🗓️ CLEAN TIME: ${report.soberDays} days`);
  lines.push('');

  lines.push(`📝 CHECK-INS`);
  lines.push(`   ${report.checkinCount}/7 days (${report.checkinRate}%)`);
  lines.push(`   Avg Mood: ${report.averageMood}/10 (${report.moodTrend})`);
  lines.push(`   Avg Craving: ${report.averageCraving}/10 (${report.cravingTrend})`);
  lines.push('');

  lines.push(`🤝 MEETINGS`);
  lines.push(`   Attended: ${report.meetingsAttended} (goal: ${report.meetingGoal})`);
  lines.push(`   Shared: ${report.sharesAtMeetings} times`);
  lines.push('');

  lines.push(`📞 FELLOWSHIP`);
  lines.push(`   Phone calls: ${report.phoneCalls}`);
  lines.push(`   Sponsor contacts: ${report.sponsorContacts}`);
  lines.push('');

  lines.push(`📖 STEP WORK`);
  lines.push(`   Current step: ${report.currentStep}`);
  lines.push(`   Progress: ${report.stepProgress}%`);
  lines.push('');

  lines.push(`📚 DAILY READING`);
  lines.push(`   Days read: ${report.readingDays}/7`);
  lines.push(`   Streak: ${report.readingStreak} days`);
  lines.push('');

  if (report.highlights.length > 0) {
    lines.push(`✨ HIGHLIGHTS`);
    report.highlights.forEach((h) => lines.push(`   • ${h}`));
    lines.push('');
  }

  if (report.areasForGrowth.length > 0) {
    lines.push(`🌱 AREAS FOR GROWTH`);
    report.areasForGrowth.forEach((a) => lines.push(`   • ${a}`));
    lines.push('');
  }

  lines.push(`💙 ${report.encouragement}`);

  return lines.join('\n');
}

/**
 * Format report for sharing with sponsor
 */
export function formatReportForSponsor(report: WeeklyReport, displayName?: string): string {
  const lines: string[] = [];

  lines.push(`📊 Weekly Update from ${displayName || 'Your Sponsee'}`);
  lines.push(`Week of ${report.weekStartDate.toLocaleDateString()}`);
  lines.push('');
  lines.push(`Clean Days: ${report.soberDays}`);
  lines.push(`Meetings: ${report.meetingsAttended}`);
  lines.push(`Check-ins: ${report.checkinCount}/7`);
  lines.push(`Avg Mood: ${report.averageMood}/10`);
  lines.push(`Current Step: ${report.currentStep}`);
  lines.push('');

  if (report.highlights.length > 0) {
    lines.push('Highlights:');
    report.highlights.slice(0, 3).forEach((h) => lines.push(`• ${h}`));
  }

  lines.push('');
  lines.push('Sent from Recovery Companion');

  return lines.join('\n');
}
