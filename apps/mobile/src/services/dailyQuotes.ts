/**
 * Daily Recovery Quotes
 *
 * Provides a rotating collection of recovery-focused quotes,
 * one for each day of the year. Includes AA slogans, recovery wisdom,
 * hope, gratitude themes, and step-related insights.
 *
 * No encryption needed — quotes are static, non-user data.
 *
 * @module services/dailyQuotes
 */

export interface DailyQuote {
  text: string;
  source: string;
}

/**
 * Get the day of the year (1-366) for a given date.
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Collection of recovery quotes — at least one per day of the year.
 */
const DAILY_QUOTES: DailyQuote[] = [
  // AA Slogans
  { text: 'One day at a time.', source: 'AA Slogan' },
  { text: 'Easy does it.', source: 'AA Slogan' },
  { text: 'First things first.', source: 'AA Slogan' },
  { text: 'Let go and let God.', source: 'AA Slogan' },
  { text: 'Think, think, think.', source: 'AA Slogan' },
  { text: 'Keep it simple.', source: 'AA Slogan' },
  { text: 'Live and let live.', source: 'AA Slogan' },
  { text: 'Progress, not perfection.', source: 'AA Slogan' },
  { text: 'This too shall pass.', source: 'AA Slogan' },
  { text: 'But for the grace of God.', source: 'AA Slogan' },

  // Serenity Prayer themes
  {
    text: 'God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.',
    source: 'Serenity Prayer',
  },
  {
    text: 'Acceptance is the answer to all my problems today.',
    source: 'Alcoholics Anonymous, p. 417',
  },
  {
    text: 'Courage is not the absence of fear, but the willingness to walk through it.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Wisdom begins when we stop pretending we have all the answers.',
    source: 'Recovery Wisdom',
  },

  // Hope and encouragement
  {
    text: 'You are not alone. Millions have walked this path before you and found freedom.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Every sober day is a victory worth celebrating.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'The darkest hour is just before the dawn.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Your story is not over. The best chapters are still being written.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Recovery is not a destination — it is a way of life.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'You are stronger than you think and braver than you believe.',
    source: 'Recovery Wisdom',
  },

  // Gratitude
  {
    text: 'Gratitude turns what we have into enough.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'A grateful heart is a sober heart.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'When you focus on the good, the good gets better.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Today I choose to see the blessings, not the burdens.',
    source: 'Recovery Wisdom',
  },

  // Step-related insights
  {
    text: 'We admitted we were powerless — that our lives had become unmanageable. Surrender is the first step to freedom.',
    source: 'Step 1 Insight',
  },
  {
    text: 'Came to believe that a power greater than ourselves could restore us to sanity.',
    source: 'Step 2 Insight',
  },
  {
    text: 'Made a decision to turn our will and our lives over to the care of God as we understood Him.',
    source: 'Step 3 Insight',
  },
  {
    text: 'Made a searching and fearless moral inventory of ourselves. Honesty begins within.',
    source: 'Step 4 Insight',
  },
  {
    text: 'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.',
    source: 'Step 5 Insight',
  },
  {
    text: 'Were entirely ready to have God remove all these defects of character.',
    source: 'Step 6 Insight',
  },
  {
    text: 'Humbly asked Him to remove our shortcomings. Humility opens the door to growth.',
    source: 'Step 7 Insight',
  },
  {
    text: 'Made a list of all persons we had harmed, and became willing to make amends to them all.',
    source: 'Step 8 Insight',
  },
  {
    text: 'Made direct amends wherever possible, except when to do so would injure them or others.',
    source: 'Step 9 Insight',
  },
  {
    text: 'Continued to take personal inventory and when we were wrong promptly admitted it.',
    source: 'Step 10 Insight',
  },
  {
    text: 'Sought through prayer and meditation to improve our conscious contact with God.',
    source: 'Step 11 Insight',
  },
  {
    text: 'Having had a spiritual awakening, we tried to carry this message to others and practice these principles in all our affairs.',
    source: 'Step 12 Insight',
  },

  // Daily living in recovery
  {
    text: 'Just for today, I will try to live through this day only, and not tackle all my problems at once.',
    source: 'Just For Today',
  },
  {
    text: 'Feelings are not facts. I can feel afraid and still do the right thing.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'I am not what happened to me. I am what I choose to become.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'The only way out is through.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Healing happens when we stop running from the pain.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Connection is the opposite of addiction.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'You do not have to see the whole staircase, just take the first step.',
    source: 'Martin Luther King Jr.',
  },
  {
    text: 'We are only as sick as our secrets.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'It works if you work it.',
    source: 'AA Slogan',
  },
  {
    text: 'Nothing changes if nothing changes.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Your worst day sober is better than your best day using.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Recovery gives back everything addiction took — and more.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Be kind to yourself. You are doing something incredibly hard.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Today is a gift. That is why they call it the present.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Surrender to win.',
    source: 'AA Slogan',
  },
  {
    text: 'Meeting makers make it.',
    source: 'AA Slogan',
  },
  {
    text: 'H.A.L.T. — never let yourself get too Hungry, Angry, Lonely, or Tired.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'The program works if you work the program.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Pray for the willingness to be willing.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Take what you need and leave the rest.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Faith without works is dead.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'You are worth recovering for.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    source: 'Proverb',
  },
  {
    text: 'We can do together what we could never do alone.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Rock bottom became the solid foundation on which I rebuilt my life.',
    source: 'J.K. Rowling',
  },
  {
    text: 'Every morning is a chance to start again.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'I am responsible for my recovery. No one else can do it for me.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Let go of who you were. Embrace who you are becoming.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'What you resist, persists. What you accept, transforms.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'When the student is ready, the teacher appears.',
    source: 'Proverb',
  },
  {
    text: 'Sobriety delivers everything alcohol promised.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Act as if. Faith will follow.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'The opposite of addiction is not sobriety — it is connection.',
    source: 'Johann Hari',
  },
  {
    text: 'Pain is the touchstone of spiritual growth.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'I may not be where I want to be, but I am grateful I am not where I used to be.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Humility is not thinking less of yourself, but thinking of yourself less.',
    source: 'C.S. Lewis',
  },
  {
    text: 'You never have to use again, no matter what.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Turn your wounds into wisdom.',
    source: 'Oprah Winfrey',
  },
  {
    text: 'It is never too late to be what you might have been.',
    source: 'George Eliot',
  },
  {
    text: 'Carrying resentment is like drinking poison and expecting the other person to die.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Expectations are premeditated resentments.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Be patient with yourself. Nothing in nature blooms all year.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'We are not human beings having a spiritual experience. We are spiritual beings having a human experience.',
    source: 'Pierre Teilhard de Chardin',
  },
  {
    text: 'Service keeps us sober.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Recovery is about progression, not perfection.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Do the next right thing.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Fear is the darkroom where negatives are developed.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Principles before personalities.',
    source: 'AA Tradition 12',
  },
  {
    text: 'When I got sober, I did not stop drinking — I started living.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Happiness is an inside job.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'The journey of a thousand miles begins with a single step.',
    source: 'Lao Tzu',
  },
  {
    text: 'Stinking thinking leads to drinking.',
    source: 'AA Slogan',
  },
  {
    text: 'God does not give us what we can handle. God helps us handle what we are given.',
    source: 'Recovery Wisdom',
  },
  {
    text: 'Change is a process, not an event.',
    source: 'Recovery Wisdom',
  },
];

/**
 * Returns the daily quote for a given date.
 * Rotates through the quotes collection based on day of year.
 */
export function getQuoteForDate(date: Date): DailyQuote {
  const dayOfYear = getDayOfYear(date);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

/**
 * Returns today's daily recovery quote.
 */
export function getTodayQuote(): DailyQuote {
  return getQuoteForDate(new Date());
}

/**
 * Total number of quotes available.
 */
export const TOTAL_QUOTES = DAILY_QUOTES.length;
