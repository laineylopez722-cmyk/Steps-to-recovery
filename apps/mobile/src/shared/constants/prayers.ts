/**
 * Prayer Library
 *
 * Common recovery prayers from 12-step programs.
 * These prayers support spiritual growth and daily practice in recovery.
 *
 * @module constants/prayers
 */

/**
 * Prayer definition
 */
export interface Prayer {
  /** Unique identifier */
  readonly id: string;
  /** Prayer title */
  readonly title: string;
  /** Full prayer text/content */
  readonly content: string;
  /** Source attribution (e.g., "Alcoholics Anonymous (Big Book)") */
  readonly source?: string;
  /** Associated step numbers (if applicable) */
  readonly stepAssociation?: readonly number[];
  /** Prayer category */
  readonly category: 'foundation' | 'step' | 'daily' | 'situational';
  /** Whether this prayer is marked as favorite */
  readonly isFavorite?: boolean;
}

export const PRAYERS: Prayer[] = [
  // Foundation Prayers
  {
    id: 'serenity-short',
    title: 'Serenity Prayer (Short)',
    content: `God, grant me the serenity
to accept the things I cannot change,
the courage to change the things I can,
and the wisdom to know the difference.`,
    source: 'Reinhold Niebuhr',
    category: 'foundation',
  },
  {
    id: 'serenity-long',
    title: 'Serenity Prayer (Full)',
    content: `God, grant me the serenity
to accept the things I cannot change,
the courage to change the things I can,
and the wisdom to know the difference.

Living one day at a time,
enjoying one moment at a time;
accepting hardship as a pathway to peace;
taking, as Jesus did,
this sinful world as it is,
not as I would have it;

Trusting that You will make all things right
if I surrender to Your will;
so that I may be reasonably happy in this life
and supremely happy with You forever in the next.

Amen.`,
    source: 'Reinhold Niebuhr',
    category: 'foundation',
  },

  // Step Prayers
  {
    id: 'third-step',
    title: 'Third Step Prayer',
    content: `God, I offer myself to Thee—
to build with me and to do with me as Thou wilt.
Relieve me of the bondage of self,
that I may better do Thy will.
Take away my difficulties,
that victory over them may bear witness
to those I would help of Thy Power,
Thy Love, and Thy Way of life.
May I do Thy will always!

Amen.`,
    source: 'Alcoholics Anonymous (Big Book)',
    stepAssociation: [3],
    category: 'step',
  },
  {
    id: 'seventh-step',
    title: 'Seventh Step Prayer',
    content: `My Creator, I am now willing
that you should have all of me,
good and bad.
I pray that you now remove from me
every single defect of character
which stands in the way of my usefulness
to you and my fellows.
Grant me strength, as I go out from here,
to do your bidding.

Amen.`,
    source: 'Alcoholics Anonymous (Big Book)',
    stepAssociation: [7],
    category: 'step',
  },
  {
    id: 'eleventh-step',
    title: 'St. Francis Prayer (11th Step)',
    content: `Lord, make me a channel of thy peace;
that where there is hatred, I may bring love;
that where there is wrong, I may bring the spirit of forgiveness;
that where there is discord, I may bring harmony;
that where there is error, I may bring truth;
that where there is doubt, I may bring faith;
that where there is despair, I may bring hope;
that where there are shadows, I may bring light;
that where there is sadness, I may bring joy.

Lord, grant that I may seek rather
to comfort than to be comforted;
to understand, than to be understood;
to love, than to be loved.

For it is by self-forgetting that one finds.
It is by forgiving that one is forgiven.
It is by dying that one awakens to Eternal Life.

Amen.`,
    source: 'St. Francis of Assisi',
    stepAssociation: [11],
    category: 'step',
  },

  // Daily Prayers
  {
    id: 'set-aside',
    title: 'Set Aside Prayer',
    content: `God, please help me set aside
everything I think I know
about myself, my disease, these steps,
and especially You;
so that I may have an open mind
and a new experience
of all these things.

Please help me see the truth.

Amen.`,
    category: 'daily',
  },
  {
    id: 'morning',
    title: 'Morning Prayer',
    content: `God, direct my thinking today,
especially that it be divorced from
self-pity, dishonest, and self-seeking motives.

As I go through this day,
let me pause when agitated or doubtful,
and ask for the right thought or action.

Let me constantly be reminded
that I am no longer running the show;
humbly saying to myself many times each day:
Thy will be done.`,
    source: 'Alcoholics Anonymous (Big Book)',
    category: 'daily',
  },
  {
    id: 'evening',
    title: 'Evening Prayer',
    content: `As I prepare for rest,
I review my day:

Was I resentful, selfish, dishonest, or afraid?
Do I owe an apology?
Have I kept something to myself
which should be discussed with another person at once?
Was I kind and loving toward all?
What could I have done better?
Was I thinking of myself most of the time?
Or was I thinking of what I could do for others?

God, forgive me where I have fallen short.
Grant me the strength to do better tomorrow.

Amen.`,
    source: 'Adapted from Alcoholics Anonymous (Big Book)',
    category: 'daily',
  },
  {
    id: 'gratitude',
    title: 'Gratitude Prayer',
    content: `Thank You, God, for this day.
Thank You for my sobriety.
Thank You for the people in my life.
Thank You for the challenges that help me grow.
Thank You for the program that saves my life.

Help me remember that I am blessed,
even when I can't see it.

Amen.`,
    category: 'daily',
  },

  // Situational Prayers
  {
    id: 'resentment',
    title: 'Resentment Prayer',
    content: `God, please help me to be free
of anger and resentment toward [name].

I pray that [they] receive
everything I want for myself.
I pray that [they] be blessed
with health, prosperity, and happiness.

Help me to remember
that the world would be better
if I looked at my own defects
rather than the defects of others.`,
    source: 'Adapted from Alcoholics Anonymous (Big Book)',
    stepAssociation: [4, 10],
    category: 'situational',
  },
  {
    id: 'fear',
    title: 'Fear Prayer',
    content: `God, please remove my fear of [fear].

Direct my attention to what You would have me be.
Grant me the courage to do Your will
and not let fear stand in my way.

Help me remember that fear is a lack of faith,
and that You are with me always.`,
    source: 'Adapted from Alcoholics Anonymous (Big Book)',
    stepAssociation: [4],
    category: 'situational',
  },
  {
    id: 'temptation',
    title: 'Temptation Prayer',
    content: `God, I am in trouble.
I need Your help right now.

Remove from me the desire to [temptation].
Give me the strength to call someone.
Help me remember why I came to this program.

Let me not take that first [substance/behavior].
Just for today, let me stay clean.

Thy will, not mine, be done.`,
    category: 'situational',
  },
  {
    id: 'meeting',
    title: 'Before a Meeting Prayer',
    content: `God, as I enter this meeting,
help me to be present.

Let me listen with an open heart.
Let me share honestly if called to do so.
Let me be of service to another.

Help me remember that we are all
just trying to recover, one day at a time.`,
    category: 'situational',
  },
  {
    id: 'amends',
    title: 'Before Making Amends Prayer',
    content: `God, give me the courage
to make this amend.

Let me speak from my heart.
Let me take full responsibility for my actions.
Let me not expect any particular outcome.

Help me remember that making amends
is about my recovery, not their response.

Thy will be done.`,
    stepAssociation: [9],
    category: 'situational',
  },
  {
    id: 'sponsor',
    title: 'Prayer for My Sponsor',
    content: `God, thank You for my sponsor.

Bless them for their willingness
to carry the message to me.
Give them strength and wisdom
as they guide me through this program.

Help me to be teachable
and willing to do the work.`,
    category: 'situational',
  },
  {
    id: 'newcomer',
    title: 'Prayer for Newcomers',
    content: `God, bless the newcomer
who walks through the door today.

Help them to feel welcome.
Help them to keep coming back.
Help them to know that recovery is possible.

Let me be of service to them
as others were of service to me.`,
    category: 'situational',
  },
];

