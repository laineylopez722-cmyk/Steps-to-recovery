/**
 * Encouragement Messages
 *
 * Positive, recovery-focused messages for scheduled encouragement notifications.
 * Messages are non-judgmental, supportive, and appropriate for users in all
 * stages of recovery. Never include triggering content or demands.
 */

export const ENCOURAGEMENT_MESSAGES: readonly string[] = [
  "You're doing amazing work in your recovery. One day at a time.",
  'Every sober moment is a victory. Keep going!',
  'You are stronger than any craving.',
  'Progress, not perfection. You are on the right path.',
  'Your courage to recover inspires others. Keep it up!',
  'Just for today, you are enough.',
  'Recovery is a gift you give yourself every single day.',
  "The fact that you're here means you haven't given up. That's everything.",
  'You are worthy of the beautiful life you are building.',
  'Each step forward, no matter how small, is a step toward freedom.',
  'Your story is still being written. Make today a good chapter.',
  "It's okay to take things one moment at a time.",
  'You have already survived your hardest days. You can do this.',
  'Connection is the opposite of addiction. Reach out today.',
  "Be gentle with yourself. You're doing the best you can.",
  'Gratitude turns what we have into enough.',
  'The pain you feel today is the strength you feel tomorrow.',
  'You are not alone on this journey. Many walk beside you.',
  "Celebrate how far you've come, not how far you have to go.",
  'Your sobriety is proof that change is possible.',
] as const;

/**
 * Get a random encouragement message
 *
 * @returns A randomly selected encouragement message
 */
export function getRandomEncouragementMessage(): string {
  const index = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
  return ENCOURAGEMENT_MESSAGES[index];
}