/**
 * Get prayers by category
 *
 * @param category - Prayer category to filter by
 * @returns Array of prayers in the specified category
 * @example
 * ```ts
 * const dailyPrayers = getPrayersByCategory('daily');
 * ```
 */
export function getPrayersByCategory(category: Prayer['category']): readonly Prayer[] {
  return PRAYERS.filter((p) => p.category === category);
}

/**
 * Get prayers associated with a specific step
 *
 * @param stepNumber - Step number (1-12)
 * @returns Array of prayers associated with the step
 * @example
 * ```ts
 * const step3Prayers = getPrayersForStep(3); // Returns Third Step Prayer
 * ```
 */
export function getPrayersForStep(stepNumber: number): readonly Prayer[] {
  if (stepNumber < 1 || stepNumber > 12 || !Number.isInteger(stepNumber)) {
    return [];
  }
  return PRAYERS.filter((p) => p.stepAssociation?.includes(stepNumber));
}

/**
 * Get prayer by ID
 *
 * @param id - Prayer ID to look up
 * @returns Prayer object if found, undefined otherwise
 * @example
 * ```ts
 * const serenity = getPrayerById('serenity-short');
 * ```
 */
export function getPrayerById(id: string): Prayer | undefined {
  if (!id || typeof id !== 'string') {
    return undefined;
  }
  return PRAYERS.find((p) => p.id === id);
}

/**
 * Check if a prayer ID is valid
 *
 * @param id - Prayer ID to validate
 * @returns True if prayer exists
 */
export function isValidPrayerId(id: string): boolean {
  return PRAYERS.some((p) => p.id === id);
}

/**
 * Prayer categories with labels
 */
export const PRAYER_CATEGORIES: { key: Prayer['category']; label: string; icon: string }[] = [
  { key: 'foundation', label: 'Foundation', icon: '🙏' },
  { key: 'step', label: 'Step Prayers', icon: '📖' },
  { key: 'daily', label: 'Daily Practice', icon: '☀️' },
  { key: 'situational', label: 'Situational', icon: '⚡' },
];
